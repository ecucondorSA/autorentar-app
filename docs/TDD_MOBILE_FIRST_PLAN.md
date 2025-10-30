# 🚀 AutoRentar - Plan TDD Mobile-First

**Fecha**: 2025-10-30
**Proyecto**: autorentar-app (Angular 20)
**Enfoque**: Test-Driven Development + Mobile-First
**Estado Backend**: 95% completo ✅
**Estado Frontend**: 8% (bloqueante único)

---

## 📊 Análisis del Proyecto

### Estado Actual

```
╔═══════════════════════════════════════════════════════╗
║  PROYECTO: AutoRentar (autorentar-app)                ║
║  Ubicación: /home/edu/Documentos/AUTORENTAR/...      ║
║  Angular: 20.3.0 (standalone components)              ║
║  TypeScript: 5.9.2 (strict mode)                      ║
║  Testing: Playwright 1.56.1                           ║
║  State: Signals (Angular 20)                          ║
╚═══════════════════════════════════════════════════════╝

Backend:    95% ✅ (66 tablas, 21 Edge Functions, SDKs)
Database:   92% ✅ (39 bookings, 14 cars, 32 users)
Payments:   90% ✅ (MercadoPago OAuth integrado)
Frontend:    8% ❌ (0 componentes, solo app root)
Tests E2E:   3 archivos (8 tests básicos que FALLAN)
```

### Estructura de Archivos

```
src/
├── app/                     # Frontend (VACÍO - 0 componentes)
│   ├── app.ts              # ✅ Root component con signals
│   ├── app.config.ts       # ✅ App configuration
│   ├── app.routes.ts       # ⚠️ VACÍO (sin rutas)
│   ├── app.html            # ✅ Template con router-outlet
│   └── app.scss            # ✅ Styles base
│
├── lib/                     # ✅ Backend SDKs (CarSDK, BookingSDK, etc.)
├── services/                # ✅ Business logic services
├── types/                   # ✅ TypeScript types + DTOs
└── utils/                   # ✅ Helper functions

e2e/                         # Tests E2E
├── app.spec.ts             # ✅ 3 tests básicos (homepage)
├── login-demo.spec.ts      # ❌ 3 tests que FALLAN (login no existe)
└── accessibility.spec.ts   # ✅ 2 tests (HTML, responsive)
```

---

## 🎯 Tests E2E Existentes

### Test 1: `app.spec.ts` ✅ (PASAN)
```typescript
✅ should load the homepage
✅ should display the main content
✅ should navigate correctly
```

### Test 2: `login-demo.spec.ts` ❌ (FALLAN - Esperan componentes)
```typescript
❌ usuario intenta hacer login
   - Busca: [data-testid="login-button"]
   - Busca: [data-testid="email-input"]
   - Busca: [data-testid="password-input"]
   - Busca: [data-testid="submit-login"]
   - Espera ruta: /login
   - Espera ruta: /dashboard

❌ formulario de login muestra errores de validación
   - Busca: form[data-testid="login-form"]
   - Busca: [data-testid="email-error"]
   - Busca: [data-testid="password-error"]

❌ usuario navega por la aplicación
   - Busca: a:has-text("About")
   - Busca: [data-testid="search-button"]
```

### Test 3: `accessibility.spec.ts` ✅ (PASAN)
```typescript
✅ should have proper HTML structure
✅ should be responsive (mobile 375x667 + desktop 1920x1080)
```

**Total**: 8 tests, 5 pasan, 3 fallan (esperan componentes que no existen)

---

## 📱 Estrategia Mobile-First (Angular Standard)

### Approach: Progressive Enhancement

**NO usamos Ionic** (proyecto es Angular web standard), pero aplicamos principios mobile-first:

1. **Diseño Mobile First**: CSS mobile como base, desktop con media queries
2. **Responsive Components**: Todos los componentes adaptativos
3. **Touch-Friendly**: Botones grandes (min 44x44px), espaciado amplio
4. **Performance**: Lazy loading, minimal bundle size
5. **PWA-Ready**: Service workers, offline support (fase 2)

