import { BadRequestException } from '@nestjs/common';
import { NotificationPreferencesController } from './notification-preferences.controller';
import { NotificationPreferencesService } from './notification-preferences.service';

function makePrisma() {
  const rows = new Map<string, { id: string; userId: string; orderAlerts: boolean; messageAlerts: boolean }>();
  return {
    rows,
    notificationPreference: {
      findUnique: jest.fn(async ({ where }: any) => rows.get(where.userId) ?? null),
      upsert: jest.fn(async ({ where, create, update }: any) => {
        const existing = rows.get(where.userId);
        const row = existing ? { ...existing, ...update } : { id: 'np-' + where.userId, ...create };
        rows.set(where.userId, row);
        return row;
      }),
    },
  };
}

const req = (userId: string) => ({ session: { userId, email: 'u@x', role: 'USER' } }) as any;

describe('NotificationPreferencesController', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let ctrl: NotificationPreferencesController;

  beforeEach(() => {
    prisma = makePrisma();
    ctrl = new NotificationPreferencesController(new NotificationPreferencesService(prisma as any));
  });

  it('user configures notifications: PUT stores and returns the record', async () => {
    const res = await ctrl.putApiNotificationsPreferences(req('u1'), { orderAlerts: true, messageAlerts: false });
    expect(res).toEqual({ userId: 'u1', orderAlerts: true, messageAlerts: false });
    expect(prisma.rows.get('u1')).toMatchObject({ orderAlerts: true, messageAlerts: false });
    expect(await ctrl.getApiNotificationsPreferences(req('u1'))).toEqual(res);
  });

  it('user disables all notifications: both fields stored as false', async () => {
    await ctrl.putApiNotificationsPreferences(req('u2'), { orderAlerts: true, messageAlerts: true });
    const res = await ctrl.putApiNotificationsPreferences(req('u2'), { orderAlerts: false, messageAlerts: false });
    expect(res).toEqual({ userId: 'u2', orderAlerts: false, messageAlerts: false });
    expect(prisma.rows.get('u2')).toMatchObject({ orderAlerts: false, messageAlerts: false });
  });

  it('is scoped to the session user', async () => {
    await ctrl.putApiNotificationsPreferences(req('a'), { orderAlerts: false, messageAlerts: false });
    expect(await ctrl.getApiNotificationsPreferences(req('b'))).toEqual({ userId: 'b', orderAlerts: true, messageAlerts: true });
  });

  it('rejects non-boolean fields', async () => {
    await expect(ctrl.putApiNotificationsPreferences(req('u3'), { orderAlerts: 'yes' })).rejects.toBeInstanceOf(BadRequestException);
  });
});
