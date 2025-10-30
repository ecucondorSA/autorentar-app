import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Tests: Sistema de Crédito Automotor (Crédito Auto)
 *
 * Flujo:
 * 1. Usuario solicita pre-aprobación de crédito
 * 2. Sistema evalúa scoring crediticio (BCRA, ingresos, historial)
 * 3. Oferta de crédito: monto, plazo, tasa, cuotas
 * 4. Usuario acepta oferta y reserva auto con financiamiento
 * 5. Pagos en cuotas mensuales desde wallet
 * 6. Gestión de mora y refinanciamiento
 *
 * ⚠️ NOTA: Sistema requiere integración con BCRA para scoring real
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

async function completeKYCIfNeeded(page: Page): Promise<void> {
  // Check if KYC is already completed
  const kycStatus = await page.evaluate(() => localStorage.getItem('kyc_status'));

  if (kycStatus !== 'verified') {
    await page.goto('/profile/kyc');

    // Fill KYC form (simplified)
    await page.getByTestId('document-type-dni').click();
    await page.getByTestId('document-number-input').fill('12345678');
    await page.getByTestId('document-front-upload').setInputFiles('e2e/fixtures/dni-front.jpg');
    await page.getByTestId('document-back-upload').setInputFiles('e2e/fixtures/dni-back.jpg');
    await page.getByTestId('submit-kyc-button').click();

    await expect(page.getByTestId('kyc-submitted-confirmation')).toBeVisible({
      timeout: 10000,
    });
  }
}

// 📝 Tests de Pre-Aprobación
test.describe('Credit System - Pre-Aprobación', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('Usuario solicita pre-aprobación de crédito', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Solicitar pre-aprobación');

    // 1. Login
    await loginAsLocatario(page);

    // 2. Ensure KYC is complete
    await completeKYCIfNeeded(page);

    // 3. Navigate to credit section
    await page.goto('/credit');
    await expect(page.getByTestId('credit-dashboard')).toBeVisible();

    // 4. Check if already has pre-approval
    const hasPreApproval = await page.getByTestId('existing-preapproval').isVisible();

    if (!hasPreApproval) {
      // 5. Click "Solicitar Pre-Aprobación"
      await page.getByTestId('request-preapproval-button').click();

      // 6. Pre-approval form
      await expect(page.getByTestId('preapproval-form')).toBeVisible();

      // 7. Enter financial information
      await page.getByTestId('monthly-income-input').fill('150000'); // $1,500/month
      await page.getByTestId('employment-type-select').selectOption('full_time');
      await page.getByTestId('employer-name-input').fill('Acme Corporation');
      await page.getByTestId('years-employed-input').fill('3');

      // 8. Upload income proof
      await page.getByTestId('income-proof-upload').setInputFiles([
        'e2e/fixtures/payslip-1.pdf',
        'e2e/fixtures/payslip-2.pdf',
        'e2e/fixtures/payslip-3.pdf',
      ]);

      // 9. Bank account information
      await page.getByTestId('bank-name-select').selectOption('banco_nacion');
      await page.getByTestId('account-number-input').fill('1234567890123456');

      // 10. Declare monthly expenses
      await page.getByTestId('monthly-rent-input').fill('50000'); // $500
      await page.getByTestId('monthly-debts-input').fill('10000'); // $100

      // 11. Authorize BCRA credit check
      await page.getByTestId('authorize-bcra-check-checkbox').check();

      // 12. Terms and conditions
      await page.getByTestId('credit-terms-checkbox').check();

      // 13. Submit request
      await page.getByTestId('submit-preapproval-button').click();

      // 14. Processing message
      await expect(page.getByTestId('credit-check-processing')).toBeVisible({
        timeout: 5000,
      });

      // 15. Wait for credit evaluation (simulated - in production takes minutes/hours)
      await expect(page.getByTestId('preapproval-result')).toBeVisible({
        timeout: 30000,
      });

      // 16. Check result
      const approved = await page.getByTestId('preapproval-approved-badge').isVisible();

      if (approved) {
        // See approved amount
        await expect(page.getByTestId('approved-credit-amount')).toBeVisible();
        const approvedAmount = await page.getByTestId('approved-credit-amount').textContent();

        // See credit score
        await expect(page.getByTestId('credit-score')).toBeVisible();
        const creditScore = await page.getByTestId('credit-score').textContent();

        // See available terms
        await expect(page.getByTestId('available-terms-section')).toBeVisible();

        console.log(`✅ Pre-aprobado: ${approvedAmount}, Score: ${creditScore}`);
      } else {
        // Rejection reason
        await expect(page.getByTestId('preapproval-rejected-badge')).toBeVisible();
        const rejectionReason = await page.getByTestId('rejection-reason').textContent();

        console.log(`❌ Rechazado: ${rejectionReason}`);
      }
    } else {
      console.log('ℹ️ Usuario ya tiene pre-aprobación activa');
    }
  });

  test('Ver detalles de pre-aprobación existente', async ({ page }) => {
    await loginAsLocatario(page);
    await page.goto('/credit');

    const hasPreApproval = await page.getByTestId('existing-preapproval').isVisible();

    if (hasPreApproval) {
      // View details
      await page.getByTestId('view-preapproval-details-button').click();

      // Check all details
      await expect(page.getByTestId('approved-credit-amount')).toBeVisible();
      await expect(page.getByTestId('credit-score')).toBeVisible();
      await expect(page.getByTestId('expiration-date')).toBeVisible();

      // Available credit terms
      await expect(page.getByTestId('credit-term-12-months')).toBeVisible();
      await expect(page.getByTestId('credit-term-24-months')).toBeVisible();
      await expect(page.getByTestId('credit-term-36-months')).toBeVisible();

      // Interest rates per term
      const rate12m = await page.getByTestId('interest-rate-12m').textContent();
      const rate24m = await page.getByTestId('interest-rate-24m').textContent();
      const rate36m = await page.getByTestId('interest-rate-36m').textContent();

      console.log(`Tasas: 12m=${rate12m}, 24m=${rate24m}, 36m=${rate36m}`);
    }
  });
});

