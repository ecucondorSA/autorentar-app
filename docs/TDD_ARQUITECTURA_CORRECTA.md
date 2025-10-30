# 🧪 Arquitectura TDD Correcta - AutoRentar Frontend

**Fecha**: 2025-10-30
**Objetivo**: Generar componentes siguiendo el flujo arquitectónico correcto
**Principio**: Database → Types → SDK → Componentes → UI usuario

---

## 🎯 Filosofía del Enfoque

### ❌ Enfoque Tradicional (INCORRECTO):
```typescript
// Tests con mocks artificiales desconectados del backend
describe('CarListComponent', () => {
  const mockCars = [
    { id: 1, name: 'Toyota' },  // ❌ No valida contra schema real
    { id: 2, name: 'Honda' }     // ❌ No usa tipos reales
  ]

  it('should display cars', () => {
    component.cars = mockCars  // ❌ No garantiza compatibilidad con backend
  })
})
```

**Problemas**:
- Desconexión entre frontend y backend
- Schema changes no detectados
- Tests pasan pero app falla en runtime
- Duplicación de tipos (mock types vs real types)

---

### ✅ Enfoque Arquitectónico (CORRECTO):
```typescript
// Tests que siguen la cadena arquitectónica completa
import { CarDTO, CarDTOSchema, parseCar } from '@/types'  // ← Types from DB
import { carSDK } from '@/lib/sdk/car.sdk'                 // ← SDK layer

describe('CarListComponent', () => {
  // ✅ Test data validated against real Zod schema
  const testCar: CarDTO = CarDTOSchema.parse({
    id: '550e8400-e29b-41d4-a716-446655440000',
    owner_id: '660e8400-e29b-41d4-a716-446655440001',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2020,
    photo_main_url: 'https://...',
    location_city: 'Buenos Aires',
    location_country: 'Argentina',
    price_per_day_cents: 5000,
    status: 'active',
    transmission: 'automatic',
    fuel_type: 'gasoline',
    seats: 5,
    doors: 4,
    rating_avg: 4.5,
    rating_count: 12,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  })

  it('should display cars with correct schema', () => {
    // ✅ Si CarDTO cambia, este test falla inmediatamente
    component.cars = [testCar]
    expect(component.cars[0].brand).toBe('Toyota')
  })

  it('should integrate with SDK correctly', async () => {
    // ✅ Puedes mockear el SDK pero usando tipos reales
    spyOn(carSDK, 'search').and.returnValue(Promise.resolve({
      data: [testCar],
      count: 1,
      page: 1,
      pageSize: 20
    }))

    await component.loadCars()
    expect(component.cars[0].brand).toBe('Toyota')
  })
})
```

**Ventajas**:
- ✅ Validación contra schema real de Zod
- ✅ Type safety completa (TypeScript + Zod)
- ✅ Schema changes detectados en tests
- ✅ Compatibilidad garantizada con backend
- ✅ Mismos tipos en toda la app

---

## 🏗️ Capas de la Arquitectura

### 1️⃣ Database Layer (✅ 100% COMPLETO)

**Estado Actual**:
```
📊 PostgreSQL Production Database
├── 66 tablas completamente configuradas
├── 39 bookings reales en producción
├── 14 cars activos
├── 32 usuarios registrados
├── RLS policies activas (20+ policies)
├── 50+ custom functions (SQL)
├── 26 custom triggers
├── PostGIS para geolocation
└── 21 Edge Functions deployed
```

