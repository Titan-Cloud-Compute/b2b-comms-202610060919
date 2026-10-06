import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../../auth/roles.guard';
import { AuditLogService } from './audit-log.service';
import { PostApiAdminAuditLogRequestDto } from './audit-log.dto';

@ApiTags('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('api/admin/audit-log')
export class AuditLogController {
  constructor(private readonly auditlog: AuditLogService) {}

  @Get()
  async getApiAdminAuditLog() {
    return this.auditlog.list();
  }

  @Post()
  @HttpCode(201)
  async postApiAdminAuditLog(@Body() body: PostApiAdminAuditLogRequestDto) {
    return this.auditlog.create(body);
  }
}
