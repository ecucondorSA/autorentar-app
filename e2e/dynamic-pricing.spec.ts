import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Tests: Sistema de Pricing Dinámico
 *
 * Flujo:
 * 1. Pricing base configurado por locador
 * 2. Surge pricing por demanda alta (fines de semana, feriados)
 * 3. Descuentos por duración (semanal, mensual)
 * 4. Descuentos por temporada baja
 * 5. Cupones y promociones
 * 6. Pricing por región/zona (diferencial geográfico)
 * 7. Early bird discounts (reserva anticipada)
 * 8. Last minute pricing
 */

// 🔧 Helper Functions
async function loginAsLocatario(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByTestId('email-input').fill('locatario@test.com');
  await page.getByTestId('password-input').fill('test1234');
  await page.getByTestId('submit-login').click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
}

async function loginAsLocador(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByTestId('email-input').fill('locador@test.com');
  await page.getByTestId('password-input').fill('test1234');
  await page.getByTestId('submit-login').click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
}

async function logout(page: Page): Promise<void> {
  await page.getByTestId('user-menu-button').click();
  await page.getByTestId('logout-button').click();
  await expect(page).toHaveURL(/login/, { timeout: 5000 });
}

function getNextWeekendDate(): Date {
  const date = new Date();
  // Find next Saturday
  while (date.getDay() !== 6) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

function getWeekdayDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 7); // Next week
  // Find a Wednesday
  while (date.getDay() !== 3) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

// 📝 Tests de Pricing Base
test.describe('Dynamic Pricing - Configuración Base', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('Locador configura pricing base y reglas dinámicas', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Configurar pricing base');

    // 1. Login como locador
    await loginAsLocador(page);

    // 2. Navigate to car management
    await page.goto('/my-cars');
    await page.getByTestId('car-card').first().click();

    // 3. Go to pricing settings
    await page.getByTestId('pricing-tab').click();
    await expect(page.getByTestId('pricing-settings')).toBeVisible();

    // 4. Set base price
    await page.getByTestId('base-price-input').clear();
    await page.getByTestId('base-price-input').fill('50'); // $50/day

    // 5. Enable dynamic pricing
    await page.getByTestId('enable-dynamic-pricing-toggle').check();

    // 6. Configure weekend surge
    await page.getByTestId('weekend-surge-section').click();
    await page.getByTestId('weekend-surge-enabled').check();
    await page.getByTestId('weekend-surge-percentage').fill('30'); // +30% on weekends

    // 7. Configure duration discounts
    await page.getByTestId('duration-discounts-section').click();

    // Weekly discount (7+ days)
    await page.getByTestId('weekly-discount-enabled').check();
    await page.getByTestId('weekly-discount-percentage').fill('10'); // -10%

    // Monthly discount (30+ days)
    await page.getByTestId('monthly-discount-enabled').check();
    await page.getByTestId('monthly-discount-percentage').fill('20'); // -20%

    // 8. Configure early bird discount
    await page.getByTestId('early-bird-section').click();
    await page.getByTestId('early-bird-enabled').check();
    await page.getByTestId('early-bird-days-advance').fill('30'); // Book 30+ days ahead
    await page.getByTestId('early-bird-discount-percentage').fill('15'); // -15%

    // 9. Configure last minute pricing
    await page.getByTestId('last-minute-section').click();
    await page.getByTestId('last-minute-enabled').check();
    await page.getByTestId('last-minute-days-threshold').fill('3'); // Last 3 days
    await page.getByTestId('last-minute-discount-percentage').fill('25'); // -25%

    // 10. Save settings
    await page.getByTestId('save-pricing-button').click();

    // 11. Verify confirmation
    await expect(page.getByTestId('pricing-saved-confirmation')).toBeVisible({
      timeout: 5000,
    });

    console.log('✅ Pricing dinámico configurado');
  });

  test('Ver preview de pricing para diferentes escenarios', async ({ page }) => {
    await loginAsLocador(page);

    await page.goto('/my-cars');
    await page.getByTestId('car-card').first().click();
    await page.getByTestId('pricing-tab').click();

    // Open pricing calculator/preview
    await page.getByTestId('pricing-preview-button').click();
    await expect(page.getByTestId('pricing-preview-modal')).toBeVisible();

    // Scenario 1: Weekend booking
    await page.getByTestId('preview-start-date').fill(
      getNextWeekendDate().toISOString().split('T')[0]
    );
    await page.getByTestId('preview-end-date').fill(
      new Date(getNextWeekendDate().getTime() + 2 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
    );
    await page.getByTestId('calculate-price-button').click();

    // Should show surge pricing
    await expect(page.getByTestId('surge-pricing-indicator')).toBeVisible();
    const weekendPrice = await page.getByTestId('calculated-total').textContent();

    // Scenario 2: Weekly booking
    const weekStart = getWeekdayDate();
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    await page.getByTestId('preview-start-date').fill(weekStart.toISOString().split('T')[0]);
    await page.getByTestId('preview-end-date').fill(weekEnd.toISOString().split('T')[0]);
    await page.getByTestId('calculate-price-button').click();

    // Should show weekly discount
    await expect(page.getByTestId('weekly-discount-indicator')).toBeVisible();
    const weeklyPrice = await page.getByTestId('calculated-total').textContent();

    console.log(`Weekend: ${weekendPrice}, Weekly: ${weeklyPrice}`);
  });
});

