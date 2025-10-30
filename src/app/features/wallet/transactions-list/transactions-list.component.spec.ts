import { provideHttpClient } from '@angular/common/http'
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'

import { TransactionsListComponent } from './transactions-list.component'

describe('TransactionsListComponent (TDD)', () => {
  let component: TransactionsListComponent
  let fixture: ComponentFixture<TransactionsListComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionsListComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(TransactionsListComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have transactions list', () => {
    expect(compiled.querySelector('[data-testid="transactions-list"]')).toBeTruthy()
  })

  it('should display transaction item', () => {
    void component.transactions.set([
      {
        id: '1',
        type: 'deposit',
        amount_cents: 100000,
        status: 'completed',
        created_at: '2024-01-15T10:00:00Z'
      } as any
    ])
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="transaction-item"]')).toBeTruthy()
  })

  it('should show transaction type', () => {
    void component.transactions.set([
      { id: '1', type: 'deposit' } as any
    ])
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="transaction-type"]')).toBeTruthy()
  })

  it('should display transaction amount', () => {
    void component.transactions.set([
      { id: '1', amount_cents: 150000 } as any
    ])
    fixture.detectChanges()

    const amount = compiled.querySelector('[data-testid="transaction-amount"]')
    expect(amount?.textContent).toContain('1500')
  })

  it('should show transaction status', () => {
    void component.transactions.set([
      { id: '1', status: 'completed' } as any
    ])
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="transaction-status"]')).toBeTruthy()
  })

  it('should display transaction date', () => {
    void component.transactions.set([
      { id: '1', created_at: '2024-01-15T10:00:00Z' } as any
    ])
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="transaction-date"]')).toBeTruthy()
  })

  it('should filter by transaction type', () => {
    expect(compiled.querySelector('[data-testid="type-filter"]')).toBeTruthy()
  })

  it('should filter by date range', () => {
    expect(compiled.querySelector('[data-testid="date-filter"]')).toBeTruthy()
  })

  it('should show empty state when no transactions', () => {
    void component.transactions.set([])
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="empty-transactions"]')).toBeTruthy()
  })

  it('should display loading spinner when loading', () => {
    void component.loading.set(true)
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="loading-spinner"]')).toBeTruthy()
  })
})
