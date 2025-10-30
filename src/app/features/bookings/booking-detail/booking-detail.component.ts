import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, computed, signal } from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';

type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';

interface BookingSummary {
  id: string;
  status: BookingStatus;
  car?: {
    brand?: string | null;
    model?: string | null;
  } | null;
  start_date?: string | null;
  end_date?: string | null;
  total_paid_cents?: number | null;
}

@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [CommonModule, IonButton],
  template: `
    <section class="booking-detail">
      <header>
        <h2>Detalle de la reserva</h2>
        <span data-testid="booking-status" [class]="bookingStatusClass()">
          {{ bookingStatusLabel() }}
        </span>
      </header>

      <section data-testid="car-details">
        <h3>Vehículo</h3>
        <p>{{ carTitle() }}</p>
      </section>

      <section data-testid="booking-dates">
        <h3>Fechas</h3>
        <p>{{ formattedDates() }}</p>
      </section>

      <section data-testid="total-paid">
        <h3>Total abonado</h3>
        <p>{{ totalPaid() }}</p>
      </section>

      <ion-button
        *ngIf="booking()?.status === 'pending'"
        data-testid="cancel-booking"
        color="danger"
        expand="block"
        (click)="cancel()"
      >
        Cancelar reserva
      </ion-button>
    </section>
  `,
  styles: [
    `
    .booking-detail {
      display: grid;
      gap: 1.5rem;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    [data-testid="booking-status"] {
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      background: #e2e8f0;
      font-size: 0.875rem;
      text-transform: capitalize;
    }
    `,
  ],
})
export class BookingDetailComponent {
  readonly booking = signal<BookingSummary | null>(null);

  @Output() readonly cancelBooking = new EventEmitter<string>();

  bookingStatusLabel = computed(() => this.booking()?.status ?? 'pending');

  bookingStatusClass = computed(() => `status-${this.booking()?.status ?? 'pending'}`);

  carTitle = computed(() => {
    const car = this.booking()?.car;
    if (!car) {
      return 'Sin información';
    }
    return [car.brand, car.model].filter(Boolean).join(' ');
  });

  formattedDates = computed(() => {
    const booking = this.booking();
    if (!booking?.start_date || !booking?.end_date) {
      return 'Fechas no disponibles';
    }
    return `${booking.start_date} → ${booking.end_date}`;
  });

  totalPaid = computed(() => {
    const cents = this.booking()?.total_paid_cents ?? 0;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  });

  cancel(): void {
    const booking = this.booking();
    if (!booking) {
      return;
    }
    this.cancelBooking.emit(booking.id);
  }
}
