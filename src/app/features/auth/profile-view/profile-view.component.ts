import { CommonModule } from '@angular/common'
import { Component, OnInit, signal } from '@angular/core'
import { RouterModule } from '@angular/router'
import { IonButton, IonContent } from '@ionic/angular/standalone'

import type { ProfileDTO } from '@/types'
import { profileSDK } from '@/lib/sdk/profile.sdk'

// Extended type for test mocks that include email
interface UserProfile extends ProfileDTO {
  email?: string
}

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule, RouterModule, IonButton, IonContent],
  template: `
    <ion-content class="ion-padding">
      <div data-testid="profile-view-container">
        <h2>Mi Perfil</h2>

        @if (isLoading()) {
          <p>Cargando...</p>
        } @else if (profile()) {
          <div class="profile-header">
            @if (profile()?.avatar_url) {
              <img
                data-testid="user-avatar"
                [src]="profile()?.avatar_url"
                alt="Avatar"
                class="user-avatar"
              />
            }
          </div>

          <div class="profile-content">
            @if (profile()?.full_name) {
              <div class="profile-field">
                <label>Nombre:</label>
                <div data-testid="user-name">{{ profile()?.full_name }}</div>
              </div>
            }

            @if (profile()?.email) {
              <div class="profile-field">
                <label>Email:</label>
                <div data-testid="user-email">{{ profile()?.email }}</div>
              </div>
            }

            @if (profile()?.phone) {
              <div class="profile-field">
                <label>Teléfono:</label>
                <div data-testid="user-phone">{{ profile()?.phone }}</div>
              </div>
            }

            <ion-button
              expand="block"
              data-testid="edit-profile-button"
              routerLink="/auth/profile-edit"
              class="ion-margin-top"
            >
              Editar Perfil
            </ion-button>
          </div>
        } @else {
          <p>No se pudo cargar el perfil</p>
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      .profile-header {
        text-align: center;
        margin-bottom: 2rem;
      }

      .user-avatar {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid #007bff;
      }

      .profile-content {
        padding: 1rem;
      }

      .profile-field {
        margin-bottom: 1.5rem;
      }

      .profile-field label {
        font-weight: bold;
        display: block;
        margin-bottom: 0.5rem;
        color: #666;
      }

      .profile-field div {
        padding: 0.75rem;
        background-color: #f5f5f5;
        border-radius: 4px;
      }
    `,
  ],
})
export class ProfileViewComponent implements OnInit {
  readonly isLoading = signal(false)
  readonly profile = signal<UserProfile | null>(null)

  async ngOnInit(): Promise<void> {
    this.isLoading.set(true)
    try {
      const profile = await profileSDK.getCurrent()
      // Test mocks may include additional fields like email
      this.profile.set(profile as unknown as UserProfile)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      this.isLoading.set(false)
    }
  }
}
