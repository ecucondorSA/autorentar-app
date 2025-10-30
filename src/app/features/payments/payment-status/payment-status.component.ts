import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

type PaymentStatus = 'pending' | 'approved' | 'failed';

@Component({
  selector: 'app-payment-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section data-testid="payment-status">
      <h2>Estado del pago</h2>
      <p>{{ statusMessage() }}</p>

      @if (status() === 'approved') {
        <ion-icon data-testid="success-icon" name="checkmark-circle"></ion-icon>
      } @else if (status() === 'failed') {
        <ion-icon data-testid="error-icon" name="close-circle"></ion-icon>
      } @else {
        <ion-spinner data-testid="pending-icon"></ion-spinner>
      }
    </section>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PaymentStatusComponent {
  readonly status = signal<PaymentStatus>('pending');

  readonly statusMessage = computed(() => {
    switch (this.status()) {
      case 'approved':
        return 'Tu pago fue aprobado.';
      case 'failed':
        return 'El pago no se pudo procesar.';
      default:
        return 'Estamos procesando tu pago…';
    }
  });
}