**Schema Real de `cars` table**:
```sql
CREATE TABLE cars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id),
  brand text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  photo_main_url text,
  location_city text,
  location_country text,
  price_per_day_cents integer NOT NULL,
  status car_status NOT NULL DEFAULT 'draft',
  transmission transmission_type NOT NULL,
  fuel_type fuel_type NOT NULL,
  seats integer NOT NULL,
  doors integer,                    -- ✅ Nullable
  rating_avg numeric(3,2),          -- ✅ Nullable
  rating_count integer,             -- ✅ Nullable
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

---

### 2️⃣ Types Layer (✅ 95% COMPLETO)

**Archivo**: `src/types/dto.ts` (435 líneas)

**Zod Schemas Disponibles**:
```typescript
// ✅ Schemas validados con Zod
export const CarDTOSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid(),
  brand: z.string(),
  model: z.string(),
  year: z.number().int().min(1900).max(2100),
  photo_main_url: z.string().nullable(),
  location_city: z.string().nullable(),
  location_country: z.string().nullable(),
  price_per_day_cents: z.number().int().positive(),
  status: z.enum(['draft', 'active', 'inactive', 'suspended']),
  transmission: z.enum(['manual', 'automatic']),
  fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'hybrid']),
  seats: z.number().int().positive(),
  doors: z.number().int().nullable(),           // ✅ Agregado hoy
  rating_avg: z.number().nullable(),            // ✅ Agregado hoy
  rating_count: z.number().int().nullable(),    // ✅ Agregado hoy
  created_at: z.string(),
  updated_at: z.string(),
})

export type CarDTO = z.infer<typeof CarDTOSchema>

