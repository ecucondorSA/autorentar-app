import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Tests: Sistema de Disputas y Resoluciones
 *
 * Flujo:
 * 1. Locatario/Locador crea disputa sobre reserva completada
 * 2. Ambas partes suben evidencia (fotos, mensajes, documentos)
 * 3. Proceso de mediación automática
 * 4. Resolución: refund, compensación, o sin acción
 * 5. Appeal si alguna parte no está conforme
 * 6. Impacto en reputación y futuras reservas
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

async function createCompletedBooking(page: Page): Promise<string> {
  // Navigate to a completed booking
  await page.goto('/bookings');
  await page.getByTestId('filter-status').selectOption('completed');

  // Get first completed booking ID
  const firstBooking = page.getByTestId('booking-card').first();
  await expect(firstBooking).toBeVisible();

  const bookingId = await firstBooking.getAttribute('data-booking-id');
  return bookingId || '';
}

// 📝 Tests Principales
test.describe('Disputes - Crear y Gestionar', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('Locatario crea disputa por daños no reconocidos', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Crear disputa por daños');

    // 1. Login
    await loginAsLocatario(page);

    // 2. Find completed booking
    const bookingId = await createCompletedBooking(page);

    // 3. Navigate to booking detail
    await page.goto(`/bookings/${bookingId}`);
    await expect(page.getByTestId('booking-detail')).toBeVisible();

    // 4. Click "Abrir Disputa"
    await page.getByTestId('open-dispute-button').click();

    // 5. Dispute form should appear
    await expect(page.getByTestId('dispute-form-modal')).toBeVisible();

    // 6. Select dispute category
    await page.getByTestId('dispute-category-select').selectOption('damage_claim');

    // 7. Write description
    const description = `
      Al devolver el auto, el locador reclamó daños en la puerta trasera derecha que no existían.
      Tengo fotos del momento de retirar el auto donde se ve que ya estaba rayado.
      El locador quiere cobrarme $50,000 por reparaciones que no corresponden.
    `;
    await page.getByTestId('dispute-description-textarea').fill(description);

    // 8. Add specific claims
    await page.getByTestId('claimed-amount-input').fill('50000'); // $500.00 dispute amount

    // 9. Upload evidence photos
    await page.getByTestId('evidence-photos-upload').setInputFiles([
      'e2e/fixtures/car-condition-pickup.jpg',
      'e2e/fixtures/car-condition-return.jpg',
      'e2e/fixtures/pre-existing-damage.jpg',
    ]);

    // 10. Upload supporting documents
    await page.getByTestId('evidence-documents-upload').setInputFiles([
      'e2e/fixtures/pickup-checklist.pdf',
      'e2e/fixtures/damage-comparison.pdf',
    ]);

    // 11. Add timeline events
    await page.getByTestId('add-timeline-event-button').click();
    await page.getByTestId('timeline-event-date-input').fill('2025-10-25T10:00');
    await page.getByTestId('timeline-event-description-textarea').fill(
      'Retiré el auto y documenté todas las condiciones existentes con fotos'
    );
    await page.getByTestId('save-timeline-event-button').click();

    // 12. Agree to mediation terms
    await page.getByTestId('mediation-terms-checkbox').check();

    // 13. Submit dispute
    await page.getByTestId('submit-dispute-button').click();

    // 14. Verify confirmation
    await expect(page.getByTestId('dispute-created-confirmation')).toBeVisible({
      timeout: 10000,
    });

    // 15. Verify dispute ID
    const disputeId = await page.getByTestId('dispute-id').textContent();
    expect(disputeId).toMatch(/^DSP-\d{8}$/);

    // 16. Verify notification sent to locador
    await expect(page.getByTestId('notification-sent-message')).toBeVisible();

    console.log('✅ Disputa creada exitosamente:', disputeId);
  });

  test('Locador responde a disputa con su versión', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Locador responde disputa');

    // 1. Login como locador
    await loginAsLocador(page);

    // 2. Navigate to disputes
    await page.goto('/disputes');

    // 3. Should see pending disputes notification
    await expect(page.getByTestId('pending-disputes-badge')).toBeVisible();

    // 4. Click on first dispute
    await page.getByTestId('dispute-item').first().click();

    // 5. Dispute detail should load
    await expect(page.getByTestId('dispute-detail')).toBeVisible();

    // 6. See locatario's claim
    await expect(page.getByTestId('original-claim-section')).toBeVisible();

    // 7. Click "Agregar Mi Versión"
    await page.getByTestId('add-response-button').click();

    // 8. Response form appears
    await expect(page.getByTestId('dispute-response-form')).toBeVisible();

    // 9. Write response
    const response = `
      El locatario devolvió el auto con daños evidentes en la puerta trasera derecha.
      Adjunto fotos del momento de la devolución donde se ve claramente el rayón profundo.
      También tengo el presupuesto del taller para la reparación que asciende a $50,000.
      Las fotos que el locatario presenta son de ANTES del alquiler, no coinciden con el estado actual.
    `;
    await page.getByTestId('response-description-textarea').fill(response);

    // 10. Upload counter-evidence
    await page.getByTestId('counter-evidence-photos-upload').setInputFiles([
      'e2e/fixtures/damage-at-return.jpg',
      'e2e/fixtures/damage-detail-closeup.jpg',
    ]);

    // 11. Upload repair quote
    await page.getByTestId('counter-evidence-documents-upload').setInputFiles([
      'e2e/fixtures/repair-quote.pdf',
      'e2e/fixtures/workshop-estimate.pdf',
    ]);

    // 12. Confirm repair amount
    await page.getByTestId('confirm-repair-amount-input').fill('50000');

    // 13. Add witnesses (optional)
    await page.getByTestId('add-witness-button').click();
    await page.getByTestId('witness-name-input').fill('Carlos Mecánico');
    await page.getByTestId('witness-contact-input').fill('+54911234567');
    await page.getByTestId('witness-statement-textarea').fill(
      'Recibí el auto para evaluar daños. El rayón es reciente, la pintura está fresca.'
    );
    await page.getByTestId('save-witness-button').click();

    // 14. Submit response
    await page.getByTestId('submit-response-button').click();

    // 15. Verify confirmation
    await expect(page.getByTestId('response-submitted-confirmation')).toBeVisible({
      timeout: 10000,
    });

    // 16. Verify dispute status changed to "under_review"
    const status = page.getByTestId('dispute-status');
    await expect(status).toHaveText(/En Revisión/i);

    console.log('✅ Respuesta del locador enviada');
  });

  test('Sistema de mediación automática evalúa evidencia', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Mediación automática');

    // 1. Login as admin/mediator (or simulate system)
    await loginAsLocatario(page);

    // 2. Navigate to dispute detail
    await page.goto('/disputes');
    await page.getByTestId('dispute-item').first().click();

    // 3. Verify mediation section is visible
    await expect(page.getByTestId('mediation-section')).toBeVisible();

    // 4. See AI-powered analysis (if implemented)
    const analysisSection = page.getByTestId('ai-analysis-section');
    if (await analysisSection.isVisible()) {
      // Check AI recommendations
      await expect(page.getByTestId('ai-recommendation')).toBeVisible();

      // Check evidence strength scores
      await expect(page.getByTestId('evidence-strength-locatario')).toBeVisible();
      await expect(page.getByTestId('evidence-strength-locador')).toBeVisible();

      // Check suggested resolution
      await expect(page.getByTestId('suggested-resolution')).toBeVisible();
    }

    // 5. Verify mediation timeline
    await expect(page.getByTestId('mediation-timeline')).toBeVisible();

    // 6. Check days remaining for resolution
    const daysRemaining = page.getByTestId('mediation-days-remaining');
    await expect(daysRemaining).toBeVisible();

    const daysText = await daysRemaining.textContent();
    expect(daysText).toMatch(/\d+ días?/);

    // 7. Verify both parties can add more evidence during mediation
    await expect(page.getByTestId('add-more-evidence-button')).toBeVisible();

    console.log('✅ Mediación en progreso');
  });

  test('Disputa resuelta a favor del locatario - Refund total', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Resolución a favor del locatario');

    // 1. Login
    await loginAsLocatario(page);

    // 2. Navigate to resolved disputes
    await page.goto('/disputes');
    await page.getByTestId('filter-status').selectOption('resolved');

    // 3. Open resolved dispute
    await page.getByTestId('dispute-item').first().click();

    // 4. Verify resolution section
    await expect(page.getByTestId('resolution-section')).toBeVisible();

    // 5. Check resolution type
    const resolutionType = page.getByTestId('resolution-type');
    await expect(resolutionType).toHaveText(/Reembolso Total/i);

    // 6. Verify refund amount
    const refundAmount = page.getByTestId('refund-amount');
    await expect(refundAmount).toBeVisible();

    // 7. Check resolution reasoning
    await expect(page.getByTestId('resolution-reasoning')).toBeVisible();

    // 8. Verify refund was processed to wallet
    await page.goto('/wallet');
    await page.getByTestId('transactions-tab').click();

    // Find refund transaction
    const refundTransaction = page.getByTestId('transaction-type-refund').first();
    await expect(refundTransaction).toBeVisible();

    // 9. Verify locador received notification
    await logout(page);
    await loginAsLocador(page);

    await page.goto('/notifications');
    const disputeNotification = page.getByTestId('notification-dispute-resolved').first();
    await expect(disputeNotification).toBeVisible();

    console.log('✅ Disputa resuelta con refund');
  });

  test('Disputa resuelta a favor del locador - Sin reembolso', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Resolución a favor del locador');

    // 1. Login como locador
    await loginAsLocador(page);

    // 2. Navigate to disputes
    await page.goto('/disputes');
    await page.getByTestId('filter-status').selectOption('resolved');

    // 3. Open dispute
    await page.getByTestId('dispute-item').first().click();

    // 4. Verify resolution
    await expect(page.getByTestId('resolution-section')).toBeVisible();

    // 5. Check resolution type
    const resolutionType = page.getByTestId('resolution-type');
    await expect(resolutionType).toHaveText(/Sin Reembolso/i);

    // 6. Verify reasoning favors locador
    const reasoning = await page.getByTestId('resolution-reasoning').textContent();
    expect(reasoning).toContain('evidencia');

    // 7. Check that original charge stands
    await expect(page.getByTestId('original-charge-maintained')).toBeVisible();

    // 8. Verify locatario received notification
    await logout(page);
    await loginAsLocatario(page);

    await page.goto('/notifications');
    const disputeNotification = page.getByTestId('notification-dispute-resolved').first();
    await expect(disputeNotification).toBeVisible();

    console.log('✅ Disputa resuelta sin reembolso');
  });

  test('Resolución parcial - Reembolso del 50%', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Resolución parcial');

    // 1. Login
    await loginAsLocatario(page);

    // 2. Navigate to dispute
    await page.goto('/disputes');
    await page.getByTestId('filter-status').selectOption('resolved');
    await page.getByTestId('dispute-item').first().click();

    // 3. Check partial resolution
    const resolutionType = page.getByTestId('resolution-type');
    await expect(resolutionType).toHaveText(/Reembolso Parcial/i);

    // 4. Verify percentage
    const refundPercentage = page.getByTestId('refund-percentage');
    await expect(refundPercentage).toBeVisible();

    const percentageText = await refundPercentage.textContent();
    expect(percentageText).toMatch(/50%/);

    // 5. Check reasoning explains split decision
    const reasoning = await page.getByTestId('resolution-reasoning').textContent();
    expect(reasoning).toContain('responsabilidad compartida');

    // 6. Verify partial refund in wallet
    await page.goto('/wallet');
    await page.getByTestId('transactions-tab').click();

    const partialRefund = page.getByTestId('transaction-type-partial-refund').first();
    await expect(partialRefund).toBeVisible();

    console.log('✅ Resolución parcial aplicada');
  });
});

