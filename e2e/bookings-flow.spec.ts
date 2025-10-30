import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Tests: Flujo completo de Bookings (Reservas)
 *
 * Flujo:
 * 1. Locatario busca auto
 * 2. Selecciona fechas y crea reserva
 * 3. Confirma pago
 * 4. Locador recibe notificación
 * 5. Locador aprueba/rechaza reserva
 * 6. Ambos pueden ver estado de reserva
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
  await page.getByTestId('user-menu').click();
  await page.getByTestId('logout-button').click();
  await expect(page).toHaveURL(/login/);
}

// 📝 Tests
test.describe('Bookings Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test('Locatario crea una reserva completa', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Crear reserva completa');

    // 1. Login como locatario
    await loginAsLocatario(page);

    // 2. Buscar autos
    await page.goto('/cars');
    await expect(page.getByTestId('car-list')).toBeVisible({ timeout: 5000 });

    // 3. Seleccionar un auto
    await page.getByTestId('car-card').first().click();
    await expect(page.getByTestId('car-detail')).toBeVisible();

    // 4. Click en "Reservar Ahora"
    await page.getByTestId('book-now-button').click();

    // 5. Debería redirigir a formulario de booking
    await expect(page).toHaveURL(/bookings\/create/);

    // 6. Llenar formulario de fechas
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7); // +7 días
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 3); // +3 días más

    await page.getByTestId('start-date-input').fill(
      startDate.toISOString().split('T')[0]
    );
    await page.getByTestId('end-date-input').fill(
      endDate.toISOString().split('T')[0]
    );

    // 7. Seleccionar seguro (opcional)
    const insuranceSelect = page.getByTestId('insurance-select');
    if (await insuranceSelect.isVisible()) {
      await insuranceSelect.selectOption('basic');
    }

    // 8. Confirmar reserva
    await page.getByTestId('confirm-booking-button').click();

    // 9. Debería mostrar resumen de pago
    await expect(page.getByTestId('payment-summary')).toBeVisible({
      timeout: 5000,
    });

    // 10. Verificar monto total
    const totalAmount = page.getByTestId('total-amount');
    await expect(totalAmount).toBeVisible();
    const amountText = await totalAmount.textContent();
    expect(Number.parseInt(amountText?.replace(/\D/g, '') || '0')).toBeGreaterThan(
      0
    );

    // 11. Confirmar pago
    await page.getByTestId('confirm-payment-button').click();

    // 12. Esperar confirmación
    await expect(page.getByTestId('booking-confirmation')).toBeVisible({
      timeout: 15000,
    });

    // 13. Verificar que muestra número de reserva
    await expect(page.getByTestId('booking-number')).toBeVisible();

    console.log('✅ Test completado: Reserva creada exitosamente');
  });

  test('Locador recibe y gestiona reserva', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Locador gestiona reserva');

    // 1. Login como locador
    await loginAsLocador(page);

    // 2. Navegar a reservas recibidas
    await page.goto('/bookings/received');
    await expect(page.getByTestId('bookings-received-list')).toBeVisible();

    // 3. Verificar que hay al menos una reserva pendiente
    const pendingBookings = page.getByTestId('booking-card-pending');
    const count = await pendingBookings.count();
    expect(count).toBeGreaterThan(0);

    // 4. Abrir detalle de primera reserva
    await pendingBookings.first().click();
    await expect(page.getByTestId('booking-detail')).toBeVisible();

    // 5. Verificar información de la reserva
    await expect(page.getByTestId('renter-info')).toBeVisible();
    await expect(page.getByTestId('car-info')).toBeVisible();
    await expect(page.getByTestId('dates-info')).toBeVisible();

    // 6. Aprobar reserva
    await page.getByTestId('approve-booking-button').click();

    // 7. Confirmar aprobación
    await page.getByTestId('confirm-approval-button').click();

    // 8. Verificar que cambió a estado "confirmado"
    await expect(page.getByTestId('booking-status-confirmed')).toBeVisible({
      timeout: 5000,
    });

    console.log('✅ Test completado: Reserva aprobada');
  });

  test('Locatario cancela reserva', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Cancelar reserva');

    // 1. Login como locatario
    await loginAsLocatario(page);

    // 2. Navegar a mis reservas
    await page.goto('/bookings');
    await expect(page.getByTestId('my-bookings-list')).toBeVisible();

    // 3. Seleccionar una reserva activa
    const activeBooking = page.getByTestId('booking-card-active').first();
    await expect(activeBooking).toBeVisible();
    await activeBooking.click();

    // 4. Click en cancelar
    await page.getByTestId('cancel-booking-button').click();

    // 5. Confirmar cancelación
    await expect(page.getByTestId('cancel-confirmation-modal')).toBeVisible();
    await page.getByTestId('confirm-cancellation-button').click();

    // 6. Verificar que cambió a estado "cancelado"
    await expect(page.getByTestId('booking-status-cancelled')).toBeVisible({
      timeout: 5000,
    });

    // 7. Verificar que muestra información de reembolso
    await expect(page.getByTestId('refund-info')).toBeVisible();

    console.log('✅ Test completado: Reserva cancelada');
  });

  test('Flujo completo: Crear, aprobar y completar reserva', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Flujo completo de reserva');

    // 1. Locatario crea reserva
    await loginAsLocatario(page);
    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();
    await page.getByTestId('book-now-button').click();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    await page.getByTestId('start-date-input').fill(
      startDate.toISOString().split('T')[0]
    );
    await page.getByTestId('end-date-input').fill(
      endDate.toISOString().split('T')[0]
    );
    await page.getByTestId('confirm-booking-button').click();
    await page.getByTestId('confirm-payment-button').click();

    // Guardar booking ID
    await expect(page.getByTestId('booking-number')).toBeVisible({ timeout: 15000 });
    const bookingNumber = await page.getByTestId('booking-number').textContent();

    // 2. Logout y login como locador
    await logout(page);
    await loginAsLocador(page);

    // 3. Locador aprueba reserva
    await page.goto('/bookings/received');
    await page.getByTestId('booking-card-pending').first().click();
    await page.getByTestId('approve-booking-button').click();
    await page.getByTestId('confirm-approval-button').click();
    await expect(page.getByTestId('booking-status-confirmed')).toBeVisible();

    // 4. Logout y login como locatario
    await logout(page);
    await loginAsLocatario(page);

    // 5. Verificar que reserva está confirmada
    await page.goto('/bookings');
    await page.getByTestId('booking-card-confirmed').first().click();
    await expect(page.getByTestId('booking-status-confirmed')).toBeVisible();

    console.log(`✅ Test completado: Booking ${bookingNumber} completado`);
  });

  test('Validaciones de formulario de reserva', async ({ page }) => {
    await loginAsLocatario(page);
    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();
    await page.getByTestId('book-now-button').click();

    // Intentar confirmar sin fechas
    const confirmButton = page.getByTestId('confirm-booking-button');
    await expect(confirmButton).toBeDisabled();

    // Fecha de inicio en el pasado
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await page.getByTestId('start-date-input').fill(
      pastDate.toISOString().split('T')[0]
    );
    await expect(page.getByTestId('date-error')).toBeVisible();

    // Fecha de fin antes de inicio
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 5);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);

    await page.getByTestId('start-date-input').fill(
      startDate.toISOString().split('T')[0]
    );
    await page.getByTestId('end-date-input').fill(
      endDate.toISOString().split('T')[0]
    );
    await expect(page.getByTestId('date-range-error')).toBeVisible();

    console.log('✅ Validaciones de formulario funcionan correctamente');
  });
});

