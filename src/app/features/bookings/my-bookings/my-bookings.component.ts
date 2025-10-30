import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

type BookingStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

interface BookingItem {
  id: string;
  status: BookingStatus;
  car?: string | null;
}

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="my-bookings">
      <nav data-testid="status-tabs" class="tabs">
        <button
          *ngFor="let status of statuses"
          type="button"
          [class.active]="status === activeStatus()"
          (click)="setStatus(status)"
        >
          {{ status | titlecase }}
        </button>
      </nav>

      <div *ngIf="bookings().length === 0" data-testid="empty-bookings" class="empty">
        Aún no tenés reservas.
      </div>

      <ul data-testid="bookings-list" *ngIf="bookings().length">
        <li *ngFor="let booking of bookings()">
          {{ booking.car || 'Reserva' }} — {{ booking.status | titlecase }}
        </li>
      </ul>
    </section>
  `,
  styles: [
    `
    .tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .tabs button {
      padding: 0.5rem 1rem;
      border-radius: 999px;
      border: 1px solid #cbd5f5;
      background: white;
    }

    .tabs button.active {
      background: #1d4ed8;
      color: white;
    }

    .empty {
      padding: 1.5rem;
      text-align: center;
      background: #f8fafc;
      border-radius: 1rem;
    }
    `,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MyBookingsComponent {
  readonly statuses: BookingStatus[] = ['upcoming', 'active', 'completed', 'cancelled'];
  readonly activeStatus = signal<BookingStatus>('upcoming');
  readonly bookings = signal<BookingItem[]>([]);

  setStatus(status: BookingStatus): void {
    this.activeStatus.set(status);
  }
}
