import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section data-testid="payment-form">
      <h2 data-testid="amount-to-pay">Total a pagar: {{ amount() | currency:'USD':'symbol' }}</h2>
      <div data-testid="payment-breakdown">
        <p>Alquiler: {{ breakdown().rental | currency:'USD':'symbol' }}</p>
        <p>Seguros: {{ breakdown().insurance | currency:'USD':'symbol' }}</p>
        <p>Comisión: {{ breakdown().fee | currency:'USD':'symbol' }}</p>
      </div>
      <ion-button data-testid="mercadopago-button" expand="block" color="primary">
        Pagar con MercadoPago
      </ion-button>
    </section>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PaymentFormComponent {
  readonly amount = signal(0);
  readonly breakdown = signal({
    rental: 0,
    insurance: 0,
    fee: 0,
  });
}
