import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'

import { BookingConfirmationComponent } from './booking-confirmation.component'

describe('BookingConfirmationComponent (TDD)', () => {
  let component: BookingConfirmationComponent
  let fixture: ComponentFixture<BookingConfirmationComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingConfirmationComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(BookingConfirmationComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display success message', () => {
    expect(compiled.querySelector('[data-testid="success-message"]')).toBeTruthy()
  })

  it('should display booking ID', () => {
    expect(compiled.querySelector('[data-testid="booking-id"]')).toBeTruthy()
  })

  it('should have view booking button', () => {
    expect(compiled.querySelector('ion-button[data-testid="view-booking"]')).toBeTruthy()
  })

  it('should have return home button', () => {
    expect(compiled.querySelector('ion-button[data-testid="return-home"]')).toBeTruthy()
  })
})