// 🔍 Tests de Edge Cases
test.describe('Bookings - Edge Cases', () => {
  test('No se puede reservar auto no disponible', async ({ page }) => {
    await loginAsLocatario(page);
    await page.goto('/cars');

    // Filtrar por autos no disponibles (si el filtro existe)
    const statusFilter = page.getByTestId('status-filter');
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('unavailable');
    }

    const unavailableCar = page.getByTestId('car-card-unavailable').first();
    if (await unavailableCar.isVisible()) {
      await unavailableCar.click();

      // Botón de reservar debe estar deshabilitado
      await expect(page.getByTestId('book-now-button')).toBeDisabled();
    }
  });

  test('No se puede reservar en fechas ya ocupadas', async ({ page }) => {
    await loginAsLocatario(page);
    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();
    await page.getByTestId('book-now-button').click();

    // Intentar reservar en fechas ocupadas (debería mostrar error)
    // Esto depende de que haya reservas existentes en la BD
    const occupiedDate = new Date();
    occupiedDate.setDate(occupiedDate.getDate() + 2);

    await page.getByTestId('start-date-input').fill(
      occupiedDate.toISOString().split('T')[0]
    );
    await page.getByTestId('end-date-input').fill(
      occupiedDate.toISOString().split('T')[0]
    );

    // El sistema debe validar disponibilidad
    await page.getByTestId('check-availability-button').click();

    // Si no está disponible, debe mostrar mensaje
    const availabilityMessage = page.getByTestId('availability-message');
    await expect(availabilityMessage).toBeVisible({ timeout: 5000 });
  });
});
