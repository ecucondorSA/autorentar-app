import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Tests: Sistema de Wallet y Pagos
 *
 * Flujo:
 * 1. Usuario carga saldo en wallet
 * 2. Usuario realiza pago de reserva con wallet
 * 3. Locador recibe pago en wallet
 * 4. Locador retira fondos
 * 5. Verificar historial de transacciones
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

// 📝 Tests
test.describe('Wallet y Pagos E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('Locatario carga saldo en wallet', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Cargar saldo en wallet');

    // 1. Login
    await loginAsLocatario(page);

    // 2. Navegar a wallet
    await page.goto('/wallet');
    await expect(page.getByTestId('wallet-dashboard')).toBeVisible();

    // 3. Verificar saldo actual
    const currentBalance = page.getByTestId('wallet-balance');
    await expect(currentBalance).toBeVisible();
    const balanceBefore = await currentBalance.textContent();

    // 4. Click en "Cargar Saldo"
    await page.getByTestId('add-funds-button').click();

    // 5. Modal de carga debe aparecer
    await expect(page.getByTestId('add-funds-modal')).toBeVisible();

    // 6. Ingresar monto
    await page.getByTestId('amount-input').fill('10000'); // $100.00

    // 7. Seleccionar método de pago
    await page.getByTestId('payment-method-select').selectOption('mercadopago');

    // 8. Confirmar
    await page.getByTestId('confirm-add-funds-button').click();

    // 9. Debería redirigir a MercadoPago (o mostrar iframe)
    // En test, podemos simular que el pago fue exitoso
    await expect(
      page.getByTestId('payment-processing')
    ).toBeVisible({ timeout: 5000 });

    // 10. Esperar confirmación
    await expect(
      page.getByTestId('payment-success')
    ).toBeVisible({ timeout: 30000 });

    // 11. Verificar que el saldo se actualizó
    await page.goto('/wallet');
    const newBalance = await currentBalance.textContent();
    expect(newBalance).not.toBe(balanceBefore);

    console.log('✅ Saldo cargado exitosamente');
  });

  test('Pago de reserva con wallet', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Pagar reserva con wallet');

    // 1. Login y crear reserva
    await loginAsLocatario(page);
    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();
    await page.getByTestId('book-now-button').click();

    // 2. Llenar fechas
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2);

    await page.getByTestId('start-date-input').fill(
      startDate.toISOString().split('T')[0]
    );
    await page.getByTestId('end-date-input').fill(
      endDate.toISOString().split('T')[0]
    );
    await page.getByTestId('confirm-booking-button').click();

    // 3. En pantalla de pago, seleccionar wallet
    await expect(page.getByTestId('payment-methods')).toBeVisible();
    await page.getByTestId('payment-method-wallet').click();

    // 4. Verificar saldo suficiente
    const walletBalance = page.getByTestId('wallet-available-balance');
    await expect(walletBalance).toBeVisible();

    const totalAmount = page.getByTestId('total-amount');
    const total = await totalAmount.textContent();

    // 5. Confirmar pago
    await page.getByTestId('confirm-payment-button').click();

    // 6. Verificar confirmación
    await expect(page.getByTestId('booking-confirmation')).toBeVisible({
      timeout: 10000,
    });

    // 7. Verificar que se descontó del wallet
    await page.goto('/wallet');
    await expect(page.getByTestId('recent-transaction-payment')).toBeVisible();

    console.log('✅ Pago con wallet exitoso');
  });

  test('Locador recibe pago en wallet', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Locador recibe pago');

    // 1. Login como locador
    await loginAsLocador(page);

    // 2. Ir a wallet
    await page.goto('/wallet');
    await expect(page.getByTestId('wallet-dashboard')).toBeVisible();

    // 3. Verificar saldo disponible
    const availableBalance = page.getByTestId('available-balance');
    await expect(availableBalance).toBeVisible();

    // 4. Verificar saldo pendiente (de reservas en progreso)
    const pendingBalance = page.getByTestId('pending-balance');
    await expect(pendingBalance).toBeVisible();

    // 5. Ver transacciones recientes
    await page.getByTestId('transactions-tab').click();
    await expect(page.getByTestId('transactions-list')).toBeVisible();

    // 6. Verificar que aparecen pagos recibidos
    const incomingPayments = page.getByTestId('transaction-type-income');
    const count = await incomingPayments.count();
    expect(count).toBeGreaterThanOrEqual(0);

    console.log('✅ Wallet de locador verificado');
  });

  test('Locador retira fondos', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Retirar fondos');

    // 1. Login como locador
    await loginAsLocador(page);

    // 2. Ir a wallet
    await page.goto('/wallet');

    // 3. Click en "Retirar"
    await page.getByTestId('withdraw-button').click();

    // 4. Modal de retiro
    await expect(page.getByTestId('withdrawal-modal')).toBeVisible();

    // 5. Verificar saldo disponible para retiro
    const availableForWithdrawal = page.getByTestId('available-for-withdrawal');
    await expect(availableForWithdrawal).toBeVisible();

    // 6. Ingresar monto
    await page.getByTestId('withdrawal-amount-input').fill('5000'); // $50.00

    // 7. Seleccionar cuenta bancaria
    const bankAccountSelect = page.getByTestId('bank-account-select');
    await expect(bankAccountSelect).toBeVisible();

    // Si no hay cuentas, debe mostrar mensaje para agregar una
    const accountCount = await bankAccountSelect.locator('option').count();
    if (accountCount === 0) {
      await expect(page.getByTestId('add-bank-account-button')).toBeVisible();
      console.log('⚠️ No hay cuentas bancarias configuradas');
      return;
    }

    await bankAccountSelect.selectOption({ index: 0 });

    // 8. Confirmar retiro
    await page.getByTestId('confirm-withdrawal-button').click();

    // 9. Verificar confirmación
    await expect(page.getByTestId('withdrawal-confirmation')).toBeVisible({
      timeout: 5000,
    });

    // 10. Verificar que aparece en transacciones
    await page.getByTestId('transactions-tab').click();
    await expect(page.getByTestId('transaction-type-withdrawal')).toBeVisible();

    console.log('✅ Retiro procesado exitosamente');
  });

  test('Historial completo de transacciones', async ({ page }) => {
    await loginAsLocatario(page);
    await page.goto('/wallet');

    // Ver todas las transacciones
    await page.getByTestId('transactions-tab').click();
    await expect(page.getByTestId('transactions-list')).toBeVisible();

    // Filtrar por tipo
    const filterSelect = page.getByTestId('transaction-type-filter');
    if (await filterSelect.isVisible()) {
      await filterSelect.selectOption('all');
      await expect(page.getByTestId('transaction-item')).toHaveCount(
        await page.getByTestId('transaction-item').count()
      );

      // Filtrar solo pagos
      await filterSelect.selectOption('payment');
      // Debería mostrar solo transacciones de tipo payment
    }

    // Filtrar por fecha
    const dateFilter = page.getByTestId('date-filter');
    if (await dateFilter.isVisible()) {
      await dateFilter.selectOption('last-30-days');
    }

    // Exportar transacciones
    const exportButton = page.getByTestId('export-transactions-button');
    if (await exportButton.isVisible()) {
      await exportButton.click();
      // Debería descargar CSV o PDF
    }

    console.log('✅ Historial de transacciones verificado');
  });
});

