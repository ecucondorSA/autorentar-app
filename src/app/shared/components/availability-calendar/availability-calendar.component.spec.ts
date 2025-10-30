/* eslint-disable @typescript-eslint/no-unsafe-argument -- Test file: TestBed.createComponent requires type assertion */
import { provideHttpClient } from '@angular/common/http'
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'

import { AvailabilityCalendarComponent } from './availability-calendar.component'

describe('AvailabilityCalendarComponent (TDD)', () => {
  let component: AvailabilityCalendarComponent
  let fixture: ComponentFixture<AvailabilityCalendarComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvailabilityCalendarComponent],
      providers: [provideHttpClient()]
    }).compileComponents()

    fixture = TestBed.createComponent(AvailabilityCalendarComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have calendar container', () => {
    expect(compiled.querySelector('[data-testid="calendar-container"]')).toBeTruthy()
  })

  it('should display current month', () => {
    expect(compiled.querySelector('[data-testid="current-month"]')).toBeTruthy()
  })

  it('should have previous month button', () => {
    expect(compiled.querySelector('[data-testid="prev-month-button"]')).toBeTruthy()
  })

  it('should have next month button', () => {
    expect(compiled.querySelector('[data-testid="next-month-button"]')).toBeTruthy()
  })

  it('should display calendar days', () => {
    expect(compiled.querySelector('[data-testid="calendar-days"]')).toBeTruthy()
  })

  it('should mark unavailable dates', () => {
    void component.unavailableDates.set(['2024-01-15', '2024-01-16'])
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="unavailable-day"]')).toBeTruthy()
  })

  it('should emit date selection', () => {
    spyOn(component.dateSelected, 'emit')

    const day = compiled.querySelector('[data-testid="calendar-day"]')
    day?.click()

    expect(component.dateSelected.emit).toHaveBeenCalled()
  })

  it('should disable past dates', () => {
    void component.disablePastDates.set(true)
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="disabled-day"]')).toBeTruthy()
  })

  it('should highlight selected range', () => {
    void component.selectedRange.set({
      start: '2024-01-10',
      end: '2024-01-15'
    })
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="selected-range"]')).toBeTruthy()
  })
})
/* eslint-enable @typescript-eslint/no-unsafe-argument -- Re-enable after test file */
