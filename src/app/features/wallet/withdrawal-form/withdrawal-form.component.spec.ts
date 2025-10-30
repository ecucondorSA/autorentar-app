import { provideHttpClient } from '@angular/common/http'
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'
import { ReactiveFormsModule } from '@angular/forms'
import { provideRouter } from '@angular/router'

import { WithdrawalFormComponent } from './withdrawal-form.component'

describe('WithdrawalFormComponent (TDD)', () => {
  let component: WithdrawalFormComponent
  let fixture: ComponentFixture<WithdrawalFormComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WithdrawalFormComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideRouter([]),
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(WithdrawalFormComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have withdrawal form', () => {
    expect(compiled.querySelector('form[data-testid="withdrawal-form"]')).toBeTruthy()
  })

  it('should display available balance', () => {
    void component.availableBalance.set(500000)
    fixture.detectChanges()

    const balance = compiled.querySelector('[data-testid="available-balance"]')
    expect(balance?.textContent).toContain('5000')
  })

  it('should have amount input', () => {
    expect(compiled.querySelector('input[data-testid="amount-input"]')).toBeTruthy()
  })

  it('should have bank account selector', () => {
    expect(compiled.querySelector('[data-testid="bank-account-select"]')).toBeTruthy()
  })

  it('should validate amount is positive', () => {
    const amountControl = component.withdrawalForm.get('amount')
    amountControl?.setValue(-100)

    expect(amountControl?.errors).toBeTruthy()
    expect(amountControl?.errors?.min).toBeTruthy()
  })

  it('should validate amount does not exceed available balance', () => {
    void component.availableBalance.set(100000)
    const amountControl = component.withdrawalForm.get('amount')
    amountControl?.setValue(150000)

    fixture.detectChanges()

    expect(component.withdrawalForm.errors?.insufficientFunds).toBeTruthy()
  })

  it('should disable submit when form invalid', () => {
    void component.withdrawalForm.patchValue({
      amount: null,
      bank_account_id: ''
    })
    fixture.detectChanges()

    const submitBtn = compiled.querySelector('[data-testid="submit-button"]')!
    expect(submitBtn?.disabled).toBeTruthy()
  })

  it('should emit withdraw event on valid submit', () => {
    void component.availableBalance.set(500000)
    spyOn(component.withdraw, 'emit')

    void component.withdrawalForm.patchValue({
      amount: 100000,
      bank_account_id: 'bank-123'
    })
    fixture.detectChanges()

    const form = compiled.querySelector('form[data-testid="withdrawal-form"]')
    form.dispatchEvent(new Event('submit'))

    expect(component.withdraw.emit).toHaveBeenCalled()
  })

  it('should show confirmation dialog before submit', () => {
    expect(compiled.querySelector('[data-testid="confirmation-modal"]')).toBeFalsy()

    void component.withdrawalForm.patchValue({
      amount: 100000,
      bank_account_id: 'bank-123'
    })
    void component.showConfirmation.set(true)
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="confirmation-modal"]')).toBeTruthy()
  })
})
