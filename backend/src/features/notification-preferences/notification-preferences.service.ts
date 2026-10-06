import { BadRequestException, Injectable } from '@nestjs/common';
import { FeatureService } from '../../common/feature';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GetApiNotificationsPreferencesResponseDto,
  PutApiNotificationsPreferencesRequestDto,
  PutApiNotificationsPreferencesResponseDto,
} from './notification-preferences.dto';

@Injectable()
export class NotificationPreferencesService extends FeatureService {
  constructor(prisma: PrismaService) {
    super(prisma, ['NotificationPreference']);
  }

  /** Returns the session user's preferences; defaults to both alerts on when none stored. */
  async get(userId: string): Promise<GetApiNotificationsPreferencesResponseDto> {
    const row = await this.prisma.notificationPreference.findUnique({ where: { userId } });
    if (!row) return { userId, orderAlerts: true, messageAlerts: true };
    return { userId: row.userId, orderAlerts: row.orderAlerts, messageAlerts: row.messageAlerts };
  }

  /** Upserts the session user's preferences and returns the stored record. */
  async put(userId: string, body: unknown): Promise<PutApiNotificationsPreferencesResponseDto> {
    const b = (body ?? {}) as Partial<PutApiNotificationsPreferencesRequestDto>;
    if (typeof b.orderAlerts !== 'boolean' || typeof b.messageAlerts !== 'boolean') {
      throw new BadRequestException('orderAlerts and messageAlerts must be booleans');
    }
    const data = { orderAlerts: b.orderAlerts, messageAlerts: b.messageAlerts };
    const row = await this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    return { userId: row.userId, orderAlerts: row.orderAlerts, messageAlerts: row.messageAlerts };
  }
}
