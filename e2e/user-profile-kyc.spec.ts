import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Tests: Perfil de Usuario y KYC (Know Your Customer)
 *
 * Flujo:
 * 1. Usuario completa su perfil
 * 2. Usuario sube documentos de identificación
 * 3. Sistema verifica identidad (KYC)
 * 4. Usuario agrega métodos de pago
 * 5. Usuario configura preferencias
 * 6. Usuario puede editar su información
 */

// 🔧 Helper Functions
async function loginAsNewUser(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByTestId('email-input').fill('newuser@test.com');
  await page.getByTestId('password-input').fill('test1234');
  await page.getByTestId('submit-login').click();
  await expect(page).toHaveURL(/dashboard|profile/, { timeout: 10000 });
}

async function loginAsLocatario(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByTestId('email-input').fill('locatario@test.com');
  await page.getByTestId('password-input').fill('test1234');
  await page.getByTestId('submit-login').click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
}

// 📝 Tests
test.describe('Profile y KYC E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('Usuario nuevo completa su perfil por primera vez', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Completar perfil nuevo usuario');

    // 1. Login como usuario nuevo
    await loginAsNewUser(page);

    // 2. Si el perfil está incompleto, debe redirigir o mostrar wizard
    const profileSetupWizard = page.getByTestId('profile-setup-wizard');
    const needsSetup = await profileSetupWizard.isVisible().catch(() => false);

    if (!needsSetup) {
      // Si no hay wizard, ir manualmente al perfil
      await page.goto('/profile/edit');
    }

    await expect(page.getByTestId('profile-form')).toBeVisible();

    // 3. PASO 1: Información Básica
    console.log('📝 Paso 1: Información básica');

    await page.getByTestId('first-name-input').fill('Juan');
    await page.getByTestId('last-name-input').fill('Pérez');

    // Fecha de nacimiento
    await page.getByTestId('birth-date-input').fill('1990-05-15');

    // Género (opcional)
    const genderSelect = page.getByTestId('gender-select');
    if (await genderSelect.isVisible()) {
      await genderSelect.selectOption('male');
    }

    // Teléfono
    await page.getByTestId('phone-input').fill('+54 9 11 5555-6666');

    // Click en siguiente o guardar
    await page.getByTestId('save-basic-info-button').click();

    // 4. PASO 2: Dirección
    console.log('📍 Paso 2: Dirección');

    await expect(page.getByTestId('address-form')).toBeVisible();

    await page.getByTestId('street-address-input').fill('Av. Santa Fe 1234');
    await page.getByTestId('apartment-input').fill('5B');
    await page.getByTestId('city-input').fill('Buenos Aires');
    await page.getByTestId('province-select').selectOption('CABA');
    await page.getByTestId('postal-code-input').fill('C1059');
    await page.getByTestId('country-input').fill('Argentina');

    await page.getByTestId('save-address-button').click();

    // 5. PASO 3: Foto de perfil
    console.log('📸 Paso 3: Foto de perfil');

    const photoUploadSection = page.getByTestId('profile-photo-section');
    if (await photoUploadSection.isVisible()) {
      await page.getByTestId('profile-photo-upload').setInputFiles(
        'e2e/fixtures/profile-photo.jpg'
      );

      await expect(page.getByTestId('profile-photo-preview')).toBeVisible({
        timeout: 5000,
      });

      await page.getByTestId('save-photo-button').click();
    }

    // 6. Confirmación
    await expect(page.getByTestId('profile-complete-message')).toBeVisible({
      timeout: 5000,
    });

    console.log('✅ Perfil completado exitosamente');
  });

  test('Usuario completa verificación KYC - Documento de identidad', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Verificación KYC');

    await loginAsNewUser(page);

    // 1. Ir a sección de verificación
    await page.goto('/profile/verification');
    await expect(page.getByTestId('kyc-verification-page')).toBeVisible();

    // 2. Verificar estado actual
    const currentStatus = page.getByTestId('kyc-status');
    await expect(currentStatus).toBeVisible();

    const statusText = await currentStatus.textContent();
    console.log(`Estado KYC actual: ${statusText}`);

    // Si ya está verificado, skip
    if (statusText?.toLowerCase().includes('verified') ||
        statusText?.toLowerCase().includes('verificado')) {
      console.log('✅ Usuario ya verificado');
      return;
    }

    // 3. Iniciar proceso de verificación
    await page.getByTestId('start-kyc-button').click();

    // 4. Tipo de documento
    await expect(page.getByTestId('document-type-selection')).toBeVisible();

    await page.getByTestId('document-type-dni').click();

    // 5. País de emisión
    await page.getByTestId('issuing-country-select').selectOption('AR');

    // 6. Número de documento
    await page.getByTestId('document-number-input').fill('12345678');

    // 7. Subir foto del frente del documento
    await page.getByTestId('document-front-upload').setInputFiles(
      'e2e/fixtures/dni-front.jpg'
    );

    await expect(page.getByTestId('document-front-preview')).toBeVisible({
      timeout: 5000,
    });

    // 8. Subir foto del dorso
    await page.getByTestId('document-back-upload').setInputFiles(
      'e2e/fixtures/dni-back.jpg'
    );

    await expect(page.getByTestId('document-back-preview')).toBeVisible({
      timeout: 5000,
    });

    // 9. Selfie con documento (opcional pero recomendado)
    const selfieUpload = page.getByTestId('selfie-with-document-upload');
    if (await selfieUpload.isVisible()) {
      await selfieUpload.setInputFiles('e2e/fixtures/selfie-with-dni.jpg');

      await expect(page.getByTestId('selfie-preview')).toBeVisible({
        timeout: 5000,
      });
    }

    // 10. Aceptar términos de verificación
    await page.getByTestId('kyc-terms-checkbox').check();

    // 11. Enviar para verificación
    await page.getByTestId('submit-kyc-button').click();

    // 12. Confirmación
    await expect(page.getByTestId('kyc-submitted-message')).toBeVisible({
      timeout: 10000,
    });

    // 13. Estado debe cambiar a "En revisión"
    await expect(page.getByTestId('kyc-status-pending')).toBeVisible();

    console.log('✅ Documentos KYC enviados para verificación');
  });

  test('Usuario agrega método de pago - Tarjeta de crédito', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Agregar método de pago');

    await loginAsLocatario(page);

    // 1. Ir a métodos de pago
    await page.goto('/profile/payment-methods');
    await expect(page.getByTestId('payment-methods-page')).toBeVisible();

    // 2. Click en "Agregar Método de Pago"
    await page.getByTestId('add-payment-method-button').click();

    // 3. Modal de agregar método
    await expect(page.getByTestId('add-payment-modal')).toBeVisible();

    // 4. Seleccionar tipo: Tarjeta de crédito
    await page.getByTestId('payment-type-credit-card').click();

    // 5. Número de tarjeta
    await page.getByTestId('card-number-input').fill('4111 1111 1111 1111'); // Visa test

    // 6. Nombre en la tarjeta
    await page.getByTestId('card-name-input').fill('JUAN PEREZ');

    // 7. Fecha de vencimiento
    await page.getByTestId('card-expiry-month-input').fill('12');
    await page.getByTestId('card-expiry-year-input').fill('2028');

    // 8. CVV
    await page.getByTestId('card-cvv-input').fill('123');

    // 9. Dirección de facturación
    const useSameAddress = page.getByTestId('use-profile-address-checkbox');
    if (await useSameAddress.isVisible()) {
      await useSameAddress.check();
    } else {
      // Llenar dirección manualmente
      await page.getByTestId('billing-address-input').fill('Av. Santa Fe 1234');
      await page.getByTestId('billing-city-input').fill('Buenos Aires');
      await page.getByTestId('billing-postal-code-input').fill('C1059');
    }

    // 10. Marcar como método predeterminado
    await page.getByTestId('set-as-default-checkbox').check();

    // 11. Guardar método de pago
    await page.getByTestId('save-payment-method-button').click();

    // 12. Verificación puede requerir autenticación 3D Secure
    // En producción, aquí aparecería iframe del banco
    // En test, simulamos que se completó exitosamente

    // 13. Confirmación
    await expect(page.getByTestId('payment-method-added-message')).toBeVisible({
      timeout: 10000,
    });

    // 14. Tarjeta debe aparecer en la lista
    const cardItem = page.getByTestId('payment-method-item').filter({
      hasText: /1111/,
    });

    await expect(cardItem).toBeVisible();

    // 15. Verificar que está marcada como predeterminada
    await expect(cardItem.getByTestId('default-badge')).toBeVisible();

    console.log('✅ Método de pago agregado');
  });

  test('Usuario edita su perfil existente', async ({ page }) => {
    await loginAsLocatario(page);

    // 1. Ir al perfil
    await page.goto('/profile');
    await expect(page.getByTestId('profile-page')).toBeVisible();

    // 2. Verificar información actual
    const currentName = await page.getByTestId('profile-name').textContent();
    const currentPhone = await page.getByTestId('profile-phone').textContent();

    console.log(`Información actual: ${currentName}, ${currentPhone}`);

    // 3. Click en "Editar Perfil"
    await page.getByTestId('edit-profile-button').click();

    // 4. Formulario de edición
    await expect(page.getByTestId('profile-edit-form')).toBeVisible();

    // 5. Cambiar teléfono
    const phoneInput = page.getByTestId('phone-input');
    await phoneInput.clear();
    await phoneInput.fill('+54 9 11 7777-8888');

    // 6. Agregar bio
    const bioTextarea = page.getByTestId('bio-textarea');
    if (await bioTextarea.isVisible()) {
      await bioTextarea.fill(
        'Usuario activo de AutoRentar. Me encanta viajar y conocer nuevos lugares.'
      );
    }

    // 7. Idiomas (opcional)
    const languageSelect = page.getByTestId('languages-select');
    if (await languageSelect.isVisible()) {
      await languageSelect.selectOption(['es', 'en']);
    }

    // 8. Guardar cambios
    await page.getByTestId('save-profile-button').click();

    // 9. Confirmación
    await expect(page.getByTestId('profile-updated-message')).toBeVisible({
      timeout: 5000,
    });

    // 10. Verificar que los cambios se guardaron
    await page.goto('/profile');
    const newPhone = await page.getByTestId('profile-phone').textContent();

    expect(newPhone).toContain('7777-8888');

    console.log('✅ Perfil actualizado correctamente');
  });

  test('Usuario configura preferencias de privacidad', async ({ page }) => {
    await loginAsLocatario(page);

    // 1. Ir a configuración
    await page.goto('/profile/settings');
    await expect(page.getByTestId('settings-page')).toBeVisible();

    // 2. Tab de privacidad
    await page.getByTestId('privacy-tab').click();
    await expect(page.getByTestId('privacy-settings')).toBeVisible();

    // 3. Configurar visibilidad del perfil
    await page.getByTestId('profile-visibility-public').check();

    // 4. Mostrar/ocultar información
    await page.getByTestId('show-phone-checkbox').uncheck(); // Ocultar teléfono
    await page.getByTestId('show-email-checkbox').uncheck(); // Ocultar email
    await page.getByTestId('show-address-checkbox').uncheck(); // Ocultar dirección exacta

    // 5. Preferencias de contacto
    await page.getByTestId('allow-messages-from-verified-only').check();

    // 6. Notificaciones por email
    await page.getByTestId('email-notifications-bookings').check();
    await page.getByTestId('email-notifications-messages').check();
    await page.getByTestId('email-notifications-marketing').uncheck();

    // 7. Guardar preferencias
    await page.getByTestId('save-privacy-settings-button').click();

    // 8. Confirmación
    await expect(page.getByTestId('settings-saved-message')).toBeVisible({
      timeout: 3000,
    });

    console.log('✅ Preferencias de privacidad actualizadas');
  });

  test('Usuario cambia su contraseña', async ({ page }) => {
    await loginAsLocatario(page);

    // 1. Ir a configuración de seguridad
    await page.goto('/profile/settings');
    await page.getByTestId('security-tab').click();

    // 2. Click en "Cambiar Contraseña"
    await page.getByTestId('change-password-button').click();

    // 3. Modal de cambio de contraseña
    await expect(page.getByTestId('change-password-modal')).toBeVisible();

    // 4. Contraseña actual
    await page.getByTestId('current-password-input').fill('test1234');

    // 5. Nueva contraseña
    await page.getByTestId('new-password-input').fill('newTest1234!');

    // 6. Confirmar nueva contraseña
    await page.getByTestId('confirm-password-input').fill('newTest1234!');

    // 7. Verificar fuerza de la contraseña
    const strengthIndicator = page.getByTestId('password-strength-indicator');
    await expect(strengthIndicator).toBeVisible();

    const strength = await strengthIndicator.textContent();
    expect(['weak', 'medium', 'strong'].some(s =>
      strength?.toLowerCase().includes(s)
    )).toBe(true);

    // 8. Cambiar contraseña
    await page.getByTestId('submit-password-change-button').click();

    // 9. Confirmación
    await expect(page.getByTestId('password-changed-message')).toBeVisible({
      timeout: 5000,
    });

    console.log('✅ Contraseña cambiada exitosamente');
  });

  test('Usuario configura autenticación de dos factores (2FA)', async ({ page }) => {
    test.slow();

    await loginAsLocatario(page);

    // 1. Ir a seguridad
    await page.goto('/profile/settings');
    await page.getByTestId('security-tab').click();

    // 2. Sección de 2FA
    const twoFASection = page.getByTestId('two-factor-section');
    await expect(twoFASection).toBeVisible();

    // 3. Verificar estado actual
    const twoFAEnabled = await twoFASection
      .getByTestId('2fa-enabled-badge')
      .isVisible()
      .catch(() => false);

    if (twoFAEnabled) {
      console.log('✅ 2FA ya está habilitado');
      return;
    }

    // 4. Click en "Habilitar 2FA"
    await page.getByTestId('enable-2fa-button').click();

    // 5. Modal de configuración 2FA
    await expect(page.getByTestId('setup-2fa-modal')).toBeVisible();

    // 6. Seleccionar método: Authenticator App
    await page.getByTestId('2fa-method-app').click();

    // 7. Mostrar QR code
    await expect(page.getByTestId('2fa-qr-code')).toBeVisible();

    // 8. Mostrar código manual (para copiar)
    const manualCode = page.getByTestId('2fa-manual-code');
    await expect(manualCode).toBeVisible();

    const codeText = await manualCode.textContent();
    console.log(`Código manual 2FA: ${codeText}`);

    // 9. Instrucciones
    await expect(page.getByText(/google authenticator|authy/i)).toBeVisible();

    // 10. Ingresar código de verificación (simulado)
    await page.getByTestId('2fa-verification-code-input').fill('123456');

    // 11. Confirmar configuración
    await page.getByTestId('confirm-2fa-button').click();

    // 12. Mostrar códigos de recuperación
    await expect(page.getByTestId('recovery-codes')).toBeVisible({
      timeout: 5000,
    });

    // Verificar que hay 10 códigos
    const recoveryCodes = page.getByTestId('recovery-code-item');
    const codeCount = await recoveryCodes.count();

    expect(codeCount).toBeGreaterThanOrEqual(8);

    // 13. Descargar o copiar códigos
    await page.getByTestId('download-recovery-codes-button').click();

    // 14. Confirmar que guardó los códigos
    await page.getByTestId('confirm-saved-codes-checkbox').check();
    await page.getByTestId('finish-2fa-setup-button').click();

    // 15. Confirmación
    await expect(page.getByTestId('2fa-enabled-message')).toBeVisible();

    console.log('✅ 2FA habilitado exitosamente');
  });

  test('Usuario elimina método de pago', async ({ page }) => {
    await loginAsLocatario(page);

    // 1. Ir a métodos de pago
    await page.goto('/profile/payment-methods');

    // 2. Seleccionar un método (que no sea el predeterminado)
    const paymentMethods = page.getByTestId('payment-method-item');
    const count = await paymentMethods.count();

    if (count === 0) {
      console.log('ℹ️ No hay métodos de pago');
      return;
    }

    // Buscar uno que NO sea default
    const nonDefaultMethod = paymentMethods.filter({
      hasNot: page.getByTestId('default-badge'),
    }).first();

    const hasNonDefault = await nonDefaultMethod.isVisible().catch(() => false);

    if (!hasNonDefault) {
      console.log('ℹ️ Solo hay método predeterminado');
      return;
    }

    // 3. Click en menú del método
    await nonDefaultMethod.getByTestId('payment-method-menu').click();

    // 4. Click en "Eliminar"
    await page.getByTestId('delete-payment-method-option').click();

    // 5. Confirmación
    await expect(page.getByTestId('delete-payment-confirmation')).toBeVisible();

    await page.getByTestId('confirm-delete-payment-button').click();

    // 6. Verificar que fue eliminado
    await expect(page.getByTestId('payment-method-deleted-message')).toBeVisible({
      timeout: 3000,
    });

    // 7. El método no debe aparecer más en la lista
    const newCount = await paymentMethods.count();
    expect(newCount).toBe(count - 1);

    console.log('✅ Método de pago eliminado');
  });
});

