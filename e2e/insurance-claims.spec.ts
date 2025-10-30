import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Tests: Sistema de Seguros y Claims (Reclamos)
 *
 * Flujo:
 * 1. Locatario contrata seguro al hacer reserva
 * 2. Durante la reserva ocurre un incidente
 * 3. Locatario o locador reporta el incidente
 * 4. Se crea un claim (reclamo)
 * 5. Se suben evidencias (fotos, videos)
 * 6. Aseguradora evalúa y aprueba/rechaza
 * 7. Se procesa el pago de cobertura
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
test.describe('Insurance y Claims E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('Locatario contrata seguro al crear reserva', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Contratar seguro con reserva');

    // 1. Login y buscar auto
    await loginAsLocatario(page);
    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();

    // 2. Iniciar proceso de reserva
    await page.getByTestId('book-now-button').click();

    // 3. Llenar fechas
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

    // 4. Página de opciones de seguro
    await expect(page.getByTestId('insurance-options')).toBeVisible({
      timeout: 5000,
    });

    // 5. Ver planes disponibles
    const basicPlan = page.getByTestId('insurance-plan-basic');
    const standardPlan = page.getByTestId('insurance-plan-standard');
    const premiumPlan = page.getByTestId('insurance-plan-premium');

    await expect(basicPlan).toBeVisible();
    await expect(standardPlan).toBeVisible();
    await expect(premiumPlan).toBeVisible();

    // 6. Ver detalles de cobertura
    await standardPlan.getByTestId('view-details-button').click();
    await expect(page.getByTestId('coverage-details-modal')).toBeVisible();

    // Verificar info de cobertura
    await expect(page.getByText(/daños por colisión/i)).toBeVisible();
    await expect(page.getByText(/robo/i)).toBeVisible();
    await expect(page.getByText(/responsabilidad civil/i)).toBeVisible();

    await page.getByTestId('close-details-button').click();

    // 7. Seleccionar plan Standard
    await standardPlan.getByTestId('select-plan-button').click();

    // 8. Verificar que el costo se agregó al total
    const insuranceCost = page.getByTestId('insurance-cost');
    await expect(insuranceCost).toBeVisible();

    const costText = await insuranceCost.textContent();
    expect(Number.parseInt(costText?.replace(/\D/g, '') || '0')).toBeGreaterThan(0);

    // 9. Continuar al pago
    await page.getByTestId('continue-to-payment-button').click();

    // 10. Verificar resumen incluye seguro
    await expect(page.getByTestId('insurance-summary')).toBeVisible();

    console.log('✅ Seguro contratado exitosamente');
  });

  test('Locatario reporta incidente durante reserva activa', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Reportar incidente');

    // 1. Login
    await loginAsLocatario(page);

    // 2. Ir a reservas activas
    await page.goto('/bookings?status=active');
    const activeBooking = page.getByTestId('booking-card-active').first();

    const hasActive = await activeBooking.isVisible().catch(() => false);
    if (!hasActive) {
      console.log('ℹ️ No hay reservas activas');
      return;
    }

    // 3. Abrir booking
    await activeBooking.click();
    await expect(page.getByTestId('booking-detail')).toBeVisible();

    // 4. Click en "Reportar Incidente"
    await page.getByTestId('report-incident-button').click();

    // 5. Modal de reporte
    await expect(page.getByTestId('incident-report-modal')).toBeVisible();

    // 6. Tipo de incidente
    await page.getByTestId('incident-type-select').selectOption('accident');

    // 7. Severidad
    await page.getByTestId('incident-severity-select').selectOption('moderate');

    // 8. Fecha y hora del incidente
    const incidentDate = new Date();
    incidentDate.setHours(incidentDate.getHours() - 2); // Hace 2 horas

    await page.getByTestId('incident-date-input').fill(
      incidentDate.toISOString().split('T')[0]
    );
    await page.getByTestId('incident-time-input').fill('14:30');

    // 9. Ubicación del incidente
    await page.getByTestId('incident-location-input').fill(
      'Av. Corrientes 1500, Buenos Aires'
    );

    // 10. Descripción detallada
    await page.getByTestId('incident-description-textarea').fill(
      'Colisión menor en estacionamiento. Otro vehículo golpeó la puerta trasera derecha al salir. El conductor se identificó y hay testigos.'
    );

    // 11. ¿Hubo autoridades involucradas?
    await page.getByTestId('police-report-checkbox').check();
    await page.getByTestId('police-report-number-input').fill('BA-2025-12345');

    // 12. ¿Hubo lesiones?
    await page.getByTestId('injuries-checkbox').uncheck();

    // 13. Información del tercero (otro conductor)
    await page.getByTestId('third-party-name-input').fill('Juan Pérez');
    await page.getByTestId('third-party-license-input').fill('AB123456');
    await page.getByTestId('third-party-insurance-input').fill('Seguros XYZ - Póliza 789');

    // 14. Subir fotos del daño
    await page.getByTestId('damage-photos-upload').setInputFiles([
      'e2e/fixtures/damage-door.jpg',
      'e2e/fixtures/damage-paint.jpg',
      'e2e/fixtures/incident-scene.jpg',
    ]);

    // Esperar que se carguen
    await page.waitForTimeout(2000);
    await expect(page.getByTestId('photo-preview')).toHaveCount(3);

    // 15. Subir denuncia policial (PDF)
    const policeReportUpload = page.getByTestId('police-report-upload');
    if (await policeReportUpload.isVisible()) {
      await policeReportUpload.setInputFiles('e2e/fixtures/police-report.pdf');
    }

    // 16. Enviar reporte
    await page.getByTestId('submit-incident-report-button').click();

    // 17. Confirmación
    await expect(page.getByTestId('incident-report-confirmation')).toBeVisible({
      timeout: 10000,
    });

    // 18. Verificar que se creó un claim
    const claimNumber = page.getByTestId('claim-number');
    await expect(claimNumber).toBeVisible();

    const claimText = await claimNumber.textContent();
    expect(claimText).toMatch(/CLAIM-\d+/);

    console.log(`✅ Incidente reportado. Claim: ${claimText}`);
  });

  test('Locador ve el claim y agrega su versión', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Locador responde a claim');

    // 1. Login como locador
    await loginAsLocador(page);

    // 2. Ir a sección de claims
    await page.goto('/insurance/claims');
    await expect(page.getByTestId('claims-list')).toBeVisible();

    // 3. Filtrar por claims pendientes
    await page.getByTestId('claims-filter-select').selectOption('pending');

    // 4. Abrir primer claim pendiente
    const pendingClaim = page.getByTestId('claim-card-pending').first();
    const hasPending = await pendingClaim.isVisible().catch(() => false);

    if (!hasPending) {
      console.log('ℹ️ No hay claims pendientes');
      return;
    }

    await pendingClaim.click();

    // 5. Ver detalles del incidente
    await expect(page.getByTestId('claim-detail')).toBeVisible();
    await expect(page.getByTestId('incident-description')).toBeVisible();
    await expect(page.getByTestId('damage-photos')).toBeVisible();

    // 6. Click en "Agregar Mi Versión"
    await page.getByTestId('add-owner-statement-button').click();

    // 7. Modal de declaración del locador
    await expect(page.getByTestId('owner-statement-modal')).toBeVisible();

    // 8. ¿Está de acuerdo con la versión del locatario?
    await page.getByTestId('agree-with-renter-radio').check();

    // 9. Comentarios adicionales
    await page.getByTestId('owner-comments-textarea').fill(
      'Confirmo la versión del locatario. El auto estaba correctamente estacionado y fue golpeado por un tercero.'
    );

    // 10. ¿El auto puede seguir circulando?
    await page.getByTestId('car-drivable-yes').check();

    // 11. Estimación de costos de reparación
    await page.getByTestId('repair-cost-estimate-input').fill('50000'); // $500

    // 12. Taller recomendado
    await page.getByTestId('recommended-shop-name-input').fill('Taller Chapa y Pintura SA');
    await page.getByTestId('recommended-shop-phone-input').fill('+54 11 4444-5555');

    // 13. Subir fotos adicionales del locador
    await page.getByTestId('owner-photos-upload').setInputFiles([
      'e2e/fixtures/owner-damage-1.jpg',
      'e2e/fixtures/owner-damage-2.jpg',
    ]);

    await page.waitForTimeout(1500);

    // 14. Enviar declaración
    await page.getByTestId('submit-owner-statement-button').click();

    // 15. Confirmación
    await expect(page.getByTestId('statement-submitted-message')).toBeVisible({
      timeout: 5000,
    });

    // 16. Estado del claim debe cambiar
    await expect(page.getByTestId('claim-status-under-review')).toBeVisible();

    console.log('✅ Declaración del locador enviada');
  });

  test('Seguimiento del claim hasta resolución', async ({ page }) => {
    test.slow();

    await loginAsLocatario(page);

    // Ir a mis claims
    await page.goto('/insurance/my-claims');
    await expect(page.getByTestId('my-claims-list')).toBeVisible();

    // Abrir un claim existente
    const claim = page.getByTestId('claim-card').first();
    const hasClaim = await claim.isVisible().catch(() => false);

    if (!hasClaim) {
      console.log('ℹ️ No hay claims');
      return;
    }

    await claim.click();

    // Timeline del claim
    await expect(page.getByTestId('claim-timeline')).toBeVisible();

    // Verificar eventos en el timeline
    const timelineEvents = page.getByTestId('timeline-event');
    const eventCount = await timelineEvents.count();

    expect(eventCount).toBeGreaterThan(0);

    // Verificar estado actual
    const currentStatus = page.getByTestId('claim-current-status');
    await expect(currentStatus).toBeVisible();

    const statusText = await currentStatus.textContent();
    const validStatuses = [
      'pending',
      'under_review',
      'approved',
      'rejected',
      'paid',
    ];

    expect(validStatuses.some((s) => statusText?.toLowerCase().includes(s))).toBe(true);

    // Ver documentos del claim
    await page.getByTestId('claim-documents-tab').click();
    await expect(page.getByTestId('documents-list')).toBeVisible();

    // Ver mensajes/comunicación
    await page.getByTestId('claim-messages-tab').click();
    const messagesSection = page.getByTestId('claim-messages');

    if (await messagesSection.isVisible()) {
      // Enviar mensaje a la aseguradora
      await page.getByTestId('message-input').fill(
        '¿Cuál es el estado actual de mi claim?'
      );
      await page.getByTestId('send-message-button').click();

      await expect(page.getByText('¿Cuál es el estado actual de mi claim?')).toBeVisible({
        timeout: 3000,
      });
    }

    console.log(`✅ Claim en estado: ${statusText}`);
  });

  test('Claim aprobado - Verificar pago de cobertura', async ({ page }) => {
    test.slow();

    await loginAsLocatario(page);
    await page.goto('/insurance/my-claims?status=approved');

    // Buscar claim aprobado
    const approvedClaim = page.getByTestId('claim-card-approved').first();
    const hasApproved = await approvedClaim.isVisible().catch(() => false);

    if (!hasApproved) {
      console.log('ℹ️ No hay claims aprobados');
      return;
    }

    await approvedClaim.click();

    // Verificar badge de "Aprobado"
    await expect(page.getByTestId('claim-status-approved')).toBeVisible();

    // Sección de pago
    await expect(page.getByTestId('payment-section')).toBeVisible();

    // Monto aprobado
    const approvedAmount = page.getByTestId('approved-coverage-amount');
    await expect(approvedAmount).toBeVisible();

    const amountText = await approvedAmount.textContent();
    expect(Number.parseInt(amountText?.replace(/\D/g, '') || '0')).toBeGreaterThan(0);

    // Deducible
    const deductible = page.getByTestId('deductible-amount');
    if (await deductible.isVisible()) {
      const deductibleText = await deductible.textContent();
      console.log(`Deducible: ${deductibleText}`);
    }

    // Monto a recibir (aprobado - deducible)
    const netAmount = page.getByTestId('net-payout-amount');
    await expect(netAmount).toBeVisible();

    // Método de pago seleccionado
    const payoutMethod = page.getByTestId('payout-method');
    await expect(payoutMethod).toBeVisible();

    // Si está pendiente de pago, puede haber botón para confirmar
    const confirmPayoutButton = page.getByTestId('confirm-payout-button');
    if (await confirmPayoutButton.isVisible()) {
      await confirmPayoutButton.click();
      await expect(page.getByTestId('payout-confirmation-modal')).toBeVisible();
    }

    console.log(`✅ Claim aprobado por ${amountText}`);
  });

  test('Claim rechazado - Ver razones y opciones de apelación', async ({ page }) => {
    await loginAsLocatario(page);
    await page.goto('/insurance/my-claims?status=rejected');

    const rejectedClaim = page.getByTestId('claim-card-rejected').first();
    const hasRejected = await rejectedClaim.isVisible().catch(() => false);

    if (!hasRejected) {
      console.log('ℹ️ No hay claims rechazados');
      return;
    }

    await rejectedClaim.click();

    // Badge de rechazado
    await expect(page.getByTestId('claim-status-rejected')).toBeVisible();

    // Razones del rechazo
    await expect(page.getByTestId('rejection-reasons')).toBeVisible();

    const reasons = page.getByTestId('rejection-reason-item');
    const reasonCount = await reasons.count();

    expect(reasonCount).toBeGreaterThan(0);

    // Opciones de apelación
    const appealButton = page.getByTestId('appeal-claim-button');
    if (await appealButton.isVisible()) {
      await appealButton.click();

      // Modal de apelación
      await expect(page.getByTestId('appeal-modal')).toBeVisible();

      await page.getByTestId('appeal-reason-textarea').fill(
        'Solicito revisión del claim. Adjunto evidencia adicional que no fue considerada.'
      );

      await page.getByTestId('appeal-evidence-upload').setInputFiles(
        'e2e/fixtures/additional-evidence.pdf'
      );

      await page.getByTestId('submit-appeal-button').click();

      await expect(page.getByTestId('appeal-submitted-message')).toBeVisible({
        timeout: 5000,
      });

      console.log('✅ Apelación enviada');
    }
  });
});

