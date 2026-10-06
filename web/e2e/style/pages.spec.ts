import { test, expect } from '@playwright/test';
import { mockApi, login } from '../spec/_support';

test.use({ serviceWorkers: 'block' });

const PAGES: [string, string][] = [
  ['/vendor/profile', 'vendor-profile-screen'],
  ['/admin/customers', 'admin-customers-screen'],
  ['/channels', 'channels-screen'],
  ['/orders', 'orders-screen'],
  ['/invoices', 'invoices-screen'],
  ['/settings/notifications', 'settings-notifications-screen'],
  ['/admin/audit-log', 'admin-audit-log-screen'],
];

for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
  for (const [path, testId] of PAGES) {
    test(`${path} uses the shared shell and tokens at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await mockApi(page);
      await login(page);
      await page.goto(`/#${path}`);
      const screen = page.locator(`app-layout [data-testid="${testId}"]`);
      await expect(screen).toBeVisible();
      const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
      expect(bodyFont).toContain('Salesforce-Sans');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}
