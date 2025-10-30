/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-floating-promises, @typescript-eslint/no-unnecessary-condition -- Test file with async operations */
import { provideHttpClient } from '@angular/common/http'
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { provideIonicAngular } from '@ionic/angular/standalone'

// ✅ STEP 1: Importar TYPES reales desde la capa de tipos
import { carSDK } from '@/lib/sdk/car.sdk'
import type { CarDTO} from '@/types';
import { CarDTOSchema, type PaginatedResponse } from '@/types'

// ✅ STEP 2: Importar SDK real (para mockear con tipos correctos)

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
    pageSize: 20,
    hasMore: false
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarListComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        provideIonicAngular(),
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(CarListComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement

    // ✅ Mock SDK globally to avoid real HTTP calls
    spyOn(carSDK, 'search').and.returnValue(
      Promise.resolve(mockPaginatedResponse)
    )
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

  it('should NOT display loading spinner when loading = false', async () => {
    // ✅ Dejar que ngOnInit() se ejecute y complete
    fixture.detectChanges()
    await fixture.whenStable()

    // Después de que loadCars() termina, loading debe ser false
    expect(component.loading()).toBe(false)

    // ✅ CRITICAL: Detectar cambios DESPUÉS de que loading cambia a false
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
    expect(title?.textContent?.trim()).toContain('Toyota')
    expect(title?.textContent?.trim()).toContain('Corolla')
  })

  it('should display car price correctly (formatted)', () => {
    component.cars.set([testCar1])
    fixture.detectChanges()

    const price = compiled.querySelector('[data-testid="car-price"]')
    // price_per_day_cents = 5000 → $50.00/día
    expect(price?.textContent?.trim()).toContain('$50')
  })

  it('should display car location correctly', () => {
    component.cars.set([testCar1])
    fixture.detectChanges()

    const location = compiled.querySelector('[data-testid="car-location"]')
    expect(location?.textContent?.trim()).toContain('Buenos Aires')
  })

  // ════════════════════════════════════════════
  // TEST SUITE 5: SDK Integration (con mock)
  // ════════════════════════════════════════════

  it('should call carSDK.search() on ngOnInit', async () => {
    // ✅ spy ya existe del beforeEach, solo verificamos
    const searchSpy = carSDK.search as jasmine.Spy

    component.ngOnInit()
    await fixture.whenStable()

    expect(searchSpy).toHaveBeenCalled()
  })

  it('should populate cars signal after successful SDK call', async () => {
    // ✅ spy ya configurado en beforeEach
    component.ngOnInit()
    await fixture.whenStable()

    expect(component.cars().length).toBe(2)
    expect(component.cars()[0]?.brand).toBe('Toyota')
    expect(component.cars()[1]?.brand).toBe('Honda')
  })

  it('should set loading = true during SDK call', () => {
    let resolveFn: ((value: PaginatedResponse<CarDTO>) => void) | undefined;
    const searchPromise = new Promise<PaginatedResponse<CarDTO>>((resolve) => {
      resolveFn = resolve;
    });
    // ✅ Reconfigurar spy para este test específico
    (carSDK.search as jasmine.Spy).and.returnValue(searchPromise);

    component.loadCars();
    expect(component.loading()).toBe(true);

    if (resolveFn) {
      resolveFn(mockPaginatedResponse);
    }
  })

  // ════════════════════════════════════════════
  // TEST SUITE 6: Error Handling
  // ════════════════════════════════════════════

  it('should handle SDK errors gracefully', async () => {
    // ✅ Reconfigurar spy para simular error
    (carSDK.search as jasmine.Spy).and.returnValue(
      Promise.reject(new Error('Network error'))
    )
    spyOn(console, 'error') // Suppress console output

    await component.loadCars()

    expect(component.loading()).toBe(false)
    expect(component.cars()).toEqual([])
  })
})
