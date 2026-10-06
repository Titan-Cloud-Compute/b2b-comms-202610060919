import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InvoiceGenerationController } from './invoice-generation.controller';
import { InvoiceGenerationService } from './invoice-generation.service';

function makeController(opts: { order?: { id: string; status: string } | null; invoice?: any } = {}) {
  const prisma: any = {
    order: { findUnique: jest.fn().mockResolvedValue(opts.order ?? null) },
    invoice: {
      findUnique: jest.fn().mockImplementation(({ where }: any) =>
        Promise.resolve(where.id && opts.invoice && where.id === opts.invoice.id ? opts.invoice : null),
      ),
      create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'inv-1', ...data })),
    },
  };
  const service = new InvoiceGenerationService(prisma);
  return { controller: new InvoiceGenerationController(service), prisma };
}

describe('InvoiceGenerationController', () => {
  it('creates an invoice for a confirmed order', async () => {
    const { controller, prisma } = makeController({ order: { id: 'o-1', status: 'confirmed' } });
    const res = await controller.postApiInvoices({ orderId: 'o-1', amount: 120.5 });
    expect(res).toEqual({ id: 'inv-1', orderId: 'o-1', amount: 120.5 });
    expect(prisma.invoice.create).toHaveBeenCalledWith({ data: { orderId: 'o-1', amount: 120.5 } });
  });

  it('rejects unconfirmed orders', async () => {
    const { controller } = makeController({ order: { id: 'o-1', status: 'pending' } });
    await expect(controller.postApiInvoices({ orderId: 'o-1', amount: 10 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns 404 for unknown orders', async () => {
    const { controller } = makeController({ order: null });
    await expect(controller.postApiInvoices({ orderId: 'nope', amount: 10 })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns a downloadUrl for a stored invoice', async () => {
    const { controller } = makeController({ invoice: { id: 'inv-9', orderId: 'o-1', amount: 5 } });
    const res = await controller.getApiInvoicesIdDownload('inv-9');
    expect(res.id).toBe('inv-9');
    expect(res.downloadUrl).toContain('inv-9');
  });

  it('returns 404 for unknown invoices', async () => {
    const { controller } = makeController();
    await expect(controller.getApiInvoicesIdDownload('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
