import { provideHttpClient } from '@angular/common/http'
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { provideIonicAngular } from '@ionic/angular/standalone'

import { HomePage } from './home.page'

describe('HomePage (TDD)', () => {
  let component: HomePage
  let fixture: ComponentFixture<HomePage>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        provideIonicAngular(),
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(HomePage)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have hero section', () => {
    expect(compiled.querySelector('[data-testid="hero-section"]')).toBeTruthy()
  })

  it('should display main heading', () => {
    const heading = compiled.querySelector('[data-testid="main-heading"]')
    expect(heading?.textContent).toContain('AutoRenta')
  })

  it('should have search form', () => {
    expect(compiled.querySelector('[data-testid="search-form"]')).toBeTruthy()
  })

  it('should show featured cars section', () => {
    expect(compiled.querySelector('[data-testid="featured-cars"]')).toBeTruthy()
  })

  it('should display featured car cards', () => {
    void component.featuredCars.set([
      { id: '1', brand: 'Toyota', model: 'Corolla' } as any,
      { id: '2', brand: 'Honda', model: 'Civic' } as any
    ])
    fixture.detectChanges()

    const cards = compiled.querySelectorAll('[data-testid="car-card"]')
    expect(cards.length).toBe(2)
  })

  it('should have how it works section', () => {
    expect(compiled.querySelector('[data-testid="how-it-works"]')).toBeTruthy()
  })

  it('should show benefits section', () => {
    expect(compiled.querySelector('[data-testid="benefits-section"]')).toBeTruthy()
  })

  it('should have CTA button', () => {
    expect(compiled.querySelector('[data-testid="cta-button"]')).toBeTruthy()
  })

  it('should navigate to car list when CTA clicked', () => {
    spyOn(component, 'goToCarList')
    fixture.detectChanges()

    const ctaBtn = compiled.querySelector('[data-testid="cta-button"]')
    ctaBtn?.click()

    expect(component.goToCarList).toHaveBeenCalled()
  })

  it('should show testimonials section', () => {
    expect(compiled.querySelector('[data-testid="testimonials"]')).toBeTruthy()
  })

  it('should display loading state for featured cars', () => {
    void component.loadingFeatured.set(true)
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="featured-loading"]')).toBeTruthy()
  })
})
