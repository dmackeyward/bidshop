import { test, expect } from '@playwright/test';

const uniqueEmail = () => `ui-buyer-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

test.describe('Buyer journey', () => {
  test('register → add to cart → checkout → confirmation', async ({ page }) => {
    // 1. Register through the UI
    await page.goto('/register');
    await page.getByTestId('register-name').fill('June Buyer');
    await page.getByTestId('register-email').fill(uniqueEmail());
    await page.getByTestId('register-password').fill('secret123');
    await page.getByTestId('register-submit').click();

    // Registration navigates home and signs us in
    await expect(page.getByTestId('nav-user-name')).toContainText('June');

    // 2. Add beef mince ($14.50) twice — waiting between clicks because the
    //    button disables itself while a request is in flight.
    const addMince = page.getByTestId('product-add-p-001');
    await addMince.click();
    await expect(page.getByTestId('product-message-p-001')).toHaveText('Added to cart');
    await addMince.click();
    await expect(page.getByTestId('product-message-p-001')).toHaveText('Added to cart');
    await expect(page.getByTestId('nav-cart-count')).toHaveText('2');

    // 3. Cart page shows correct line math for qty 2
    await page.getByTestId('nav-cart').click();
    await expect(page.getByTestId('cart-row-p-001')).toBeVisible();
    await expect(page.getByTestId('cart-qty-p-001')).toHaveValue('2');
    await expect(page.getByTestId('cart-line-total-p-001')).toHaveText('$29.00');
    await expect(page.getByTestId('cart-subtotal')).toHaveText('$29.00');
    await expect(page.getByTestId('cart-summary')).toContainText('GST (15%)');

    // 4. Checkout — name and email are pre-filled from the signed-in user
    await page.getByTestId('cart-checkout').click();
    await expect(page.getByTestId('checkout-form')).toBeVisible();
    await expect(page.getByTestId('checkout-name')).toHaveValue('June Buyer');
    await page.getByTestId('checkout-address').fill('1 Queen St');
    await page.getByTestId('checkout-city').fill('Auckland');
    await page.getByTestId('checkout-postcode').fill('1010');
    await page.getByTestId('checkout-submit').click();

    // 5. Confirmation — server-side order at 15% GST
    await expect(page.getByTestId('order-confirmation')).toBeVisible();
    const orderId = await page.getByTestId('order-id').textContent();
    expect(orderId).toMatch(/^#/);
    await expect(page.getByTestId('order-total')).toHaveText('$33.35');
  });

  test.fixme('total charged matches the total displayed at checkout (BUG-005)', async ({
    page,
  }) => {
    // Same journey, but this test captures the PRICE THE CUSTOMER SEES on
    // screen and asserts the confirmation charges exactly that. No hardcoded
    // numbers — pure customer contract. Fails today: cart shows 12.5% GST,
    // the order charges 15% (see FINDINGS.md BUG-005).
    await page.goto('/register');
    await page.getByTestId('register-name').fill('Fix Me');
    await page.getByTestId('register-email').fill(uniqueEmail());
    await page.getByTestId('register-password').fill('secret123');
    await page.getByTestId('register-submit').click();
    await expect(page.getByTestId('nav-user-name')).toBeVisible();

    await page.getByTestId('product-add-p-001').click();
    await expect(page.getByTestId('product-message-p-001')).toHaveText('Added to cart');
    await page.getByTestId('product-add-p-001').click();
    await expect(page.getByTestId('product-message-p-001')).toHaveText('Added to cart');

    await page.getByTestId('nav-cart').click();
    const displayedTotal = (await page.getByTestId('cart-total').textContent()) ?? '';

    await page.getByTestId('cart-checkout').click();
    await page.getByTestId('checkout-address').fill('1 Queen St');
    await page.getByTestId('checkout-city').fill('Auckland');
    await page.getByTestId('checkout-postcode').fill('1010');
    await page.getByTestId('checkout-submit').click();
    await expect(page.getByTestId('order-confirmation')).toBeVisible();

    // The customer should be charged exactly what the screen promised.
    await expect(page.getByTestId('order-total')).toHaveText(displayedTotal);
  });
});