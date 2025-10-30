# Frontend Development Guide - AutoRentar

**CRITICAL**: Lee este documento ANTES de crear cualquier componente Angular para evitar errores de tipos.

**Última actualización**: 30 Octubre 2025

---

## 🎯 Objetivo

Este documento te guía paso a paso para crear componentes Angular que integren correctamente con el backend sin errores de tipos.

---

## 📋 Prerrequisitos

Antes de empezar a codear, **SIEMPRE**:

1. ✅ Lee `docs/BACKEND_API_REFERENCE.md` para conocer los tipos disponibles
2. ✅ Verifica los nombres exactos de campos en los DTOs
3. ✅ Usa los Services (no los SDKs directamente)
4. ✅ Valida inputs con los Schemas de Zod

---

## 🏗️ Estructura de Componentes

### Pattern Recomendado

```
src/app/
├── features/           # Feature modules
│   ├── home/
│   │   ├── home.component.ts
│   │   ├── home.component.html
│   │   └── home.component.css
│   ├── cars/
│   │   ├── car-list/
│   │   ├── car-detail/
│   │   └── car-card/
│   ├── bookings/
│   │   ├── booking-create/
│   │   ├── booking-list/
│   │   └── booking-detail/
│   └── auth/
│       ├── login/
│       └── register/
├── shared/             # Shared components
│   ├── header/
│   ├── footer/
│   └── loading/
├── guards/             # Route guards (✅ ya existe)
└── interceptors/       # HTTP interceptors (✅ ya existe)
```

---

## ✅ Template: Component Correcto

### Example: Car List Component

```typescript
/**
 * Car List Component
 * Displays available cars with filters
 */

import { CommonModule } from '@angular/common'
import { Component, OnInit, signal } from '@angular/core'
import { Router } from '@angular/router'

// ✅ Import from backend
import { carSDK } from '@/lib/sdk/car.sdk'
import type { CarDTO } from '@/types/dto'

@Component({
  selector: 'app-car-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="car-list">
      <h1>Available Cars</h1>

      @if (loading()) {
        <p>Loading cars...</p>
      }

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      <div class="cars-grid">
        @for (car of cars(); track car.id) {
          <div class="car-card" (click)="selectCar(car.id)">
            <h3>{{ car.make }} {{ car.model }}</h3>
            <p>{{ car.year }}</p>
            <p class="price">${{ (car.price_per_day_cents / 100).toFixed(2) }}/day</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class CarListComponent implements OnInit {
  // ✅ Use signals for reactive state
  cars = signal<CarDTO[]>([])
  loading = signal(false)
  error = signal<string | null>(null)

  constructor(private router: Router) {}

  async ngOnInit(): Promise<void> {
    await this.loadCars()
  }

  private async loadCars(): Promise<void> {
    this.loading.set(true)
    this.error.set(null)

    try {
      // ✅ Use SDK method
      const availableCars = await carSDK.search({
        status: 'active',
      })

      this.cars.set(availableCars)
    } catch (err) {
      this.error.set('Failed to load cars')
      console.error('Load cars error:', err)
    } finally {
      this.loading.set(false)
    }
  }

  selectCar(carId: string): void {
    void this.router.navigate(['/cars', carId])
  }
}
```

---

## ✅ Template: Form Component Correcto

### Example: Create Booking Component

