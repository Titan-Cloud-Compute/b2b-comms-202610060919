/**
 * Self-service signup is open to anyone: a signup WITHOUT a registration
 * token (once the bootstrap admin exists) creates a VENDOR account instead of
 * being rejected with "registration token is required".
 */

import { AuthService } from './auth.service';

function makeService(existingUsers: number) {
  const create = jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({
    id: 'user-1',
    ...data,
  }));
  const tx = {
    user: { count: jest.fn().mockResolvedValue(existingUsers), create },
    registrationToken: { findUnique: jest.fn(), updateMany: jest.fn(), update: jest.fn() },
  };
  const prisma = {
    runAsAdmin: (fn: (t: typeof tx) => unknown) => fn(tx),
  } as unknown as ConstructorParameters<typeof AuthService>[0];
  const service = new AuthService(prisma, {} as never, {} as never, {} as never);
  jest
    .spyOn(service as unknown as { issueToken: () => Promise<string> }, 'issueToken')
    .mockResolvedValue('jwt');
  return { service, create, tx };
}

describe('AuthService.signup — self-service (no registration token)', () => {
  it('creates a VENDOR account when no token is supplied', async () => {
    const { service, create, tx } = makeService(3);
    const { user, token } = await service.signup({
      email: 'New@Example.com',
      password: 'Password1!',
    } as never);
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].data).toMatchObject({
      email: 'new@example.com',
      role: 'VENDOR',
    });
    expect((user as unknown as { role: string }).role).toBe('VENDOR');
    expect(token).toBe('jwt');
    expect(tx.registrationToken.findUnique).not.toHaveBeenCalled();
  });

  it('still makes the very first user the bootstrap ADMIN', async () => {
    const { service, create } = makeService(0);
    await service.signup({ email: 'a@b.co', password: 'Password1!' } as never);
    expect(create.mock.calls[0][0].data).toMatchObject({ role: 'ADMIN' });
  });
});