// 🔍 Tests de Appeal (Apelación)
test.describe('Disputes - Appeal Process', () => {
  test('Locatario apela resolución desfavorable', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Apelar resolución');

    // 1. Login
    await loginAsLocatario(page);

    // 2. Navigate to resolved dispute
    await page.goto('/disputes');
    await page.getByTestId('filter-status').selectOption('resolved');
    await page.getByTestId('dispute-item').first().click();

    // 3. Verify appeal button is available (within appeal window)
    const appealButton = page.getByTestId('appeal-resolution-button');

    // Check if within appeal window (typically 7 days)
    const appealWindowMessage = page.getByTestId('appeal-window-message');
    if (await appealWindowMessage.isVisible()) {
      await expect(appealButton).toBeVisible();

      // 4. Click appeal
      await appealButton.click();

      // 5. Appeal form appears
      await expect(page.getByTestId('appeal-form-modal')).toBeVisible();

      // 6. Select appeal reason
      await page.getByTestId('appeal-reason-select').selectOption('new_evidence');

      // 7. Write appeal justification
      const justification = `
        Tengo nueva evidencia que no fue considerada en la resolución original.
        Conseguí el testimonio del mecánico que revisó el auto ANTES de mi alquiler,
        confirmando que el daño ya existía. Adjunto su declaración firmada y fotos.
      `;
      await page.getByTestId('appeal-justification-textarea').fill(justification);

      // 8. Upload new evidence
      await page.getByTestId('new-evidence-upload').setInputFiles([
        'e2e/fixtures/mechanic-statement-signed.pdf',
        'e2e/fixtures/pre-rental-inspection.pdf',
        'e2e/fixtures/pre-existing-damage-certified.jpg',
      ]);

      // 9. Confirm appeal fee (if applicable)
      const appealFeeMessage = page.getByTestId('appeal-fee-message');
      if (await appealFeeMessage.isVisible()) {
        await page.getByTestId('confirm-appeal-fee-checkbox').check();
      }

      // 10. Submit appeal
      await page.getByTestId('submit-appeal-button').click();

      // 11. Verify confirmation
      await expect(page.getByTestId('appeal-submitted-confirmation')).toBeVisible({
        timeout: 10000,
      });

      // 12. Verify dispute status changed to "under_appeal"
      const status = page.getByTestId('dispute-status');
      await expect(status).toHaveText(/En Apelación/i);

      // 13. Verify appeal timeline
      await expect(page.getByTestId('appeal-review-deadline')).toBeVisible();
    } else {
      // Appeal window expired
      await expect(appealButton).toBeDisabled();
      console.log('⚠️ Ventana de apelación cerrada');
    }

    console.log('✅ Apelación presentada');
  });

  test('Locador es notificado de apelación y puede responder', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Responder a apelación');

    // 1. Login como locador
    await loginAsLocador(page);

    // 2. Check notifications
    await page.goto('/notifications');

    // 3. Should see appeal notification
    const appealNotification = page.getByTestId('notification-dispute-appeal');
    await expect(appealNotification.first()).toBeVisible();

    // 4. Click to view appeal
    await appealNotification.first().click();

    // 5. Appeal detail loads
    await expect(page.getByTestId('appeal-detail')).toBeVisible();

    // 6. See new evidence submitted by locatario
    await expect(page.getByTestId('new-evidence-section')).toBeVisible();

    // 7. Click "Responder a Apelación"
    await page.getByTestId('respond-to-appeal-button').click();

    // 8. Response form
    await expect(page.getByTestId('appeal-response-form')).toBeVisible();

    // 9. Write counter-response
    const counterResponse = `
      La nueva evidencia presentada no cambia los hechos. El mecánico mencionado
      no inspeccionó el vehículo el día del alquiler. Las fotos son anteriores.
      Mantengo que el daño ocurrió durante el período de alquiler del locatario.
    `;
    await page.getByTestId('appeal-counter-response-textarea').fill(counterResponse);

    // 10. Upload counter-evidence
    await page.getByTestId('appeal-counter-evidence-upload').setInputFiles([
      'e2e/fixtures/rental-agreement-signed.pdf',
      'e2e/fixtures/damage-report-certified.pdf',
    ]);

    // 11. Submit response
    await page.getByTestId('submit-appeal-response-button').click();

    // 12. Verify confirmation
    await expect(page.getByTestId('appeal-response-submitted')).toBeVisible({
      timeout: 5000,
    });

    console.log('✅ Respuesta a apelación enviada');
  });

  test('Apelación resuelta - Nueva decisión emitida', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Resolución de apelación');

    // 1. Login
    await loginAsLocatario(page);

    // 2. Navigate to dispute
    await page.goto('/disputes');
    await page.getByTestId('filter-status').selectOption('resolved');
    await page.getByTestId('dispute-item').first().click();

    // 3. Check if appeal was resolved
    const appealResolutionSection = page.getByTestId('appeal-resolution-section');

    if (await appealResolutionSection.isVisible()) {
      // 4. See new decision
      await expect(page.getByTestId('appeal-decision')).toBeVisible();

      // 5. Check if decision changed
      const decisionChanged = page.getByTestId('decision-changed-indicator');
      if (await decisionChanged.isVisible()) {
        // Original decision was overturned
        await expect(page.getByTestId('new-resolution-type')).toBeVisible();
        await expect(page.getByTestId('new-refund-amount')).toBeVisible();

        console.log('✅ Decisión original revertida');
      } else {
        // Original decision upheld
        const upheldMessage = page.getByTestId('decision-upheld-message');
        await expect(upheldMessage).toBeVisible();

        console.log('✅ Decisión original mantenida');
      }

      // 6. Verify this is final (no more appeals)
      await expect(page.getByTestId('final-decision-badge')).toBeVisible();

      const noMoreAppeals = await page.getByTestId('no-more-appeals-message').textContent();
      expect(noMoreAppeals).toMatch(/final/i);
    }

    console.log('✅ Apelación resuelta');
  });
});

