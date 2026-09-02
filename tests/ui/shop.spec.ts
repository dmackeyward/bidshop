import { test, expect } from '@playwright/test';

const productCards = '[data-testid^="product-card-"]';

test.describe('Shop – browsing (public)', () => {
  test('shows all 18 seeded products', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('product-grid')).toBeVisible();
    await expect(page.locator(productCards)).toHaveCount(18);
    await expect(page.getByTestId('product-card-p-001')).toBeVisible();
  });

  test('search narrows the grid (with debounce)', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('filter-search').fill('avocado');
    // The app debounces 200ms then fetches — auto-waiting handles the timing.
    await expect(page.locator(productCards)).toHaveCount(1);
    await expect(page.getByTestId('product-card-p-005')).toBeVisible();
    await expect(page.getByTestId('filter-summary')).toHaveText('1 product');
  });

  test('category filter and empty state', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('filter-category').selectOption('Seafood');
    await expect(page.locator(productCards)).toHaveCount(2); // oysters + salmon

    await page.getByTestId('filter-search').fill('zzzz-no-such-product');
    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(page.locator(productCards)).toHaveCount(0);
  });

  test('logged-out visitors are sent to login to buy', async ({ page }) => {
    await page.goto('/');
    const loginLink = page.getByTestId('product-login-p-001');
    await expect(loginLink).toHaveText('Log in to buy');
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });
});