import { BadRequestException, Injectable } from '@nestjs/common';
import { FeatureService } from '../../common/feature';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  GetApiVendorDocumentsResponseDto,
  PostApiVendorDocumentsResponseDto,
  PostApiVendorProfileRequestDto,
  PostApiVendorProfileResponseDto,
} from './vendor-onboarding.dto';

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`${field} is required`);
  }
  return value.trim();
}

@Injectable()
export class VendorOnboardingService extends FeatureService {
  constructor(prisma: PrismaService) {
    super(prisma, ['VendorProfile', 'Document'] as const);
  }

  async upsertProfile(
    userId: string,
    body: Partial<PostApiVendorProfileRequestDto> | undefined,
  ): Promise<PostApiVendorProfileResponseDto> {
    const companyName = requireString(body?.companyName, 'companyName');
    const contactEmail = requireString(body?.contactEmail, 'contactEmail');
    const profile = await this.prisma.vendorProfile.upsert({
      where: { userId },
      create: { userId, companyName, contactEmail },
      update: { companyName, contactEmail },
    });
    return { id: profile.id, companyName: profile.companyName, contactEmail: profile.contactEmail };
  }

  private async ensureProfile(userId: string) {
    const existing = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (existing) return existing;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('user not found');
    return this.prisma.vendorProfile.create({
      data: { userId, companyName: user.email, contactEmail: user.email },
    });
  }

  async createDocument(userId: string, filename: unknown): Promise<PostApiVendorDocumentsResponseDto> {
    const name = requireString(filename, 'filename');
    const profile = await this.ensureProfile(userId);
    const doc = await this.prisma.document.create({
      data: { filename: name, status: 'pending', vendorProfileId: profile.id },
    });
    return { id: doc.id, filename: doc.filename, status: doc.status };
  }

  async listDocuments(userId: string): Promise<GetApiVendorDocumentsResponseDto[]> {
    const profile = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (!profile) return [];
    const docs = await this.prisma.document.findMany({
      where: { vendorProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
    return docs.map((d) => ({ id: d.id, filename: d.filename, status: d.status }));
  }
}
