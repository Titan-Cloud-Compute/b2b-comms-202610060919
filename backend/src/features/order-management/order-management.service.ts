import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { FeatureService } from '../../common/feature';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GetApiOrdersResponseDto,
  OrderItemInputDto,
  PatchApiOrdersIdConfirmRequestDto,
  PatchApiOrdersIdConfirmResponseDto,
  PostApiOrdersRequestDto,
  PostApiOrdersResponseDto,
} from './order-management.dto';

export interface OrderActor {
  userId?: string;
  role?: string;
  email?: string;
}

@Injectable()
export class OrderManagementService extends FeatureService {
  constructor(prisma: PrismaService) {
    super(prisma, ['Order', 'OrderItem'] as const);
  }

  private get db(): any {
    return this.prisma as any;
  }

  /** Resolve (or lazily create) the Customer row for the session user. */
  private async resolveCustomer(actor: OrderActor): Promise<{ id: string }> {
    if (!actor?.userId) throw new UnauthorizedException('not authenticated');
    const existing = await this.db.customer.findUnique({ where: { userId: actor.userId } });
    if (existing) return existing;
    let email = actor.email;
    if (!email) {
      const user = await this.db.user.findUnique({ where: { id: actor.userId } });
      if (!user) throw new UnauthorizedException('user not found');
      email = user.email;
    }
    const byEmail = await this.db.customer.findUnique({ where: { email } });
    if (byEmail) return byEmail;
    return this.db.customer.create({ data: { email, userId: actor.userId } });
  }

  private normalizeItems(items: OrderItemInputDto[] | undefined) {
    if (!Array.isArray(items)) return [];
    return items
      .filter((i) => i && typeof i.description === 'string' && i.description.trim())
      .map((i) => {
        const quantity = Math.trunc(Number(i.quantity));
        const unitPrice = Number(i.unitPrice);
        if (!Number.isFinite(quantity) || quantity < 1) throw new BadRequestException('quantity must be a positive integer');
        if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new BadRequestException('unitPrice must be a non-negative number');
        return { description: i.description.trim(), quantity, unitPrice };
      });
  }

  /** Create a pending purchase order for the session customer. */
  async create(dto: PostApiOrdersRequestDto, actor: OrderActor): Promise<PostApiOrdersResponseDto> {
    const vendorId = typeof dto?.vendorId === 'string' ? dto.vendorId.trim() : '';
    if (!vendorId) throw new BadRequestException('vendorId is required');
    const items = this.normalizeItems(dto?.items);
    const customer = await this.resolveCustomer(actor);
    const order = await this.model('Order').create({
      data: {
        status: 'pending',
        customerId: customer.id,
        vendorId,
        ...(items.length ? { orderItems: { create: items } } : {}),
      },
    });
    return { id: order.id, status: order.status, customerId: order.customerId, vendorId: order.vendorId };
  }

  /** List orders visible to the session user. */
  async list(actor: OrderActor): Promise<GetApiOrdersResponseDto[]> {
    if (!actor?.userId) throw new UnauthorizedException('not authenticated');
    const role = String(actor.role ?? '').toUpperCase();
    let where: Record<string, unknown> | undefined;
    if (role === 'VENDOR') {
      const profile = await this.db.vendorProfile.findUnique({ where: { userId: actor.userId } });
      const ids = [actor.userId, ...(profile ? [profile.id] : [])];
      where = { vendorId: { in: ids } };
    } else if (role !== 'ADMIN') {
      const customer = await this.db.customer.findUnique({ where: { userId: actor.userId } });
      if (!customer) return [];
      where = { customerId: customer.id };
    }
    const orders = await this.model('Order').findMany({ where, orderBy: { createdAt: 'desc' } });
    return orders.map((o: any) => ({ id: o.id, status: o.status, customerId: o.customerId, vendorId: o.vendorId }));
  }

  /** Confirm a pending order. */
  async confirm(id: string, dto: PatchApiOrdersIdConfirmRequestDto): Promise<PatchApiOrdersIdConfirmResponseDto> {
    const estimatedDelivery = typeof dto?.estimatedDelivery === 'string' ? dto.estimatedDelivery.trim() : '';
    if (!estimatedDelivery || Number.isNaN(Date.parse(estimatedDelivery))) {
      throw new BadRequestException('estimatedDelivery must be a valid date');
    }
    const order = await this.model('Order').findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (String(order.status).toLowerCase() !== 'pending') {
      throw new BadRequestException('Only pending orders can be confirmed');
    }
    const updated = await this.model('Order').update({ where: { id }, data: { status: 'confirmed' } });
    return { id: updated.id, status: updated.status };
  }
}