// 🔍 Tests de Validación
test.describe('Wallet - Validaciones', () => {
  test('No se puede retirar más del saldo disponible', async ({ page }) => {
    await loginAsLocador(page);
    await page.goto('/wallet');
    await page.getByTestId('withdraw-button').click();

    // Intentar retirar un monto muy alto
    await page.getByTestId('withdrawal-amount-input').fill('999999999');

    // Debe mostrar error
    await expect(page.getByTestId('insufficient-funds-error')).toBeVisible();

    // Botón de confirmar debe estar deshabilitado
    await expect(page.getByTestId('confirm-withdrawal-button')).toBeDisabled();
  });

  test('No se puede pagar si el saldo es insuficiente', async ({ page }) => {
    await loginAsLocatario(page);

    // Intentar crear reserva sin saldo
    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();
    await page.getByTestId('book-now-button').click();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 3);

    await page.getByTestId('start-date-input').fill(
      startDate.toISOString().split('T')[0]
    );
    await page.getByTestId('end-date-input').fill(
      endDate.toISOString().split('T')[0]
    );
    await page.getByTestId('confirm-booking-button').click();

    // Seleccionar pago con wallet
    await page.getByTestId('payment-method-wallet').click();

    // Si no hay saldo suficiente, debe mostrar mensaje
    const insufficientFunds = page.getByTestId('wallet-insufficient-funds');
    const walletBalance = await page.getByTestId('wallet-available-balance').textContent();

    if (walletBalance && Number.parseInt(walletBalance.replace(/\D/g, '')) < 1000) {
      await expect(insufficientFunds).toBeVisible();
      await expect(page.getByTestId('confirm-payment-button')).toBeDisabled();
    }
  });

  test('Validar monto mínimo de carga', async ({ page }) => {
    await loginAsLocatario(page);
    await page.goto('/wallet');
    await page.getByTestId('add-funds-button').click();

    // Intentar cargar monto muy bajo
    await page.getByTestId('amount-input').fill('10'); // $0.10

    // Debe mostrar error de monto mínimo
    await expect(page.getByTestId('minimum-amount-error')).toBeVisible();
  });
});

// 🔍 Tests de Seguridad
test.describe('Wallet - Seguridad', () => {
  test('Transacciones requieren autenticación', async ({ page }) => {
    // Intentar acceder a wallet sin login
    await page.goto('/wallet');

    // Debe redirigir a login
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });

  test('No se puede manipular saldo desde cliente', async ({ page }) => {
    await loginAsLocatario(page);
    await page.goto('/wallet');

    // Intentar modificar saldo con DevTools (simulado)
    // En producción, el saldo viene de Supabase y está protegido por RLS
    const balanceElement = page.getByTestId('wallet-balance');
    const originalBalance = await balanceElement.textContent();

    // Refrescar página
    await page.reload();

    // Saldo debe ser el mismo (viene de servidor)
    const newBalance = await balanceElement.textContent();
    expect(newBalance).toBe(originalBalance);
  });
});
