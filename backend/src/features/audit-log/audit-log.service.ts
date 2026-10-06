import { Injectable } from '@nestjs/common';
import { FeatureService } from '../../common/feature';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GetApiAdminAuditLogResponseDto,
  PostApiAdminAuditLogRequestDto,
  PostApiAdminAuditLogResponseDto,
} from './audit-log.dto';

type AuditEntryRow = { id: string; action: string; userId: string; createdAt: Date };

function toDto(row: AuditEntryRow): GetApiAdminAuditLogResponseDto {
  return {
    id: row.id,
    action: row.action,
    userId: row.userId,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

@Injectable()
export class AuditLogService extends FeatureService {
  constructor(prisma: PrismaService) {
    super(prisma, ['AuditEntry']);
  }

  /** All audit entries, oldest first (chronological order). */
  async list(): Promise<GetApiAdminAuditLogResponseDto[]> {
    const rows = await this.model('AuditEntry').findMany({ orderBy: { createdAt: 'asc' } });
    return rows.map(toDto);
  }

  /** Record a new audit entry. */
  async create(dto: PostApiAdminAuditLogRequestDto): Promise<PostApiAdminAuditLogResponseDto> {
    const row = await this.model('AuditEntry').create({
      data: { action: dto.action, userId: dto.userId },
    });
    return toDto(row);
  }
}
