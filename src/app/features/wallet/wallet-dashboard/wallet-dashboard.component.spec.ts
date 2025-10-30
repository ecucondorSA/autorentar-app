/* eslint-disable @typescript-eslint/no-unsafe-argument -- Test file: TestBed.createComponent requires type assertion */
import { provideHttpClient } from '@angular/common/http'
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'

import { WalletDashboardComponent } from './wallet-dashboard.component'

describe('WalletDashboardComponent (TDD)', () => {
  let component: WalletDashboardComponent
  let fixture: ComponentFixture<WalletDashboardComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WalletDashboardComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(WalletDashboardComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display wallet balance', () => {
    void component.balance.set(500000)
    fixture.detectChanges()

    const balance = compiled.querySelector('[data-testid="wallet-balance"]')
    expect(balance?.textContent).toContain('5000')
  })

  it('should show locked funds amount', () => {
    void component.lockedFunds.set(200000)
    fixture.detectChanges()

    const locked = compiled.querySelector('[data-testid="locked-funds"]')
    expect(locked?.textContent).toContain('2000')
  })

  it('should display available balance', () => {
    void component.balance.set(500000)
    void component.lockedFunds.set(200000)
    fixture.detectChanges()

    const available = compiled.querySelector('[data-testid="available-balance"]')
    expect(available?.textContent).toContain('3000')
  })

  it('should have deposit button', () => {
    expect(compiled.querySelector('[data-testid="deposit-button"]')).toBeTruthy()
  })

  it('should have withdraw button', () => {
    expect(compiled.querySelector('[data-testid="withdraw-button"]')).toBeTruthy()
  })

  it('should navigate to deposit when deposit clicked', () => {
    spyOn(component, 'goToDeposit')
    fixture.detectChanges()

    const depositBtn = compiled.querySelector('[data-testid="deposit-button"]')
    depositBtn.click()

    expect(component.goToDeposit).toHaveBeenCalled()
  })

  it('should navigate to withdraw when withdraw clicked', () => {
    spyOn(component, 'goToWithdraw')
    fixture.detectChanges()

    const withdrawBtn = compiled.querySelector('[data-testid="withdraw-button"]')
    withdrawBtn.click()

    expect(component.goToWithdraw).toHaveBeenCalled()
  })

  it('should show recent transactions list', () => {
    expect(compiled.querySelector('[data-testid="recent-transactions"]')).toBeTruthy()
  })

  it('should display transaction count', () => {
    void component.recentTransactions.set([
      { id: '1', type: 'deposit' } as any,
      { id: '2', type: 'withdrawal' } as any
    ])
    fixture.detectChanges()

    const transactions = compiled.querySelectorAll('[data-testid="transaction-item"]')
    expect(transactions.length).toBe(2)
  })
})
