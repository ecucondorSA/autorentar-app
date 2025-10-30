import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-withdrawal-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form data-testid="withdrawal-form" [formGroup]="withdrawalForm" (ngSubmit)="confirm()">
      <div data-testid="available-balance">Disponible: {{ formatCurrency(availableBalance()) }}</div>

      <input data-testid="amount-input" type="number" formControlName="amount" min="1" />

      <ion-select data-testid="bank-account-select" formControlName="bank_account_id">
        <ion-select-option value="">Seleccioná una cuenta</ion-select-option>
        <ion-select-option value="bank-123">Cuenta principal</ion-select-option>
      </ion-select>

      <ion-button data-testid="submit-button" type="submit" [disabled]="withdrawalForm.invalid">
        Solicitar retiro
      </ion-button>
    </form>

    <section *ngIf="showConfirmation()" data-testid="confirmation-modal" class="modal">
      <p>Confirmá el retiro de {{ formatCurrency(withdrawalForm.value.amount ?? 0) }}</p>
      <ion-button color="success" (click)="submit()">Confirmar</ion-button>
      <ion-button fill="outline" (click)="cancel()">Cancelar</ion-button>
    </section>
  `,
  styles: [
    `
    form {
      display: grid;
      gap: 1rem;
      max-width: 360px;
    }

    .modal {
      margin-top: 1.5rem;
      padding: 1rem;
      border-radius: 1rem;
      background: #f8fafc;
      display: grid;
      gap: 1rem;
    }
    `,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class WithdrawalFormComponent {
  private readonly fb = inject(FormBuilder);
  readonly availableBalance = signal(0);
  readonly showConfirmation = signal(false);

  @Output() readonly withdraw = new EventEmitter<{ amount: number; bank_account_id: string }>();

  readonly withdrawalForm = this.fb.group(
    {
      amount: [null as number | null, [Validators.required, Validators.min(1)]],
      bank_account_id: ['', Validators.required],
    },
    { validators: () => this.validateBalance() }
  );


  formatCurrency(cents: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  }

  private validateBalance() {
    const amount = this.withdrawalForm.get('amount')?.value ?? 0;
    if (amount > this.availableBalance()) {
      return { insufficientFunds: true };
    }
    return null;
  }

  confirm(): void {
    this.withdrawalForm.updateValueAndValidity();
    if (this.withdrawalForm.invalid) {
      this.withdrawalForm.markAllAsTouched();
      return;
    }
    this.showConfirmation.set(true);
  }

  cancel(): void {
    this.showConfirmation.set(false);
  }

  submit(): void {
    if (this.withdrawalForm.invalid) {
      return;
    }
    this.showConfirmation.set(false);
    this.withdraw.emit(this.withdrawalForm.getRawValue() as { amount: number; bank_account_id: string });
  }
}
