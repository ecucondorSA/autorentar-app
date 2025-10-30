import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'

import { PaymentFormComponent } from './payment-form.component'

describe('PaymentFormComponent (TDD)', () => {
  let component: PaymentFormComponent
  let fixture: ComponentFixture<PaymentFormComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentFormComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(PaymentFormComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display amount to pay', () => {
    expect(compiled.querySelector('[data-testid="amount-to-pay"]')).toBeTruthy()
  })

  it('should have MercadoPago button', () => {
    expect(compiled.querySelector('ion-button[data-testid="mercadopago-button"]')).toBeTruthy()
  })

  it('should display payment breakdown', () => {
    expect(compiled.querySelector('[data-testid="payment-breakdown"]')).toBeTruthy()
  })
})
