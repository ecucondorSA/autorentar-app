import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [CommonModule, IonButton],
  template: `
    <section class="confirmation">
      <h2 data-testid="success-message">¡Reserva confirmada!</h2>
      <p data-testid="booking-id">Código: {{ bookingId() }}</p>

      <div class="actions">
        <ion-button data-testid="view-booking" (click)="viewBooking()">Ver reserva</ion-button>
        <ion-button data-testid="return-home" fill="outline" (click)="returnHome()">Volver al inicio</ion-button>
      </div>
    </section>
  `,
  styles: [
    `
    .confirmation {
      text-align: center;
      display: grid;
      gap: 1rem;
    }

    .actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
    }
    `,
  ],
})
export class BookingConfirmationComponent {
  private readonly router = inject(Router);
  readonly bookingId = signal<string>('RES-0001');

  viewBooking(): void {
    void this.router.navigate(['/bookings', this.bookingId()]);
  }

  returnHome(): void {
    void this.router.navigate(['/']);
  }
}
