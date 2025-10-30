import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Tests: Publicación y Gestión de Autos (Locador)
 *
 * Flujo:
 * 1. Locador publica un auto nuevo
 * 2. Sube fotos y documentos
 * 3. Configura precio y disponibilidad
 * 4. Edita información del auto
 * 5. Activa/desactiva publicación
 */

// 🔧 Helper Functions
async function loginAsLocador(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByTestId('email-input').fill('locador@test.com');
  await page.getByTestId('password-input').fill('test1234');
  await page.getByTestId('submit-login').click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
}

// 📝 Tests
test.describe('Publicación de Autos E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('Locador publica un auto completo', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Publicar auto completo');

    // 1. Login como locador
    await loginAsLocador(page);

    // 2. Navegar a "Publicar Auto"
    await page.goto('/cars/publish');
    await expect(page.getByTestId('car-publish-form')).toBeVisible();

    // 3. PASO 1: Información Básica
    console.log('📝 Paso 1: Información básica');

    await page.getByTestId('brand-input').fill('Toyota');
    await page.getByTestId('model-input').fill('Corolla');
    await page.getByTestId('year-input').fill('2022');
    await page.getByTestId('license-plate-input').fill('ABC123');

    // Tipo de combustible
    await page.getByTestId('fuel-type-select').selectOption('gasoline');

    // Transmisión
    await page.getByTestId('transmission-select').selectOption('automatic');

    // Número de asientos
    await page.getByTestId('seats-input').fill('5');

    // Puertas
    await page.getByTestId('doors-input').fill('4');

    // Color
    await page.getByTestId('color-input').fill('Blanco');

    // Click en "Siguiente"
    await page.getByTestId('next-step-button').click();

    // 4. PASO 2: Ubicación
    console.log('📍 Paso 2: Ubicación');

    await expect(page.getByTestId('location-form')).toBeVisible();

    await page.getByTestId('address-input').fill('Av. Corrientes 1234');
    await page.getByTestId('city-input').fill('Buenos Aires');
    await page.getByTestId('province-select').selectOption('CABA');
    await page.getByTestId('country-input').fill('Argentina');
    await page.getByTestId('postal-code-input').fill('C1043');

    // Coordenadas (opcional, puede autocompletarse con geocoding)
    const latInput = page.getByTestId('latitude-input');
    if (await latInput.isVisible()) {
      await latInput.fill('-34.6037');
      await page.getByTestId('longitude-input').fill('-58.3816');
    }

    await page.getByTestId('next-step-button').click();

    // 5. PASO 3: Precio y Disponibilidad
    console.log('💰 Paso 3: Precio');

    await expect(page.getByTestId('pricing-form')).toBeVisible();

    await page.getByTestId('price-per-day-input').fill('5000'); // $50/día

    // Descuentos por cantidad de días (opcional)
    const weeklyDiscountInput = page.getByTestId('weekly-discount-input');
    if (await weeklyDiscountInput.isVisible()) {
      await weeklyDiscountInput.fill('10'); // 10% descuento semanal
    }

    const monthlyDiscountInput = page.getByTestId('monthly-discount-input');
    if (await monthlyDiscountInput.isVisible()) {
      await monthlyDiscountInput.fill('20'); // 20% descuento mensual
    }

    // Kilometraje incluido
    await page.getByTestId('km-included-input').fill('200');

    // Depósito de seguridad
    await page.getByTestId('security-deposit-input').fill('10000'); // $100

    await page.getByTestId('next-step-button').click();

    // 6. PASO 4: Fotos
    console.log('📸 Paso 4: Fotos');

    await expect(page.getByTestId('photos-form')).toBeVisible();

    // Subir foto principal
    const mainPhotoInput = page.getByTestId('main-photo-input');
    await mainPhotoInput.setInputFiles('e2e/fixtures/car-main.jpg');

    // Esperar que se cargue
    await expect(page.getByTestId('main-photo-preview')).toBeVisible({
      timeout: 10000,
    });

    // Subir fotos adicionales (opcional)
    const additionalPhotosInput = page.getByTestId('additional-photos-input');
    if (await additionalPhotosInput.isVisible()) {
      await additionalPhotosInput.setInputFiles([
        'e2e/fixtures/car-front.jpg',
        'e2e/fixtures/car-back.jpg',
        'e2e/fixtures/car-interior.jpg',
      ]);

      await page.waitForTimeout(2000);
    }

    await page.getByTestId('next-step-button').click();

    // 7. PASO 5: Características y Extras
    console.log('✨ Paso 5: Características');

    await expect(page.getByTestId('features-form')).toBeVisible();

    // Seleccionar características
    await page.getByTestId('feature-air-conditioning').check();
    await page.getByTestId('feature-bluetooth').check();
    await page.getByTestId('feature-gps').check();
    await page.getByTestId('feature-backup-camera').check();

    // Descripción
    await page.getByTestId('description-textarea').fill(
      'Auto en excelente estado, ideal para viajes familiares. Mantenimiento al día.'
    );

    await page.getByTestId('next-step-button').click();

    // 8. PASO 6: Documentos
    console.log('📄 Paso 6: Documentos');

    await expect(page.getByTestId('documents-form')).toBeVisible();

    // Cédula verde/azul
    await page.getByTestId('registration-doc-input').setInputFiles(
      'e2e/fixtures/cedula-verde.pdf'
    );

    // Seguro
    await page.getByTestId('insurance-doc-input').setInputFiles(
      'e2e/fixtures/seguro.pdf'
    );

    // VTV (opcional)
    const vtvInput = page.getByTestId('vtv-doc-input');
    if (await vtvInput.isVisible()) {
      await vtvInput.setInputFiles('e2e/fixtures/vtv.pdf');
    }

    await page.waitForTimeout(2000);

    // 9. PASO 7: Revisión y Publicación
    console.log('✅ Paso 7: Revisión final');

    await page.getByTestId('next-step-button').click();
    await expect(page.getByTestId('review-form')).toBeVisible();

    // Verificar resumen de información
    await expect(page.getByText('Toyota Corolla 2022')).toBeVisible();
    await expect(page.getByText('$50')).toBeVisible();
    await expect(page.getByText('Buenos Aires')).toBeVisible();

    // Aceptar términos y condiciones
    await page.getByTestId('terms-checkbox').check();

    // Publicar
    await page.getByTestId('publish-car-button').click();

    // 10. Confirmación
    await expect(page.getByTestId('publish-success-message')).toBeVisible({
      timeout: 10000,
    });

    console.log('✅ Auto publicado exitosamente');
  });

  test('Locador ve su auto publicado en "Mis Autos"', async ({ page }) => {
    await loginAsLocador(page);

    // Navegar a "Mis Autos"
    await page.goto('/my-cars');
    await expect(page.getByTestId('my-cars-list')).toBeVisible();

    // Debe haber al menos un auto
    const carCards = page.getByTestId('my-car-card');
    const count = await carCards.count();
    expect(count).toBeGreaterThan(0);

    // Verificar información del primer auto
    const firstCar = carCards.first();
    await expect(firstCar.getByTestId('car-brand-model')).toBeVisible();
    await expect(firstCar.getByTestId('car-status')).toBeVisible();
    await expect(firstCar.getByTestId('car-price')).toBeVisible();

    console.log(`✅ ${count} auto(s) publicado(s)`);
  });

  test('Locador edita información de su auto', async ({ page }) => {
    test.slow();

    await loginAsLocador(page);
    await page.goto('/my-cars');

    // Click en editar primer auto
    await page.getByTestId('my-car-card').first().click();
    await page.getByTestId('edit-car-button').click();

    // Debería abrir formulario de edición
    await expect(page.getByTestId('car-edit-form')).toBeVisible();

    // Cambiar precio
    const priceInput = page.getByTestId('price-per-day-input');
    await priceInput.clear();
    await priceInput.fill('6000'); // Cambiar a $60/día

    // Cambiar descripción
    const descriptionInput = page.getByTestId('description-textarea');
    await descriptionInput.clear();
    await descriptionInput.fill('Auto actualizado con nuevo precio.');

    // Guardar cambios
    await page.getByTestId('save-changes-button').click();

    // Verificar confirmación
    await expect(page.getByTestId('update-success-message')).toBeVisible({
      timeout: 5000,
    });

    // Verificar que el precio se actualizó
    await page.goto('/my-cars');
    const firstCarPrice = page.getByTestId('my-car-card').first().getByTestId('car-price');
    await expect(firstCarPrice).toContainText('60');

    console.log('✅ Auto editado exitosamente');
  });

  test('Locador activa/desactiva publicación', async ({ page }) => {
    await loginAsLocador(page);
    await page.goto('/my-cars');

    // Abrir detalle del auto
    await page.getByTestId('my-car-card').first().click();

    // Verificar estado actual
    const statusBadge = page.getByTestId('car-status-badge');
    await expect(statusBadge).toBeVisible();
    const currentStatus = await statusBadge.textContent();

    // Toggle estado
    const toggleButton = page.getByTestId('toggle-status-button');
    await toggleButton.click();

    // Confirmar cambio
    const confirmButton = page.getByTestId('confirm-status-change');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Esperar actualización
    await page.waitForTimeout(1000);

    // Verificar que cambió el estado
    const newStatus = await statusBadge.textContent();
    expect(newStatus).not.toBe(currentStatus);

    console.log(`✅ Estado cambiado de "${currentStatus}" a "${newStatus}"`);
  });

  test('Locador elimina auto', async ({ page }) => {
    await loginAsLocador(page);
    await page.goto('/my-cars');

    // Contar autos antes
    const countBefore = await page.getByTestId('my-car-card').count();

    // Abrir último auto
    await page.getByTestId('my-car-card').last().click();

    // Click en eliminar
    await page.getByTestId('delete-car-button').click();

    // Confirmar eliminación
    await expect(page.getByTestId('delete-confirmation-modal')).toBeVisible();
    await page.getByTestId('confirm-delete-button').click();

    // Debe redirigir a lista
    await expect(page).toHaveURL(/my-cars/);

    // Contar autos después
    const countAfter = await page.getByTestId('my-car-card').count();
    expect(countAfter).toBe(countBefore - 1);

    console.log('✅ Auto eliminado');
  });
});

