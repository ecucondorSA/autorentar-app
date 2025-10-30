/* eslint-disable @typescript-eslint/no-unsafe-argument -- Test file: TestBed.createComponent requires type assertion */
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'

import { BookingDetailComponent } from './booking-detail.component'

describe('BookingDetailComponent (TDD)', () => {
  let component: BookingDetailComponent
  let fixture: ComponentFixture<BookingDetailComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingDetailComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(BookingDetailComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display booking status', () => {
    expect(compiled.querySelector('[data-testid="booking-status"]')).toBeTruthy()
  })

  it('should display car details', () => {
    expect(compiled.querySelector('[data-testid="car-details"]')).toBeTruthy()
  })

  it('should display booking dates', () => {
    expect(compiled.querySelector('[data-testid="booking-dates"]')).toBeTruthy()
  })

  it('should display total paid', () => {
    expect(compiled.querySelector('[data-testid="total-paid"]')).toBeTruthy()
  })

  it('should have cancel button when pending', () => {
    void component.booking.set({ status: 'pending' } as any)
    fixture.detectChanges()
    expect(compiled.querySelector('ion-button[data-testid="cancel-booking"]')).toBeTruthy()
  })
})
/* eslint-enable @typescript-eslint/no-unsafe-argument -- Re-enable after test file */
