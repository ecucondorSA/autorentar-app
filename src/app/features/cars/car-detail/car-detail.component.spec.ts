/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-non-null-assertion -- Test file with Jasmine spies */
import { signal } from '@angular/core'
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'
import { provideRouter, ActivatedRoute } from '@angular/router'

import { carSDK } from '@/lib/sdk/car.sdk'
import type { CarDTO} from '@/types';
import { CarDTOSchema } from '@/types'

import { CarDetailComponent } from './car-detail.component'

describe('CarDetailComponent (TDD)', () => {
  let component: CarDetailComponent
  let fixture: ComponentFixture<CarDetailComponent>
  let compiled: HTMLElement

  const testCar: CarDTO = CarDTOSchema.parse({
    id: 'test-car-id',
    owner_id: 'owner-id',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2020,
    photo_main_url: 'https://example.com/car.jpg',
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            params: signal({ id: 'test-car-id' }),
          },
        },
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(CarDetailComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement

    spyOn(carSDK, 'getById').and.returnValue(Promise.resolve(testCar))
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize with loading = true', () => {
    expect(component.loading()).toBe(true)
  })

  it('should call carSDK.getById with route param id', async () => {
    component.ngOnInit()
    await fixture.whenStable()
    expect(carSDK.getById).toHaveBeenCalledWith('test-car-id')
  })

  it('should display car brand and model', async () => {
    component.ngOnInit()
    await fixture.whenStable()
    fixture.detectChanges()

    const title = compiled.querySelector('[data-testid="car-title"]')
    expect(title?.textContent).toContain('Toyota Corolla 2020')
  })

  it('should display car image', async () => {
    component.ngOnInit()
    await fixture.whenStable()
    fixture.detectChanges()

    const img = compiled.querySelector('img[data-testid="car-main-image"]')!
    expect(img).toBeTruthy()
    expect(img.src).toContain('car.jpg')
  })

  it('should display car price', async () => {
    component.ngOnInit()
    await fixture.whenStable()
    fixture.detectChanges()

    const price = compiled.querySelector('[data-testid="car-price"]')
    expect(price?.textContent).toContain('$50')
  })

  it('should display car specifications', async () => {
    component.ngOnInit()
    await fixture.whenStable()
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="car-transmission"]')?.textContent).toContain('automatic')
    expect(compiled.querySelector('[data-testid="car-fuel"]')?.textContent).toContain('gasoline')
    expect(compiled.querySelector('[data-testid="car-seats"]')?.textContent).toContain('5')
  })

  it('should have book button', async () => {
    component.ngOnInit()
    await fixture.whenStable()
    fixture.detectChanges()

    expect(compiled.querySelector('ion-button[data-testid="book-button"]')).toBeTruthy()
  })

  it('should display loading spinner when loading', () => {
    component.loading.set(true)
    fixture.detectChanges()
    expect(compiled.querySelector('[data-testid="loading-spinner"]')).toBeTruthy()
  })

  it('should NOT display spinner when loaded', async () => {
    component.ngOnInit()
    await fixture.whenStable()
    fixture.detectChanges()

    expect(component.loading()).toBe(false)
    expect(compiled.querySelector('[data-testid="loading-spinner"]')).toBeNull()
  })
})
/* eslint-enable @typescript-eslint/unbound-method, @typescript-eslint/no-non-null-assertion -- Re-enable after test file */