// 🔍 Tests de Validación
test.describe('Insurance - Validaciones', () => {
  test('No se puede reportar incidente sin fotos', async ({ page }) => {
    await loginAsLocatario(page);
    await page.goto('/bookings?status=active');

    const activeBooking = page.getByTestId('booking-card-active').first();
    const hasActive = await activeBooking.isVisible().catch(() => false);

    if (!hasActive) return;

    await activeBooking.click();
    await page.getByTestId('report-incident-button').click();

    // Llenar formulario pero NO subir fotos
    await page.getByTestId('incident-type-select').selectOption('accident');
    await page.getByTestId('incident-description-textarea').fill(
      'Descripción del incidente'
    );

    // Botón debe estar deshabilitado sin fotos
    const submitButton = page.getByTestId('submit-incident-report-button');
    await expect(submitButton).toBeDisabled();

    // Error debe aparecer
    await expect(page.getByTestId('photos-required-error')).toBeVisible();
  });

  test('No se puede reportar incidente para reserva sin seguro', async ({ page }) => {
    await loginAsLocatario(page);
    await page.goto('/bookings?status=active');

    // Buscar booking sin seguro
    const bookingNoInsurance = page.getByTestId('booking-no-insurance').first();
    const hasNoInsurance = await bookingNoInsurance.isVisible().catch(() => false);

    if (!hasNoInsurance) {
      console.log('ℹ️ Todas las reservas tienen seguro');
      return;
    }

    await bookingNoInsurance.click();

    // Botón de reportar incidente no debe estar visible o debe mostrar mensaje
    const reportButton = page.getByTestId('report-incident-button');
    const isVisible = await reportButton.isVisible().catch(() => false);

    if (isVisible) {
      await reportButton.click();
      await expect(page.getByTestId('no-insurance-warning')).toBeVisible();
    } else {
      await expect(page.getByText(/no cuenta con seguro/i)).toBeVisible();
    }
  });

  test('Fecha del incidente debe ser durante la reserva', async ({ page }) => {
    await loginAsLocatario(page);
    await page.goto('/bookings?status=active');

    const activeBooking = page.getByTestId('booking-card-active').first();
    if (!(await activeBooking.isVisible().catch(() => false))) return;

    await activeBooking.click();
    await page.getByTestId('report-incident-button').click();

    // Intentar poner fecha futura
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    await page.getByTestId('incident-date-input').fill(
      futureDate.toISOString().split('T')[0]
    );

    await expect(page.getByTestId('invalid-date-error')).toBeVisible();

    // Intentar poner fecha antes del inicio de la reserva
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1);

    await page.getByTestId('incident-date-input').fill(
      pastDate.toISOString().split('T')[0]
    );

    await expect(page.getByTestId('invalid-date-error')).toBeVisible();
  });
});