// Helper para parsing seguro
export function parseCar(row: unknown): CarDTO {
  return CarDTOSchema.parse(row)
}
```

**Otros DTOs disponibles**:
- ✅ `BookingDTO` - State machine completa
- ✅ `ProfileDTO` - Users + KYC
- ✅ `PaymentDTO` - MercadoPago integration
- ✅ `InsurancePolicyDTO` - Coverage management
- ✅ `WalletDTO` - Balance + transactions
- ✅ `ReviewDTO` - Rating system
- ✅ `MessageDTO` - In-app messaging
- ✅ `NotificationDTO` - Push notifications
- ✅ `DisputeDTO` - Dispute resolution

**Total**: 12 DTOs con validación runtime

---

### 3️⃣ SDK Layer (✅ 95% COMPLETO)

**Archivos**: `src/lib/sdk/*.sdk.ts`

**SDKs Refactorizados con Patrón DTO**:
```typescript
// ✅ CarSDK.ts - 14 métodos
export class CarSDK extends BaseSDK {
  async getById(id: string): Promise<CarDTO> {
    try {
      const { data, error } = await this.supabase
        .from('cars')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {throw toError(error)}
      if (!data) {throw new Error('Car not found')}

      return parseCar(data)  // ✅ Zod validation
    } catch (e) {
      throw toError(e)
    }
  }

  async search(filters: CarSearchFilters): Promise<PaginatedResponse<CarDTO>> {
    // ... implementation
    return {
      data: cars.map(parseCar),  // ✅ Zod validation en todos
      count: total,
      page: filters.page,
      pageSize: filters.pageSize
    }
  }
}

// ✅ Singleton exportado
export const carSDK = new CarSDK(supabase)
```

**SDKs disponibles**:
1. ✅ `BaseSDK` - Foundation con type guards
2. ✅ `CarSDK` - 14 métodos (search, getById, create, update, etc.)
3. ✅ `BookingSDK` - 2 métodos refactorizados
4. ✅ `ProfileSDK` - 8 métodos refactorizados
5. ✅ `PaymentSDK` - 6 métodos refactorizados
6. ✅ `InsuranceSDK` - Error handling mejorado
7. ✅ `WalletSDK` - Error handling mejorado
8. ✅ `ReviewSDK` - Error handling mejorado
9. ✅ `PricingSDK` - Bug fix + error handling

**Total**: 9 SDKs, 50+ métodos implementados

---

### 4️⃣ Services Layer (✅ 95% COMPLETO)

**Archivos**: `src/services/*.service.ts` (2,101 líneas totales)

**Services con Business Logic**:
```typescript
// ✅ BookingService.ts (506 líneas, 8 métodos)
export class BookingService {
  constructor(
    private readonly bookingSDK: BookingSDK,
    private readonly carSDK: CarSDK,
    private readonly paymentSDK: PaymentSDK,
    private readonly walletSDK: WalletSDK
  ) {}

  async createBooking(input: CreateBookingInput): Promise<BookingDTO> {
    // Business logic: orquesta múltiples SDKs
    // 1. Validate car availability
    // 2. Calculate pricing
    // 3. Create booking
    // 4. Hold funds in wallet
    return bookingDTO
  }
}

// ✅ Singleton
export const bookingService = new BookingService(
  bookingSDK,
  carSDK,
  paymentSDK,
  walletSDK
)
```

**Services disponibles**:
1. ✅ `BookingService` - 8 métodos (create, confirm, cancel, start, complete)
2. ✅ `PaymentService` - 4 métodos (process, refund, split, webhook)
3. ✅ `WalletService` - 6 métodos (credit, debit, hold, release, freeze)
4. ✅ `InsuranceService` - 4 métodos (create, submit claim, approve, reject)
5. ✅ `ProfileService` - 5 métodos (register, KYC submit/approve, become owner)
6. ✅ `CarService` - 3 métodos (publish, unpublish, getWithStats)

**Total**: 6 services, 40 métodos implementados

---

### 5️⃣ Components Layer (⚠️ 8% - BLOQUEANTE)

**Estado Actual**:
- ✅ `LoginComponent` (203 líneas, 19 unit tests)
- ✅ `DashboardComponent` (placeholder básico)
- ❌ `CarListComponent` - **PENDIENTE**
- ❌ `CarDetailComponent` - **PENDIENTE**
- ❌ `SearchBarComponent` - **PENDIENTE**
- ❌ `HeaderComponent` - **PENDIENTE**
- ❌ `FooterComponent` - **PENDIENTE**

---

### 6️⃣ UI Layer (⚠️ 8% - BLOQUEANTE)

**Estado Actual**:
- ✅ Ionic 8 instalado (875 packages)
- ✅ Capacitor 7 configurado
- ✅ Rutas básicas (/login, /dashboard, /)
- ✅ Estilos globales Ionic + variables personalizadas
- ❌ Páginas completas - **PENDIENTE**

---

## 🧪 Estrategia TDD por Componente

### Paso 1️⃣: Car List Component (TDD Completo)

#### A. Definir los Tests PRIMERO (RED Phase)

**Archivo**: `src/app/features/cars/car-list/car-list.component.spec.ts`

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideIonicAngular } from '@ionic/angular/standalone'

// ✅ STEP 1: Importar TYPES reales desde la capa de tipos
import { CarDTO, CarDTOSchema, PaginatedResponse } from '@/types'

// ✅ STEP 2: Importar SDK real (para mockear con tipos correctos)
import { carSDK, CarSDK } from '@/lib/sdk/car.sdk'

// ✅ STEP 3: Importar el componente a testear
import { CarListComponent } from './car-list.component'

describe('CarListComponent (TDD)', () => {
  let component: CarListComponent
  let fixture: ComponentFixture<CarListComponent>
  let compiled: HTMLElement

  // ✅ STEP 4: Crear test data usando el schema real de Zod
  const testCar1: CarDTO = CarDTOSchema.parse({
    id: '550e8400-e29b-41d4-a716-446655440000',
    owner_id: '660e8400-e29b-41d4-a716-446655440001',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2020,
    photo_main_url: 'https://example.com/toyota.jpg',
    location_city: 'Buenos Aires',
    location_country: 'Argentina',
    price_per_day_cents: 5000,
    status: 'active',
    transmission: 'automatic',
    fuel_type: 'gasoline',
    seats: 5,
    doors: 4,
    rating_avg: 4.5,
    rating_count: 12,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  })

  const testCar2: CarDTO = CarDTOSchema.parse({
    id: '770e8400-e29b-41d4-a716-446655440002',
    owner_id: '660e8400-e29b-41d4-a716-446655440001',
    brand: 'Honda',
    model: 'Civic',
    year: 2021,
    photo_main_url: 'https://example.com/honda.jpg',
    location_city: 'Córdoba',
    location_country: 'Argentina',
    price_per_day_cents: 4500,
    status: 'active',
    transmission: 'manual',
    fuel_type: 'gasoline',
    seats: 5,
    doors: 4,
    rating_avg: 4.8,
    rating_count: 25,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  })

  const mockPaginatedResponse: PaginatedResponse<CarDTO> = {
    data: [testCar1, testCar2],
    count: 2,
    page: 1,
    pageSize: 20
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarListComponent],
      providers: [
        provideHttpClient(),
        provideIonicAngular(),
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(CarListComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
  })

  // ════════════════════════════════════════════
  // TEST SUITE 1: Component Creation
  // ════════════════════════════════════════════

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  // ════════════════════════════════════════════
  // TEST SUITE 2: Initial State
  // ════════════════════════════════════════════

  it('should initialize with empty cars array', () => {
    expect(component.cars()).toEqual([])
  })

  it('should initialize with loading = false', () => {
    expect(component.loading()).toBe(false)
  })

  it('should have searchFilters signal initialized', () => {
    const filters = component.searchFilters()
    expect(filters).toBeDefined()
    expect(filters.status).toBe('active')
  })

  // ════════════════════════════════════════════
  // TEST SUITE 3: Template Structure
  // ════════════════════════════════════════════

  it('should have ion-content with data-testid="car-list-content"', () => {
    fixture.detectChanges()
    const content = compiled.querySelector('ion-content[data-testid="car-list-content"]')
    expect(content).toBeTruthy()
  })

  it('should display loading spinner when loading = true', () => {
    component.loading.set(true)
    fixture.detectChanges()

    const spinner = compiled.querySelector('ion-spinner[data-testid="loading-spinner"]')
    expect(spinner).toBeTruthy()
  })

  it('should NOT display loading spinner when loading = false', () => {
    component.loading.set(false)
    fixture.detectChanges()

    const spinner = compiled.querySelector('ion-spinner[data-testid="loading-spinner"]')
    expect(spinner).toBeNull()
  })

  // ════════════════════════════════════════════
  // TEST SUITE 4: Car Cards Display
  // ════════════════════════════════════════════

  it('should display 2 car cards when cars signal has 2 items', () => {
    component.cars.set([testCar1, testCar2])
    fixture.detectChanges()

    const cards = compiled.querySelectorAll('ion-card[data-testid="car-card"]')
    expect(cards.length).toBe(2)
  })

  it('should display car brand and model correctly', () => {
    component.cars.set([testCar1])
    fixture.detectChanges()

    const title = compiled.querySelector('[data-testid="car-title"]')
    expect(title?.textContent?.trim()).toBe('Toyota Corolla')
  })

  it('should display car price correctly (formatted)', () => {
    component.cars.set([testCar1])
    fixture.detectChanges()

    const price = compiled.querySelector('[data-testid="car-price"]')
    // price_per_day_cents = 5000 → $50.00/día
    expect(price?.textContent?.trim()).toBe('$50.00/día')
  })

  it('should display car location correctly', () => {
    component.cars.set([testCar1])
    fixture.detectChanges()

    const location = compiled.querySelector('[data-testid="car-location"]')
    expect(location?.textContent?.trim()).toContain('Buenos Aires')
  })

  it('should display car rating correctly', () => {
    component.cars.set([testCar1])
    fixture.detectChanges()

    const rating = compiled.querySelector('[data-testid="car-rating"]')
    expect(rating?.textContent?.trim()).toContain('4.5')
  })

  it('should display car photo', () => {
    component.cars.set([testCar1])
    fixture.detectChanges()

    const img = compiled.querySelector('img[data-testid="car-photo"]') as HTMLImageElement
    expect(img).toBeTruthy()
    expect(img.src).toContain('toyota.jpg')
  })

  // ════════════════════════════════════════════
  // TEST SUITE 5: SDK Integration (con mock)
  // ════════════════════════════════════════════

  it('should call carSDK.search() on ngOnInit with correct filters', async () => {
    // ✅ Mock del SDK usando tipos reales
    const searchSpy = spyOn(carSDK, 'search').and.returnValue(
      Promise.resolve(mockPaginatedResponse)
    )

    component.ngOnInit()
    await fixture.whenStable()

    expect(searchSpy).toHaveBeenCalledWith({
      status: 'active',
      radius: 50,
      sortBy: 'price_asc',
      page: 1,
      pageSize: 20
    })
  })

  it('should populate cars signal after successful SDK call', async () => {
    spyOn(carSDK, 'search').and.returnValue(
      Promise.resolve(mockPaginatedResponse)
    )

    component.ngOnInit()
    await fixture.whenStable()

    expect(component.cars().length).toBe(2)
    expect(component.cars()[0].brand).toBe('Toyota')
    expect(component.cars()[1].brand).toBe('Honda')
  })

  it('should set loading = true during SDK call', async () => {
    let resolveFn: (value: PaginatedResponse<CarDTO>) => void
    const searchPromise = new Promise<PaginatedResponse<CarDTO>>((resolve) => {
      resolveFn = resolve
    })
    spyOn(carSDK, 'search').and.returnValue(searchPromise)

    component.loadCars()
    expect(component.loading()).toBe(true)

    resolveFn!(mockPaginatedResponse)
    await fixture.whenStable()
    expect(component.loading()).toBe(false)
  })

  // ════════════════════════════════════════════
  // TEST SUITE 6: Error Handling
  // ════════════════════════════════════════════

  it('should handle SDK errors gracefully', async () => {
    spyOn(carSDK, 'search').and.returnValue(
      Promise.reject(new Error('Network error'))
    )
    spyOn(console, 'error') // Suppress console output

    await component.loadCars()

    expect(component.loading()).toBe(false)
    expect(component.cars()).toEqual([])
  })

  // ════════════════════════════════════════════
  // TEST SUITE 7: User Interactions
  // ════════════════════════════════════════════

  it('should navigate to car detail when card is clicked', () => {
    component.cars.set([testCar1])
    fixture.detectChanges()

    const card = compiled.querySelector('ion-card[data-testid="car-card"]') as HTMLElement
    const routerSpy = spyOn(component['router'], 'navigate')

    card.click()

    expect(routerSpy).toHaveBeenCalledWith(['/cars', testCar1.id])
  })
})
```

---

#### B. Implementar el Componente (GREEN Phase)

**Archivo**: `src/app/features/cars/car-list/car-list.component.ts`

```typescript
import { Component, OnInit, inject, signal } from '@angular/core'
import { Router } from '@angular/router'
import { CommonModule } from '@angular/common'
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonImg,
} from '@ionic/angular/standalone'

// ✅ STEP 1: Importar TYPES reales
import { CarDTO, CarSearchFilters } from '@/types'

// ✅ STEP 2: Importar SDK real
import { carSDK } from '@/lib/sdk/car.sdk'

@Component({
  selector: 'app-car-list',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSpinner,
    IonImg,
  ],
  template: `
    <ion-content class="ion-padding" data-testid="car-list-content">
      @if (loading()) {
        <div class="loading-container">
          <ion-spinner data-testid="loading-spinner"></ion-spinner>
        </div>
      }

      @if (!loading() && cars().length === 0) {
        <div class="empty-state">
          <p>No se encontraron autos disponibles</p>
        </div>
      }

      <div class="car-grid">
        @for (car of cars(); track car.id) {
          <ion-card
            data-testid="car-card"
            (click)="onCarClick(car.id)"
            button
          >
            @if (car.photo_main_url) {
              <img
                [src]="car.photo_main_url"
                [alt]="car.brand + ' ' + car.model"
                data-testid="car-photo"
              />
            }

            <ion-card-header>
              <ion-card-title data-testid="car-title">
                {{ car.brand }} {{ car.model }}
              </ion-card-title>
            </ion-card-header>

            <ion-card-content>
              <p data-testid="car-price">
                {{ formatPrice(car.price_per_day_cents) }}/día
              </p>

              <p data-testid="car-location">
                📍 {{ car.location_city }}, {{ car.location_country }}
              </p>

              @if (car.rating_avg) {
                <p data-testid="car-rating">
                  ⭐ {{ car.rating_avg }} ({{ car.rating_count }} reviews)
                </p>
              }

              <p class="car-specs">
                🚗 {{ car.transmission === 'automatic' ? 'Automático' : 'Manual' }}
                • ⛽ {{ formatFuelType(car.fuel_type) }}
                • 👥 {{ car.seats }} asientos
              </p>
            </ion-card-content>
          </ion-card>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: var(--ion-color-medium);
    }

    .car-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    ion-card {
      margin: 0;
      cursor: pointer;
      transition: transform 0.2s;
    }

    ion-card:hover {
      transform: translateY(-4px);
    }

    ion-card img {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }

    .car-specs {
      font-size: 0.875rem;
      color: var(--ion-color-medium);
      margin-top: 0.5rem;
    }

    @media (max-width: 768px) {
      .car-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CarListComponent implements OnInit {
  private readonly router = inject(Router)

  // ✅ Signals para state management
  readonly cars = signal<CarDTO[]>([])
  readonly loading = signal(false)
  readonly searchFilters = signal<CarSearchFilters>({
    status: 'active',
    radius: 50,
    sortBy: 'price_asc',
    page: 1,
    pageSize: 20
  })

  ngOnInit(): void {
    this.loadCars()
  }

  async loadCars(): Promise<void> {
    this.loading.set(true)
    try {
      // ✅ Llamada al SDK real (que retorna DTOs validados)
      const response = await carSDK.search(this.searchFilters())

      // ✅ Los datos ya vienen validados con Zod desde el SDK
      this.cars.set(response.data)
    } catch (error) {
      console.error('Error loading cars:', error)
      this.cars.set([])
      // TODO: Show error toast to user
    } finally {
      this.loading.set(false)
    }
  }

  onCarClick(carId: string): void {
    this.router.navigate(['/cars', carId])
  }

  // Helper methods
  formatPrice(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`
  }

  formatFuelType(fuel: string): string {
    const map: Record<string, string> = {
      gasoline: 'Nafta',
      diesel: 'Gasoil',
      electric: 'Eléctrico',
      hybrid: 'Híbrido'
    }
    return map[fuel] || fuel
  }
}
```

---

#### C. Ejecutar Tests (Verificar RED → GREEN)

```bash
# Run specific test file
npm run test -- --include="**/car-list.component.spec.ts"