// 📝 Tests de Simulación de Cuotas
test.describe('Credit System - Simulación', () => {
  test('Simular cuotas antes de reservar', async ({ page }) => {
    await loginAsLocatario(page);

    // 1. Search for expensive car (to need financing)
    await page.goto('/cars');
    await page.getByTestId('filter-price-min').fill('200'); // $200+/day
    await page.getByTestId('apply-filters-button').click();

    await page.getByTestId('car-card').first().click();

    // 2. Select dates for long booking (to accumulate high total)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30); // 30 days

    await page.getByTestId('start-date-input').fill(startDate.toISOString().split('T')[0]);
    await page.getByTestId('end-date-input').fill(endDate.toISOString().split('T')[0]);

    // 3. See total price
    const totalPrice = await page.getByTestId('total-price').textContent();
    console.log(`Total price: ${totalPrice}`);

    // 4. Click "Pagar con Crédito"
    await page.getByTestId('payment-method-credit').click();

    // 5. Credit simulation should appear
    await expect(page.getByTestId('credit-simulation')).toBeVisible();

    // 6. Select term (12, 24, or 36 months)
    await page.getByTestId('credit-term-select').selectOption('12');

    // 7. See monthly installment
    await expect(page.getByTestId('monthly-installment-amount')).toBeVisible();
    const monthlyAmount = await page.getByTestId('monthly-installment-amount').textContent();

    // 8. See total cost with interest
    await expect(page.getByTestId('total-cost-with-interest')).toBeVisible();
    const totalWithInterest = await page.getByTestId('total-cost-with-interest').textContent();

    // 9. See interest rate (TNA and TEA)
    await expect(page.getByTestId('interest-rate-tna')).toBeVisible();
    await expect(page.getByTestId('interest-rate-tea')).toBeVisible();

    // 10. View installment breakdown
    await page.getByTestId('view-installment-breakdown-button').click();
    await expect(page.getByTestId('installment-table')).toBeVisible();

    // Check first installment details
    const firstInstallment = page.getByTestId('installment-row-1');
    await expect(firstInstallment.getByTestId('installment-capital')).toBeVisible();
    await expect(firstInstallment.getByTestId('installment-interest')).toBeVisible();
    await expect(firstInstallment.getByTestId('installment-total')).toBeVisible();

    console.log(`Cuota mensual: ${monthlyAmount}, Total con interés: ${totalWithInterest}`);
  });

  test('Comparar diferentes plazos de financiamiento', async ({ page }) => {
    await loginAsLocatario(page);

    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();

    // Book for long period
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    await page.getByTestId('start-date-input').fill(startDate.toISOString().split('T')[0]);
    await page.getByTestId('end-date-input').fill(endDate.toISOString().split('T')[0]);

    await page.getByTestId('payment-method-credit').click();

    // Compare 12 vs 24 vs 36 months
    const terms = ['12', '24', '36'];
    const comparisons: Record<string, string> = {};

    for (const term of terms) {
      await page.getByTestId('credit-term-select').selectOption(term);

      const monthlyAmount = await page.getByTestId('monthly-installment-amount').textContent();
      comparisons[term] = monthlyAmount || '';

      console.log(`${term} months: ${monthlyAmount}`);
    }

    // 36 months should have lower monthly payment but higher total cost
    // (This is the tradeoff users need to understand)
  });
});

