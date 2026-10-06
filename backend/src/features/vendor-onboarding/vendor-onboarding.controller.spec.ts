import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import type { Request } from 'express';
import { VendorOnboardingController } from './vendor-onboarding.controller';
import { VendorOnboardingService } from './vendor-onboarding.service';
import type { PrismaService } from '../../prisma/prisma.service';

function makePrisma() {
  const profiles: Array<{ id: string; userId: string; companyName: string; contactEmail: string }> = [];
  const docs: Array<{ id: string; filename: string; status: string; vendorProfileId: string; createdAt: Date }> = [];
  let seq = 0;
  return {
    user: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) =>
        where.id === 'u1' ? { id: 'u1', email: 'vendor@acme.example.com' } : null,
      ),
    },
    vendorProfile: {
      findUnique: jest.fn(async ({ where }: { where: { userId: string } }) =>
        profiles.find((p) => p.userId === where.userId) ?? null,
      ),
      create: jest.fn(async ({ data }: { data: { userId: string; companyName: string; contactEmail: string } }) => {
        const p = { id: `p${++seq}`, ...data };
        profiles.push(p);
        return p;
      }),
      upsert: jest.fn(
        async ({ where, create, update }: {
          where: { userId: string };
          create: { userId: string; companyName: string; contactEmail: string };
          update: { companyName: string; contactEmail: string };
        }) => {
          const found = profiles.find((p) => p.userId === where.userId);
          if (found) return Object.assign(found, update);
          const p = { id: `p${++seq}`, ...create };
          profiles.push(p);
          return p;
        },
      ),
    },
    document: {
      create: jest.fn(async ({ data }: { data: { filename: string; status: string; vendorProfileId: string } }) => {
        const d = { id: `d${++seq}`, createdAt: new Date(), ...data };
        docs.push(d);
        return d;
      }),
      findMany: jest.fn(async ({ where }: { where: { vendorProfileId: string } }) =>
        docs.filter((d) => d.vendorProfileId === where.vendorProfileId),
      ),
    },
  };
}

const req = (userId?: string) => ({ session: userId ? { userId, role: 'VENDOR', firmId: null } : undefined }) as unknown as Request;

describe('VendorOnboardingController', () => {
  let controller: VendorOnboardingController;

  beforeEach(() => {
    const service = new VendorOnboardingService(makePrisma() as unknown as PrismaService);
    controller = new VendorOnboardingController(service);
  });

  it('is mounted at /api/vendor with profile and documents routes', () => {
    expect(Reflect.getMetadata(PATH_METADATA, VendorOnboardingController)).toBe('api/vendor');
    const proto = VendorOnboardingController.prototype;
    expect(Reflect.getMetadata(PATH_METADATA, proto.postApiVendorProfile)).toBe('profile');
    expect(Reflect.getMetadata(PATH_METADATA, proto.postApiVendorDocuments)).toBe('documents');
    expect(Reflect.getMetadata(PATH_METADATA, proto.getApiVendorDocuments)).toBe('documents');
  });

  it('stores the profile and returns the created record', async () => {
    const res = await controller.postApiVendorProfile(req('u1'), {
      companyName: 'Acme',
      contactEmail: 'ops@acme.example.com',
    });
    expect(res).toEqual({ id: expect.any(String), companyName: 'Acme', contactEmail: 'ops@acme.example.com' });
  });

  it('rejects an empty company name', async () => {
    await expect(
      controller.postApiVendorProfile(req('u1'), { companyName: '', contactEmail: 'a@b.c' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('stores an uploaded document as pending and lists it', async () => {
    await controller.postApiVendorProfile(req('u1'), { companyName: 'Acme', contactEmail: 'a@b.c' });
    const doc = await controller.postApiVendorDocuments(req('u1'), { filename: 'w9.pdf' });
    expect(doc).toEqual({ id: expect.any(String), filename: 'w9.pdf', status: 'pending' });
    const list = await controller.getApiVendorDocuments(req('u1'));
    expect(list).toEqual([doc]);
  });

  it('returns an empty library when no profile exists', async () => {
    expect(await controller.getApiVendorDocuments(req('u1'))).toEqual([]);
  });

  it('requires a session', async () => {
    await expect(controller.getApiVendorDocuments(req())).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
