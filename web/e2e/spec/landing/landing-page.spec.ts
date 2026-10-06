import { test, expect } from '@playwright/test';
import { mockApi } from '../_support';

test.use({ serviceWorkers: 'block' });

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
  test(`signed-out visitor sees landing copy and role CTAs (${viewport.width}px)`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await mockApi(page);
    await page.goto('/#/');

    await expect(page.locator('[data-testid="landing-hero"] h1')).toHaveText('B2B Vendor & Customer Workspace Portal');
    await expect(page.getByTestId('landing-subheadline')).toContainText(
      'Streamline onboarding, communications, and invoicing between vendors and customers in one place.');

    await expect(page.getByTestId('landing-highlight-0')).toContainText('Shared channels for real-time vendor-customer communication');
    await expect(page.getByTestId('landing-highlight-1')).toContainText('Integrated invoice management and approval workflows');
    await expect(page.getByTestId('landing-highlight-2')).toContainText('Role-based access for admins, vendors, and customers');

    const ctas: Array<[string, string, string]> = [
      ['landing-cta-admin', 'Get Started', '#/dashboard'],
      ['landing-cta-vendor', 'View Orders', '#/orders'],
      ['landing-cta-customer', 'Track Invoices', '#/invoices'],
    ];
    for (const [id, label, dest] of ctas) {
      const a = page.getByTestId(id);
      await expect(a).toBeVisible();
      await expect(a).toHaveText(label);
      expect(await a.getAttribute('href')).toMatch(new RegExp(dest.replace('/', '\\/') + '$'));
    }

    const body = await page.locator('body').innerText();
    expect(body).not.toContain('Enterprise Platform');
    expect(body).not.toContain('A modern platform for your organization');
  });
}
