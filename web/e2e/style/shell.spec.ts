import { test, expect } from '@playwright/test';
import { mockApi, login } from '../spec/_support';

test.use({ serviceWorkers: 'block' });

for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
  test(`orders renders inside the shared shell at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await mockApi(page);
    await login(page);
    await page.goto('/#/orders');
    await expect(page.locator('app-layout [data-testid="orders-screen"]')).toBeVisible();
    await expect(page.locator('app-layout app-sidebar')).toHaveCount(1);
    await expect(page.locator('app-layout [data-testid="app-topbar"]')).toHaveCount(1);
    for (const group of ['Vendor', 'Customer', 'Admin']) {
      await expect(page.locator('.nav-group-label', { hasText: new RegExp(`^\\s*${group}\\s*$`) })).toHaveCount(1);
    }
    const primary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim().toLowerCase());
    expect(primary).toBe('#481a54');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
