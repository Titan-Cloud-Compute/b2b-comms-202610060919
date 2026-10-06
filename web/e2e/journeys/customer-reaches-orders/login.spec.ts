import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

// Hermetic run: the SPA is served statically, so stub the backend API.
async function mockApi(page: import('@playwright/test').Page, role: string) {
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (method === 'POST' && /\/api\/auth\/(login|signup)/.test(url)) {
      const body = route.request().postDataJSON() ?? {};
      return route.fulfill({ status: /signup/.test(url) ? 201 : 200, contentType: 'application/json',
        body: JSON.stringify({ id: 'u1', email: body.email, role }) });
    }
    if (method === 'GET' && /\/api\/admin\/customers/.test(url)) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    return route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"unauthenticated"}' });
  });
}

test('customer reaches orders — login', async ({ page }) => {
  await mockApi(page, 'CUSTOMER');
  await page.goto('/#/login');
  await page.getByLabel('Email').fill('buyer@corp.example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button').click();
});
