/* eslint-disable @typescript-eslint/no-unsafe-argument -- Test file: TestBed.createComponent requires type assertion */
import { provideHttpClient } from '@angular/common/http'
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'

import { InsuranceListComponent } from './insurance-list.component'

describe('InsuranceListComponent (TDD)', () => {
  let component: InsuranceListComponent
  let fixture: ComponentFixture<InsuranceListComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsuranceListComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(InsuranceListComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have insurance policies list', () => {
    expect(compiled.querySelector('[data-testid="insurance-list"]')).toBeTruthy()
  })

  it('should display insurance policy card', () => {
    void component.policies.set([
      {
        id: '1',
        policy_number: 'POL-123',
        provider: 'Test Insurance',
        coverage_type: 'full',
        status: 'active'
      } as any
    ])
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="insurance-card"]')).toBeTruthy()
  })

  it('should show policy number', () => {
    void component.policies.set([
      { id: '1', policy_number: 'POL-123' } as any
    ])
    fixture.detectChanges()

    const policyNumber = compiled.querySelector('[data-testid="policy-number"]')
    expect(policyNumber?.textContent).toContain('POL-123')
  })

  it('should display coverage type', () => {
    void component.policies.set([
      { id: '1', coverage_type: 'full' } as any
    ])
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="coverage-type"]')).toBeTruthy()
  })

  it('should show expiration date', () => {
    void component.policies.set([
      { id: '1', expiration_date: '2024-12-31' } as any
    ])
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="expiration-date"]')).toBeTruthy()
  })

  it('should emit view details event', () => {
    void component.policies.set([
      { id: '1', policy_number: 'POL-123' } as any
    ])
    spyOn(component.viewDetails, 'emit')
    fixture.detectChanges()

    const card = compiled.querySelector('[data-testid="insurance-card"]') as HTMLElement | null
    card?.click()

    expect(component.viewDetails.emit).toHaveBeenCalledWith('1')
  })

  it('should show add policy button', () => {
    expect(compiled.querySelector('[data-testid="add-policy-button"]')).toBeTruthy()
  })

  it('should display policy status badge', () => {
    void component.policies.set([
      { id: '1', status: 'active' } as any
    ])
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="policy-status"]')).toBeTruthy()
  })
})
/* eslint-enable @typescript-eslint/no-unsafe-argument -- Re-enable after test file */
