import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FeatureService } from '../../common/feature';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GetApiInvoicesIdDownloadResponseDto,
  PostApiInvoicesRequestDto,
  PostApiInvoicesResponseDto,
} from './invoice-generation.dto';

@Injectable()
export class InvoiceGenerationService extends FeatureService {
  constructor(prisma: PrismaService) {
    super(prisma, ['Invoice', 'Order'] as const);
  }

  /** Create an invoice for a confirmed order. */
  async create(dto: PostApiInvoicesRequestDto): Promise<PostApiInvoicesResponseDto> {
    const orderId = typeof dto?.orderId === 'string' ? dto.orderId.trim() : '';
    const amount = Number(dto?.amount);
    if (!orderId) throw new BadRequestException('orderId is required');
    if (!Number.isFinite(amount) || amount < 0) throw new BadRequestException('amount must be a non-negative number');

    const order = await this.model('Order').findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (String(order.status).toLowerCase() !== 'confirmed') {
      throw new BadRequestException('Invoices can only be generated for confirmed orders');
    }
    const existing = await this.model('Invoice').findUnique({ where: { orderId } });
    if (existing) throw new ConflictException('An invoice already exists for this order');

    const invoice = await this.model('Invoice').create({ data: { orderId, amount } });
    return { id: invoice.id, orderId: invoice.orderId, amount: invoice.amount };
  }

  /** Resolve the download link for a stored invoice. */
  async download(id: string): Promise<GetApiInvoicesIdDownloadResponseDto> {
    const invoice = await this.model('Invoice').findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return { id: invoice.id, downloadUrl: `/api/invoices/${encodeURIComponent(invoice.id)}/file` };
  }
}
