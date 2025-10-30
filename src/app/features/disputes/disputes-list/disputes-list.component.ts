import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

interface DisputeSummary {
  id: string;
  booking_id?: string | null;
  reason?: string | null;
  status?: string | null;
  created_at?: string | null;
  evidence_count?: number | null;
}

@Component({
  selector: 'app-disputes-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="disputes">
      <header>
        <h2>Disputas</h2>
        <ion-button data-testid="create-dispute-button" (click)="createDispute()">Crear disputa</ion-button>
      </header>

      <div data-testid="disputes-list" class="disputes__list">
        <article
          *ngFor="let dispute of disputes()"
          data-testid="dispute-card"
          (click)="openDispute(dispute.id)"
        >
          <h3 data-testid="dispute-reason">{{ dispute.reason || 'Disputa' }}</h3>
          <p data-testid="dispute-status">Estado: {{ dispute.status || 'open' }}</p>
          <p data-testid="dispute-date">{{ formatDate(dispute.created_at) }}</p>
          <p data-testid="evidence-count">Evidencia: {{ dispute.evidence_count ?? 0 }}</p>
          <a data-testid="booking-link" (click)="goToBooking(dispute.booking_id); $event.stopPropagation()">
            Ver reserva
          </a>
        </article>
      </div>
    </section>
  `,
  styles: [
    `
    .disputes {
      display: grid;
      gap: 1rem;
    }

    .disputes__list {
      display: grid;
      gap: 1rem;
    }

    article {
      padding: 1rem;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
      background: #fff;
      cursor: pointer;
    }
    `,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DisputesListComponent {
  readonly disputes = signal<DisputeSummary[]>([]);

  @Output() readonly viewDispute = new EventEmitter<string>();
  @Output() readonly create = new EventEmitter<void>();

  constructor(private readonly router: Router) {}

  openDispute(id?: string | null): void {
    if (id) {
      this.viewDispute.emit(id);
    }
  }

  createDispute(): void {
    this.create.emit();
  }

  goToBooking(bookingId?: string | null): void {
    if (!bookingId) {
      return;
    }
    void this.router.navigate(['/bookings', bookingId]);
  }

  formatDate(value?: string | null): string {
    if (!value) {
      return '—';
    }
    return new Date(value).toLocaleDateString('es-AR');
  }
}
