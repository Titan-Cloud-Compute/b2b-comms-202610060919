import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { FeatureService } from '../../common/feature';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GetApiAdminCustomersResponseDto,
  PostApiAdminCustomersInviteResponseDto,
} from './customer-invite.dto';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class CustomerInviteService extends FeatureService {
  constructor(private readonly db: PrismaService) {
    super(db, []);
  }

  async invite(rawEmail: unknown): Promise<PostApiAdminCustomersInviteResponseDto> {
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
    if (!EMAIL_RE.test(email)) {
      throw new BadRequestException('A valid email is required');
    }
    const existing = await this.db.customer.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Customer already exists');
    }
    const user =
      (await this.db.user.findUnique({ where: { email } })) ??
      (await this.db.user.create({ data: { email, role: UserRole.CUSTOMER } }));
    const linked = await this.db.customer.findUnique({ where: { userId: user.id } });
    if (linked) {
      throw new ConflictException('Customer already exists');
    }
    const customer = await this.db.customer.create({ data: { email, userId: user.id } });
    return { customerId: customer.id, email: customer.email, invitationSent: true };
  }

  async list(): Promise<GetApiAdminCustomersResponseDto[]> {
    const rows = await this.db.customer.findMany({
      select: { id: true, email: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({ id: r.id, email: r.email }));
  }
}