### Breakpoints Estándar

```scss
// mobile-first approach
$breakpoint-tablet: 768px;
$breakpoint-desktop: 1024px;
$breakpoint-wide: 1440px;

// Base styles para mobile (<768px)
.component {
  /* mobile styles */
}

// Tablet y superiores
@media (min-width: $breakpoint-tablet) {
  .component {
    /* tablet styles */
  }
}

// Desktop
@media (min-width: $breakpoint-desktop) {
  .component {
    /* desktop styles */
  }
}
```

---

## 🔴 Plan de Implementación TDD

### Fase 1: Auth Flow (Semana 1) - CRÍTICO

#### Componente 1.1: Login Page
**Prioridad**: 🔴 P0 (bloquea 3 tests)

**Test E2E esperado** (`login-demo.spec.ts`):
- Ruta `/login` debe existir
- Form con `data-testid="login-form"`
- Input `data-testid="email-input"`
- Input `data-testid="password-input"`
- Button `data-testid="submit-login"`
- Errors: `data-testid="email-error"` y `data-testid="password-error"`

**Unit Tests a crear** (`login.component.spec.ts`):
```typescript
describe('LoginComponent', () => {
  it('should create', () => { /* ... */ });

  it('should have email input with required validation', () => {
    // Red → Green → Refactor
  });

  it('should have password input with minLength(6)', () => {
    // Red → Green → Refactor
  });

  it('should show error when email is invalid', () => {
    // Red → Green → Refactor
  });

  it('should disable submit button when form invalid', () => {
    // Red → Green → Refactor
  });

  it('should call authService.login() on submit', () => {
    // Red → Green → Refactor
  });

  it('should navigate to /dashboard after successful login', () => {
    // Red → Green → Refactor
  });

  it('should be responsive (mobile + desktop)', () => {
    // Red → Green → Refactor
  });
});
```

