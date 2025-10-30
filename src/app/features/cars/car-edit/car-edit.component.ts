import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-car-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form data-testid="car-edit-form" [formGroup]="form" (ngSubmit)="save()">
      <ion-input data-testid="price-input" type="number" formControlName="pricePerDay" label="Precio por día"></ion-input>
      <ion-input data-testid="status-input" formControlName="status" label="Estado"></ion-input>

      <div class="actions">
        <ion-button data-testid="save-button" type="submit" [disabled]="form.invalid">Guardar cambios</ion-button>
        <ion-button data-testid="delete-button" color="danger" fill="outline" type="button" (click)="delete()">Eliminar auto</ion-button>
      </div>
    </form>
  `,
  styles: [
    `
    .actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1rem;
    }
    `,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CarEditComponent {
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.group({
    pricePerDay: [80, [Validators.required, Validators.min(1)]],
    status: ['active', Validators.required],
  });

  @Output() readonly updated = new EventEmitter<{ pricePerDay: number; status: string }>();
  @Output() readonly deleted = new EventEmitter<void>();

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.updated.emit(this.form.getRawValue() as { pricePerDay: number; status: string });
  }

  delete(): void {
    this.deleted.emit();
  }
}