// 🔍 Tests de Validación
test.describe('Publicación de Autos - Validaciones', () => {
  test('No se puede publicar sin información básica completa', async ({ page }) => {
    await loginAsLocador(page);
    await page.goto('/cars/publish');

    // Intentar avanzar sin llenar campos
    const nextButton = page.getByTestId('next-step-button');
    await expect(nextButton).toBeDisabled();

    // Llenar solo algunos campos
    await page.getByTestId('brand-input').fill('Toyota');
    // Aún debe estar deshabilitado
    await expect(nextButton).toBeDisabled();

    // Llenar todos los campos obligatorios
    await page.getByTestId('model-input').fill('Corolla');
    await page.getByTestId('year-input').fill('2022');
    await page.getByTestId('license-plate-input').fill('ABC123');
    await page.getByTestId('fuel-type-select').selectOption('gasoline');
    await page.getByTestId('transmission-select').selectOption('automatic');
    await page.getByTestId('seats-input').fill('5');

    // Ahora debe estar habilitado
    await expect(nextButton).toBeEnabled();

    console.log('✅ Validaciones de campos obligatorios funcionan');
  });

  test('Precio debe ser mayor a 0', async ({ page }) => {
    await loginAsLocador(page);
    await page.goto('/cars/publish');

    // Llenar info básica
    await page.getByTestId('brand-input').fill('Toyota');
    await page.getByTestId('model-input').fill('Corolla');
    await page.getByTestId('year-input').fill('2022');
    await page.getByTestId('license-plate-input').fill('ABC123');
    await page.getByTestId('fuel-type-select').selectOption('gasoline');
    await page.getByTestId('transmission-select').selectOption('automatic');
    await page.getByTestId('seats-input').fill('5');

    // Avanzar a precios
    await page.getByTestId('next-step-button').click();
    await page.getByTestId('next-step-button').click(); // Skip location
    await expect(page.getByTestId('pricing-form')).toBeVisible();

    // Intentar poner precio 0
    await page.getByTestId('price-per-day-input').fill('0');
    await expect(page.getByTestId('price-error')).toBeVisible();

    // Intentar poner precio negativo
    await page.getByTestId('price-per-day-input').fill('-100');
    await expect(page.getByTestId('price-error')).toBeVisible();

    console.log('✅ Validación de precio funciona');
  });

  test('Año del auto debe ser válido', async ({ page }) => {
    await loginAsLocador(page);
    await page.goto('/cars/publish');

    // Intentar año futuro
    await page.getByTestId('year-input').fill('2030');
    await expect(page.getByTestId('year-error')).toBeVisible();

    // Intentar año muy antiguo
    await page.getByTestId('year-input').fill('1900');
    await expect(page.getByTestId('year-error')).toBeVisible();

    // Año válido
    await page.getByTestId('year-input').fill('2020');
    const yearError = page.getByTestId('year-error');
    await expect(yearError).not.toBeVisible();

    console.log('✅ Validación de año funciona');
  });

  test('Patente debe tener formato válido', async ({ page }) => {
    await loginAsLocador(page);
    await page.goto('/cars/publish');

    // Patente inválida
    await page.getByTestId('license-plate-input').fill('123');
    await expect(page.getByTestId('license-plate-error')).toBeVisible();

    // Patente válida argentina (formato viejo)
    await page.getByTestId('license-plate-input').fill('ABC123');
    const plateError = page.getByTestId('license-plate-error');
    await expect(plateError).not.toBeVisible();

    // Patente válida argentina (formato nuevo)
    await page.getByTestId('license-plate-input').fill('AA123BC');
    await expect(plateError).not.toBeVisible();

    console.log('✅ Validación de patente funciona');
  });
});

// 🔍 Tests de Seguridad
test.describe('Publicación de Autos - Seguridad', () => {
  test('Solo el dueño puede editar su auto', async ({ page, context }) => {
    // Login como locador 1 y obtener ID de su auto
    await loginAsLocador(page);
    await page.goto('/my-cars');
    const firstCarCard = page.getByTestId('my-car-card').first();
    await firstCarCard.click();

    const carUrl = page.url();
    const carId = carUrl.split('/').pop();

    // Logout
    await page.getByTestId('user-menu').click();
    await page.getByTestId('logout-button').click();

    // Login como locador 2 (diferente usuario)
    await page.goto('/login');
    await page.getByTestId('email-input').fill('otro_locador@test.com');
    await page.getByTestId('password-input').fill('test1234');
    await page.getByTestId('submit-login').click();

    // Intentar acceder al auto del primer locador
    await page.goto(`/cars/${carId}/edit`);

    // Debe mostrar error o redirigir
    await expect(
      page.getByTestId('unauthorized-message') || page.getByText(/no autorizado/i)
    ).toBeVisible({ timeout: 5000 });

    console.log('✅ Protección de edición funciona');
  });
});
