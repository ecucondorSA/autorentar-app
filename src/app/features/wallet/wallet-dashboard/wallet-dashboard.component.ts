import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

interface WalletTransactionSummary {
  id: string;
  type: 'deposit' | 'withdrawal' | 'payment';
  amount_cents?: number;
}

@Component({
  selector: 'app-wallet-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="wallet-dashboard">
      <header>
        <h2>Wallet</h2>
        <div class="actions">
          <ion-button data-testid="deposit-button" (click)="goToDeposit()">Depositar</ion-button>
          <ion-button data-testid="withdraw-button" fill="outline" (click)="goToWithdraw()">Retirar</ion-button>
        </div>
      </header>

      <div class="balances">
        <div data-testid="wallet-balance">Saldo total: {{ formatCurrency(balance()) }}</div>
        <div data-testid="locked-funds">Fondos retenidos: {{ formatCurrency(lockedFunds()) }}</div>
        <div data-testid="available-balance">Disponible: {{ formatCurrency(availableBalance()) }}</div>
      </div>

      <section data-testid="recent-transactions">
        <h3>Movimientos recientes</h3>
        <p *ngIf="recentTransactions().length === 0">Sin movimientos</p>
        <ul>
          <li *ngFor="let txn of recentTransactions()" data-testid="transaction-item">
            {{ txn.type | titlecase }} — {{ formatCurrency(txn.amount_cents ?? 0) }}
          </li>
        </ul>
      </section>
    </section>
  `,
  styles: [
    `
    .wallet-dashboard {
      display: grid;
      gap: 1.5rem;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .balances {
      display: grid;
      gap: 0.75rem;
      background: #f8fafc;
      border-radius: 1rem;
      padding: 1.5rem;
    }
    `,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class WalletDashboardComponent {
  readonly balance = signal(0);
  readonly lockedFunds = signal(0);
  readonly recentTransactions = signal<WalletTransactionSummary[]>([]);

  constructor(private readonly router: Router) {}

  availableBalance(): number {
    return Math.max(0, this.balance() - this.lockedFunds());
  }

  formatCurrency(cents: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  }

  goToDeposit(): void {
    void this.router.navigate(['/wallet/deposit']);
  }

  goToWithdraw(): void {
    void this.router.navigate(['/wallet/withdraw']);
  }
}
