import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

interface ReceivedBooking {
  id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  renter_name?: string | null;
}

@Component({
  selector: 'app-bookings-received',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section data-testid="received-bookings-list" class="bookings">
      <article *ngFor="let booking of bookings()" class="booking-card">
        <h3>{{ booking.renter_name || 'Reserva' }}</h3>
        <p>Estado: {{ booking.status }}</p>

        <div *ngIf="booking.status === 'pending'" class="actions">
          <ion-button data-testid="approve-booking" color="success" (click)="approve(booking.id)">
            Aprobar
          </ion-button>
          <ion-button data-testid="reject-booking" color="danger" fill="outline" (click)="reject(booking.id)">
            Rechazar
          </ion-button>
        </div>
      </article>
    </section>
  `,
  styles: [
    `
    .bookings {
      display: grid;
      gap: 1rem;
    }

    .booking-card {
      padding: 1rem;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
      background: #fff;
    }

    .actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.75rem;
    }
    `,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BookingsReceivedComponent {
  readonly bookings = signal<ReceivedBooking[]>([]);

  @Output() readonly bookingApproved = new EventEmitter<string>();
  @Output() readonly bookingRejected = new EventEmitter<string>();

  approve(id?: string): void {
    if (id) {
      this.bookingApproved.emit(id);
    }
  }

  reject(id?: string): void {
    if (id) {
      this.bookingRejected.emit(id);
    }
  }
}
