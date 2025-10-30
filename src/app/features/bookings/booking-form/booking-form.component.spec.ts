import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'

import { BookingFormComponent } from './booking-form.component'

describe('BookingFormComponent (TDD)', () => {
  let component: BookingFormComponent
  let fixture: ComponentFixture<BookingFormComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingFormComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(BookingFormComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have booking form', () => {
    expect(compiled.querySelector('form[data-testid="booking-form"]')).toBeTruthy()
  })

  it('should have start date input', () => {
    expect(compiled.querySelector('[data-testid="start-date"]')).toBeTruthy()
  })

  it('should have end date input', () => {
    expect(compiled.querySelector('[data-testid="end-date"]')).toBeTruthy()
  })

  it('should display total price', () => {
    expect(compiled.querySelector('[data-testid="total-price"]')).toBeTruthy()
  })

  it('should have book button', () => {
    expect(compiled.querySelector('ion-button[data-testid="book-now-button"]')).toBeTruthy()
  })
})
