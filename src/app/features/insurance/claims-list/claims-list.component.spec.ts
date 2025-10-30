/* eslint-disable @typescript-eslint/no-unsafe-argument -- Test file: TestBed.createComponent requires type assertion */
import { provideHttpClient } from '@angular/common/http'
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'

import { ClaimsListComponent } from './claims-list.component'

describe('ClaimsListComponent (TDD)', () => {
  let component: ClaimsListComponent
  let fixture: ComponentFixture<ClaimsListComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClaimsListComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(ClaimsListComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have claims list container', () => {
    expect(compiled.querySelector('[data-testid="claims-list"]')).toBeTruthy()
  })

  it('should display claim card', () => {
    void component.claims.set([
      {
        id: '1',
        claim_number: 'CLM-001',
        status: 'pending',
        amount_cents: 100000
      } as any
    ])
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="claim-card"]')).toBeTruthy()
  })

  it('should show claim number', () => {
    void component.claims.set([
      { id: '1', claim_number: 'CLM-001' } as any
    ])
    fixture.detectChanges()

    const claimNumber = compiled.querySelector('[data-testid="claim-number"]')
    expect(claimNumber?.textContent).toContain('CLM-001')
  })

  it('should display claim status', () => {
    void component.claims.set([
      { id: '1', status: 'pending' } as any
    ])
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="claim-status"]')).toBeTruthy()
  })

  it('should show claim amount', () => {
    void component.claims.set([
      { id: '1', amount_cents: 150000 } as any
    ])
    fixture.detectChanges()

    const amount = compiled.querySelector('[data-testid="claim-amount"]')
    expect(amount?.textContent).toContain('1500')
  })

  it('should display incident date', () => {
    void component.claims.set([
      { id: '1', incident_date: '2024-01-15' } as any
    ])
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="incident-date"]')).toBeTruthy()
  })

  it('should emit view claim event', () => {
    void component.claims.set([
      { id: '1', claim_number: 'CLM-001' } as any
    ])
    spyOn(component.viewClaim, 'emit')
    fixture.detectChanges()

    const card = compiled.querySelector('[data-testid="claim-card"]')
    card.click()

    expect(component.viewClaim.emit).toHaveBeenCalledWith('1')
  })

  it('should show create claim button', () => {
    expect(compiled.querySelector('[data-testid="create-claim-button"]')).toBeTruthy()
  })

  it('should filter claims by status', () => {
    expect(compiled.querySelector('[data-testid="status-filter"]')).toBeTruthy()
  })
})
/* eslint-enable @typescript-eslint/no-unsafe-argument -- Re-enable after test file */