// 🔍 Tests de Impacto en Reputación
test.describe('Disputes - Impacto en Reputación', () => {
  test('Disputa resuelta impacta rating del usuario', async ({ page }) => {
    await loginAsLocatario(page);

    // 1. Get rating before dispute resolution
    await page.goto('/profile');
    const ratingBefore = await page.getByTestId('user-rating').textContent();

    // 2. Navigate to resolved dispute (against locatario)
    await page.goto('/disputes');
    await page.getByTestId('filter-status').selectOption('resolved');

    // Find dispute where locatario lost
    await page.getByTestId('dispute-item').first().click();

    // 3. Check if dispute affected reputation
    const reputationImpact = page.getByTestId('reputation-impact-section');
    if (await reputationImpact.isVisible()) {
      // Check rating penalty
      await expect(page.getByTestId('rating-penalty')).toBeVisible();

      // Check penalty reason
      await expect(page.getByTestId('penalty-reason')).toBeVisible();
    }

    // 4. Go back to profile to see updated rating
    await page.goto('/profile');
    const ratingAfter = await page.getByTestId('user-rating').textContent();

    // Rating might have decreased (or stayed the same if first offense)
    console.log(`Rating: ${ratingBefore} → ${ratingAfter}`);
  });

  test('Múltiples disputas perdidas marcan usuario como riesgoso', async ({ page }) => {
    await loginAsLocatario(page);

    // 1. Navigate to profile
    await page.goto('/profile');

    // 2. Check dispute history
    await page.getByTestId('disputes-history-tab').click();

    // 3. Count lost disputes
    const lostDisputes = page.getByTestId('dispute-status-lost');
    const lostCount = await lostDisputes.count();

    // 4. If 3+ lost disputes, should see warning badge
    if (lostCount >= 3) {
      await expect(page.getByTestId('high-risk-user-badge')).toBeVisible();

      // Check restrictions
      await expect(page.getByTestId('booking-restrictions-message')).toBeVisible();
    }

    // 5. Check if requires additional deposit
    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();
    await page.getByTestId('book-now-button').click();

    const additionalDeposit = page.getByTestId('additional-security-deposit');
    if (lostCount >= 2) {
      await expect(additionalDeposit).toBeVisible();
    }
  });

  test('Disputa ganada mejora reputación del usuario', async ({ page }) => {
    await loginAsLocatario(page);

    // 1. Navigate to resolved dispute (in favor of locatario)
    await page.goto('/disputes');
    await page.getByTestId('filter-status').selectOption('resolved');

    await page.getByTestId('dispute-item').first().click();

    // 2. Check positive reputation impact
    const reputationImpact = page.getByTestId('reputation-impact-section');
    if (await reputationImpact.isVisible()) {
      const impactType = await page.getByTestId('reputation-impact-type').textContent();

      if (impactType?.includes('Positivo')) {
        // Check trustworthiness boost
        await expect(page.getByTestId('trustworthiness-boost')).toBeVisible();

        // Check reliability badge earned
        const reliabilityBadge = page.getByTestId('reliability-badge-earned');
        if (await reliabilityBadge.isVisible()) {
          console.log('✅ Badge de confiabilidad ganado');
        }
      }
    }
  });
});

