/* eslint-disable @typescript-eslint/no-non-null-assertion -- Test file with DOM queries */
/* eslint-disable @typescript-eslint/no-unsafe-argument -- Test file: TestBed.createComponent requires type assertion */
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'

import type { CarDTO} from '@/types';
import { CarDTOSchema } from '@/types'

import { CarCardComponent } from './car-card.component'

describe('CarCardComponent (TDD)', () => {
  let component: CarCardComponent
  let fixture: ComponentFixture<CarCardComponent>
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
      imports: [CarCardComponent],
      providers: [provideRouter([])],
    }).compileComponents()

    fixture = TestBed.createComponent(CarCardComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have ion-card with data-testid="car-card"', () => {
    component.car = testCar
    fixture.detectChanges()
    expect(compiled.querySelector('ion-card[data-testid="car-card"]')).toBeTruthy()
  })

  it('should display car image', () => {
    component.car = testCar
    fixture.detectChanges()
    const img = compiled.querySelector('img[data-testid="car-image"]')!
    expect(img).toBeTruthy()
    expect(img.src).toContain('car.jpg')
  })

  it('should display car title (brand + model)', () => {
    component.car = testCar
    fixture.detectChanges()
    const title = compiled.querySelector('[data-testid="car-title"]')
    expect(title?.textContent).toContain('Toyota Corolla')
  })

  it('should display car price formatted', () => {
    component.car = testCar
    fixture.detectChanges()
    const price = compiled.querySelector('[data-testid="car-price"]')
    expect(price?.textContent).toContain('$50')
  })

  it('should display car location', () => {
    component.car = testCar
    fixture.detectChanges()
    const location = compiled.querySelector('[data-testid="car-location"]')
    expect(location?.textContent).toContain('Buenos Aires')
  })

  it('should emit click event when card clicked', () => {
    component.car = testCar
    const emitSpy = jasmine.createSpy('emit')
    component.cardClick.emit = emitSpy
    fixture.detectChanges()

    const card = compiled.querySelector('ion-card[data-testid="car-card"]')!
    card.click()

    expect(emitSpy).toHaveBeenCalledWith(testCar.id)
  })

  it('should be clickable (button attribute)', () => {
    component.car = testCar
    fixture.detectChanges()
    const card = compiled.querySelector('ion-card[data-testid="car-card"]')
    expect(card?.hasAttribute('button')).toBeTruthy()
  })
})
/* eslint-enable @typescript-eslint/no-non-null-assertion -- Re-enable after test file */
/* eslint-enable @typescript-eslint/no-unsafe-argument -- Re-enable after test file */
