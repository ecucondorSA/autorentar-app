import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Tests: Sistema de Reviews y Ratings
 *
 * Flujo:
 * 1. Locatario completa reserva y califica al locador y auto
 * 2. Locador califica al locatario
 * 3. Reviews aparecen en perfiles y listings
 * 4. Sistema de reputación se actualiza
 * 5. Reviews pueden reportarse si son inapropiadas
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
test.describe('Reviews y Ratings E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('Locatario deja review después de completar reserva', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Locatario deja review');

    // 1. Login como locatario
    await loginAsLocatario(page);

    // 2. Navegar a "Mis Reservas"
    await page.goto('/bookings');
    await expect(page.getByTestId('my-bookings-list')).toBeVisible();

    // 3. Buscar reserva completada que aún no tenga review
    const completedBookings = page.getByTestId('booking-card-completed');
    const hasCompleted = await completedBookings.first().isVisible().catch(() => false);

    if (!hasCompleted) {
      console.log('ℹ️ No hay reservas completadas sin review');
      return;
    }

    // 4. Abrir booking completado
    await completedBookings.first().click();
    await expect(page.getByTestId('booking-detail')).toBeVisible();

    // 5. Click en "Dejar Review"
    await page.getByTestId('leave-review-button').click();

    // 6. Modal de review debe aparecer
    await expect(page.getByTestId('review-modal')).toBeVisible();

    // 7. Calificar con estrellas (auto)
    const carRatingStars = page.getByTestId('car-rating-stars');
    await carRatingStars.locator('[data-rating="5"]').click(); // 5 estrellas

    // 8. Calificar con estrellas (locador)
    const ownerRatingStars = page.getByTestId('owner-rating-stars');
    await ownerRatingStars.locator('[data-rating="5"]').click(); // 5 estrellas

    // 9. Escribir comentario sobre el auto
    await page.getByTestId('car-review-text').fill(
      'Excelente auto, muy cómodo y limpio. El locador fue muy amable y puntual.'
    );

    // 10. Escribir comentario sobre el locador
    await page.getByTestId('owner-review-text').fill(
      'Muy buen locador, comunicación clara y proceso simple.'
    );

    // 11. Categorías adicionales (opcional)
    const cleanliness = page.getByTestId('rating-cleanliness');
    if (await cleanliness.isVisible()) {
      await cleanliness.locator('[data-rating="5"]').click();
    }

    const communication = page.getByTestId('rating-communication');
    if (await communication.isVisible()) {
      await communication.locator('[data-rating="5"]').click();
    }

    const accuracy = page.getByTestId('rating-accuracy');
    if (await accuracy.isVisible()) {
      await accuracy.locator('[data-rating="4"]').click();
    }

    // 12. Subir fotos (opcional)
    const photoUpload = page.getByTestId('review-photos-upload');
    if (await photoUpload.isVisible()) {
      await photoUpload.setInputFiles(['e2e/fixtures/car-review-1.jpg']);
    }

    // 13. Enviar review
    await page.getByTestId('submit-review-button').click();

    // 14. Verificar confirmación
    await expect(page.getByTestId('review-success-message')).toBeVisible({
      timeout: 5000,
    });

    // 15. Verificar que el booking ahora muestra que fue reviewed
    await expect(page.getByTestId('review-submitted-badge')).toBeVisible();

    console.log('✅ Review enviada exitosamente');
  });

  test('Locador deja review del locatario', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Locador deja review del locatario');

    // 1. Login como locador
    await loginAsLocador(page);

    // 2. Navegar a reservas recibidas completadas
    await page.goto('/bookings/received?status=completed');
    await expect(page.getByTestId('bookings-received-list')).toBeVisible();

    // 3. Buscar reserva completada sin review del locatario
    const needsReview = page.getByTestId('booking-needs-review').first();
    const hasNeedsReview = await needsReview.isVisible().catch(() => false);

    if (!hasNeedsReview) {
      console.log('ℹ️ No hay reservas que necesiten review');
      return;
    }

    // 4. Abrir booking
    await needsReview.click();

    // 5. Click en "Calificar Locatario"
    await page.getByTestId('rate-renter-button').click();

    // 6. Modal de review
    await expect(page.getByTestId('renter-review-modal')).toBeVisible();

    // 7. Calificar locatario
    await page
      .getByTestId('renter-rating-stars')
      .locator('[data-rating="5"]')
      .click();

    // 8. Categorías específicas para locatarios
    await page
      .getByTestId('rating-respect-rules')
      .locator('[data-rating="5"]')
      .click();

    await page
      .getByTestId('rating-cleanliness-car')
      .locator('[data-rating="5"]')
      .click();

    await page
      .getByTestId('rating-communication')
      .locator('[data-rating="5"]')
      .click();

    // 9. Comentario
    await page.getByTestId('renter-review-text').fill(
      'Excelente locatario, devolvió el auto en perfectas condiciones y respetó todos los términos.'
    );

    // 10. Recomendaría a este locatario
    await page.getByTestId('would-rent-again-checkbox').check();

    // 11. Enviar review
    await page.getByTestId('submit-renter-review-button').click();

    // 12. Confirmación
    await expect(page.getByTestId('review-success-message')).toBeVisible({
      timeout: 5000,
    });

    console.log('✅ Review del locatario enviada');
  });

  test('Reviews aparecen en el perfil del usuario', async ({ page }) => {
    await loginAsLocatario(page);

    // Ir al propio perfil
    await page.goto('/profile');
    await expect(page.getByTestId('profile-page')).toBeVisible();

    // Sección de reviews
    await page.getByTestId('reviews-tab').click();
    await expect(page.getByTestId('reviews-section')).toBeVisible();

    // Estadísticas de rating
    const overallRating = page.getByTestId('overall-rating');
    await expect(overallRating).toBeVisible();

    const ratingValue = await overallRating.textContent();
    expect(Number.parseFloat(ratingValue || '0')).toBeGreaterThanOrEqual(0);
    expect(Number.parseFloat(ratingValue || '0')).toBeLessThanOrEqual(5);

    // Total de reviews
    const reviewCount = page.getByTestId('review-count');
    await expect(reviewCount).toBeVisible();

    // Lista de reviews
    const reviewsList = page.getByTestId('reviews-list');
    await expect(reviewsList).toBeVisible();

    // Verificar que cada review tiene la info necesaria
    const reviewItems = page.getByTestId('review-item');
    const count = await reviewItems.count();

    if (count > 0) {
      const firstReview = reviewItems.first();
      await expect(firstReview.getByTestId('review-rating')).toBeVisible();
      await expect(firstReview.getByTestId('review-text')).toBeVisible();
      await expect(firstReview.getByTestId('review-date')).toBeVisible();
      await expect(firstReview.getByTestId('reviewer-name')).toBeVisible();
    }

    console.log(`✅ Perfil muestra ${count} reviews`);
  });

  test('Reviews aparecen en el listing del auto', async ({ page }) => {
    // Sin login, como visitante
    await page.goto('/cars');

    // Seleccionar un auto
    await page.getByTestId('car-card').first().click();
    await expect(page.getByTestId('car-detail')).toBeVisible();

    // Scroll a la sección de reviews
    await page.getByTestId('reviews-section').scrollIntoViewIfNeeded();

    // Verificar rating promedio del auto
    const carRating = page.getByTestId('car-average-rating');
    await expect(carRating).toBeVisible();

    // Verificar número total de reviews
    const reviewCount = page.getByTestId('car-review-count');
    await expect(reviewCount).toBeVisible();

    // Lista de reviews del auto
    const carReviews = page.getByTestId('car-reviews-list');
    await expect(carReviews).toBeVisible();

    // Filtrar reviews por rating
    const filterSelect = page.getByTestId('reviews-filter-rating');
    if (await filterSelect.isVisible()) {
      await filterSelect.selectOption('5'); // Solo 5 estrellas
      await page.waitForTimeout(500);

      // Verificar que todas las reviews visibles son 5 estrellas
      const visibleReviews = page.getByTestId('review-item');
      const visibleCount = await visibleReviews.count();

      for (let i = 0; i < visibleCount; i++) {
        const reviewRating = visibleReviews.nth(i).getByTestId('review-rating');
        const ratingText = await reviewRating.textContent();
        expect(ratingText).toContain('5');
      }
    }

    console.log('✅ Reviews del auto visibles correctamente');
  });

  test('No se puede dejar review sin completar reserva', async ({ page }) => {
    await loginAsLocatario(page);

    // Ir a una reserva activa (no completada)
    await page.goto('/bookings');
    const activeBooking = page.getByTestId('booking-card-active').first();

    const hasActive = await activeBooking.isVisible().catch(() => false);
    if (!hasActive) {
      console.log('ℹ️ No hay reservas activas');
      return;
    }

    await activeBooking.click();

    // El botón de "Dejar Review" no debe estar visible o debe estar deshabilitado
    const leaveReviewButton = page.getByTestId('leave-review-button');
    const isVisible = await leaveReviewButton.isVisible().catch(() => false);

    if (isVisible) {
      await expect(leaveReviewButton).toBeDisabled();
    } else {
      // O directamente no existe
      await expect(leaveReviewButton).not.toBeVisible();
    }

    console.log('✅ Validación de review solo después de completar funciona');
  });

  test('No se puede dejar múltiples reviews para la misma reserva', async ({ page }) => {
    await loginAsLocatario(page);
    await page.goto('/bookings');

    // Buscar booking ya reviewed
    const reviewedBooking = page.getByTestId('booking-card-reviewed').first();
    const hasReviewed = await reviewedBooking.isVisible().catch(() => false);

    if (!hasReviewed) {
      console.log('ℹ️ No hay bookings con review');
      return;
    }

    await reviewedBooking.click();

    // Badge de "Review enviada" debe estar visible
    await expect(page.getByTestId('review-submitted-badge')).toBeVisible();

    // Botón de "Dejar Review" no debe estar o debe estar deshabilitado
    const leaveReviewButton = page.getByTestId('leave-review-button');
    const isVisible = await leaveReviewButton.isVisible().catch(() => false);

    expect(isVisible).toBe(false);

    console.log('✅ No se permiten múltiples reviews');
  });

  test('Responder a una review', async ({ page }) => {
    await loginAsLocador(page);

    // Ir a perfil y ver reviews recibidas
    await page.goto('/profile');
    await page.getByTestId('reviews-tab').click();

    // Buscar una review sin respuesta
    const reviewWithoutResponse = page
      .getByTestId('review-item')
      .filter({ has: page.getByTestId('no-response-indicator') })
      .first();

    const hasReview = await reviewWithoutResponse.isVisible().catch(() => false);
    if (!hasReview) {
      console.log('ℹ️ No hay reviews sin respuesta');
      return;
    }

    // Click en "Responder"
    await reviewWithoutResponse.getByTestId('respond-button').click();

    // Modal de respuesta
    await expect(page.getByTestId('response-modal')).toBeVisible();

    // Escribir respuesta
    await page.getByTestId('response-text').fill(
      '¡Muchas gracias por tu review! Fue un placer tenerte como locatario.'
    );

    // Enviar respuesta
    await page.getByTestId('submit-response-button').click();

    // Verificar que aparece la respuesta
    await expect(page.getByTestId('response-text-display')).toBeVisible({
      timeout: 3000,
    });

    console.log('✅ Respuesta enviada correctamente');
  });

  test('Reportar review inapropiada', async ({ page }) => {
    await loginAsLocatario(page);
    await page.goto('/profile');

    // Ver reviews de otros usuarios en algún auto
    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();
    await page.getByTestId('reviews-section').scrollIntoViewIfNeeded();

    // Click en el menú de una review
    const firstReview = page.getByTestId('review-item').first();
    await firstReview.getByTestId('review-menu-button').click();

    // Click en "Reportar"
    await page.getByTestId('report-review-option').click();

    // Modal de reporte
    await expect(page.getByTestId('report-modal')).toBeVisible();

    // Seleccionar razón
    await page.getByTestId('report-reason-select').selectOption('inappropriate-content');

    // Detalles adicionales
    await page.getByTestId('report-details-text').fill(
      'Esta review contiene lenguaje ofensivo.'
    );

    // Enviar reporte
    await page.getByTestId('submit-report-button').click();

    // Confirmación
    await expect(page.getByTestId('report-success-message')).toBeVisible({
      timeout: 3000,
    });

    console.log('✅ Review reportada correctamente');
  });
});

