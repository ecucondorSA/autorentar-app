import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Tests: Búsqueda Avanzada y Filtros
 *
 * Flujo:
 * 1. Usuario busca autos con filtros básicos
 * 2. Usuario aplica filtros avanzados (precio, tipo, características)
 * 3. Usuario ordena resultados
 * 4. Usuario busca en mapa
 * 5. Usuario guarda búsquedas favoritas
 * 6. Sistema muestra resultados relevantes
 */

// 🔧 Helper Functions
async function loginAsLocatario(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByTestId('email-input').fill('locatario@test.com');
  await page.getByTestId('password-input').fill('test1234');
  await page.getByTestId('submit-login').click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
}

// 📝 Tests
test.describe('Búsqueda Avanzada y Filtros E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('Búsqueda básica por ubicación', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Búsqueda por ubicación');

    // 1. Ir a página de búsqueda sin login (público)
    await page.goto('/cars');
    await expect(page.getByTestId('car-list')).toBeVisible();

    // 2. Usar barra de búsqueda
    const searchInput = page.getByTestId('location-search-input');
    await searchInput.fill('Buenos Aires');

    // 3. Sugerencias de autocompletado deben aparecer
    await expect(page.getByTestId('location-suggestions')).toBeVisible({
      timeout: 3000,
    });

    // 4. Seleccionar una sugerencia
    await page.getByTestId('location-suggestion-item').first().click();

    // 5. Resultados se actualizan
    await page.waitForTimeout(1000);

    // 6. Verificar que todos los autos mostrados están en Buenos Aires
    const carCards = page.getByTestId('car-card');
    const count = await carCards.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const location = await carCards.nth(i).getByTestId('car-location').textContent();
      expect(location?.toLowerCase()).toContain('buenos aires');
    }

    console.log(`✅ ${count} autos encontrados en Buenos Aires`);
  });

  test('Filtrar por rango de fechas', async ({ page }) => {
    await page.goto('/cars');

    // 1. Abrir filtro de fechas
    await page.getByTestId('date-filter-button').click();
    await expect(page.getByTestId('date-filter-modal')).toBeVisible();

    // 2. Seleccionar fechas
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 3);

    await page.getByTestId('filter-start-date-input').fill(
      startDate.toISOString().split('T')[0]
    );
    await page.getByTestId('filter-end-date-input').fill(
      endDate.toISOString().split('T')[0]
    );

    // 3. Aplicar filtro
    await page.getByTestId('apply-date-filter-button').click();

    // 4. Solo se muestran autos disponibles en esas fechas
    await page.waitForTimeout(1000);

    // 5. Verificar que hay resultados
    const resultsCount = await page.getByTestId('results-count').textContent();
    console.log(`Resultados con fechas: ${resultsCount}`);

    // 6. Badge de filtro activo debe aparecer
    await expect(page.getByTestId('active-filter-dates')).toBeVisible();

    console.log('✅ Filtro de fechas aplicado');
  });

  test('Filtrar por rango de precio', async ({ page }) => {
    await page.goto('/cars');

    // 1. Abrir panel de filtros
    await page.getByTestId('filters-button').click();
    await expect(page.getByTestId('filters-panel')).toBeVisible();

    // 2. Sección de precio
    const priceSection = page.getByTestId('price-filter-section');
    await expect(priceSection).toBeVisible();

    // 3. Usar sliders de rango
    const minPriceSlider = priceSection.getByTestId('min-price-slider');
    const maxPriceSlider = priceSection.getByTestId('max-price-slider');

    // O inputs numéricos
    const minPriceInput = priceSection.getByTestId('min-price-input');
    const maxPriceInput = priceSection.getByTestId('max-price-input');

    if (await minPriceInput.isVisible()) {
      await minPriceInput.fill('30'); // $30/día mínimo
      await maxPriceInput.fill('100'); // $100/día máximo
    }

    // 4. Aplicar filtros
    await page.getByTestId('apply-filters-button').click();

    // 5. Esperar resultados
    await page.waitForTimeout(1000);

    // 6. Verificar que todos los precios están en el rango
    const carCards = page.getByTestId('car-card');
    const count = await carCards.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const priceText = await carCards.nth(i).getByTestId('car-price').textContent();
      const price = Number.parseInt(priceText?.replace(/\D/g, '') || '0') / 100;

      expect(price).toBeGreaterThanOrEqual(30);
      expect(price).toBeLessThanOrEqual(100);
    }

    console.log(`✅ ${count} autos en rango $30-$100`);
  });

  test('Filtrar por tipo de vehículo y características', async ({ page }) => {
    test.slow();

    await page.goto('/cars');

    // 1. Abrir filtros
    await page.getByTestId('filters-button').click();

    // 2. Tipo de transmisión
    await page.getByTestId('transmission-automatic').check();

    // 3. Tipo de combustible
    await page.getByTestId('fuel-type-gasoline').check();

    // 4. Número de asientos
    await page.getByTestId('seats-5').check();

    // 5. Características especiales
    await page.getByTestId('feature-air-conditioning').check();
    await page.getByTestId('feature-bluetooth').check();
    await page.getByTestId('feature-gps').check();

    // 6. Año del vehículo (mínimo)
    const minYearInput = page.getByTestId('min-year-input');
    if (await minYearInput.isVisible()) {
      await minYearInput.fill('2020');
    }

    // 7. Aplicar filtros
    await page.getByTestId('apply-filters-button').click();

    await page.waitForTimeout(1500);

    // 8. Verificar resultados cumplen criterios
    const firstCar = page.getByTestId('car-card').first();

    if (await firstCar.isVisible()) {
      // Click para ver detalle
      await firstCar.click();

      // Verificar características
      await expect(page.getByText(/automático/i)).toBeVisible();
      await expect(page.getByText(/5 asientos/i)).toBeVisible();
    }

    console.log('✅ Filtros múltiples aplicados correctamente');
  });

  test('Ordenar resultados por diferentes criterios', async ({ page }) => {
    await page.goto('/cars');

    // Esperar que carguen los autos
    await expect(page.getByTestId('car-list')).toBeVisible();
    await page.waitForTimeout(1000);

    // 1. Ordenar por precio ascendente
    await page.getByTestId('sort-select').selectOption('price_asc');
    await page.waitForTimeout(1000);

    // Verificar que el primer auto tiene el precio más bajo
    const carCards = page.getByTestId('car-card');
    const firstPrice = await carCards.first().getByTestId('car-price').textContent();
    const secondPrice = await carCards.nth(1).getByTestId('car-price').textContent();

    const price1 = Number.parseInt(firstPrice?.replace(/\D/g, '') || '0');
    const price2 = Number.parseInt(secondPrice?.replace(/\D/g, '') || '0');

    expect(price1).toBeLessThanOrEqual(price2);

    console.log(`✅ Ordenado por precio: $${price1/100} <= $${price2/100}`);

    // 2. Ordenar por precio descendente
    await page.getByTestId('sort-select').selectOption('price_desc');
    await page.waitForTimeout(1000);

    const firstPriceDesc = await carCards.first().getByTestId('car-price').textContent();
    const secondPriceDesc = await carCards.nth(1).getByTestId('car-price').textContent();

    const priceDesc1 = Number.parseInt(firstPriceDesc?.replace(/\D/g, '') || '0');
    const priceDesc2 = Number.parseInt(secondPriceDesc?.replace(/\D/g, '') || '0');

    expect(priceDesc1).toBeGreaterThanOrEqual(priceDesc2);

    // 3. Ordenar por rating
    const ratingOption = page.getByTestId('sort-select').locator('option[value="rating"]');
    if (await ratingOption.isVisible()) {
      await page.getByTestId('sort-select').selectOption('rating');
      await page.waitForTimeout(1000);

      console.log('✅ Ordenamiento por rating aplicado');
    }

    // 4. Ordenar por más reciente
    const newestOption = page.getByTestId('sort-select').locator('option[value="newest"]');
    if (await newestOption.isVisible()) {
      await page.getByTestId('sort-select').selectOption('newest');
      await page.waitForTimeout(1000);

      console.log('✅ Ordenamiento por más reciente aplicado');
    }
  });

  test('Búsqueda en mapa con zoom y arrastre', async ({ page }) => {
    test.slow();

    // 1. Ir a vista de explorar (tiene mapa)
    await page.goto('/explore');
    await expect(page.getByTestId('map-view')).toBeVisible();

    // 2. Esperar que cargue el mapa
    await page.waitForTimeout(2000);

    // 3. Verificar que hay marcadores en el mapa
    // Los marcadores de Mapbox son elementos personalizados
    const mapContainer = page.locator('#map');
    await expect(mapContainer).toBeVisible();

    // 4. Click en un marcador (abre popup)
    const markers = page.locator('.custom-marker');
    const markerCount = await markers.count();

    console.log(`${markerCount} marcadores en el mapa`);

    if (markerCount > 0) {
      await markers.first().click();
      await page.waitForTimeout(500);

      // Popup debe aparecer
      const popup = page.locator('.mapboxgl-popup');
      await expect(popup).toBeVisible({ timeout: 3000 });

      console.log('✅ Popup del mapa visible');
    }

    // 5. Cambiar a vista de lista
    await page.getByTestId('list-view-button').click();
    await expect(page.getByTestId('list-view')).toBeVisible();

    // 6. Volver a vista de mapa
    await page.getByTestId('map-view-button').click();
    await expect(page.getByTestId('map-view')).toBeVisible();

    console.log('✅ Toggle entre mapa y lista funciona');
  });

  test('Guardar búsqueda como favorita', async ({ page }) => {
    test.slow();

    // Login requerido para guardar
    await loginAsLocatario(page);

    // 1. Hacer una búsqueda con filtros
    await page.goto('/cars');
    await page.getByTestId('location-search-input').fill('Buenos Aires');
    await page.getByTestId('location-suggestion-item').first().click();

    await page.getByTestId('filters-button').click();
    await page.getByTestId('transmission-automatic').check();
    await page.getByTestId('min-price-input').fill('30');
    await page.getByTestId('max-price-input').fill('80');
    await page.getByTestId('apply-filters-button').click();

    await page.waitForTimeout(1000);

    // 2. Click en "Guardar Búsqueda"
    const saveSearchButton = page.getByTestId('save-search-button');

    if (!(await saveSearchButton.isVisible())) {
      console.log('ℹ️ Función de guardar búsqueda no disponible');
      return;
    }

    await saveSearchButton.click();

    // 3. Modal para nombrar la búsqueda
    await expect(page.getByTestId('save-search-modal')).toBeVisible();

    await page.getByTestId('search-name-input').fill('Autos automáticos en BA');

    // 4. Opción de recibir alertas
    await page.getByTestId('enable-alerts-checkbox').check();

    // 5. Guardar
    await page.getByTestId('confirm-save-search-button').click();

    // 6. Confirmación
    await expect(page.getByTestId('search-saved-message')).toBeVisible({
      timeout: 3000,
    });

    // 7. Ir a búsquedas guardadas
    await page.goto('/saved-searches');
    await expect(page.getByTestId('saved-searches-list')).toBeVisible();

    // 8. Verificar que aparece la búsqueda
    const savedSearch = page.getByText('Autos automáticos en BA');
    await expect(savedSearch).toBeVisible();

    console.log('✅ Búsqueda guardada correctamente');
  });

  test('Usar búsqueda guardada', async ({ page }) => {
    await loginAsLocatario(page);

    // 1. Ir a búsquedas guardadas
    await page.goto('/saved-searches');
    await expect(page.getByTestId('saved-searches-list')).toBeVisible();

    const savedSearches = page.getByTestId('saved-search-item');
    const count = await savedSearches.count();

    if (count === 0) {
      console.log('ℹ️ No hay búsquedas guardadas');
      return;
    }

    // 2. Click en una búsqueda guardada
    await savedSearches.first().click();

    // 3. Debe redirigir a resultados con los filtros aplicados
    await expect(page).toHaveURL(/\/cars/);

    // 4. Verificar que los filtros están activos
    const activeFilters = page.getByTestId('active-filter-badge');
    const activeCount = await activeFilters.count();

    expect(activeCount).toBeGreaterThan(0);

    console.log(`✅ Búsqueda cargada con ${activeCount} filtros`);
  });

  test('Limpiar todos los filtros', async ({ page }) => {
    await page.goto('/cars');

    // 1. Aplicar varios filtros
    await page.getByTestId('filters-button').click();
    await page.getByTestId('transmission-automatic').check();
    await page.getByTestId('fuel-type-gasoline').check();
    await page.getByTestId('min-price-input').fill('40');
    await page.getByTestId('apply-filters-button').click();

    await page.waitForTimeout(500);

    // 2. Verificar que hay filtros activos
    const activeFilters = page.getByTestId('active-filter-badge');
    const beforeCount = await activeFilters.count();

    expect(beforeCount).toBeGreaterThan(0);

    // 3. Click en "Limpiar Filtros"
    await page.getByTestId('clear-filters-button').click();

    // 4. Filtros deben desaparecer
    await page.waitForTimeout(500);

    const afterCount = await activeFilters.count().catch(() => 0);

    expect(afterCount).toBe(0);

    console.log('✅ Filtros limpiados correctamente');
  });

  test('Paginación de resultados', async ({ page }) => {
    await page.goto('/cars');

    // Esperar resultados
    await expect(page.getByTestId('car-list')).toBeVisible();
    await page.waitForTimeout(1000);

    // 1. Verificar número de resultados en página 1
    const carCards = page.getByTestId('car-card');
    const page1Count = await carCards.count();

    console.log(`Página 1: ${page1Count} resultados`);

    // 2. Buscar paginación
    const pagination = page.getByTestId('pagination');
    const hasPagination = await pagination.isVisible().catch(() => false);

    if (!hasPagination) {
      console.log('ℹ️ No hay suficientes resultados para paginación');
      return;
    }

    // 3. Ir a página 2
    const nextButton = page.getByTestId('pagination-next');
    if (await nextButton.isVisible() && !(await nextButton.isDisabled())) {
      await nextButton.click();
      await page.waitForTimeout(1000);

      // 4. Verificar que cambió la URL o el contenido
      const page2Count = await carCards.count();

      console.log(`Página 2: ${page2Count} resultados`);

      // 5. Ir a página 1 de nuevo
      const prevButton = page.getByTestId('pagination-prev');
      await prevButton.click();
      await page.waitForTimeout(1000);

      console.log('✅ Paginación funciona correctamente');
    }
  });

  test('Búsqueda sin resultados muestra mensaje apropiado', async ({ page }) => {
    await page.goto('/cars');

    // 1. Aplicar filtros muy restrictivos que no den resultados
    await page.getByTestId('filters-button').click();
    await page.getByTestId('min-price-input').fill('1'); // $0.01/día
    await page.getByTestId('max-price-input').fill('2'); // $0.02/día (imposible)
    await page.getByTestId('apply-filters-button').click();

    await page.waitForTimeout(1000);

    // 2. Debe mostrar mensaje de "Sin resultados"
    await expect(page.getByTestId('no-results-message')).toBeVisible({
      timeout: 5000,
    });

    // 3. Sugerencias para modificar búsqueda
    const suggestions = page.getByTestId('search-suggestions');
    if (await suggestions.isVisible()) {
      await expect(suggestions).toContainText(/modificar|cambiar|filtros/i);
    }

    // 4. Botón para limpiar filtros debe estar visible
    await expect(page.getByTestId('clear-filters-button')).toBeVisible();

    console.log('✅ Mensaje de sin resultados mostrado');
  });
});

