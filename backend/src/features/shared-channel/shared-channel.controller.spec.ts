import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { SharedChannelController } from './shared-channel.controller';
import { SharedChannelService } from './shared-channel.service';
import { PrismaService } from '../../prisma/prisma.service';

function fakePrisma() {
  return {
    vendorProfile: { findUnique: jest.fn() },
    channel: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
    message: { create: jest.fn() },
  };
}

const reqFor = (userId: string, role: string) =>
  ({ session: { userId, role, firmId: null } }) as unknown as Request;

describe('SharedChannelController', () => {
  let prisma: ReturnType<typeof fakePrisma>;
  let controller: SharedChannelController;

  beforeEach(() => {
    prisma = fakePrisma();
    const service = new SharedChannelService(prisma as unknown as PrismaService);
    controller = new SharedChannelController(service);
  });

  it('vendor creates a channel stored against their VendorProfile', async () => {
    prisma.vendorProfile.findUnique.mockResolvedValue({ id: 'vp1', userId: 'u1' });
    prisma.channel.create.mockResolvedValue({ id: 'c1', name: 'Ops', vendorId: 'vp1' });
    const res = await controller.postApiChannels(reqFor('u1', 'VENDOR'), { name: 'Ops' });
    expect(res).toEqual({ id: 'c1', name: 'Ops' });
    expect(prisma.channel.create).toHaveBeenCalledWith({
      data: { name: 'Ops', vendorId: 'vp1', vendorProfileId: 'vp1' },
    });
  });

  it('rejects an empty channel name', async () => {
    await expect(controller.postApiChannels(reqFor('u1', 'VENDOR'), { name: ' ' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('lists channels', async () => {
    prisma.channel.findMany.mockResolvedValue([{ id: 'c1', name: 'Ops', vendorId: 'vp1' }]);
    await expect(controller.getApiChannels()).resolves.toEqual([{ id: 'c1', name: 'Ops' }]);
  });

  it('customer posts a message with senderId from the session', async () => {
    prisma.channel.findUnique.mockResolvedValue({ id: 'c1' });
    prisma.message.create.mockResolvedValue({ id: 'm1', body: 'hi', channelId: 'c1', senderId: 'u2' });
    const res = await controller.postApiChannelsIdMessages(reqFor('u2', 'CUSTOMER'), 'c1', { body: 'hi' });
    expect(res).toEqual({ id: 'm1', body: 'hi', channelId: 'c1', senderId: 'u2' });
    expect(prisma.message.create).toHaveBeenCalledWith({ data: { body: 'hi', channelId: 'c1', senderId: 'u2' } });
  });
});
