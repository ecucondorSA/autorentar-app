import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

interface UpcomingBooking {
  id: string;
  start_date: string;
  car_brand?: string | null;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="dashboard">
      <h1 data-testid="welcome-message">Hola, {{ userName() || 'conductor' }} 👋</h1>

      <div class="metrics">
        <div data-testid="active-bookings-count">Reservas activas: {{ activeBookings() }}</div>
        <div data-testid="wallet-balance">Saldo wallet: {{ formatCurrency(walletBalance()) }}</div>
        <div data-testid="total-cars-count">Autos publicados: {{ totalCars() }}</div>
        <div data-testid="pending-reviews-count">Reseñas pendientes: {{ pendingReviews() }}</div>
      </div>

      <section data-testid="quick-actions" class="quick-actions">
        <ion-button data-testid="publish-car-button" (click)="goToPublish()">Publicar un auto</ion-button>
        <ion-button (click)="goToBookings()">Ver reservas</ion-button>
      </section>

      <section data-testid="recent-activity" class="recent">
        <h2>Próximas reservas</h2>
        <div *ngIf="upcomingBookings().length === 0">No hay reservas programadas.</div>
        <ul>
          <li *ngFor="let booking of upcomingBookings()" data-testid="upcoming-booking">
            {{ booking.car_brand || 'Auto' }} — {{ booking.start_date }}
          </li>
        </ul>
      </section>

      <section data-testid="bookings-section" class="card" (click)="goToBookings()">
        Gestioná tus reservas
      </section>
    </section>
  `,
  styles: [
    `
    .dashboard {
      display: grid;
      gap: 1.5rem;
    }

    .metrics {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }

    .quick-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .recent ul {
      display: grid;
      gap: 0.5rem;
    }

    .card {
      padding: 1rem;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      background: #fff;
      cursor: pointer;
    }
    `,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DashboardComponent {
  readonly userName = signal('');
  readonly activeBookings = signal(0);
  readonly walletBalance = signal(0);
  readonly totalCars = signal(0);
  readonly pendingReviews = signal(0);
  readonly upcomingBookings = signal<UpcomingBooking[]>([]);

  constructor(private readonly router: Router) {}

  formatCurrency(cents: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  }

  goToPublish(): void {
    void this.router.navigate(['/cars/publish']);
  }

  goToBookings(): void {
    void this.router.navigate(['/bookings']);
  }
}
