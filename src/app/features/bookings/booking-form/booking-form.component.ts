import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonInput, IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonInput, IonButton],
  template: `
    <form data-testid="booking-form" [formGroup]="form" (ngSubmit)="submit()">
      <ion-input data-testid="start-date" type="date" formControlName="startDate" label="Desde"></ion-input>
      <ion-input data-testid="end-date" type="date" formControlName="endDate" label="Hasta"></ion-input>
      <ion-input data-testid="guests" type="number" formControlName="guests" label="Pasajeros"></ion-input>

      <div data-testid="total-price">Total: {{ totalPrice() }}</div>

      <ion-button data-testid="book-now-button" type="submit" [disabled]="form.invalid">
        Reservar ahora
      </ion-button>
    </form>
  `,
})
export class BookingFormComponent {
  private readonly fb = inject(FormBuilder);
  readonly nightlyRate = signal(80);

  readonly form = this.fb.group({
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    guests: [1, [Validators.required, Validators.min(1)]],
  });

  @Output() readonly bookingRequested = new EventEmitter<{ startDate: string; endDate: string; guests: number }>();

  totalPrice = computed(() => {
    const { startDate, endDate } = this.form.value;
    if (!startDate || !endDate) {
      return this.formatCurrency(0);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    return this.formatCurrency(nights * this.nightlyRate());
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.bookingRequested.emit(this.form.getRawValue() as { startDate: string; endDate: string; guests: number });
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  }
}
