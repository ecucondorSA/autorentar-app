import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
  ],
  template: `
    <ion-content class="ion-padding">
      <div class="login-container">
        <ion-card>
          <ion-card-header>
            <ion-card-title class="ion-text-center">
              Iniciar Sesión
            </ion-card-title>
          </ion-card-header>

          <ion-card-content>
            <form
              [formGroup]="form"
              (ngSubmit)="onSubmit()"
              data-testid="login-form"
            >
              <!-- Email -->
              <ion-item>
                <ion-label position="stacked">Email *</ion-label>
                <ion-input
                  type="email"
                  formControlName="email"
                  data-testid="email-input"
                  placeholder="tu@email.com"
                  autocomplete="email"
                  [class.ion-invalid]="
                    form.get('email')?.invalid && form.get('email')?.touched
                  "
                  [class.ion-touched]="form.get('email')?.touched"
                ></ion-input>
              </ion-item>

              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <ion-text color="danger" data-testid="email-error">
                  <p class="error-message">
                    @if (form.get('email')?.errors?.['required']) { Email
                    requerido }
                    @if (form.get('email')?.errors?.['email']) { Formato de
                    email inválido }
                  </p>
                </ion-text>
              }

              <!-- Password -->
              <ion-item>
                <ion-label position="stacked">Contraseña *</ion-label>
                <ion-input
                  type="password"
                  formControlName="password"
                  data-testid="password-input"
                  placeholder="••••••••"
                  autocomplete="current-password"
                  [class.ion-invalid]="
                    form.get('password')?.invalid &&
                    form.get('password')?.touched
                  "
                  [class.ion-touched]="form.get('password')?.touched"
                ></ion-input>
              </ion-item>

              @if (form.get('password')?.invalid &&
              form.get('password')?.touched) {
                <ion-text color="danger" data-testid="password-error">
                  <p class="error-message">
                    Password requerido (mínimo 6 caracteres)
                  </p>
                </ion-text>
              }

              <!-- Submit Button -->
              <ion-button
                expand="block"
                type="submit"
                data-testid="submit-login"
                [disabled]="form.invalid || submitting()"
                class="ion-margin-top"
              >
                {{ submitting() ? 'Ingresando...' : 'Ingresar' }}
              </ion-button>

              <!-- Links -->
              <div class="form-footer ion-text-center ion-margin-top">
                <ion-button fill="clear" routerLink="/auth/register" size="small">
                  Crear cuenta
                </ion-button>
                <br />
                <ion-button fill="clear" routerLink="/auth/reset-password" size="small">
                  ¿Olvidaste tu contraseña?
                </ion-button>
              </div>
            </form>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .login-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100%;
        padding: 1rem;
      }

      ion-card {
        width: 100%;
        max-width: 400px;
        margin: 0;
      }

      ion-card-title {
        font-size: 1.5rem;
        font-weight: bold;
      }

      .error-message {
        margin: 0.5rem 0.75rem;
        font-size: 0.875rem;
      }

      .form-footer ion-button {
        text-transform: none;
      }

      /* Desktop styles */
      @media (min-width: 768px) {
        ion-card {
          max-width: 500px;
        }

        ion-card-title {
          font-size: 2rem;
        }
      }
    `,
  ],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly submitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required.bind(Validators), Validators.email.bind(Validators)]],
    password: ['', [Validators.required.bind(Validators), Validators.minLength(6)]],
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    this.submitting.set(true);
    try {
      const { email, password } = this.form.getRawValue();

      // TODO: Implement AuthService.login() when available
      console.error('Login attempt:', { email, password });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Navigate to dashboard
      await this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Login error:', error);
      // TODO: Show error toast to user
    } finally {
      this.submitting.set(false);
    }
  }
}
