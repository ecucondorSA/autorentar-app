import { test, expect } from '@playwright/test';

test.describe('Login Flow - Demo Test', () => {
  test('usuario intenta hacer login', async ({ page }) => {
    console.log('🎬 Iniciando test de login...');
    
    // 1. Navegar a la página principal
    await page.goto('/');
    console.log('✅ Página principal cargada');
    
    // 2. Esperar un momento para que se vea bien en el video
    await page.waitForTimeout(1000);
    
    // 3. Buscar un botón de login que NO existe (esto fallará)
    console.log('🔍 Buscando botón de login...');
    const loginButton = page.locator('[data-testid="login-button"]');
    
    // 4. Intentar que el botón sea visible (fallará porque no existe)
    await expect(loginButton).toBeVisible({ timeout: 5000 });
    console.log('❌ Este mensaje no se verá porque el test falló antes');
    
    // 5. Intentar hacer click (nunca llegará aquí)
    await loginButton.click();
    
    // 6. Buscar formulario de login
    const emailInput = page.locator('[data-testid="email-input"]');
    await expect(emailInput).toBeVisible();
    
    // 7. Llenar datos (nunca llegará aquí)
    await emailInput.fill('test@autorentar.com');
    await page.locator('[data-testid="password-input"]').fill('password123');
    
    // 8. Submit
    await page.locator('[data-testid="submit-login"]').click();
    
    // 9. Verificar que se redirige al dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('formulario de login muestra errores de validación', async ({ page }) => {
    console.log('🎬 Test de validación de formulario...');
    
    await page.goto('/login');
    
    // Buscar el formulario (fallará porque /login no existe)
    const form = page.locator('form[data-testid="login-form"]');
    await expect(form).toBeVisible({ timeout: 5000 });
    
    // Intentar submit sin llenar datos
    await page.locator('[data-testid="submit-login"]').click();
    
    // Verificar mensajes de error
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Email requerido');
    await expect(page.locator('[data-testid="password-error"]')).toContainText('Password requerido');
  });

  test('usuario navega por la aplicación', async ({ page }) => {
    console.log('🎬 Test de navegación...');
    
    // Este test será más interesante visualmente
    await page.goto('/');
    
    // Esperar un poco para el video
    await page.waitForTimeout(2000);
    
    // Intentar navegar a diferentes secciones
    console.log('Buscando menú de navegación...');
    
    // Buscar links que no existen
    const aboutLink = page.locator('a:has-text("About")');
    await expect(aboutLink).toBeVisible({ timeout: 3000 });
    
    await aboutLink.click();
    await page.waitForTimeout(1000);
    
    // Intentar buscar un auto
    const searchButton = page.locator('[data-testid="search-button"]');
    await expect(searchButton).toBeVisible({ timeout: 3000 });
  });
});
