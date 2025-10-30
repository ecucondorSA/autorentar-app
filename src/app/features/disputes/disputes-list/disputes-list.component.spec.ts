import { provideHttpClient } from '@angular/common/http'
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'

import { DisputesListComponent } from './disputes-list.component'

describe('DisputesListComponent (TDD)', () => {
  let component: DisputesListComponent
  let fixture: ComponentFixture<DisputesListComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisputesListComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(DisputesListComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have disputes list container', () => {
    expect(compiled.querySelector('[data-testid="disputes-list"]')).toBeTruthy()
  })

  it('should display dispute card', () => {
    void component.disputes.set([
      {
        id: '1',
        booking_id: 'booking-123',
        reason: 'damage',
        status: 'open'
      } as any
    ])
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="dispute-card"]')).toBeTruthy()
  })

  it('should show dispute reason', () => {
    void component.disputes.set([
      { id: '1', reason: 'damage' } as any
    ])
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="dispute-reason"]')).toBeTruthy()
  })

  it('should display dispute status', () => {
    void component.disputes.set([
      { id: '1', status: 'open' } as any
    ])
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="dispute-status"]')).toBeTruthy()
  })

  it('should show related booking link', () => {
    void component.disputes.set([
      { id: '1', booking_id: 'booking-123' } as any
    ])
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="booking-link"]')).toBeTruthy()
  })

  it('should display created date', () => {
    void component.disputes.set([
      { id: '1', created_at: '2024-01-15T10:00:00Z' } as any
    ])
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="dispute-date"]')).toBeTruthy()
  })

  it('should emit view dispute event', () => {
    void component.disputes.set([
      { id: '1', reason: 'damage' } as any
    ])
    spyOn(component.viewDispute, 'emit')
    fixture.detectChanges()

    const card = compiled.querySelector('[data-testid="dispute-card"]')
    card.click()

    expect(component.viewDispute.emit).toHaveBeenCalledWith('1')
  })

  it('should show create dispute button', () => {
    expect(compiled.querySelector('[data-testid="create-dispute-button"]')).toBeTruthy()
  })

  it('should display evidence count', () => {
    void component.disputes.set([
      { id: '1', evidence_count: 3 } as any
    ])
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="evidence-count"]')).toBeTruthy()
  })
})
