import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FeatureService } from '../../common/feature';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  GetApiChannelsResponseDto,
  PostApiChannelsIdMessagesResponseDto,
  PostApiChannelsResponseDto,
} from './shared-channel.dto';

@Injectable()
export class SharedChannelService extends FeatureService {
  constructor(prisma: PrismaService) {
    super(prisma, ['Channel', 'Message', 'VendorProfile'] as const);
  }

  async createChannel(userId: string, name: string): Promise<PostApiChannelsResponseDto> {
    const vendor = await this.model('VendorProfile').findUnique({ where: { userId } });
    if (!vendor) throw new ForbiddenException('vendor profile required to create a channel');
    const channel = await this.model('Channel').create({
      data: { name, vendorId: vendor.id, vendorProfileId: vendor.id },
    });
    return { id: channel.id, name: channel.name };
  }

  async listChannels(): Promise<GetApiChannelsResponseDto[]> {
    const rows = await this.model('Channel').findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((c) => ({ id: c.id, name: c.name }));
  }

  async postMessage(
    channelId: string,
    senderId: string,
    body: string,
  ): Promise<PostApiChannelsIdMessagesResponseDto & { senderId: string }> {
    const channel = await this.model('Channel').findUnique({ where: { id: channelId } });
    if (!channel) throw new NotFoundException('channel not found');
    const msg = await this.model('Message').create({ data: { body, channelId, senderId } });
    return { id: msg.id, body: msg.body, channelId: msg.channelId, senderId: msg.senderId };
  }
}