```typescript
/**
 * Create Booking Component
 * Form to create a new booking
 */

import { CommonModule } from '@angular/common'
import { Component, OnInit, signal } from '@angular/core'
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, ActivatedRoute } from '@angular/router'

// ✅ Import correct types
import { bookingService } from '@/services/booking.service'
import { carSDK } from '@/lib/sdk/car.sdk'
import type { CreateBookingInput } from '@/types' // ✅ Not CreateBookingServiceInput
import type { CarDTO, BookingDTO } from '@/types/dto'

@Component({
  selector: 'app-create-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="create-booking">
      <h1>Book {{ car()?.make }} {{ car()?.model }}</h1>

      <form [formGroup]="bookingForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="start_date">Start Date</label>
          <input
            type="datetime-local"
            id="start_date"
            formControlName="start_date"
            required
          />
        </div>

        <div class="form-group">
          <label for="end_date">End Date</label>
          <input
            type="datetime-local"
            id="end_date"
            formControlName="end_date"
            required
          />
        </div>

        <div class="form-group">
          <label>
            <input type="checkbox" formControlName="extra_gps" />
            Add GPS (+$10/day)
          </label>
        </div>

        <div class="form-group">
          <label for="extra_driver_count">Extra Drivers</label>
          <input
            type="number"
            id="extra_driver_count"
            formControlName="extra_driver_count"
            min="0"
            max="5"
          />
        </div>

        <div class="form-group">
          <label for="insurance">Insurance Level</label>
          <select id="insurance" formControlName="insurance_coverage_level">
            <option value="none">No Insurance</option>
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
          </select>
        </div>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }

        <button type="submit" [disabled]="loading() || !bookingForm.valid">
          {{ loading() ? 'Creating...' : 'Create Booking' }}
        </button>
      </form>
    </div>
  `,
})
export class CreateBookingComponent implements OnInit {
  bookingForm: FormGroup
  car = signal<CarDTO | null>(null)
  loading = signal(false)
  error = signal<string | null>(null)

  private carId: string | null = null

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // ✅ Initialize form with correct fields
    this.bookingForm = this.fb.group({
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      extra_driver_count: [0, [Validators.min(0), Validators.max(5)]],
      extra_child_seat_count: [0, [Validators.min(0), Validators.max(5)]],
      extra_gps: [false],
      insurance_coverage_level: ['none'],
      promo_code: [''],
    })
  }

  async ngOnInit(): Promise<void> {
    this.carId = this.route.snapshot.paramMap.get('id')
    if (this.carId) {
      await this.loadCar(this.carId)
    }
  }

  private async loadCar(id: string): Promise<void> {
    try {
      const carData = await carSDK.getById(id)
      this.car.set(carData)
    } catch (err) {
      this.error.set('Failed to load car')
      console.error('Load car error:', err)
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.bookingForm.valid || !this.carId) {
      return
    }

    this.loading.set(true)
    this.error.set(null)

    try {
      const formValue = this.bookingForm.value

      // ✅ Use correct type: CreateBookingInput
      const input: CreateBookingInput = {
        car_id: this.carId,
        renter_id: 'USER_ID_FROM_AUTH', // TODO: Get from auth service
        start_date: new Date(formValue.start_date).toISOString(),
        end_date: new Date(formValue.end_date).toISOString(),
        extra_driver_count: formValue.extra_driver_count,
        extra_child_seat_count: formValue.extra_child_seat_count,
        extra_gps: formValue.extra_gps,
        insurance_coverage_level: formValue.insurance_coverage_level,
        promo_code: formValue.promo_code || undefined,
      }

      // ✅ Use service (not SDK)
      const booking: BookingDTO = await bookingService.createBooking(input)

      // Navigate to booking detail
      await this.router.navigate(['/bookings', booking.id])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create booking'
      this.error.set(message)
      console.error('Create booking error:', err)
    } finally {
      this.loading.set(false)
    }
  }
}
```

---

## ❌ Errores Comunes y Cómo Evitarlos

### Error 1: Wrong Type Import

❌ **WRONG**:
```typescript
import type { CreateBookingServiceInput } from '@/types/service-types'
```

✅ **CORRECT**:
```typescript
import type { CreateBookingInput } from '@/types'
```

### Error 2: Wrong Field Names

❌ **WRONG**:
```typescript
const profile = {
  kyc_status: 'approved',
  onboarding_status: 'complete'
}
```

✅ **CORRECT**:
```typescript
const profile = {
  kyc: 'verified',  // ✅ Not 'approved'
  onboarding: 'complete'
}
```

### Error 3: Removed Fields

❌ **WRONG**:
```typescript
const input = {
  extra_wifi: true  // ❌ This field was removed
}
```

✅ **CORRECT**:
```typescript
const input = {
  extra_gps: true  // ✅ Use this instead
}
```

### Error 4: Using SDK Instead of Service

❌ **WRONG**:
```typescript
const booking = await bookingSDK.create(input)
```

✅ **CORRECT**:
```typescript
const booking = await bookingService.createBooking(input)
```

### Error 5: Not Handling Async Properly

❌ **WRONG**:
```typescript
ngOnInit() {
  this.loadCars()  // Missing await
}
```

✅ **CORRECT**:
```typescript
async ngOnInit(): Promise<void> {
  await this.loadCars()
}
```

---

## 🔐 Authentication Pattern

### Getting Current User

```typescript
import { supabase } from '@/lib/supabase'

