import { test, expect } from '@playwright/test';
import { mockApi, login } from '../spec/_support';

test.use({ serviceWorkers: 'block' });

const VIEWPORTS = [
  { width: 1280, height: 800 },
  { width: 375, height: 812 },
];

for (const viewport of VIEWPORTS) {
  test(`/login renders token-styled auth card without sidebar at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await mockApi(page);
    await page.goto('/#/login');

    // No sidebar on auth pages
    await expect(page.locator('app-sidebar')).toHaveCount(0);

    // Submit button uses primary colour token
    const submitBg = await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]') as HTMLElement | null;
      return btn ? getComputedStyle(btn).backgroundColor : '';
    });
    expect(submitBg).toBe('rgb(72, 26, 84)');

    // Only one button role on login
    await expect(page.getByRole('button')).toHaveCount(1);

    // No horizontal overflow
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test(`/signup renders token-styled auth card without sidebar at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await mockApi(page);
    await page.goto('/#/signup');

    // No sidebar on auth pages
    await expect(page.locator('app-sidebar')).toHaveCount(0);

    // Submit button uses primary colour token
    const submitBg = await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]') as HTMLElement | null;
      return btn ? getComputedStyle(btn).backgroundColor : '';
    });
    expect(submitBg).toBe('rgb(72, 26, 84)');

    // No horizontal overflow
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

for (const viewport of VIEWPORTS) {
  test(`/dashboard renders inside shared layout at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await mockApi(page);
    await login(page);
    await page.goto('/#/dashboard');

    await expect(page.locator('app-layout .routed-area')).toBeVisible();

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test(`/settings renders inside shared layout at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await mockApi(page);
    await login(page);
    await page.goto('/#/settings');

    await expect(page.locator('app-layout .routed-area')).toBeVisible();

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
