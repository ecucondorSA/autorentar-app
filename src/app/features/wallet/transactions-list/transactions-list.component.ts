import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

interface WalletTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'payment';
  amount_cents?: number;
  status?: string | null;
  created_at?: string | null;
}

@Component({
  selector: 'app-transactions-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="transactions">
      <div class="filters">
        <ion-select data-testid="type-filter" [ngModel]="typeFilter()" (ngModelChange)="setType($event)">
          <ion-select-option value="all">Todos</ion-select-option>
          <ion-select-option value="deposit">Depósitos</ion-select-option>
          <ion-select-option value="withdrawal">Retiros</ion-select-option>
          <ion-select-option value="payment">Pagos</ion-select-option>
        </ion-select>

        <input data-testid="date-filter" type="date" [ngModel]="dateFilter()" (ngModelChange)="setDate($event)" />
      </div>

      <ion-spinner *ngIf="loading()" data-testid="loading-spinner"></ion-spinner>

      <p *ngIf="!loading() && filteredTransactions().length === 0" data-testid="empty-transactions">
        No hay movimientos para mostrar.
      </p>

      <ul data-testid="transactions-list" *ngIf="filteredTransactions().length">
        <li *ngFor="let txn of filteredTransactions()" data-testid="transaction-item">
          <span data-testid="transaction-type">{{ txn.type | titlecase }}</span>
          <span data-testid="transaction-amount">{{ formatCurrency(txn.amount_cents ?? 0) }}</span>
          <span data-testid="transaction-status">{{ txn.status || 'pendiente' }}</span>
          <span data-testid="transaction-date">{{ formatDate(txn.created_at) }}</span>
        </li>
      </ul>
    </section>
  `,
  styles: [
    `
    .transactions {
      display: grid;
      gap: 1rem;
    }

    .filters {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    ul {
      display: grid;
      gap: 0.75rem;
    }

    li {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      background: #fff;
      border: 1px solid #e2e8f0;
    }
    `,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TransactionsListComponent {
  readonly transactions = signal<WalletTransaction[]>([]);
  readonly loading = signal(false);

  readonly typeFilter = signal<'all' | 'deposit' | 'withdrawal' | 'payment'>('all');
  readonly dateFilter = signal('');

  readonly filteredTransactions = computed(() => {
    const type = this.typeFilter();
    const date = this.dateFilter();

    return this.transactions().filter((txn) => {
      const matchesType = type === 'all' || txn.type === type;
      const matchesDate = !date || (txn.created_at ?? '').startsWith(date);
      return matchesType && matchesDate;
    });
  });

  setType(value: 'all' | 'deposit' | 'withdrawal' | 'payment'): void {
    this.typeFilter.set(value);
  }

  setDate(value: string): void {
    this.dateFilter.set(value);
  }

  formatCurrency(cents: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  }

  formatDate(value?: string | null): string {
    if (!value) {
      return '—';
    }
    return new Date(value).toLocaleDateString('es-AR');
  }
}
