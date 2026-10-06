import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

// Hermetic: the SPA is served statically, so stub the backend API.
async function mockApi(page: import('@playwright/test').Page) {
  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method().toUpperCase();
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (method === 'POST' && /\/api\/auth\/login/.test(url)) {
      const body = req.postDataJSON() ?? {};
      return json({ id: 'v1', email: body.email, role: 'VENDOR' });
    }
    if (method === 'GET' && /\/api\/users\/me(\?|$)/.test(url)) {
      return json({ id: 'v1', email: 'vendor@acme.example.com', role: 'VENDOR' });
    }
    if (method === 'GET') return json([]);
    return json({ ok: true });
  });
}

test('vendor login redirects to /vendor/profile and keeps VENDOR role across reload', async ({ page }) => {
  await mockApi(page);
  await page.goto('/#/login');
  await page.getByLabel('Email').fill('vendor@acme.example.com');
  await page.getByLabel('Password').fill('password');
  await page.locator('button[type="submit"]').click();

  await page.waitForURL(/#\/vendor\/profile/, { timeout: 10_000 });
  await expect(page.getByTestId('vendor-profile-screen')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('user') || '{}').role)).toBe('VENDOR');

  await page.reload();
  await expect(page).toHaveURL(/#\/vendor\/profile/);
  await expect(page.getByTestId('vendor-profile-screen')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('user') || '{}').role)).toBe('VENDOR');
  expect(page.url()).not.toContain('/dashboard');
});
