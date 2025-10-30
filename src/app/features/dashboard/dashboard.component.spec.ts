import { provideHttpClient } from '@angular/common/http'
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'

import { DashboardComponent } from './dashboard.component'

describe('DashboardComponent (TDD)', () => {
  let component: DashboardComponent
  let fixture: ComponentFixture<DashboardComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(DashboardComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display welcome message with user name', () => {
    void component.userName.set('Juan Pérez')
    fixture.detectChanges()

    const welcome = compiled.querySelector('[data-testid="welcome-message"]')
    expect(welcome?.textContent).toContain('Juan Pérez')
  })

  it('should show active bookings count', () => {
    void component.activeBookings.set(3)
    fixture.detectChanges()

    const count = compiled.querySelector('[data-testid="active-bookings-count"]')
    expect(count?.textContent).toContain('3')
  })

  it('should display wallet balance', () => {
    void component.walletBalance.set(250000)
    fixture.detectChanges()

    const balance = compiled.querySelector('[data-testid="wallet-balance"]')
    expect(balance?.textContent).toContain('2500')
  })

  it('should show total cars count', () => {
    void component.totalCars.set(5)
    fixture.detectChanges()

    const count = compiled.querySelector('[data-testid="total-cars-count"]')
    expect(count?.textContent).toContain('5')
  })

  it('should have quick actions section', () => {
    expect(compiled.querySelector('[data-testid="quick-actions"]')).toBeTruthy()
  })

  it('should display publish car button', () => {
    expect(compiled.querySelector('[data-testid="publish-car-button"]')).toBeTruthy()
  })

  it('should show recent activity section', () => {
    expect(compiled.querySelector('[data-testid="recent-activity"]')).toBeTruthy()
  })

  it('should display upcoming bookings', () => {
    void component.upcomingBookings.set([
      { id: '1', start_date: '2024-02-01', car_brand: 'Toyota' } as any
    ])
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="upcoming-booking"]')).toBeTruthy()
  })

  it('should show pending reviews count', () => {
    void component.pendingReviews.set(2)
    fixture.detectChanges()

    const count = compiled.querySelector('[data-testid="pending-reviews-count"]')
    expect(count?.textContent).toContain('2')
  })

  it('should navigate to bookings when section clicked', () => {
    spyOn(component, 'goToBookings')
    fixture.detectChanges()

    const section = compiled.querySelector('[data-testid="bookings-section"]')
    section?.click()

    expect(component.goToBookings).toHaveBeenCalled()
  })
})