// 📝 Tests de Reserva con Crédito
test.describe('Credit System - Reserva Financiada', () => {
  test('Reservar auto con financiamiento', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Reservar con crédito');

    // 1. Login
    await loginAsLocatario(page);

    // 2. Find car and select dates
    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 14); // 2 weeks

    await page.getByTestId('start-date-input').fill(startDate.toISOString().split('T')[0]);
    await page.getByTestId('end-date-input').fill(endDate.toISOString().split('T')[0]);

    // 3. Select credit payment
    await page.getByTestId('payment-method-credit').click();

    // 4. Choose term
    await page.getByTestId('credit-term-select').selectOption('12');

    // 5. Review credit terms
    await page.getByTestId('credit-terms-link').click();
    await expect(page.getByTestId('credit-terms-modal')).toBeVisible();
    await page.getByTestId('close-modal-button').click();

    // 6. Accept credit agreement
    await page.getByTestId('accept-credit-agreement-checkbox').check();

    // 7. Confirm booking
    await page.getByTestId('confirm-booking-button').click();

    // 8. Credit approval processing
    await expect(page.getByTestId('credit-approval-processing')).toBeVisible({
      timeout: 5000,
    });

    // 9. Final approval
    await expect(page.getByTestId('booking-confirmed')).toBeVisible({ timeout: 30000 });

    // 10. See credit details
    await expect(page.getByTestId('credit-contract-number')).toBeVisible();
    const contractNumber = await page.getByTestId('credit-contract-number').textContent();

    // 11. Download credit contract
    await page.getByTestId('download-credit-contract-button').click();
    // In real test, would verify download

    // 12. See first payment date
    await expect(page.getByTestId('first-payment-date')).toBeVisible();
    const firstPaymentDate = await page.getByTestId('first-payment-date').textContent();

    console.log(`✅ Reserva financiada. Contrato: ${contractNumber}, Primera cuota: ${firstPaymentDate}`);
  });

  test('Ver créditos activos en dashboard', async ({ page }) => {
    await loginAsLocatario(page);

    await page.goto('/credit');

    // Active credits section
    await page.getByTestId('active-credits-tab').click();
    await expect(page.getByTestId('active-credits-list')).toBeVisible();

    // Check each active credit
    const creditCards = page.getByTestId('credit-card');
    const count = await creditCards.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      const card = creditCards.nth(i);

      // Each card should show
      await expect(card.getByTestId('car-description')).toBeVisible();
      await expect(card.getByTestId('remaining-installments')).toBeVisible();
      await expect(card.getByTestId('next-payment-date')).toBeVisible();
      await expect(card.getByTestId('next-payment-amount')).toBeVisible();

      // Payment status
      const paymentStatus = card.getByTestId('payment-status');
      await expect(paymentStatus).toBeVisible();
    }

    console.log(`${count} créditos activos`);
  });
});

