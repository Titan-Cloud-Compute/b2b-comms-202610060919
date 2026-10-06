import { Body, Controller, Get, HttpCode, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../../auth/roles.guard';
import { OrderManagementService, OrderActor } from './order-management.service';
import {
  GetApiOrdersResponseDto,
  PatchApiOrdersIdConfirmRequestDto,
  PatchApiOrdersIdConfirmResponseDto,
  PostApiOrdersRequestDto,
  PostApiOrdersResponseDto,
} from './order-management.dto';

function actorOf(req: Request | undefined): OrderActor {
  const s: any = (req as any)?.session ?? {};
  return { userId: s.userId, role: s.role, email: s.email };
}

@ApiTags('order-management')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/orders')
export class OrderManagementController {
  constructor(private readonly ordermanagement: OrderManagementService) {}

  @Post()
  @HttpCode(201)
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  async postApiOrders(
    @Body() body: PostApiOrdersRequestDto,
    @Req() req?: Request,
  ): Promise<PostApiOrdersResponseDto> {
    return this.ordermanagement.create(body, actorOf(req));
  }

  @Patch(':id/confirm')
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  async patchApiOrdersIdConfirm(
    @Param('id') id: string,
    @Body() body: PatchApiOrdersIdConfirmRequestDto,
  ): Promise<PatchApiOrdersIdConfirmResponseDto> {
    return this.ordermanagement.confirm(id, body);
  }

  @Get()
  async getApiOrders(@Req() req?: Request): Promise<GetApiOrdersResponseDto[]> {
    return this.ordermanagement.list(actorOf(req));
  }
}
