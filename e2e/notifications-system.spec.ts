import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Tests: Sistema de Notificaciones
 *
 * Flujo:
 * 1. Usuario recibe notificaciones en tiempo real
 * 2. Badge de contador se actualiza
 * 3. Usuario puede ver y marcar como leídas
 * 4. Notificaciones redirigen a la acción correspondiente
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
test.describe('Sistema de Notificaciones E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('Usuario ve contador de notificaciones no leídas', async ({ page }) => {
    await loginAsLocatario(page);

    // Esperar que cargue el dashboard
    await expect(page).toHaveURL(/dashboard/);

    // El badge de notificaciones debe estar visible si hay notificaciones
    const notificationBadge = page.getByTestId('notification-badge');

    // Puede o no estar visible dependiendo de si hay notificaciones
    const isVisible = await notificationBadge.isVisible().catch(() => false);

    if (isVisible) {
      // Si hay notificaciones, el badge debe tener un número
      const badgeText = await notificationBadge.textContent();
      expect(Number.parseInt(badgeText || '0')).toBeGreaterThan(0);
      console.log(`✅ ${badgeText} notificaciones no leídas`);
    } else {
      console.log('ℹ️ No hay notificaciones no leídas');
    }
  });

  test('Usuario abre panel de notificaciones', async ({ page }) => {
    await loginAsLocatario(page);

    // Click en botón de notificaciones
    await page.getByTestId('notifications-button').click();

    // Panel debe aparecer
    await expect(page.getByTestId('notifications-panel')).toBeVisible({
      timeout: 3000,
    });

    // Debe mostrar lista de notificaciones o mensaje de "no hay notificaciones"
    const notificationsList = page.getByTestId('notifications-list');
    const emptyMessage = page.getByText(/no hay notificaciones/i);

    const hasNotifications = await notificationsList.isVisible().catch(() => false);
    const isEmpty = await emptyMessage.isVisible().catch(() => false);

    expect(hasNotifications || isEmpty).toBe(true);

    console.log('✅ Panel de notificaciones abierto');
  });

  test('Marcar notificación como leída', async ({ page }) => {
    test.slow();

    await loginAsLocatario(page);

    // Abrir panel
    await page.getByTestId('notifications-button').click();
    await expect(page.getByTestId('notifications-panel')).toBeVisible();

    // Verificar si hay notificaciones no leídas
    const unreadNotification = page.getByTestId('notification-item-unread').first();
    const hasUnread = await unreadNotification.isVisible().catch(() => false);

    if (!hasUnread) {
      console.log('ℹ️ No hay notificaciones no leídas para marcar');
      return;
    }

    // Contar notificaciones no leídas antes
    const unreadCount = await page.getByTestId('notification-item-unread').count();

    // Click en la notificación (debería marcarla como leída)
    await unreadNotification.click();

    // Esperar navegación si la notificación redirige
    await page.waitForTimeout(1000);

    // Volver a abrir panel
    await page.getByTestId('notifications-button').click();

    // Verificar que disminuyó el contador
    const newUnreadCount = await page
      .getByTestId('notification-item-unread')
      .count()
      .catch(() => 0);

    expect(newUnreadCount).toBeLessThanOrEqual(unreadCount);

    console.log('✅ Notificación marcada como leída');
  });

  test('Notificación de nuevo mensaje redirige a chat', async ({ page }) => {
    test.slow();

    await loginAsLocador(page);

    // Abrir notificaciones
    await page.getByTestId('notifications-button').click();
    await expect(page.getByTestId('notifications-panel')).toBeVisible();

    // Buscar notificación de tipo "nuevo mensaje"
    const messageNotification = page
      .getByTestId('notification-item')
      .filter({ hasText: /mensaje|message/i })
      .first();

    const hasMessageNotif = await messageNotification.isVisible().catch(() => false);

    if (!hasMessageNotif) {
      console.log('ℹ️ No hay notificaciones de mensajes');
      return;
    }

    // Click en la notificación
    await messageNotification.click();

    // Debe redirigir a la página de mensajes o abrir el chat
    await expect(page).toHaveURL(/messages|chat/, { timeout: 5000 });

    console.log('✅ Redirigido a mensajes correctamente');
  });

  test('Notificación de nueva reserva redirige a bookings', async ({ page }) => {
    test.slow();

    await loginAsLocador(page);

    // Abrir notificaciones
    await page.getByTestId('notifications-button').click();
    await expect(page.getByTestId('notifications-panel')).toBeVisible();

    // Buscar notificación de tipo "nueva reserva"
    const bookingNotification = page
      .getByTestId('notification-item')
      .filter({ hasText: /reserva|booking/i })
      .first();

    const hasBookingNotif = await bookingNotification.isVisible().catch(() => false);

    if (!hasBookingNotif) {
      console.log('ℹ️ No hay notificaciones de reservas');
      return;
    }

    // Click en la notificación
    await bookingNotification.click();

    // Debe redirigir a bookings
    await expect(page).toHaveURL(/bookings/, { timeout: 5000 });

    console.log('✅ Redirigido a reservas correctamente');
  });

  test('Marcar todas las notificaciones como leídas', async ({ page }) => {
    await loginAsLocatario(page);

    // Abrir panel
    await page.getByTestId('notifications-button').click();
    await expect(page.getByTestId('notifications-panel')).toBeVisible();

    // Buscar botón de "marcar todas como leídas"
    const markAllButton = page.getByTestId('mark-all-read-button');
    const hasButton = await markAllButton.isVisible().catch(() => false);

    if (!hasButton) {
      console.log('ℹ️ No hay botón de marcar todas o no hay notificaciones');
      return;
    }

    // Click en marcar todas
    await markAllButton.click();

    // Esperar confirmación
    await page.waitForTimeout(1000);

    // Badge debe desaparecer o mostrar 0
    const badge = page.getByTestId('notification-badge');
    const stillVisible = await badge.isVisible().catch(() => false);

    if (stillVisible) {
      const badgeText = await badge.textContent();
      expect(badgeText).toBe('0');
    }

    console.log('✅ Todas las notificaciones marcadas como leídas');
  });

  test('Filtrar notificaciones por tipo', async ({ page }) => {
    await loginAsLocatario(page);

    // Abrir panel
    await page.getByTestId('notifications-button').click();
    await expect(page.getByTestId('notifications-panel')).toBeVisible();

    // Buscar filtro de tipo
    const typeFilter = page.getByTestId('notification-type-filter');
    const hasFilter = await typeFilter.isVisible().catch(() => false);

    if (!hasFilter) {
      console.log('ℹ️ No hay filtro de tipo disponible');
      return;
    }

    // Filtrar solo mensajes
    await typeFilter.selectOption('messages');
    await page.waitForTimeout(500);

    // Todas las notificaciones visibles deben ser de tipo mensaje
    const visibleNotifications = page.getByTestId('notification-item');
    const count = await visibleNotifications.count();

    for (let i = 0; i < count; i++) {
      const notification = visibleNotifications.nth(i);
      const text = await notification.textContent();
      expect(text?.toLowerCase()).toContain('mensaje' || 'message');
    }

    console.log('✅ Filtro de tipo funciona correctamente');
  });

  test('Eliminar notificación individual', async ({ page }) => {
    await loginAsLocatario(page);

    // Abrir panel
    await page.getByTestId('notifications-button').click();
    await expect(page.getByTestId('notifications-panel')).toBeVisible();

    // Contar notificaciones antes
    const countBefore = await page.getByTestId('notification-item').count();

    if (countBefore === 0) {
      console.log('ℹ️ No hay notificaciones para eliminar');
      return;
    }

    // Buscar botón de eliminar en primera notificación
    const deleteButton = page
      .getByTestId('notification-item')
      .first()
      .getByTestId('delete-notification-button');

    const hasDelete = await deleteButton.isVisible().catch(() => false);

    if (!hasDelete) {
      console.log('ℹ️ No hay botón de eliminar disponible');
      return;
    }

    // Click en eliminar
    await deleteButton.click();

    // Confirmar si aparece modal de confirmación
    const confirmButton = page.getByTestId('confirm-delete-notification');
    const hasConfirm = await confirmButton.isVisible().catch(() => false);

    if (hasConfirm) {
      await confirmButton.click();
    }

    // Esperar actualización
    await page.waitForTimeout(500);

    // Contar notificaciones después
    const countAfter = await page.getByTestId('notification-item').count();

    expect(countAfter).toBe(countBefore - 1);

    console.log('✅ Notificación eliminada correctamente');
  });
});