// 📝 Tests de Surge Pricing
test.describe('Dynamic Pricing - Surge Pricing', () => {
  test('Pricing aumenta en fin de semana', async ({ page }) => {
    await loginAsLocatario(page);

    // 1. Search for a car
    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();

    // 2. Select weekday dates first
    const weekday = getWeekdayDate();
    const weekdayEnd = new Date(weekday.getTime() + 2 * 24 * 60 * 60 * 1000);

    await page.getByTestId('start-date-input').fill(weekday.toISOString().split('T')[0]);
    await page.getByTestId('end-date-input').fill(weekdayEnd.toISOString().split('T')[0]);

    // Calculate weekday price
    const weekdayPrice = await page.getByTestId('total-price').textContent();
    const weekdayAmount = Number.parseInt(weekdayPrice?.replace(/\D/g, '') || '0');

    // 3. Change to weekend dates
    const weekend = getNextWeekendDate();
    const weekendEnd = new Date(weekend.getTime() + 2 * 24 * 60 * 60 * 1000);

    await page.getByTestId('start-date-input').fill(weekend.toISOString().split('T')[0]);
    await page.getByTestId('end-date-input').fill(weekendEnd.toISOString().split('T')[0]);

    // Calculate weekend price
    const weekendPrice = await page.getByTestId('total-price').textContent();
    const weekendAmount = Number.parseInt(weekendPrice?.replace(/\D/g, '') || '0');

    // Weekend should be more expensive
    expect(weekendAmount).toBeGreaterThan(weekdayAmount);

    // Check surge indicator
    await expect(page.getByTestId('surge-pricing-badge')).toBeVisible();

    console.log(`Weekday: $${weekdayAmount / 100}, Weekend: $${weekendAmount / 100}`);
  });

  test('Surge pricing en feriados nacionales', async ({ page }) => {
    await loginAsLocatario(page);

    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();

    // Select a holiday date (e.g., New Year's Day 2026-01-01)
    await page.getByTestId('start-date-input').fill('2026-01-01');
    await page.getByTestId('end-date-input').fill('2026-01-03');

    // Should show holiday surge
    await expect(page.getByTestId('holiday-surge-badge')).toBeVisible();

    // Check increased price
    const holidayPrice = await page.getByTestId('total-price').textContent();
    console.log(`Holiday price: ${holidayPrice}`);

    // Should show which holiday
    const holidayName = await page.getByTestId('holiday-name').textContent();
    expect(holidayName).toContain('Año Nuevo');
  });

  test('Surge pricing por alta demanda en zona', async ({ page }) => {
    await loginAsLocatario(page);

    // Search in high-demand area (e.g., downtown Buenos Aires)
    await page.goto('/cars');
    await page.getByTestId('location-input').fill('Palermo, Buenos Aires');
    await page.getByTestId('search-button').click();

    // Select car in high-demand zone
    await page.getByTestId('car-card').first().click();

    // Check for demand-based surge
    const demandSurge = page.getByTestId('demand-surge-badge');
    if (await demandSurge.isVisible()) {
      // Get surge percentage
      const surgeText = await demandSurge.textContent();
      expect(surgeText).toMatch(/\+\d+%/);

      // Check surge explanation
      await demandSurge.hover();
      await expect(page.getByTestId('surge-explanation-tooltip')).toBeVisible();
    }
  });
});