async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Not authenticated')
  }

  return user
}
```

### Using in Component

```typescript
export class MyComponent implements OnInit {
  userId: string | null = null

  async ngOnInit(): Promise<void> {
    try {
      const user = await getCurrentUser()
      this.userId = user.id
      await this.loadUserData(user.id)
    } catch (err) {
      console.error('Auth error:', err)
      // Redirect to login
      void this.router.navigate(['/login'])
    }
  }
}
```

---

## 🎨 Component Checklist

Antes de crear un componente, verifica:

- [ ] ✅ Leíste `BACKEND_API_REFERENCE.md`
- [ ] ✅ Conoces los tipos exactos que necesitas (DTOs, Inputs)
- [ ] ✅ Sabes qué Service usar
- [ ] ✅ Verificaste los nombres de campos en los DTOs
- [ ] ✅ No usas campos que ya no existen (`extra_wifi`, `kyc_status`, etc.)
- [ ] ✅ Usas valores correctos de enums (`verified` no `approved`)
- [ ] ✅ Manejas errores correctamente
- [ ] ✅ Usas signals para estado reactivo
- [ ] ✅ Manejas loading y error states
- [ ] ✅ El componente es standalone

---

## 📊 Data Flow Pattern

```
Component
  ↓
Service (Business Logic)
  ↓
SDK (Data Access)
  ↓
Supabase (Database)
```

**Regla de oro**: Components llaman Services, no SDKs.

---

## 🧪 Testing Pattern

```typescript
import { TestBed } from '@angular/core/testing'
import { CarListComponent } from './car-list.component'

describe('CarListComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarListComponent]
    }).compileComponents()
  })

  it('should create', () => {
    const fixture = TestBed.createComponent(CarListComponent)
    const component = fixture.componentInstance
    expect(component).toBeTruthy()
  })

  it('should load cars on init', async () => {
    const fixture = TestBed.createComponent(CarListComponent)
    const component = fixture.componentInstance

    await component.ngOnInit()

    expect(component.cars().length).toBeGreaterThan(0)
  })
})
```

---

## 🚀 Quick Start Commands

```bash
# Generate new component
ng generate component features/cars/car-list --standalone

# Generate service wrapper (if needed)
ng generate service features/cars/car

# Generate guard
ng generate guard guards/owner --functional

# Run dev server
npm run start

# Run tests
npm run test

# Run linting
npm run lint
```

---

## 📚 Resources

1. **Backend Reference**: `docs/BACKEND_API_REFERENCE.md`
2. **Type Definitions**: `src/types/dto.ts`
3. **Input Schemas**: `src/types/schemas.ts`
4. **Services**: `src/services/*.service.ts`
5. **SDKs**: `src/lib/sdk/*.sdk.ts`

---

## ⚠️ IMPORTANT REMINDERS

1. **ALWAYS** use `CreateBookingInput`, not `CreateBookingServiceInput`
2. **ALWAYS** use `kyc` field, not `kyc_status`
3. **ALWAYS** use `verified` value, not `approved`
4. **ALWAYS** use Services, not SDKs directly
5. **ALWAYS** check `BACKEND_API_REFERENCE.md` before coding
6. **NEVER** use removed fields like `extra_wifi`
7. **NEVER** assume field names without checking DTOs
8. **NEVER** skip error handling

---

## 🎯 Next Steps

1. Read `BACKEND_API_REFERENCE.md` completely
2. Create your first component using these templates
3. Test locally
4. Run `npm run lint` before committing
5. Let the pre-commit hook validate your code

---

**Good luck! 🚀**

**Last updated**: 30 October 2025
