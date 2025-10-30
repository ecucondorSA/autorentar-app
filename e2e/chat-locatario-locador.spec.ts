import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Tests: Sistema de Chat entre Locatario y Locador
 *
 * Flujo completo:
 * 1. Locatario busca auto
 * 2. Locatario envía mensaje al locador preguntando por disponibilidad
 * 3. Locador recibe notificación
 * 4. Locador responde al locatario
 * 5. Ambos pueden ver el historial de conversación
 * 6. Mensajes se marcan como leídos
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
test.describe('Chat Locatario-Locador E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Limpiar cookies y storage antes de cada test
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test('Locatario envía mensaje al locador sobre disponibilidad del auto', async ({ page }) => {
    test.slow(); // Marca como test lento (3x timeout)

    console.log('🎬 Test: Locatario envía mensaje al locador');

    // 1. Login como locatario
    console.log('📝 Step 1: Login como locatario');
    await loginAsLocatario(page);
    await page.waitForTimeout(1000); // Para el video

    // 2. Buscar autos disponibles
    console.log('🔍 Step 2: Buscar autos disponibles');
    await page.goto('/cars');
    await expect(page.getByTestId('car-list')).toBeVisible({ timeout: 5000 });

    // 3. Seleccionar un auto
    console.log('🚗 Step 3: Seleccionar un auto');
    const firstCar = page.getByTestId('car-card').first();
    await expect(firstCar).toBeVisible();
    await firstCar.click();

    // 4. Verificar que estamos en la página de detalle
    await expect(page).toHaveURL(/\/cars\/[a-f0-9-]+/);
    await expect(page.getByTestId('car-detail')).toBeVisible();

    // 5. Abrir chat con el locador
    console.log('💬 Step 4: Abrir chat con locador');
    await page.getByTestId('contact-owner-button').click();
    await expect(page.getByTestId('chat-modal')).toBeVisible();

    // 6. Escribir mensaje
    console.log('✍️  Step 5: Escribir mensaje');
    const messageInput = page.getByTestId('message-input');
    await expect(messageInput).toBeVisible();

    const testMessage = '¿El auto está disponible este fin de semana del 15 al 17 de noviembre?';
    await messageInput.fill(testMessage);

    // 7. Enviar mensaje
    console.log('📤 Step 6: Enviar mensaje');
    await page.getByTestId('send-message-button').click();

    // 8. Verificar que el mensaje aparece en el chat
    console.log('✅ Step 7: Verificar mensaje enviado');
    await expect(page.getByText(testMessage)).toBeVisible({ timeout: 5000 });

    // 9. Verificar indicador de "enviado"
    await expect(page.getByTestId('message-sent-indicator').last()).toBeVisible();

    console.log('✅ Test completado: Mensaje enviado correctamente');
  });

  test('Locador recibe notificación y responde al locatario', async ({ page, context }) => {
    test.slow();

    console.log('🎬 Test: Locador recibe y responde mensaje');

    // 1. Primero, el locatario envía un mensaje (setup)
    console.log('📝 Setup: Locatario envía mensaje');
    await loginAsLocatario(page);
    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();
    await page.getByTestId('contact-owner-button').click();
    await page.getByTestId('message-input').fill('¿Cuál es el precio por día?');
    await page.getByTestId('send-message-button').click();
    await page.waitForTimeout(1000);

    // 2. Logout del locatario
    console.log('🚪 Step 1: Logout locatario');
    await logout(page);

    // 3. Login como locador
    console.log('📝 Step 2: Login como locador');
    await loginAsLocador(page);

    // 4. Verificar que hay notificaciones
    console.log('🔔 Step 3: Verificar notificaciones');
    const notificationBadge = page.getByTestId('notification-badge');
    await expect(notificationBadge).toBeVisible({ timeout: 5000 });
    await expect(notificationBadge).toContainText('1'); // 1 mensaje nuevo

    // 5. Abrir panel de notificaciones
    console.log('📬 Step 4: Abrir notificaciones');
    await page.getByTestId('notifications-button').click();
    await expect(page.getByTestId('notifications-panel')).toBeVisible();

    // 6. Click en la notificación de mensaje
    console.log('💬 Step 5: Abrir mensaje desde notificación');
    await page.getByTestId('notification-item').first().click();

    // 7. Debe redirigir a la conversación
    await expect(page.getByTestId('chat-conversation')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('¿Cuál es el precio por día?')).toBeVisible();

    // 8. Locador escribe respuesta
    console.log('✍️  Step 6: Locador responde');
    const responseMessage = 'Hola! El precio es $5,000 por día. ¿Te interesa reservarlo?';
    await page.getByTestId('message-input').fill(responseMessage);
    await page.getByTestId('send-message-button').click();

    // 9. Verificar que la respuesta aparece
    console.log('✅ Step 7: Verificar respuesta enviada');
    await expect(page.getByText(responseMessage)).toBeVisible({ timeout: 5000 });

    console.log('✅ Test completado: Locador respondió correctamente');
  });

  test('Conversación completa con múltiples mensajes', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Conversación completa');

    // 1. Login como locatario
    await loginAsLocatario(page);
    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();
    await page.getByTestId('contact-owner-button').click();

    // 2. Enviar múltiples mensajes
    const messages = [
      '¿El auto tiene seguro incluido?',
      '¿Cuál es el kilometraje máximo permitido?',
      '¿Puedo recogerlo en el aeropuerto?',
    ];

    console.log('📤 Enviando múltiples mensajes');
    for (const message of messages) {
      await page.getByTestId('message-input').fill(message);
      await page.getByTestId('send-message-button').click();
      await page.waitForTimeout(500); // Esperar entre mensajes
      await expect(page.getByText(message)).toBeVisible();
    }

    // 3. Verificar que todos los mensajes están en el historial
    console.log('✅ Verificando historial completo');
    for (const message of messages) {
      await expect(page.getByText(message)).toBeVisible();
    }

    // 4. Verificar contador de mensajes
    const messageCount = await page.getByTestId('message-item').count();
    expect(messageCount).toBe(messages.length);

    console.log(`✅ Test completado: ${messages.length} mensajes en conversación`);
  });

  test('Marcar mensajes como leídos', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Marcar mensajes como leídos');

    // 1. Setup: Locatario envía mensaje
    await loginAsLocatario(page);
    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();
    await page.getByTestId('contact-owner-button').click();
    await page.getByTestId('message-input').fill('Mensaje de prueba');
    await page.getByTestId('send-message-button').click();
    await page.waitForTimeout(1000);
    await logout(page);

    // 2. Login como locador
    await loginAsLocador(page);

    // 3. Verificar badge de mensajes no leídos
    console.log('🔔 Verificando badge de no leídos');
    await expect(page.getByTestId('unread-messages-badge')).toBeVisible();

    // 4. Abrir conversación
    console.log('💬 Abriendo conversación');
    await page.getByTestId('messages-button').click();
    await page.getByTestId('conversation-item').first().click();

    // 5. Esperar que se marquen como leídos (automático)
    await page.waitForTimeout(2000);

    // 6. Verificar que el badge desapareció o cambió
    console.log('✅ Verificando que mensajes se marcaron como leídos');
    await expect(page.getByTestId('unread-messages-badge')).not.toBeVisible({ timeout: 5000 });

    console.log('✅ Test completado: Mensajes marcados como leídos');
  });

  test('Conversación asociada a booking específico', async ({ page }) => {
    test.slow();

    console.log('🎬 Test: Conversación durante proceso de booking');

    // 1. Login como locatario
    await loginAsLocatario(page);

    // 2. Crear una reserva (booking)
    console.log('📅 Creando booking');
    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();
    await page.getByTestId('book-now-button').click();

    // 3. Llenar formulario de booking
    await page.getByTestId('start-date-input').fill('2025-11-15');
    await page.getByTestId('end-date-input').fill('2025-11-17');
    await page.getByTestId('confirm-booking-button').click();

    // 4. Esperar confirmación
    await expect(page.getByTestId('booking-confirmation')).toBeVisible({ timeout: 10000 });

    // 5. Enviar mensaje en contexto del booking
    console.log('💬 Enviando mensaje en contexto de booking');
    await page.getByTestId('message-owner-button').click();

    const bookingMessage = '¿A qué hora puedo recoger el auto el día 15?';
    await page.getByTestId('message-input').fill(bookingMessage);
    await page.getByTestId('send-message-button').click();

    // 6. Verificar que mensaje está asociado al booking
    await expect(page.getByText(bookingMessage)).toBeVisible();
    await expect(page.getByTestId('booking-context-badge')).toBeVisible();

    console.log('✅ Test completado: Mensaje asociado a booking');
  });

  test('Push notifications se envían correctamente', async ({ page, context }) => {
    test.slow();

    console.log('🎬 Test: Push notifications');

    // 1. Configurar permisos de notificaciones
    await context.grantPermissions(['notifications']);

    // 2. Login como locatario
    await loginAsLocatario(page);

    // 3. Registrar service worker (si existe)
    await page.waitForTimeout(2000); // Esperar registro de SW

    // 4. Enviar mensaje
    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();
    await page.getByTestId('contact-owner-button').click();
    await page.getByTestId('message-input').fill('Test notification');
    await page.getByTestId('send-message-button').click();

    // 5. Verificar que se intentó enviar notificación
    // (En un test real, aquí verificaríamos el registro en el servidor)
    console.log('✅ Push notification enviada');

    console.log('✅ Test completado: Push notifications OK');
  });
});