**Implementación**:
```typescript
// src/app/features/auth/login/login.component.ts
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        data-testid="login-form"
        class="login-form"
      >
        <h1>Iniciar Sesión</h1>

        <!-- Email -->
        <div class="form-group">
          <label for="email">Email *</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            data-testid="email-input"
            placeholder="tu@email.com"
            [class.error]="form.get('email')?.invalid && form.get('email')?.touched"
          />
          @if (form.get('email')?.invalid && form.get('email')?.touched) {
            <span class="error-message" data-testid="email-error">
              @if (form.get('email')?.errors?.['required']) {
                Email requerido
              }
              @if (form.get('email')?.errors?.['email']) {
                Formato de email inválido
              }
            </span>
          }
        </div>

        <!-- Password -->
        <div class="form-group">
          <label for="password">Contraseña *</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            data-testid="password-input"
            placeholder="••••••••"
            [class.error]="form.get('password')?.invalid && form.get('password')?.touched"
          />
          @if (form.get('password')?.invalid && form.get('password')?.touched) {
            <span class="error-message" data-testid="password-error">
              Password requerido (mínimo 6 caracteres)
            </span>
          }
        </div>

        <!-- Submit -->
        <button
          type="submit"
          data-testid="submit-login"
          [disabled]="form.invalid || submitting()"
          class="btn-primary"
        >
          {{ submitting() ? 'Ingresando...' : 'Ingresar' }}
        </button>

        <!-- Links -->
        <div class="form-footer">
          <a routerLink="/auth/register">Crear cuenta</a>
          <a routerLink="/auth/reset-password">¿Olvidaste tu contraseña?</a>
        </div>
      </form>
    </div>
  `,
  styles: [`
    /* Mobile-first styles */
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: var(--color-background);
    }

    .login-form {
      width: 100%;
      max-width: 400px;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    h1 {
      font-size: 1.5rem;
      margin-bottom: 1.5rem;
      text-align: center;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--color-text-primary);
    }

    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.2s;

      /* Touch-friendly: min 44px height */
      min-height: 44px;
    }

    input:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    input.error {
      border-color: var(--color-error);
    }

    .error-message {
      display: block;
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: var(--color-error);
    }

    .btn-primary {
      width: 100%;
      padding: 0.875rem;
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;

      /* Touch-friendly: min 44px height */
      min-height: 44px;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--color-primary-dark);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .form-footer {
      margin-top: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      text-align: center;
    }

    .form-footer a {
      color: var(--color-primary);
      text-decoration: none;
      font-size: 0.875rem;
    }

    /* Tablet y superiores */
    @media (min-width: 768px) {
      h1 {
        font-size: 2rem;
      }

      .form-footer {
        flex-direction: row;
        justify-content: space-between;
      }
    }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  // TODO: inject AuthService cuando esté implementado

  protected readonly submitting = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    this.submitting.set(true);
    try {
      const { email, password } = this.form.getRawValue();

      // TODO: Implementar AuthService.login()
      console.log('Login attempt:', { email, password });

      // Simular login exitoso por ahora
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to dashboard
      await this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Login error:', error);
      // TODO: Mostrar error al usuario
    } finally {
      this.submitting.set(false);
    }
  }
}
```

**Ruta a agregar** (`app.routes.ts`):
```typescript
import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  }
];
```

**Tiempo estimado**: 2-3 horas (TDD completo + mobile styles)

---

#### Componente 1.2: Header Navigation
**Prioridad**: 🟡 P1

**Test E2E esperado** (`login-demo.spec.ts`):
- Botón "Ingresar" visible en homepage con `data-testid="login-button"`
- Link "About" visible

**Unit Tests a crear** (`header.component.spec.ts`):
```typescript
describe('HeaderComponent', () => {
  it('should display login button when user not authenticated', () => {});
  it('should display user menu when authenticated', () => {});
  it('should be sticky on scroll', () => {});
  it('should toggle mobile menu on hamburger click', () => {});
  it('should be responsive', () => {});
});
```

**Implementación**:
```typescript
// src/app/shared/components/header/header.component.ts
@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="header">
      <div class="container">
        <div class="logo">
          <a routerLink="/">AutoRentar</a>
        </div>

        <nav class="nav-desktop">
          <a routerLink="/about">About</a>
          <a routerLink="/cars">Autos</a>
          <button
            data-testid="login-button"
            (click)="goToLogin()"
            class="btn-primary"
          >
            Ingresar
          </button>
        </nav>

        <!-- Mobile menu hamburger -->
        <button class="hamburger" (click)="toggleMenu()">
          ☰
        </button>
      </div>

      <!-- Mobile menu -->
      @if (menuOpen()) {
        <div class="nav-mobile">
          <a routerLink="/about" (click)="closeMenu()">About</a>
          <a routerLink="/cars" (click)="closeMenu()">Autos</a>
          <button
            data-testid="login-button"
            (click)="goToLogin()"
            class="btn-primary"
          >
            Ingresar
          </button>
        </div>
      }
    </header>
  `,
  styles: [`
    /* Mobile-first header */
    .header {
      position: sticky;
      top: 0;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      z-index: 100;
    }

    .container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .logo a {
      font-size: 1.25rem;
      font-weight: bold;
      color: var(--color-primary);
      text-decoration: none;
    }

    /* Desktop nav hidden on mobile */
    .nav-desktop {
      display: none;
    }

    /* Mobile hamburger */
    .hamburger {
      display: block;
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.5rem;
      /* Touch-friendly */
      min-width: 44px;
      min-height: 44px;
    }

    /* Mobile menu */
    .nav-mobile {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border-top: 1px solid var(--color-border);
    }

    .nav-mobile a,
    .nav-mobile button {
      width: 100%;
      text-align: center;
      padding: 0.75rem;
      /* Touch-friendly */
      min-height: 44px;
    }

    /* Desktop styles */
    @media (min-width: 768px) {
      .hamburger {
        display: none;
      }

      .nav-desktop {
        display: flex;
        align-items: center;
        gap: 1.5rem;
      }

      .nav-mobile {
        display: none;
      }
    }
  `]
})
export class HeaderComponent {
  private readonly router = inject(Router);
  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected goToLogin(): void {
    this.closeMenu();
    void this.router.navigate(['/login']);
  }
}
```

**Tiempo estimado**: 2 horas

---

#### Componente 1.3: Dashboard Page (Placeholder)
**Prioridad**: 🟡 P1

Crear página básica para que el test de login redirija correctamente.

```typescript
// src/app/features/dashboard/dashboard.component.ts
@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="dashboard">
      <h1>Dashboard</h1>
      <p>Bienvenido a AutoRentar</p>
    </div>
  `
})
export class DashboardComponent {}
```

