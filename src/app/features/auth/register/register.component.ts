import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonInput, IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonInput, IonButton],
  template: `
    <form [formGroup]="registerForm" data-testid="register-form" (ngSubmit)="onSubmit()">
      <ion-input data-testid="name-input" formControlName="fullName" label="Nombre completo"></ion-input>
      <ion-input data-testid="email-input" formControlName="email" label="Email" type="email"></ion-input>
      <ion-input data-testid="password-input" formControlName="password" label="Contraseña" type="password"></ion-input>
      <ion-input data-testid="password-confirm-input" formControlName="passwordConfirm" label="Confirmar contraseña" type="password"></ion-input>

      <p *ngIf="showPasswordMismatch" data-testid="password-match-error" class="error">
        Las contraseñas deben coincidir.
      </p>

      <ion-button data-testid="submit-register" type="submit" [disabled]="registerForm.invalid">
        Crear cuenta
      </ion-button>
    </form>
  `,
  styles: [
    `
    form {
      display: grid;
      gap: 1rem;
      max-width: 480px;
    }

    .error {
      color: #dc2626;
      font-size: 0.875rem;
    }
    `,
  ],
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly registerForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    passwordConfirm: ['', [Validators.required]],
  });

  get showPasswordMismatch(): boolean {
    const { password, passwordConfirm } = this.registerForm.value;
    return Boolean(password && passwordConfirm && password !== passwordConfirm);
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid || this.showPasswordMismatch) {
      this.registerForm.markAllAsTouched();
      return;
    }

    await this.router.navigate(['/auth/login']);
  }
}