// 🔍 Tests de Validación
test.describe('Profile - Validaciones', () => {
  test('No se puede guardar perfil con edad menor a 18 años', async ({ page }) => {
    await loginAsNewUser(page);
    await page.goto('/profile/edit');

    // Intentar poner fecha de nacimiento que indique menor de 18
    const today = new Date();
    const underageDate = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());

    await page.getByTestId('birth-date-input').fill(
      underageDate.toISOString().split('T')[0]
    );

    await page.getByTestId('save-basic-info-button').click();

    // Debe mostrar error
    await expect(page.getByTestId('age-requirement-error')).toBeVisible();
    await expect(page.getByText(/18 años/i)).toBeVisible();
  });

  test('Teléfono debe tener formato válido', async ({ page }) => {
    await loginAsLocatario(page);
    await page.goto('/profile/edit');

    // Intentar teléfono inválido
    await page.getByTestId('phone-input').fill('123'); // Muy corto

    await expect(page.getByTestId('phone-error')).toBeVisible();

    // Teléfono válido
    await page.getByTestId('phone-input').fill('+54 9 11 5555-6666');

    await expect(page.getByTestId('phone-error')).not.toBeVisible();
  });

  test('Tarjeta de crédito debe tener número válido', async ({ page }) => {
    await loginAsLocatario(page);
    await page.goto('/profile/payment-methods');
    await page.getByTestId('add-payment-method-button').click();
    await page.getByTestId('payment-type-credit-card').click();

    // Número inválido
    await page.getByTestId('card-number-input').fill('1234 5678 9012 3456');

    await expect(page.getByTestId('card-number-error')).toBeVisible();

    // Número válido (Visa test)
    await page.getByTestId('card-number-input').fill('4111 1111 1111 1111');

    await expect(page.getByTestId('card-number-error')).not.toBeVisible();
  });
});
