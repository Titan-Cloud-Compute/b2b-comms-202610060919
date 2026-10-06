import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../../auth/roles.guard';
import { VendorOnboardingService } from './vendor-onboarding.service';
import type {
  PostApiVendorDocumentsRequestDto,
  PostApiVendorProfileRequestDto,
} from './vendor-onboarding.dto';

function sessionUserId(req: Request): string {
  const userId = req.session?.userId;
  if (!userId) throw new UnauthorizedException('not authenticated');
  return userId;
}

@ApiTags('vendor-onboarding')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.VENDOR, UserRole.USER, UserRole.MANAGER, UserRole.ADMIN)
@Controller('api/vendor')
export class VendorOnboardingController {
  constructor(private readonly vendoronboarding: VendorOnboardingService) {}

  @Post('profile')
  @HttpCode(201)
  async postApiVendorProfile(@Req() req: Request, @Body() body: PostApiVendorProfileRequestDto) {
    return this.vendoronboarding.upsertProfile(sessionUserId(req), body);
  }

  @Post('documents')
  @HttpCode(201)
  async postApiVendorDocuments(@Req() req: Request, @Body() body: PostApiVendorDocumentsRequestDto) {
    return this.vendoronboarding.createDocument(sessionUserId(req), body?.filename);
  }

  @Get('documents')
  async getApiVendorDocuments(@Req() req: Request) {
    return this.vendoronboarding.listDocuments(sessionUserId(req));
  }
}