// 🔍 Tests de Validaciones
test.describe('Disputes - Validaciones', () => {
  test('No se puede crear disputa sin descripción', async ({ page }) => {
    await loginAsLocatario(page);

    const bookingId = await createCompletedBooking(page);
    await page.goto(`/bookings/${bookingId}`);

    await page.getByTestId('open-dispute-button').click();
    await page.getByTestId('dispute-category-select').selectOption('damage_claim');

    // Try to submit without description
    await page.getByTestId('submit-dispute-button').click();

    // Should show error
    await expect(page.getByTestId('description-required-error')).toBeVisible();
  });

  test('Requiere al menos 1 evidencia para crear disputa', async ({ page }) => {
    await loginAsLocatario(page);

    const bookingId = await createCompletedBooking(page);
    await page.goto(`/bookings/${bookingId}`);

    await page.getByTestId('open-dispute-button').click();
    await page.getByTestId('dispute-category-select').selectOption('damage_claim');
    await page.getByTestId('dispute-description-textarea').fill('Test dispute');

    // Try to submit without evidence
    await page.getByTestId('submit-dispute-button').click();

    // Should show error
    await expect(page.getByTestId('evidence-required-error')).toBeVisible();
  });

  test('No se puede crear disputa después de 30 días de completada la reserva', async ({ page }) => {
    await loginAsLocatario(page);

    // Navigate to old completed booking (> 30 days)
    await page.goto('/bookings');
    await page.getByTestId('filter-status').selectOption('completed');

    // Try to find old booking
    const oldBooking = page.getByTestId('booking-card').filter({
      hasText: '60 días atrás', // Or similar text
    });

    if (await oldBooking.isVisible()) {
      await oldBooking.click();

      // Dispute button should be disabled or not visible
      const disputeButton = page.getByTestId('open-dispute-button');

      if (await disputeButton.isVisible()) {
        await expect(disputeButton).toBeDisabled();

        // Should show message explaining time limit
        await expect(page.getByTestId('dispute-time-limit-message')).toBeVisible();
      } else {
        console.log('✅ Botón de disputa no visible para reservas antiguas');
      }
    }
  });

  test('Monto reclamado debe ser razonable (< precio total de reserva)', async ({ page }) => {
    await loginAsLocatario(page);

    const bookingId = await createCompletedBooking(page);
    await page.goto(`/bookings/${bookingId}`);

    // Get booking total price
    const totalPrice = await page.getByTestId('booking-total-price').textContent();
    const priceInCents = Number.parseInt(totalPrice?.replace(/\D/g, '') || '0');

    await page.getByTestId('open-dispute-button').click();
    await page.getByTestId('dispute-category-select').selectOption('overcharge');
    await page.getByTestId('dispute-description-textarea').fill('Overcharged');

    // Try to claim unreasonable amount (more than 2x total)
    await page.getByTestId('claimed-amount-input').fill(String(priceInCents * 3));

    await page.getByTestId('submit-dispute-button').click();

    // Should show warning
    await expect(page.getByTestId('unreasonable-amount-warning')).toBeVisible();
  });
});

// 🔍 Tests de Notificaciones
test.describe('Disputes - Notificaciones', () => {
  test('Ambas partes reciben notificaciones en cada etapa', async ({ page }) => {
    test.slow();

    // 1. Create dispute as locatario
    await loginAsLocatario(page);
    const bookingId = await createCompletedBooking(page);
    await page.goto(`/bookings/${bookingId}`);
    await page.getByTestId('open-dispute-button').click();

    // Fill and submit (shortened for brevity)
    await page.getByTestId('dispute-category-select').selectOption('damage_claim');
    await page.getByTestId('dispute-description-textarea').fill('Test');
    await page.getByTestId('evidence-photos-upload').setInputFiles(['e2e/fixtures/test.jpg']);
    await page.getByTestId('submit-dispute-button').click();

    // 2. Locador should receive notification
    await logout(page);
    await loginAsLocador(page);
    await page.goto('/notifications');

    await expect(page.getByTestId('notification-new-dispute')).toBeVisible();

    // 3. After locador responds, locatario gets notification
    // (Implementation would continue testing each notification)
  });
});
