import { CommonModule } from '@angular/common'
import { Component, signal } from '@angular/core'
import { RouterModule } from '@angular/router'
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
} from '@ionic/angular/standalone'

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
  ],
  template: `
    <ion-content class="ion-padding">
      <div data-testid="profile-edit-container">
        <ion-card>
          <ion-card-header>
            <ion-card-title class="ion-text-center">
              Editar Perfil
            </ion-card-title>
          </ion-card-header>

          <ion-card-content>
            <form data-testid="profile-edit-form">
              <!-- Avatar Upload -->
              <div class="avatar-section ion-margin-bottom">
                <label>Foto de Perfil</label>
                <input
                  type="file"
                  data-testid="avatar-upload"
                  accept="image/*"
                  class="ion-margin-top"
                />
              </div>

              <!-- Name Input -->
              <ion-item>
                <ion-label position="stacked">Nombre *</ion-label>
                <ion-input
                  type="text"
                  data-testid="name-input"
                  placeholder="Tu nombre"
                  autocomplete="name"
                ></ion-input>
              </ion-item>

              <!-- Email Input -->
              <ion-item>
                <ion-label position="stacked">Email *</ion-label>
                <ion-input
                  type="email"
                  data-testid="email-input"
                  placeholder="tu@email.com"
                  autocomplete="email"
                  disabled
                ></ion-input>
              </ion-item>

              <!-- Phone Input -->
              <ion-item>
                <ion-label position="stacked">Teléfono</ion-label>
                <ion-input
                  type="tel"
                  data-testid="phone-input"
                  placeholder="+54..."
                  autocomplete="tel"
                ></ion-input>
              </ion-item>

              <!-- Action Buttons -->
              <div class="button-group ion-margin-top">
                <ion-button
                  expand="block"
                  type="submit"
                  data-testid="save-profile"
                  [disabled]="isLoading()"
                  class="ion-margin-bottom"
                >
                  {{ isLoading() ? 'Guardando...' : 'Guardar Cambios' }}
                </ion-button>

                <ion-button
                  expand="block"
                  fill="outline"
                  type="button"
                  data-testid="cancel-edit"
                  [disabled]="isLoading()"
                  routerLink="/auth/profile-view"
                >
                  Cancelar
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
      ion-card {
        width: 100%;
        max-width: 500px;
        margin: 0 auto;
      }

      ion-card-title {
        font-size: 1.5rem;
        font-weight: bold;
      }

      .avatar-section {
        text-align: center;
        padding: 1rem;
        border: 2px dashed #ccc;
        border-radius: 8px;
      }

      .avatar-section input {
        cursor: pointer;
      }

      .button-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      /* Desktop styles */
      @media (min-width: 768px) {
        ion-card {
          max-width: 600px;
        }

        ion-card-title {
          font-size: 2rem;
        }
      }
    `,
  ],
})
export class ProfileEditComponent {
  readonly isLoading = signal(false)
}
