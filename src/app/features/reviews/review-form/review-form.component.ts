import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <ion-range data-testid="rating-input" min="1" max="5" step="1" snaps="true" formControlName="rating"></ion-range>
      <ion-textarea data-testid="comment-input" formControlName="comment" label="Comentario"></ion-textarea>
      <ion-button data-testid="submit-review" type="submit" [disabled]="form.invalid">Enviar reseña</ion-button>
    </form>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ReviewFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    rating: [5, [Validators.required]],
    comment: ['', [Validators.required, Validators.minLength(10)]],
  });

  @Output() readonly submitted = new EventEmitter<{ rating: number; comment: string }>();

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitted.emit(this.form.getRawValue() as { rating: number; comment: string });
  }
}
