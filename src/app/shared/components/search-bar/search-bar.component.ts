import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="searchForm" data-testid="search-form" (ngSubmit)="onSubmit()">
      <ion-input
        data-testid="location-input"
        formControlName="location"
        label="Ubicación"
        placeholder="Ciudad"
      ></ion-input>

      <ion-input
        data-testid="start-date-input"
        type="date"
        formControlName="startDate"
        label="Desde"
      ></ion-input>

      <ion-input
        data-testid="end-date-input"
        type="date"
        formControlName="endDate"
        label="Hasta"
      ></ion-input>

      <ion-button
        data-testid="search-button"
        type="submit"
        [disabled]="searchForm.invalid"
      >
        Buscar
      </ion-button>
    </form>
  `,
  styles: [
    `
    form {
      display: grid;
      gap: 0.75rem;
      align-items: center;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }

    ion-button {
      justify-self: start;
    }
    `,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SearchBarComponent {
  private readonly fb = inject(FormBuilder);

  readonly searchForm = this.fb.group({
    location: ['', [Validators.required]],
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
  });

  @Output() readonly search = new EventEmitter<{ location: string; startDate: string; endDate: string }>();

  onSubmit(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    this.search.emit(this.searchForm.getRawValue() as { location: string; startDate: string; endDate: string });
  }
}