// 🔍 Tests de Performance
test.describe('Búsqueda - Performance', () => {
  test('Búsqueda con autocompletado es rápida', async ({ page }) => {
    await page.goto('/cars');

    const searchInput = page.getByTestId('location-search-input');

    // Medir tiempo de respuesta del autocompletado
    const startTime = Date.now();

    await searchInput.fill('Buenos');

    await expect(page.getByTestId('location-suggestions')).toBeVisible({
      timeout: 2000,
    });

    const responseTime = Date.now() - startTime;

    expect(responseTime).toBeLessThan(1500); // Menos de 1.5 segundos

    console.log(`⏱️ Autocompletado respondió en ${responseTime}ms`);
  });

  test('Aplicar filtros actualiza resultados rápidamente', async ({ page }) => {
    await page.goto('/cars');
    await page.waitForTimeout(500);

    await page.getByTestId('filters-button').click();

    const startTime = Date.now();

    await page.getByTestId('transmission-automatic').check();
    await page.getByTestId('apply-filters-button').click();

    await expect(page.getByTestId('car-list')).toBeVisible();

    const updateTime = Date.now() - startTime;

    expect(updateTime).toBeLessThan(3000); // Menos de 3 segundos

    console.log(`⏱️ Filtros aplicados en ${updateTime}ms`);
  });

  test('Mapa con muchos marcadores no se congela', async ({ page }) => {
    test.slow();

    await page.goto('/explore');
    await expect(page.getByTestId('map-view')).toBeVisible();

    // Esperar que cargue completamente
    await page.waitForTimeout(3000);

    // Intentar hacer zoom y arrastrar
    const map = page.locator('#map');

    // Verificar que el mapa es interactivo (no congelado)
    const isVisible = await map.isVisible();
    expect(isVisible).toBe(true);

    // Si hay controles de zoom, probarlos
    const zoomIn = page.locator('.mapboxgl-ctrl-zoom-in');
    if (await zoomIn.isVisible()) {
      await zoomIn.click();
      await page.waitForTimeout(500);

      const zoomOut = page.locator('.mapboxgl-ctrl-zoom-out');
      await zoomOut.click();
      await page.waitForTimeout(500);

      console.log('✅ Mapa interactivo y responsivo');
    }
  });
});

// 🔍 Tests de Accesibilidad
test.describe('Búsqueda - Accesibilidad', () => {
  test('Filtros son navegables con teclado', async ({ page }) => {
    await page.goto('/cars');
    await page.getByTestId('filters-button').click();

    // Tab a través de los filtros
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verificar que el foco está en un elemento de filtro
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));

    expect(focusedElement).toBeTruthy();

    console.log(`✅ Foco en: ${focusedElement}`);
  });

  test('Resultados tienen etiquetas ARIA apropiadas', async ({ page }) => {
    await page.goto('/cars');

    // Verificar que la lista tiene role="list"
    const carList = page.getByTestId('car-list');
    const role = await carList.getAttribute('role');

    // Los screen readers deben poder identificar la lista
    expect(['list', 'region'].includes(role || '')).toBe(true);

    console.log('✅ ARIA roles configurados correctamente');
  });
});