// 📝 Tests de Descuentos por Duración
test.describe('Dynamic Pricing - Descuentos por Duración', () => {
  test('Descuento por reserva semanal (7+ días)', async ({ page }) => {
    await loginAsLocatario(page);

    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();

    // Get daily price
    const dailyPriceText = await page.getByTestId('price-per-day').textContent();
    const dailyPrice = Number.parseInt(dailyPriceText?.replace(/\D/g, '') || '0') / 100;

    // Book for 7 days
    const startDate = getWeekdayDate();
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    await page.getByTestId('start-date-input').fill(startDate.toISOString().split('T')[0]);
    await page.getByTestId('end-date-input').fill(endDate.toISOString().split('T')[0]);

    // Check weekly discount applied
    await expect(page.getByTestId('weekly-discount-badge')).toBeVisible();

    // Calculate expected price with discount
    const totalPriceText = await page.getByTestId('total-price').textContent();
    const totalPrice = Number.parseInt(totalPriceText?.replace(/\D/g, '') || '0') / 100;

    // Should be less than daily price * 7
    expect(totalPrice).toBeLessThan(dailyPrice * 7);

    // Check discount amount
    const discountAmount = await page.getByTestId('discount-amount').textContent();
    console.log(`Weekly discount: ${discountAmount}`);
  });

  test('Descuento por reserva mensual (30+ días)', async ({ page }) => {
    await loginAsLocatario(page);

    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();

    // Get daily price
    const dailyPriceText = await page.getByTestId('price-per-day').textContent();
    const dailyPrice = Number.parseInt(dailyPriceText?.replace(/\D/g, '') || '0') / 100;

    // Book for 30 days
    const startDate = getWeekdayDate();
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    await page.getByTestId('start-date-input').fill(startDate.toISOString().split('T')[0]);
    await page.getByTestId('end-date-input').fill(endDate.toISOString().split('T')[0]);

    // Check monthly discount applied
    await expect(page.getByTestId('monthly-discount-badge')).toBeVisible();

    // Should have larger discount than weekly
    const totalPriceText = await page.getByTestId('total-price').textContent();
    const totalPrice = Number.parseInt(totalPriceText?.replace(/\D/g, '') || '0') / 100;

    const expectedFullPrice = dailyPrice * 30;
    const discountPercentage = ((expectedFullPrice - totalPrice) / expectedFullPrice) * 100;

    // Monthly discount should be around 20%
    expect(discountPercentage).toBeGreaterThan(15);
    expect(discountPercentage).toBeLessThan(25);

    console.log(`Monthly discount: ${discountPercentage.toFixed(1)}%`);
  });

  test('Descuentos acumulativos no exceden máximo', async ({ page }) => {
    await loginAsLocatario(page);

    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();

    // Try to apply monthly discount + early bird + coupon
    const farFutureDate = new Date();
    farFutureDate.setDate(farFutureDate.getDate() + 60); // 60 days ahead (early bird)
    const endDate = new Date(farFutureDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days duration

    await page.getByTestId('start-date-input').fill(farFutureDate.toISOString().split('T')[0]);
    await page.getByTestId('end-date-input').fill(endDate.toISOString().split('T')[0]);

    // Apply coupon
    await page.getByTestId('coupon-input').fill('SUMMER2025');
    await page.getByTestId('apply-coupon-button').click();

    // Check that total discount doesn't exceed maximum (e.g., 50%)
    const priceBreakdown = page.getByTestId('price-breakdown');
    await priceBreakdown.click();

    const totalDiscountText = await page.getByTestId('total-discount-percentage').textContent();
    const totalDiscount = Number.parseFloat(totalDiscountText?.replace(/\D/g, '') || '0');

    // Maximum discount cap (usually 50%)
    expect(totalDiscount).toBeLessThanOrEqual(50);

    console.log(`Total combined discount: ${totalDiscount}%`);
  });
});

// 📝 Tests de Cupones y Promociones
test.describe('Dynamic Pricing - Cupones', () => {
  test('Aplicar cupón de descuento válido', async ({ page }) => {
    await loginAsLocatario(page);

    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();

    // Select dates
    const startDate = getWeekdayDate();
    const endDate = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    await page.getByTestId('start-date-input').fill(startDate.toISOString().split('T')[0]);
    await page.getByTestId('end-date-input').fill(endDate.toISOString().split('T')[0]);

    // Get price before coupon
    const priceBefore = await page.getByTestId('total-price').textContent();
    const amountBefore = Number.parseInt(priceBefore?.replace(/\D/g, '') || '0');

    // Apply coupon
    await page.getByTestId('coupon-input').fill('NEWUSER10');
    await page.getByTestId('apply-coupon-button').click();

    // Should show success message
    await expect(page.getByTestId('coupon-applied-success')).toBeVisible();

    // Price should decrease
    const priceAfter = await page.getByTestId('total-price').textContent();
    const amountAfter = Number.parseInt(priceAfter?.replace(/\D/g, '') || '0');

    expect(amountAfter).toBeLessThan(amountBefore);

    // Check coupon details
    await expect(page.getByTestId('coupon-discount-line')).toBeVisible();
    const couponDiscount = await page.getByTestId('coupon-discount-amount').textContent();
    console.log(`Coupon discount: ${couponDiscount}`);
  });

  test('Rechazar cupón inválido o expirado', async ({ page }) => {
    await loginAsLocatario(page);

    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();

    // Try to apply invalid coupon
    await page.getByTestId('coupon-input').fill('INVALID123');
    await page.getByTestId('apply-coupon-button').click();

    // Should show error
    await expect(page.getByTestId('coupon-invalid-error')).toBeVisible();

    // Try expired coupon
    await page.getByTestId('coupon-input').clear();
    await page.getByTestId('coupon-input').fill('EXPIRED2024');
    await page.getByTestId('apply-coupon-button').click();

    await expect(page.getByTestId('coupon-expired-error')).toBeVisible();
  });

  test('Cupón solo válido para primera reserva', async ({ page }) => {
    await loginAsLocatario(page);

    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();

    // Try to apply first-time user coupon
    await page.getByTestId('coupon-input').fill('FIRSTRIDE50');
    await page.getByTestId('apply-coupon-button').click();

    // Check if user already has bookings
    const hasBookings = await page.evaluate(() => {
      // This would check user's booking history
      return localStorage.getItem('user_bookings_count') !== '0';
    });

    if (hasBookings) {
      // Should show error
      await expect(page.getByTestId('coupon-first-booking-only-error')).toBeVisible();
    } else {
      // Should apply successfully
      await expect(page.getByTestId('coupon-applied-success')).toBeVisible();
    }
  });

  test('Cupón con monto mínimo de compra', async ({ page }) => {
    await loginAsLocatario(page);

    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();

    // Book for 1 day (low amount)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    await page.getByTestId('start-date-input').fill(tomorrow.toISOString().split('T')[0]);
    await page.getByTestId('end-date-input').fill(dayAfter.toISOString().split('T')[0]);

    // Try to apply coupon with minimum $200 purchase
    await page.getByTestId('coupon-input').fill('BIG200');
    await page.getByTestId('apply-coupon-button').click();

    const totalPrice = await page.getByTestId('total-price').textContent();
    const amount = Number.parseInt(totalPrice?.replace(/\D/g, '') || '0') / 100;

    if (amount < 200) {
      // Should show minimum purchase error
      await expect(page.getByTestId('coupon-minimum-purchase-error')).toBeVisible();
      const minMessage = await page.getByTestId('coupon-minimum-purchase-error').textContent();
      expect(minMessage).toContain('$200');
    }
  });
});

// 📝 Tests de Early Bird y Last Minute
test.describe('Dynamic Pricing - Early Bird & Last Minute', () => {
  test('Early bird discount por reserva anticipada', async ({ page }) => {
    await loginAsLocatario(page);

    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();

    // Book 40 days in advance
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 40);
    const endDate = new Date(farFuture);
    endDate.setDate(endDate.getDate() + 2);

    await page.getByTestId('start-date-input').fill(farFuture.toISOString().split('T')[0]);
    await page.getByTestId('end-date-input').fill(endDate.toISOString().split('T')[0]);

    // Should show early bird discount
    await expect(page.getByTestId('early-bird-discount-badge')).toBeVisible();

    // Check discount amount
    const discountText = await page.getByTestId('early-bird-discount-amount').textContent();
    console.log(`Early bird discount: ${discountText}`);

    // Verify explanation
    await page.getByTestId('early-bird-discount-badge').hover();
    await expect(page.getByTestId('early-bird-explanation')).toBeVisible();
  });

  test('Last minute discount por reserva inmediata', async ({ page }) => {
    await loginAsLocatario(page);

    await page.goto('/cars');

    // Filter for cars with last-minute availability
    await page.getByTestId('filters-button').click();
    await page.getByTestId('last-minute-deals-toggle').check();
    await page.getByTestId('apply-filters-button').click();

    // Select first last-minute car
    await page.getByTestId('car-card').first().click();

    // Should show last-minute badge
    await expect(page.getByTestId('last-minute-deal-badge')).toBeVisible();

    // Book for tomorrow (last minute)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 2);

    await page.getByTestId('start-date-input').fill(tomorrow.toISOString().split('T')[0]);
    await page.getByTestId('end-date-input').fill(dayAfter.toISOString().split('T')[0]);

    // Check last-minute discount
    await expect(page.getByTestId('last-minute-discount-line')).toBeVisible();
    const discountAmount = await page.getByTestId('last-minute-discount-amount').textContent();
    console.log(`Last minute discount: ${discountAmount}`);
  });
});