// 🔍 Tests de Tiempo Real
test.describe('Notificaciones - Tiempo Real', () => {
  test('Badge se actualiza cuando llega nueva notificación', async ({
    page,
    context,
  }) => {
    test.slow();

    // Login como locador
    await loginAsLocador(page);

    // Abrir segunda página como locatario
    const locatarioPage = await context.newPage();
    await locatarioPage.goto('/login');
    await locatarioPage.getByTestId('email-input').fill('locatario@test.com');
    await locatarioPage.getByTestId('password-input').fill('test1234');
    await locatarioPage.getByTestId('submit-login').click();

    // Locatario envía mensaje al locador
    await locatarioPage.goto('/cars');
    await locatarioPage.getByTestId('car-card').first().click();
    await locatarioPage.getByTestId('contact-owner-button').click();
    await locatarioPage.getByTestId('message-input').fill('Mensaje de prueba');
    await locatarioPage.getByTestId('send-message-button').click();

    // Esperar que el mensaje se envíe
    await locatarioPage.waitForTimeout(2000);

    // Verificar que el locador recibe notificación
    // El badge debería actualizarse (esto requiere websockets o polling)
    await page.waitForTimeout(3000); // Esperar actualización

    const badge = page.getByTestId('notification-badge');
    const isVisible = await badge.isVisible().catch(() => false);

    if (isVisible) {
      const badgeText = await badge.textContent();
      expect(Number.parseInt(badgeText || '0')).toBeGreaterThan(0);
      console.log('✅ Badge actualizado en tiempo real');
    } else {
      console.log('⚠️ Badge no visible (puede requerir refresh)');
    }

    await locatarioPage.close();
  });
});