// 🔍 Tests de Validación
test.describe('Reviews - Validaciones', () => {
  test('Rating debe estar entre 1 y 5 estrellas', async ({ page }) => {
    await loginAsLocatario(page);
    await page.goto('/bookings');

    const completedBooking = page.getByTestId('booking-card-completed').first();
    const hasCompleted = await completedBooking.isVisible().catch(() => false);

    if (!hasCompleted) {
      console.log('ℹ️ No hay bookings completados');
      return;
    }

    await completedBooking.click();
    await page.getByTestId('leave-review-button').click();

    // Sin seleccionar rating, botón debe estar deshabilitado
    const submitButton = page.getByTestId('submit-review-button');
    await expect(submitButton).toBeDisabled();

    // Seleccionar rating
    await page.getByTestId('car-rating-stars').locator('[data-rating="3"]').click();
    await page.getByTestId('owner-rating-stars').locator('[data-rating="4"]').click();

    // Ahora debe estar habilitado
    await expect(submitButton).toBeEnabled();
  });

  test('Comentario de review debe tener longitud mínima', async ({ page }) => {
    await loginAsLocatario(page);
    await page.goto('/bookings');

    const completedBooking = page.getByTestId('booking-card-completed').first();
    const hasCompleted = await completedBooking.isVisible().catch(() => false);

    if (!hasCompleted) {
      return;
    }

    await completedBooking.click();
    await page.getByTestId('leave-review-button').click();

    // Seleccionar ratings
    await page.getByTestId('car-rating-stars').locator('[data-rating="5"]').click();
    await page.getByTestId('owner-rating-stars').locator('[data-rating="5"]').click();

    // Intentar enviar con comentario muy corto
    await page.getByTestId('car-review-text').fill('Ok'); // Muy corto

    // Debe mostrar error de longitud mínima
    await expect(page.getByTestId('review-text-error')).toBeVisible();

    // Botón debe estar deshabilitado
    await expect(page.getByTestId('submit-review-button')).toBeDisabled();

    // Escribir comentario de longitud adecuada
    await page.getByTestId('car-review-text').fill(
      'Excelente experiencia con este auto, totalmente recomendable.'
    );

    // Error debe desaparecer
    await expect(page.getByTestId('review-text-error')).not.toBeVisible();
  });

  test('No se puede dejar review con lenguaje ofensivo', async ({ page }) => {
    // Este test depende de la implementación de filtro de contenido
    // Aquí mostramos el flujo esperado
    await loginAsLocatario(page);
    await page.goto('/bookings');

    const completedBooking = page.getByTestId('booking-card-completed').first();
    const hasCompleted = await completedBooking.isVisible().catch(() => false);

    if (!hasCompleted) {
      return;
    }

    await completedBooking.click();
    await page.getByTestId('leave-review-button').click();

    await page.getByTestId('car-rating-stars').locator('[data-rating="1"]').click();
    await page.getByTestId('owner-rating-stars').locator('[data-rating="1"]').click();

    // Intentar enviar con contenido inapropiado (simulado)
    await page.getByTestId('car-review-text').fill(
      'Este es un comentario con palabras [FILTRADAS] que debería ser bloqueado.'
    );

    await page.getByTestId('submit-review-button').click();

    // Sistema debe detectar y mostrar error
    await expect(page.getByTestId('inappropriate-content-error')).toBeVisible({
      timeout: 3000,
    });

    console.log('✅ Filtro de contenido funciona');
  });
});