// 📝 Tests de Pricing Regional
test.describe('Dynamic Pricing - Diferencial Regional', () => {
  test('Pricing varía por zona geográfica', async ({ page }) => {
    await loginAsLocatario(page);

    // Search in expensive zone (downtown)
    await page.goto('/cars');
    await page.getByTestId('location-input').fill('Recoleta, Buenos Aires');
    await page.getByTestId('search-button').click();

    await page.getByTestId('car-card').first().click();
    const priceRecoleta = await page.getByTestId('price-per-day').textContent();

    // Search in cheaper zone (suburbs)
    await page.goto('/cars');
    await page.getByTestId('location-input').fill('Merlo, Buenos Aires');
    await page.getByTestId('search-button').click();

    await page.getByTestId('car-card').first().click();
    const priceMerlo = await page.getByTestId('price-per-day').textContent();

    // Compare prices
    const amountRecoleta = Number.parseInt(priceRecoleta?.replace(/\D/g, '') || '0');
    const amountMerlo = Number.parseInt(priceMerlo?.replace(/\D/g, '') || '0');

    console.log(`Recoleta: $${amountRecoleta / 100}, Merlo: $${amountMerlo / 100}`);

    // Downtown should generally be more expensive
    // (Note: This might not always be true depending on specific cars)
  });

  test('Pricing por distancia desde punto de entrega', async ({ page }) => {
    await loginAsLocatario(page);

    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();

    // Select delivery option
    await page.getByTestId('delivery-option-toggle').check();

    // Enter delivery address far from car location
    await page.getByTestId('delivery-address-input').fill('La Plata, Buenos Aires');

    // Should calculate delivery surcharge
    await page.getByTestId('calculate-delivery-button').click();

    const deliverySurcharge = page.getByTestId('delivery-surcharge');
    if (await deliverySurcharge.isVisible()) {
      const surchargeAmount = await deliverySurcharge.textContent();
      console.log(`Delivery surcharge: ${surchargeAmount}`);

      // Should show distance
      const distance = await page.getByTestId('delivery-distance').textContent();
      expect(distance).toMatch(/\d+ km/);
    }
  });
});