**Ruta**:
```typescript
{
  path: 'dashboard',
  loadComponent: () => import('./features/dashboard/dashboard.component')
    .then(m => m.DashboardComponent)
}
```

**Tiempo estimado**: 30 minutos

---

### Fase 2: Car Listing (Semana 2)

#### Componente 2.1: Search Bar
**Test E2E esperado**: `data-testid="search-button"`

```typescript
// Unit tests
describe('SearchBarComponent', () => {
  it('should have location input', () => {});
  it('should have date range picker', () => {});
  it('should emit search event on submit', () => {});
  it('should be responsive', () => {});
});
```

#### Componente 2.2: Car List Page
```typescript
describe('CarListComponent', () => {
  it('should display loading state', () => {});
  it('should display empty state when no cars', () => {});
  it('should display car cards in grid', () => {});
  it('should be responsive (1 col mobile, 2 cols tablet, 3 cols desktop)', () => {});
});
```

#### Componente 2.3: Car Card
```typescript
describe('CarCardComponent', () => {
  it('should display car image', () => {});
  it('should display car make, model, year', () => {});
  it('should display price per day', () => {});
  it('should be clickable', () => {});
  it('should be touch-friendly (min 44px tap target)', () => {});
});
```

**Tiempo estimado**: 1 semana

---

### Fase 3: Booking Flow (Semana 3-4)

#### Componente 3.1: Car Detail Page
#### Componente 3.2: Booking Form
#### Componente 3.3: Payment Page
#### Componente 3.4: Booking Confirmation

**Tiempo estimado**: 2 semanas

---

## 🎨 Design System Mobile-First

### CSS Variables (Design Tokens)

```scss
// src/styles.scss
:root {
  /* Colors */
  --color-primary: #007bff;
  --color-primary-dark: #0056b3;
  --color-background: #f8f9fa;
  --color-text-primary: #212529;
  --color-text-secondary: #6c757d;
  --color-border: #dee2e6;
  --color-error: #dc3545;
  --color-success: #28a745;

  /* Spacing (mobile-first) */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-base: 16px; /* 16px = 1rem */
  --font-size-sm: 0.875rem; /* 14px */
  --font-size-lg: 1.125rem; /* 18px */
  --font-size-xl: 1.5rem; /* 24px */

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 2px 10px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 25px rgba(0,0,0,0.15);

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
}

/* Base mobile styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  line-height: 1.5;
  color: var(--color-text-primary);
  background: var(--color-background);

  /* Prevent horizontal scroll on mobile */
  overflow-x: hidden;
}

/* Touch-friendly tap targets (WCAG AAA) */
button,
a,
input[type="checkbox"],
input[type="radio"] {
  min-width: 44px;
  min-height: 44px;
}

/* Responsive images */
img {
  max-width: 100%;
  height: auto;
}
```

---

## 🧪 Testing Strategy

### Unit Tests (Jasmine + Karma)
```bash
# Crear test file primero (RED)
ng generate component features/auth/login --skip-tests
touch src/app/features/auth/login/login.component.spec.ts

# Escribir test (debe fallar)
npm run test

# Implementar código (GREEN)
# Editar login.component.ts

# Refactorizar (REFACTOR)
# Mejorar código manteniendo tests verdes
```

### E2E Tests (Playwright)
```bash
# Verificar tests existentes
npm run e2e

# Run en modo UI (debugging)
npm run e2e:ui

# Run en headed mode (ver browser)
npm run e2e:headed
```

