import { PATH_METADATA, HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuditLogController', () => {
  const now = Date.now();
  let rows: { id: string; action: string; userId: string; createdAt: Date }[];
  let fakePrisma: any;
  let controller: AuditLogController;

  beforeEach(() => {
    rows = [
      { id: 'b', action: 'second', userId: 'u1', createdAt: new Date(now + 1000) },
      { id: 'a', action: 'first', userId: 'u1', createdAt: new Date(now) },
    ];
    fakePrisma = {
      auditEntry: {
        findMany: jest.fn(async (args: any) => {
          const dir = args?.orderBy?.createdAt === 'desc' ? -1 : 1;
          return [...rows].sort((x, y) => dir * (x.createdAt.getTime() - y.createdAt.getTime()));
        }),
        create: jest.fn(async ({ data }: any) => {
          const row = { id: 'c', createdAt: new Date(now + 2000), ...data };
          rows.push(row);
          return row;
        }),
      },
    };
    controller = new AuditLogController(new AuditLogService(fakePrisma as unknown as PrismaService));
  });

  it('is mounted at api/admin/audit-log', () => {
    expect(Reflect.getMetadata(PATH_METADATA, AuditLogController)).toBe('api/admin/audit-log');
  });

  it('GET lists entries in chronological order', async () => {
    const result = await controller.getApiAdminAuditLog();
    expect(fakePrisma.auditEntry.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'asc' } });
    expect(result.map((r) => r.action)).toEqual(['first', 'second']);
    expect(typeof result[0].createdAt).toBe('string');
  });

  it('POST stores the entry and returns it with 201', async () => {
    const created = await controller.postApiAdminAuditLog({ action: 'login', userId: 'u2' });
    expect(fakePrisma.auditEntry.create).toHaveBeenCalledWith({ data: { action: 'login', userId: 'u2' } });
    expect(created).toMatchObject({ id: 'c', action: 'login', userId: 'u2' });
    expect(created.createdAt).toBeDefined();
    expect(
      Reflect.getMetadata(HTTP_CODE_METADATA, AuditLogController.prototype.postApiAdminAuditLog),
    ).toBe(201);
  });
});
