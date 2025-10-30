/* eslint-disable @typescript-eslint/no-unsafe-argument -- Test file: TestBed.createComponent requires type assertion */
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'

import { PaymentStatusComponent } from './payment-status.component'

describe('PaymentStatusComponent (TDD)', () => {
  let component: PaymentStatusComponent
  let fixture: ComponentFixture<PaymentStatusComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentStatusComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(PaymentStatusComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display payment status', () => {
    expect(compiled.querySelector('[data-testid="payment-status"]')).toBeTruthy()
  })

  it('should display success icon when approved', () => {
    void component.status.set('approved')
    fixture.detectChanges()
    expect(compiled.querySelector('[data-testid="success-icon"]')).toBeTruthy()
  })

  it('should display error icon when failed', () => {
    void component.status.set('failed')
    fixture.detectChanges()
    expect(compiled.querySelector('[data-testid="error-icon"]')).toBeTruthy()
  })
})