# Expected output:
# ✅ 19 tests passing
# ✅ 0 errors
# ✅ Coverage: 100%
```

---

#### D. Refactor (REFACTOR Phase)

1. Extraer `formatPrice()` a un pipe compartido
2. Extraer `formatFuelType()` a un service de traducción
3. Extraer car card a un sub-componente reutilizable
4. Agregar skeleton loaders para mejor UX

---

## 📋 Componentes Pendientes (Mismo Flujo TDD)

### 2️⃣ CarDetailComponent
**Tests primero** → Implementación → Refactor

**Tests clave**:
- Display car details correctamente
- Load car con `carSDK.getById()`
- Display owner info
- Calendar de disponibilidad
- Botón de reserva

---

### 3️⃣ SearchBarComponent
**Tests primero** → Implementación → Refactor

**Tests clave**:
- Formulario de búsqueda con filtros
- Validación de inputs
- Emit search event
- Integration con `searchService`

---

### 4️⃣ HeaderComponent
**Tests primero** → Implementación → Refactor

**Tests clave**:
- Navigation menu
- User avatar/menu
- Responsive mobile menu
- Integration con `AuthService`

---

### 5️⃣ BookingComponent
**Tests primero** → Implementación → Refactor

**Tests clave**:
- Date selection
- Price calculation
- Integration con `bookingService`
- Payment flow

---

## 🎯 Ventajas del Enfoque Arquitectónico

### ✅ Type Safety Completa
```typescript
// Si cambias CarDTO en el futuro:
export const CarDTOSchema = z.object({
  // ... campos existentes
  engine_size: z.number().positive(),  // ✅ NUEVO CAMPO
})