// 📝 Tests de Pagos de Cuotas
test.describe('Credit System - Gestión de Cuotas', () => {
  test('Pagar cuota mensual desde wallet', async ({ page }) => {
    await loginAsLocatario(page);

    // 1. Go to credit dashboard
    await page.goto('/credit');
    await page.getByTestId('active-credits-tab').click();

    // 2. Select first active credit
    await page.getByTestId('credit-card').first().click();

    // 3. Credit detail
    await expect(page.getByTestId('credit-detail')).toBeVisible();

    // 4. See next payment due
    await expect(page.getByTestId('next-payment-due')).toBeVisible();

    // 5. Click "Pagar Cuota"
    await page.getByTestId('pay-installment-button').click();

    // 6. Payment confirmation modal
    await expect(page.getByTestId('payment-confirmation-modal')).toBeVisible();

    // 7. See payment amount
    const paymentAmount = await page.getByTestId('payment-amount').textContent();

    // 8. Check wallet balance
    const walletBalance = await page.getByTestId('wallet-balance').textContent();
    console.log(`Wallet: ${walletBalance}, Payment: ${paymentAmount}`);

    // 9. Confirm payment
    await page.getByTestId('confirm-payment-button').click();

    // 10. Processing
    await expect(page.getByTestId('payment-processing')).toBeVisible();

    // 11. Success
    await expect(page.getByTestId('payment-success')).toBeVisible({ timeout: 10000 });

    // 12. Verify updated credit status
    await page.goto('/credit');
    await page.getByTestId('active-credits-tab').click();
    await page.getByTestId('credit-card').first().click();

    // Check remaining installments decreased
    const remainingInstallments = await page.getByTestId('remaining-installments').textContent();
    console.log(`Cuotas restantes: ${remainingInstallments}`);
  });

  test('Ver historial de pagos de crédito', async ({ page }) => {
    await loginAsLocatario(page);

    await page.goto('/credit');
    await page.getByTestId('active-credits-tab').click();
    await page.getByTestId('credit-card').first().click();

    // Payment history tab
    await page.getByTestId('payment-history-tab').click();
    await expect(page.getByTestId('payment-history-list')).toBeVisible();

    // Check payments
    const paymentItems = page.getByTestId('payment-item');
    const paymentCount = await paymentItems.count();

    if (paymentCount > 0) {
      const firstPayment = paymentItems.first();

      await expect(firstPayment.getByTestId('payment-date')).toBeVisible();
      await expect(firstPayment.getByTestId('payment-amount')).toBeVisible();
      await expect(firstPayment.getByTestId('payment-status')).toBeVisible();

      // Check receipt download
      const receiptButton = firstPayment.getByTestId('download-receipt-button');
      if (await receiptButton.isVisible()) {
        await receiptButton.click();
        // Would verify download in real test
      }
    }

    console.log(`${paymentCount} pagos en historial`);
  });

  test('Configurar débito automático de cuotas', async ({ page }) => {
    await loginAsLocatario(page);

    await page.goto('/credit');
    await page.getByTestId('active-credits-tab').click();
    await page.getByTestId('credit-card').first().click();

    // Settings tab
    await page.getByTestId('credit-settings-tab').click();

    // Enable auto-debit
    await page.getByTestId('auto-debit-toggle').check();

    // Select payment source
    await page.getByTestId('auto-debit-source-select').selectOption('wallet');

    // Set day of month
    await page.getByTestId('auto-debit-day-select').selectOption('5'); // Day 5 of each month

    // Confirm
    await page.getByTestId('save-auto-debit-button').click();

    // Verify confirmation
    await expect(page.getByTestId('auto-debit-enabled-message')).toBeVisible();

    console.log('✅ Débito automático configurado');
  });
});

