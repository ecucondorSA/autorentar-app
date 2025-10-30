import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, EventEmitter, Output, computed, signal } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

interface ClaimSummary {
  id: string;
  claim_number?: string | null;
  status?: string | null;
  amount_cents?: number | null;
  incident_date?: string | null;
}

@Component({
  selector: 'app-claims-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="claims">
      <header>
        <h2>Reclamos</h2>
        <ion-select data-testid="status-filter" [ngModel]="statusFilter()" (ngModelChange)="setStatus($event)">
          <ion-select-option value="all">Todos</ion-select-option>
          <ion-select-option value="pending">Pendientes</ion-select-option>
          <ion-select-option value="approved">Aprobados</ion-select-option>
          <ion-select-option value="rejected">Rechazados</ion-select-option>
        </ion-select>
        <ion-button data-testid="create-claim-button" (click)="createClaim()">Nuevo reclamo</ion-button>
      </header>

      <div data-testid="claims-list" class="claims__list">
        <article
          *ngFor="let claim of filteredClaims()"
          data-testid="claim-card"
          (click)="openClaim(claim.id)"
        >
          <h3 data-testid="claim-number">{{ claim.claim_number || 'Reclamo' }}</h3>
          <p data-testid="claim-status">Estado: {{ claim.status || 'pending' }}</p>
          <p data-testid="claim-amount">Monto: {{ formatCurrency(claim.amount_cents ?? 0) }}</p>
          <p data-testid="incident-date">Incidente: {{ claim.incident_date || '—' }}</p>
        </article>
      </div>
    </section>
  `,
  styles: [
    `
    .claims {
      display: grid;
      gap: 1rem;
    }

    .claims__list {
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
export class ClaimsListComponent {
  readonly claims = signal<ClaimSummary[]>([]);
  readonly statusFilter = signal<'all' | 'pending' | 'approved' | 'rejected'>('all');

  @Output() readonly viewClaim = new EventEmitter<string>();
  @Output() readonly create = new EventEmitter<void>();

  readonly filteredClaims = computed(() => {
    const filter = this.statusFilter();
    if (filter === 'all') {
      return this.claims();
    }
    return this.claims().filter((claim) => claim.status === filter);
  });

  setStatus(value: 'all' | 'pending' | 'approved' | 'rejected'): void {
    this.statusFilter.set(value);
  }

  createClaim(): void {
    this.create.emit();
  }

  openClaim(id?: string | null): void {
    if (id) {
      this.viewClaim.emit(id);
    }
  }

  formatCurrency(cents: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  }
}