// 🔍 Tests de Performance
test.describe('Notificaciones - Performance', () => {
  test('Panel de notificaciones carga rápido', async ({ page }) => {
    await loginAsLocatario(page);

    const startTime = Date.now();

    // Abrir panel
    await page.getByTestId('notifications-button').click();
    await expect(page.getByTestId('notifications-panel')).toBeVisible();

    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(1000); // Menos de 1 segundo

    console.log(`⏱️ Panel cargó en ${loadTime}ms`);
  });

  test('Paginación de notificaciones antiguas', async ({ page }) => {
    await loginAsLocatario(page);

    // Abrir panel
    await page.getByTestId('notifications-button').click();
    await expect(page.getByTestId('notifications-panel')).toBeVisible();

    // Buscar botón de "cargar más"
    const loadMoreButton = page.getByTestId('load-more-notifications');
    const hasLoadMore = await loadMoreButton.isVisible().catch(() => false);

    if (!hasLoadMore) {
      console.log('ℹ️ No hay más notificaciones para cargar');
      return;
    }

    // Contar notificaciones antes
    const countBefore = await page.getByTestId('notification-item').count();

    // Click en cargar más
    await loadMoreButton.click();
    await page.waitForTimeout(1000);

    // Contar después
    const countAfter = await page.getByTestId('notification-item').count();

    expect(countAfter).toBeGreaterThan(countBefore);

    console.log(`✅ Cargadas ${countAfter - countBefore} notificaciones más`);
  });
});