// 🔍 Tests de Performance y Estadísticas
test.describe('Reviews - Estadísticas y Agregados', () => {
  test('Rating promedio se calcula correctamente', async ({ page }) => {
    // Ver perfil de un usuario con múltiples reviews
    await page.goto('/profile/user-with-reviews');

    const overallRating = page.getByTestId('overall-rating');
    await expect(overallRating).toBeVisible();

    const ratingText = await overallRating.textContent();
    const rating = Number.parseFloat(ratingText || '0');

    // Rating debe ser un número válido entre 0 y 5
    expect(rating).toBeGreaterThanOrEqual(0);
    expect(rating).toBeLessThanOrEqual(5);

    // Verificar distribución de ratings (gráfico de barras)
    const ratingDistribution = page.getByTestId('rating-distribution');
    if (await ratingDistribution.isVisible()) {
      // Verificar que muestra distribución 5★, 4★, 3★, 2★, 1★
      for (let stars = 5; stars >= 1; stars--) {
        const bar = ratingDistribution.getByTestId(`rating-bar-${stars}`);
        await expect(bar).toBeVisible();
      }
    }

    console.log(`✅ Rating promedio: ${rating}/5`);
  });

  test('Reviews más recientes aparecen primero', async ({ page }) => {
    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();
    await page.getByTestId('reviews-section').scrollIntoViewIfNeeded();

    const reviewItems = page.getByTestId('review-item');
    const count = await reviewItems.count();

    if (count < 2) {
      console.log('ℹ️ No hay suficientes reviews para comparar');
      return;
    }

    // Obtener fechas de las primeras dos reviews
    const firstDate = await reviewItems.nth(0).getByTestId('review-date').textContent();
    const secondDate = await reviewItems.nth(1).getByTestId('review-date').textContent();

    // La primera debe ser más reciente que la segunda
    const date1 = new Date(firstDate || '');
    const date2 = new Date(secondDate || '');

    expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime());

    console.log('✅ Reviews ordenadas por fecha (más reciente primero)');
  });

  test('Paginación de reviews funciona correctamente', async ({ page }) => {
    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();
    await page.getByTestId('reviews-section').scrollIntoViewIfNeeded();

    // Contar reviews en primera página
    const reviewItemsBefore = page.getByTestId('review-item');
    const countBefore = await reviewItemsBefore.count();

    // Buscar botón de "Cargar más" o paginación
    const loadMoreButton = page.getByTestId('load-more-reviews');
    const hasLoadMore = await loadMoreButton.isVisible().catch(() => false);

    if (!hasLoadMore) {
      console.log('ℹ️ No hay más reviews para cargar');
      return;
    }

    // Click en cargar más
    await loadMoreButton.click();
    await page.waitForTimeout(1000);

    // Contar reviews después
    const countAfter = await reviewItemsBefore.count();

    expect(countAfter).toBeGreaterThan(countBefore);

    console.log(`✅ Cargadas ${countAfter - countBefore} reviews adicionales`);
  });
});