### Mobile Testing
```bash
# Playwright mobile viewports
npm run e2e -- --project=mobile-chrome
npm run e2e -- --project=mobile-safari

# Browser dev tools
# Chrome DevTools → Device Toolbar (Cmd+Shift+M)
# Test en: iPhone SE (375x667), iPad (768x1024), Desktop (1920x1080)
```

---

## 📦 Estructura de Carpetas Final

```
src/app/
├── core/                    # Servicios singleton, guards, interceptors
│   ├── guards/
│   │   └── auth.guard.ts
│   ├── interceptors/
│   │   └── auth.interceptor.ts
│   └── services/
│       └── auth.service.ts
│
├── features/                # Feature modules (lazy-loaded)
│   ├── auth/
│   │   ├── login/
│   │   │   ├── login.component.ts
│   │   │   ├── login.component.spec.ts
│   │   │   └── login.component.scss
│   │   ├── register/
│   │   └── reset-password/
│   │
│   ├── cars/
│   │   ├── car-list/
│   │   ├── car-detail/
│   │   └── car-search/
│   │
│   ├── bookings/
│   │   ├── booking-form/
│   │   ├── booking-detail/
│   │   └── my-bookings/
│   │
│   └── dashboard/
│       └── dashboard.component.ts
│
├── shared/                  # Componentes compartidos
│   ├── components/
│   │   ├── header/
│   │   │   ├── header.component.ts
│   │   │   ├── header.component.spec.ts
│   │   │   └── header.component.scss
│   │   ├── footer/
│   │   ├── car-card/
│   │   ├── search-bar/
│   │   └── loading-spinner/
│   │
│   ├── pipes/
│   │   └── currency-format.pipe.ts
│   │
│   └── directives/
│       └── lazy-load-image.directive.ts
│
├── app.ts                   # App root component
├── app.config.ts            # App configuration
└── app.routes.ts            # App routing
```

---

## 🚀 Comandos de Desarrollo

### TDD Workflow
```bash
# 1. RED - Crear test (debe fallar)
npm run test -- --include="**/login.component.spec.ts"

# 2. GREEN - Implementar mínimo para pasar
# Editar componente

# 3. REFACTOR - Mejorar código
# Tests deben seguir pasando

# 4. Verificar E2E
npm run e2e
```

### Development
```bash
# Start dev server
npm run start

# Open in browser
open http://localhost:4200

# Run tests in watch mode
npm run test

# Run E2E in UI mode
npm run e2e:ui
```

### Quality Checks
```bash
# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format:check
npm run format:write

# All checks
npm run validate:all
```

---

## 📊 Métricas de Éxito

### Objetivos Semana 1
- [x] Análisis y plan TDD creado
- [ ] LoginComponent implementado con TDD
- [ ] HeaderComponent implementado
- [ ] 3 tests E2E de login pasando
- [ ] Mobile responsive (375px - 1920px)

### Objetivos Semana 2
- [ ] Car list page con search
- [ ] Car card component
- [ ] Navigation completa
- [ ] 5+ tests E2E adicionales

### Objetivos Semana 3-4
- [ ] Booking flow completo
- [ ] Payment integration UI
- [ ] Dashboard funcional
- [ ] 15+ tests E2E pasando

---

## 🎯 Próximo Paso Inmediato

**ACCIÓN**: Implementar LoginComponent con TDD

1. Crear directorio: `src/app/features/auth/login/`
2. Crear test file: `login.component.spec.ts`
3. Escribir primer test (RED)
4. Implementar código mínimo (GREEN)
5. Refactorizar y mejorar (REFACTOR)
6. Repetir para cada funcionalidad

**Tiempo estimado**: 2-3 horas
**Resultado esperado**: 3 tests E2E de login pasando ✅

---

**Última actualización**: 2025-10-30
**Mobile-First**: ✅ CSS responsive desde mobile
**TDD**: ✅ Red → Green → Refactor
**Framework**: Angular 20 standalone + signals
