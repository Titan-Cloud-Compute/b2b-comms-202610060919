import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
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
import { SharedChannelService } from './shared-channel.service';
import type {
  PostApiChannelsIdMessagesRequestDto,
  PostApiChannelsRequestDto,
} from './shared-channel.dto';

function sessionUserId(req: Request): string {
  const userId = req.session?.userId;
  if (!userId) throw new UnauthorizedException('not authenticated');
  return userId;
}

@ApiTags('shared-channel')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/channels')
export class SharedChannelController {
  constructor(private readonly sharedchannel: SharedChannelService) {}

  @Post()
  @HttpCode(201)
  @Roles(UserRole.VENDOR)
  async postApiChannels(@Req() req: Request, @Body() dto: PostApiChannelsRequestDto) {
    const name = typeof dto?.name === 'string' ? dto.name.trim() : '';
    if (!name) throw new BadRequestException('name is required');
    return this.sharedchannel.createChannel(sessionUserId(req), name);
  }

  @Post(':id/messages')
  @HttpCode(201)
  @Roles(UserRole.VENDOR, UserRole.CUSTOMER)
  async postApiChannelsIdMessages(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: PostApiChannelsIdMessagesRequestDto,
  ) {
    const body = typeof dto?.body === 'string' ? dto.body.trim() : '';
    if (!body) throw new BadRequestException('body is required');
    return this.sharedchannel.postMessage(id, sessionUserId(req), body);
  }

  @Get()
  @Roles(UserRole.VENDOR, UserRole.CUSTOMER)
  async getApiChannels() {
    return this.sharedchannel.listChannels();
  }
}