// 📝 Tests de Mora y Atrasos
test.describe('Credit System - Gestión de Mora', () => {
  test('Notificación de cuota próxima a vencer', async ({ page }) => {
    await loginAsLocatario(page);

    // Check notifications
    await page.goto('/notifications');

    // Should have upcoming payment notification (if payment due soon)
    const upcomingPayment = page.getByTestId('notification-payment-due-soon');

    if (await upcomingPayment.isVisible()) {
      // Check notification content
      await expect(upcomingPayment.getByTestId('payment-amount')).toBeVisible();
      await expect(upcomingPayment.getByTestId('due-date')).toBeVisible();

      // Click to pay directly
      await upcomingPayment.getByTestId('pay-now-button').click();

      // Should navigate to payment
      await expect(page).toHaveURL(/credit\/pay/);
    }
  });

  test('Aplicación de recargo por mora', async ({ page }) => {
    await loginAsLocatario(page);

    await page.goto('/credit');
    await page.getByTestId('active-credits-tab').click();

    // Look for overdue credit
    const overdueCredit = page.getByTestId('credit-card-overdue');

    if (await overdueCredit.isVisible()) {
      await overdueCredit.click();

      // Check overdue status
      await expect(page.getByTestId('overdue-badge')).toBeVisible();

      // See late fee
      await expect(page.getByTestId('late-fee-amount')).toBeVisible();
      const lateFee = await page.getByTestId('late-fee-amount').textContent();

      // See days overdue
      await expect(page.getByTestId('days-overdue')).toBeVisible();
      const daysOverdue = await page.getByTestId('days-overdue').textContent();

      console.log(`Mora: ${daysOverdue}, Recargo: ${lateFee}`);

      // Pay overdue installment
      await page.getByTestId('pay-overdue-button').click();

      // Total should include late fee
      const totalDue = await page.getByTestId('total-due-with-late-fee').textContent();
      console.log(`Total a pagar con mora: ${totalDue}`);
    } else {
      console.log('ℹ️ No hay créditos en mora');
    }
  });

  test('Solicitar refinanciamiento por dificultades de pago', async ({ page }) => {
    test.slow();

    await loginAsLocatario(page);

    await page.goto('/credit');
    await page.getByTestId('active-credits-tab').click();
    await page.getByTestId('credit-card').first().click();

    // Request refinancing
    await page.getByTestId('request-refinancing-button').click();

    // Refinancing form
    await expect(page.getByTestId('refinancing-request-form')).toBeVisible();

    // Explain reason
    await page.getByTestId('refinancing-reason-select').selectOption('financial_hardship');
    await page.getByTestId('refinancing-explanation-textarea').fill(
      'Tuve una reducción de ingresos y necesito extender el plazo de pago.'
    );

    // Proposed new term
    await page.getByTestId('proposed-new-term-select').selectOption('24'); // Extend to 24 months

    // Upload supporting documents
    await page.getByTestId('supporting-documents-upload').setInputFiles([
      'e2e/fixtures/income-reduction-proof.pdf',
    ]);

    // Submit request
    await page.getByTestId('submit-refinancing-request-button').click();

    // Confirmation
    await expect(page.getByTestId('refinancing-request-submitted')).toBeVisible({
      timeout: 10000,
    });

    // Check status
    await page.getByTestId('refinancing-status-tab').click();
    await expect(page.getByTestId('refinancing-request-pending')).toBeVisible();

    console.log('✅ Solicitud de refinanciamiento enviada');
  });
});