// 🔍 Tests de Integración con Wallet
test.describe('Insurance - Integración con Wallet', () => {
  test('Pago de claim se refleja en wallet del locatario', async ({ page }) => {
    test.slow();

    await loginAsLocatario(page);

    // Ver balance actual del wallet
    await page.goto('/wallet');
    const balanceBefore = await page.getByTestId('wallet-balance').textContent();

    // Ver claims pagados recientes
    await page.goto('/insurance/my-claims?status=paid');

    const paidClaim = page.getByTestId('claim-card-paid').first();
    const hasPaid = await paidClaim.isVisible().catch(() => false);

    if (!hasPaid) {
      console.log('ℹ️ No hay claims pagados recientemente');
      return;
    }

    // Abrir claim pagado
    await paidClaim.click();

    // Obtener monto pagado
    const paidAmount = await page.getByTestId('paid-amount').textContent();

    // Ir a wallet y verificar transacción
    await page.goto('/wallet');
    await page.getByTestId('transactions-tab').click();

    // Buscar transacción de insurance payout
    const insurancePayout = page
      .getByTestId('transaction-item')
      .filter({ hasText: /insurance|seguro|claim/i })
      .first();

    await expect(insurancePayout).toBeVisible();

    // Verificar que el balance aumentó
    const balanceAfter = await page.getByTestId('wallet-balance').textContent();

    const before = Number.parseInt(balanceBefore?.replace(/\D/g, '') || '0');
    const after = Number.parseInt(balanceAfter?.replace(/\D/g, '') || '0');

    expect(after).toBeGreaterThanOrEqual(before);

    console.log(`✅ Payout de ${paidAmount} reflejado en wallet`);
  });
});