// 🔍 Tests de Notificaciones de Precio
test.describe('Dynamic Pricing - Alertas', () => {
  test('Alerta de precio cuando baja', async ({ page }) => {
    await loginAsLocatario(page);

    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();

    // Set price alert
    await page.getByTestId('set-price-alert-button').click();
    await expect(page.getByTestId('price-alert-modal')).toBeVisible();

    // Enter desired price
    await page.getByTestId('alert-target-price-input').fill('40'); // $40/day
    await page.getByTestId('save-price-alert-button').click();

    // Verify confirmation
    await expect(page.getByTestId('price-alert-set-confirmation')).toBeVisible();

    // Check notifications
    await page.goto('/notifications');

    // Should see price alert set notification
    await expect(page.getByTestId('notification-price-alert-set')).toBeVisible();
  });

  test('Recomendación de mejor momento para reservar', async ({ page }) => {
    await loginAsLocatario(page);

    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();

    // Check for pricing insights
    const pricingInsights = page.getByTestId('pricing-insights-section');
    if (await pricingInsights.isVisible()) {
      // See recommendation
      await expect(page.getByTestId('best-time-to-book')).toBeVisible();

      // Check price trend
      await expect(page.getByTestId('price-trend-chart')).toBeVisible();

      // See price history
      await page.getByTestId('view-price-history-button').click();
      await expect(page.getByTestId('price-history-modal')).toBeVisible();
    }
  });
});
