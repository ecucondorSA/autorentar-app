import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-car-publish',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form data-testid="car-publish-form" [formGroup]="form" (ngSubmit)="submit()">
      <ion-input data-testid="brand-input" formControlName="brand" label="Marca"></ion-input>
      <ion-input data-testid="model-input" formControlName="model" label="Modelo"></ion-input>
      <ion-input data-testid="year-input" formControlName="year" type="number" label="Año"></ion-input>
      <ion-input data-testid="price-input" formControlName="pricePerDay" type="number" label="Precio por día"></ion-input>
      <input data-testid="photo-upload" type="file" (change)="onPhotoSelected($event)" />
      <ion-input data-testid="location-input" formControlName="location" label="Ubicación"></ion-input>

      <ion-button data-testid="publish-button" type="submit" [disabled]="form.invalid">
        Publicar auto
      </ion-button>
    </form>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CarPublishComponent {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    brand: ['', Validators.required],
    model: ['', Validators.required],
    year: [new Date().getFullYear(), Validators.required],
    pricePerDay: [50, [Validators.required, Validators.min(1)]],
    location: ['', Validators.required],
    photo: [null as File | null],
  });

  @Output() readonly carPublished = new EventEmitter<FormData>();

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.item(0) ?? null;
    this.form.patchValue({ photo: file });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    Object.entries(this.form.getRawValue()).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    });

    this.carPublished.emit(formData);
  }
}
