import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderManagementController } from './order-management.controller';
import { OrderManagementService } from './order-management.service';

function makeController(opts: { order?: { id: string; status: string } | null; customer?: any } = {}) {
  const prisma: any = {
    user: { findUnique: jest.fn().mockResolvedValue({ id: 'u-1', email: 'buyer@corp.example.com' }) },
    customer: {
      findUnique: jest.fn().mockResolvedValue(opts.customer === undefined ? { id: 'c-1', userId: 'u-1' } : opts.customer),
      create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: 'c-new', ...data })),
    },
    vendorProfile: { findUnique: jest.fn().mockResolvedValue({ id: 'vp-1', userId: 'v-1' }) },
    order: {
      create: jest.fn().mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'o-1', status: data.status, customerId: data.customerId, vendorId: data.vendorId }),
      ),
      findUnique: jest.fn().mockResolvedValue(opts.order ?? null),
      findMany: jest.fn().mockResolvedValue([{ id: 'o-1', status: 'pending', customerId: 'c-1', vendorId: 'vp-1' }]),
      update: jest.fn().mockImplementation(({ where, data }: any) => Promise.resolve({ id: where.id, ...data })),
    },
  };
  const service = new OrderManagementService(prisma);
  return { controller: new OrderManagementController(service), prisma };
}

const customerReq: any = { session: { userId: 'u-1', role: 'CUSTOMER' } };
const vendorReq: any = { session: { userId: 'v-1', role: 'VENDOR' } };

describe('OrderManagementController', () => {
  it('creates a pending order for the session customer', async () => {
    const { controller, prisma } = makeController();
    const res = await controller.postApiOrders(
      { vendorId: 'vp-1', items: [{ description: 'Widgets', quantity: 2, unitPrice: 3.5 }] },
      customerReq,
    );
    expect(res).toMatchObject({ id: 'o-1', status: 'pending', customerId: 'c-1' });
    expect(prisma.order.create).toHaveBeenCalledWith({
      data: {
        status: 'pending',
        customerId: 'c-1',
        vendorId: 'vp-1',
        orderItems: { create: [{ description: 'Widgets', quantity: 2, unitPrice: 3.5 }] },
      },
    });
  });

  it('creates the Customer row when missing', async () => {
    const { controller, prisma } = makeController({ customer: null });
    const res = await controller.postApiOrders({ vendorId: 'vp-1' }, customerReq);
    expect(prisma.customer.create).toHaveBeenCalled();
    expect(res.customerId).toBe('c-new');
  });

  it('rejects a missing vendorId', async () => {
    const { controller } = makeController();
    await expect(controller.postApiOrders({ vendorId: '' }, customerReq)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists the customer orders', async () => {
    const { controller, prisma } = makeController();
    const res = await controller.getApiOrders(customerReq);
    expect(res[0]).toMatchObject({ id: 'o-1', status: 'pending' });
    expect(prisma.order.findMany.mock.calls[0][0].where).toEqual({ customerId: 'c-1' });
  });

  it('lists the vendor orders', async () => {
    const { controller, prisma } = makeController();
    await controller.getApiOrders(vendorReq);
    expect(prisma.order.findMany.mock.calls[0][0].where).toEqual({ vendorId: { in: ['v-1', 'vp-1'] } });
  });

  it('confirms a pending order', async () => {
    const { controller } = makeController({ order: { id: 'o-1', status: 'pending' } });
    const res = await controller.patchApiOrdersIdConfirm('o-1', { estimatedDelivery: '2026-11-01' });
    expect(res).toEqual({ id: 'o-1', status: 'confirmed' });
  });

  it('rejects confirming a non-pending order', async () => {
    const { controller } = makeController({ order: { id: 'o-1', status: 'confirmed' } });
    await expect(
      controller.patchApiOrdersIdConfirm('o-1', { estimatedDelivery: '2026-11-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns 404 for unknown orders', async () => {
    const { controller } = makeController({ order: null });
    await expect(
      controller.patchApiOrdersIdConfirm('nope', { estimatedDelivery: '2026-11-01' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
