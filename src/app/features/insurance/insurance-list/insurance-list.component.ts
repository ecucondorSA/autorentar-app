import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

type InsurancePolicy = {
  id: string;
  policy_number?: string | null;
  provider?: string | null;
  coverage_type?: string | null;
  status?: string | null;
  expiration_date?: string | null;
};

@Component({
  selector: 'app-insurance-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section data-testid="insurance-list">
      <ion-button data-testid="add-policy-button" expand="block" color="primary">
        Agregar póliza
      </ion-button>

      <article
        *ngFor="let policy of policies()"
        data-testid="insurance-card"
        (click)="handleSelect(policy.id)"
      >
        <header>
          <h3 data-testid="policy-number">{{ policy.policy_number || 'Sin número' }}</h3>
          <span data-testid="policy-status">{{ policy.status || 'pending' }}</span>
        </header>
        <p data-testid="provider">{{ policy.provider || 'Proveedor desconocido' }}</p>
        <p data-testid="coverage-type">Cobertura: {{ policy.coverage_type || 'N/A' }}</p>
        <p data-testid="expiration-date">
          Expira: {{ policy.expiration_date || 'sin fecha' }}
        </p>
      </article>
    </section>
  `,
  styles: [
    `
    section {
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

    ion-button {
      width: 100%;
    }
    `,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class InsuranceListComponent {
  @Input() set policiesInput(value: InsurancePolicy[] | null | undefined) {
    this.policies.set(value ?? []);
  }

  @Output() readonly viewDetails = new EventEmitter<string>();

  readonly policies = signal<InsurancePolicy[]>([]);

  handleSelect(policyId: string | undefined): void {
    if (!policyId) {
      return;
    }
    this.viewDetails.emit(policyId);
  }
}
