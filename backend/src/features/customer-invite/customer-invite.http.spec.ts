import 'reflect-metadata';
import { ConflictException, HttpStatus, RequestMethod } from '@nestjs/common';
import { HTTP_CODE_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { CustomerInviteController } from './customer-invite.controller';
import { CustomerInviteService } from './customer-invite.service';

function fakePrisma() {
  const users: Array<{ id: string; email: string; role: string }> = [];
  const customers: Array<{ id: string; email: string; userId: string; createdAt: Date }> = [];
  let n = 0;
  return {
    user: {
      findUnique: jest.fn(async ({ where }: any) => users.find((u) => u.email === where.email) ?? null),
      create: jest.fn(async ({ data }: any) => {
        const u = { id: `u${++n}`, ...data };
        users.push(u);
        return u;
      }),
    },
    customer: {
      findUnique: jest.fn(async ({ where }: any) =>
        customers.find((c) => (where.email ? c.email === where.email : c.userId === where.userId)) ?? null),
      create: jest.fn(async ({ data }: any) => {
        const c = { id: `c${++n}`, createdAt: new Date(), ...data };
        customers.push(c);
        return c;
      }),
      findMany: jest.fn(async () => customers.map((c) => ({ id: c.id, email: c.email }))),
    },
  };
}

function makeController() {
  const service = new CustomerInviteService(fakePrisma() as any);
  return new CustomerInviteController(service);
}

const handler = (name: string) => (CustomerInviteController.prototype as any)[name];

describe('CustomerInviteController (api/admin/customers)', () => {
  it('is mounted at api/admin/customers', () => {
    expect(Reflect.getMetadata(PATH_METADATA, CustomerInviteController)).toBe('api/admin/customers');
  });

  it('exposes POST invite with 201 and GET list', () => {
    const post = handler('postApiAdminCustomersInvite');
    expect(Reflect.getMetadata(PATH_METADATA, post)).toBe('invite');
    expect(Reflect.getMetadata(METHOD_METADATA, post)).toBe(RequestMethod.POST);
    expect(Reflect.getMetadata(HTTP_CODE_METADATA, post)).toBe(HttpStatus.CREATED);
    const get = handler('getApiAdminCustomers');
    expect(Reflect.getMetadata(METHOD_METADATA, get)).toBe(RequestMethod.GET);
  });

  it('creates a Customer and returns invitationSent true, then rejects a duplicate with 409', async () => {
    const controller = makeController();
    const res = await controller.postApiAdminCustomersInvite({ email: 'buyer@corp.example.com' });
    expect(res).toEqual({ customerId: expect.any(String), email: 'buyer@corp.example.com', invitationSent: true });

    await expect(
      controller.postApiAdminCustomersInvite({ email: 'buyer@corp.example.com' }),
    ).rejects.toBeInstanceOf(ConflictException);

    const list = await controller.getApiAdminCustomers();
    expect(list).toEqual([{ id: res.customerId, email: 'buyer@corp.example.com' }]);
  });
});
