// AuditLog DTOs
import { IsNotEmpty, IsString } from 'class-validator';

export interface GetApiAdminAuditLogRequestDto {
}

export interface GetApiAdminAuditLogResponseDto {
  id: string;
  action: string;
  userId: string;
  createdAt: string;
}

export class PostApiAdminAuditLogRequestDto {
  @IsString()
  @IsNotEmpty()
  action!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;
}

export interface PostApiAdminAuditLogResponseDto {
  id: string;
  action: string;
  userId: string;
  createdAt: string;
}