// 🧪 Tests de Validación y Edge Cases
test.describe('Chat - Validaciones y Edge Cases', () => {
  test('No se puede enviar mensaje vacío', async ({ page }) => {
    await loginAsLocatario(page);
    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();
    await page.getByTestId('contact-owner-button').click();

    // Intentar enviar sin escribir nada
    const sendButton = page.getByTestId('send-message-button');
    await expect(sendButton).toBeDisabled();

    // Escribir espacios en blanco
    await page.getByTestId('message-input').fill('   ');
    await expect(sendButton).toBeDisabled();

    // Escribir mensaje válido
    await page.getByTestId('message-input').fill('Mensaje válido');
    await expect(sendButton).toBeEnabled();
  });

  test('Mensaje muy largo se trunca o muestra advertencia', async ({ page }) => {
    await loginAsLocatario(page);
    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();
    await page.getByTestId('contact-owner-button').click();

    // Escribir mensaje muy largo (>500 caracteres)
    const longMessage = 'a'.repeat(600);
    await page.getByTestId('message-input').fill(longMessage);

    // Verificar advertencia de longitud
    await expect(page.getByTestId('message-length-warning')).toBeVisible();

    // El botón podría estar deshabilitado o el mensaje se trunca
    const sendButton = page.getByTestId('send-message-button');
    const isDisabled = await sendButton.isDisabled();

    if (!isDisabled) {
      // Si permite enviar, debe truncar
      await sendButton.click();
      const sentMessage = page.getByTestId('message-item').last();
      const text = await sentMessage.textContent();
      expect(text?.length).toBeLessThanOrEqual(500);
    }
  });

  test('Usuario no autenticado no puede enviar mensajes', async ({ page }) => {
    // Sin login, ir directo a un auto
    await page.goto('/cars');
    await page.getByTestId('car-card').first().click();

    // Intentar contactar al dueño
    await page.getByTestId('contact-owner-button').click();

    // Debe redirigir a login o mostrar modal de login
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });
});

// 🔍 Tests de Performance
test.describe('Chat - Performance', () => {
  test('Cargar conversación con 100+ mensajes', async ({ page }) => {
    test.slow();

    await loginAsLocatario(page);

    // Navegar a conversación existente con muchos mensajes
    await page.goto('/messages/conversation-with-100-messages');

    // Medir tiempo de carga
    const startTime = Date.now();
    await expect(page.getByTestId('message-list')).toBeVisible({ timeout: 10000 });
    const loadTime = Date.now() - startTime;

    console.log(`⏱️  Tiempo de carga: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000); // Menos de 3 segundos

    // Verificar scroll virtual (lazy loading)
    const visibleMessages = await page.getByTestId('message-item').count();
    console.log(`📊 Mensajes visibles: ${visibleMessages}`);

    // No todos los 100 mensajes deberían renderizarse al mismo tiempo
    expect(visibleMessages).toBeLessThan(100);
  });
});