// Todos los tests fallarán inmediatamente:
// ❌ Error: testCar1 is missing 'engine_size'
// ❌ Error: CarListComponent template needs update

// = Detección temprana de breaking changes
```

---

### ✅ Validación Runtime Automática
```typescript
// El SDK ya valida con Zod:
const response = await carSDK.search(filters)
// response.data es CarDTO[] validado

// Si la DB retorna datos mal formados:
// ❌ Zod lanza error inmediatamente
// ❌ El componente NUNCA recibe datos inválidos
```

---

### ✅ Refactoring Seguro
```typescript
// Cambiar estructura de la respuesta:
// ANTES:
async search(): Promise<CarDTO[]> { ... }

// DESPUÉS:
async search(): Promise<PaginatedResponse<CarDTO>> { ... }

// TypeScript + Tests detectan TODOS los usos:
// ❌ component.cars = await carSDK.search()  // Type error
// ✅ component.cars = (await carSDK.search()).data  // Correcto
```

---

### ✅ Mocks Realistas
```typescript
// Los mocks siguen el mismo schema que producción:
const testCar = CarDTOSchema.parse({...})  // ✅ Validado

// VS enfoque tradicional:
const testCar = { id: 1, name: 'Toyota' }  // ❌ No validado
```

---

## 📊 Roadmap Actualizado

### Semana 11-12: Core Components con TDD ⚠️

**Día 1-2: CarListComponent**
- ✅ Escribir 19 tests (RED)
- ✅ Implementar componente (GREEN)
- ✅ Refactor (extraer pipes/services)
- ✅ Ejecutar tests E2E

**Día 3-4: CarDetailComponent**
- ✅ Escribir 15 tests
- ✅ Implementar
- ✅ Refactor
- ✅ E2E tests

**Día 5-6: SearchBarComponent**
- ✅ Escribir 12 tests
- ✅ Implementar
- ✅ Refactor
- ✅ E2E tests

**Día 7: Header + Footer**
- ✅ Escribir 10 tests (Header)
- ✅ Escribir 5 tests (Footer)
- ✅ Implementar ambos
- ✅ E2E tests

**Día 8-10: BookingComponent**
- ✅ Escribir 20 tests
- ✅ Implementar booking flow
- ✅ Integration con PaymentService
- ✅ E2E tests completos

---

## 🚀 Siguiente Acción Inmediata

**¿Qué hacer ahora?**

1. ✅ Backend compilando sin errores (HECHO)
2. ✅ Types + SDKs listos (HECHO)
3. ⏳ **SIGUIENTE**: Implementar `CarListComponent` con TDD

**Comando para empezar**:
```bash
# Crear archivos
mkdir -p src/app/features/cars/car-list
touch src/app/features/cars/car-list/car-list.component.ts
touch src/app/features/cars/car-list/car-list.component.spec.ts

# Copiar los tests del documento
# Ejecutar tests (deben fallar - RED phase)
npm run test -- --include="**/car-list.component.spec.ts"

# Implementar componente
# Ejecutar tests (deben pasar - GREEN phase)

# Refactor y optimizar
```

---

## 📚 Referencias

- **Database Schema**: PostgreSQL en aws-1-us-east-2.pooler.supabase.com
- **Types**: `/src/types/dto.ts` (435 líneas)
- **SDKs**: `/src/lib/sdk/*.sdk.ts` (9 SDKs)
- **Services**: `/src/services/*.service.ts` (6 services)
- **Ionic Docs**: https://ionicframework.com/docs/angular
- **Zod Docs**: https://zod.dev

---

**Conclusión**: Este enfoque arquitectónico garantiza que cada componente esté **correctamente integrado con el backend desde el primer momento**, eliminando sorpresas en runtime y manteniendo type safety completa en toda la aplicación.