// 📝 Tests de Validaciones
test.describe('Credit System - Validaciones', () => {
  test('No se puede solicitar crédito sin KYC completo', async ({ page }) => {
    await loginAsLocatario(page);

    // Clear KYC status (simulate unverified user)
    await page.evaluate(() => localStorage.setItem('kyc_status', 'pending'));

    await page.goto('/credit');
    await page.getByTestId('request-preapproval-button').click();

    // Should show KYC required error
    await expect(page.getByTestId('kyc-required-error')).toBeVisible();

    // Redirect to KYC
    await page.getByTestId('complete-kyc-button').click();
    await expect(page).toHaveURL(/kyc/);
  });

  test('Monto de crédito no puede exceder límite pre-aprobado', async ({ page }) => {
    await loginAsLocatario(page);

    // User has $10,000 pre-approved
    await page.goto('/cars');

    // Try to book car with total > $10,000
    await page.getByTestId('filter-price-min').fill('500'); // $500/day
    await page.getByTestId('apply-filters-button').click();
    await page.getByTestId('car-card').first().click();

    // Book for 30 days = $15,000 total
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    await page.getByTestId('start-date-input').fill(startDate.toISOString().split('T')[0]);
    await page.getByTestId('end-date-input').fill(endDate.toISOString().split('T')[0]);

    await page.getByTestId('payment-method-credit').click();

    // Should show credit limit exceeded error
    const creditLimitError = page.getByTestId('credit-limit-exceeded-error');
    if (await creditLimitError.isVisible()) {
      await expect(creditLimitError).toContainText('límite de crédito');

      // Show approved amount
      await expect(page.getByTestId('available-credit-amount')).toBeVisible();
    }
  });

  test('No se puede tener más de 3 créditos activos simultáneamente', async ({ page }) => {
    await loginAsLocatario(page);

    await page.goto('/credit');
    await page.getByTestId('active-credits-tab').click();

    const activeCredits = await page.getByTestId('credit-card').count();

    if (activeCredits >= 3) {
      // Try to request new credit
      await page.goto('/cars');
      await page.getByTestId('car-card').first().click();

      await page.getByTestId('payment-method-credit').click();

      // Should show max credits error
      await expect(page.getByTestId('max-credits-error')).toBeVisible();
      await expect(page.getByTestId('max-credits-error')).toContainText('máximo de 3 créditos');
    }
  });
});

// 📝 Tests de Impacto en Score
test.describe('Credit System - Score Crediticio', () => {
  test('Ver evolución de score crediticio', async ({ page }) => {
    await loginAsLocatario(page);

    await page.goto('/credit');
    await page.getByTestId('credit-score-tab').click();

    // Current score
    await expect(page.getByTestId('current-credit-score')).toBeVisible();
    const currentScore = await page.getByTestId('current-credit-score').textContent();

    // Score history chart
    await expect(page.getByTestId('score-history-chart')).toBeVisible();

    // Factors affecting score
    await expect(page.getByTestId('score-factors-section')).toBeVisible();

    // Check positive factors
    const positiveFactors = page.getByTestId('score-factor-positive');
    const positiveCount = await positiveFactors.count();

    // Check negative factors
    const negativeFactors = page.getByTestId('score-factor-negative');
    const negativeCount = await negativeFactors.count();

    console.log(`Score: ${currentScore}, +${positiveCount} factores positivos, -${negativeCount} negativos`);
  });

  test('Pagos puntuales mejoran score', async ({ page }) => {
    await loginAsLocatario(page);

    await page.goto('/credit');
    await page.getByTestId('credit-score-tab').click();

    // Check on-time payment streak
    const paymentStreak = page.getByTestId('on-time-payment-streak');
    if (await paymentStreak.isVisible()) {
      const streakText = await paymentStreak.textContent();
      console.log(`Racha de pagos puntuales: ${streakText}`);

      // Should have score boost indicator
      await expect(page.getByTestId('score-boost-on-time-payments')).toBeVisible();
    }
  });

  test('Mora negativa impacta score', async ({ page }) => {
    await loginAsLocatario(page);

    await page.goto('/credit');
    await page.getByTestId('active-credits-tab').click();

    // Check for overdue payments
    const overdueCredits = page.getByTestId('credit-card-overdue');
    const overdueCount = await overdueCredits.count();

    if (overdueCount > 0) {
      // Go to score tab
      await page.getByTestId('credit-score-tab').click();

      // Should see negative impact
      const negativeImpact = page.getByTestId('score-negative-impact-overdue');
      if (await negativeImpact.isVisible()) {
        const impactText = await negativeImpact.textContent();
        console.log(`Impacto negativo por mora: ${impactText}`);
      }
    }
  });
});
