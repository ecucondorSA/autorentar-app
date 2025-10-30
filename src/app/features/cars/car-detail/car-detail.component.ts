import { CommonModule } from '@angular/common'
import type { OnInit} from '@angular/core';
import { Component, inject, signal } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonSpinner,
  IonChip,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonTextarea,
} from '@ionic/angular/standalone'
import { addIcons } from 'ionicons'
import { star, location, carSport, close } from 'ionicons/icons'
import { FormsModule } from '@angular/forms'

// Types y SDK
import { carSDK } from '@/lib/sdk/car.sdk'
import { messageSDK } from '@/lib/sdk/message.sdk'
import type { CarDTO } from '@/types'

interface ChatMessage {
  id: string;
  content: string;
  created_at: string;
  sent?: boolean;
}

@Component({
  selector: 'app-car-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonSpinner,
    IonChip,
    IonIcon,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonTextarea,
  ],
  template: `
    <ion-content class="ion-padding" data-testid="car-detail-content">
      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-container">
          <ion-spinner data-testid="loading-spinner"></ion-spinner>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="error-container">
          <ion-card color="danger">
            <ion-card-content data-testid="error-message">
              {{ error() }}
            </ion-card-content>
          </ion-card>
        </div>
      }

      <!-- Car Details -->
      @if (!loading() && !error() && car()) {
        <div class="car-detail" data-testid="car-detail">
          <!-- Main Photo -->
          @if (car()!.photo_main_url) {
            <img
              [src]="car()!.photo_main_url"
              [alt]="car()!.brand + ' ' + car()!.model"
              data-testid="car-main-image"
              class="car-main-photo"
            />
          }

          <!-- Header Card -->
          <ion-card>
            <ion-card-header>
              <ion-card-title data-testid="car-title">
                {{ car()!.brand }} {{ car()!.model }} {{ car()!.year }}
              </ion-card-title>
            </ion-card-header>

            <ion-card-content>
              <!-- Price -->
              <p data-testid="car-price" class="price">
                {{ formatPrice(car()!.price_per_day_cents) }}/día
              </p>

              <!-- Location -->
              <p data-testid="car-location" class="location">
                <ion-icon name="location"></ion-icon>
                {{ car()!.location_city }}, {{ car()!.location_country }}
              </p>

              <!-- Rating -->
              @if (car()!.rating_avg) {
                <p data-testid="car-rating" class="rating">
                  <ion-icon name="star"></ion-icon>
                  {{ car()!.rating_avg }} ({{ car()!.rating_count }} reviews)
                </p>
              }

              <!-- Specs -->
              <div class="car-specs">
                <ion-chip data-testid="car-transmission">
                  {{ car()!.transmission }}
                </ion-chip>
                <ion-chip data-testid="car-fuel">
                  {{ car()!.fuel_type }}
                </ion-chip>
                <ion-chip data-testid="car-seats">
                  {{ car()!.seats }}
                </ion-chip>
                @if (car()!.doors) {
                  <ion-chip>
                    {{ car()!.doors }} puertas
                  </ion-chip>
                }
              </div>

              <!-- Action Buttons -->
              <div class="action-buttons">
                <ion-button
                  expand="block"
                  data-testid="book-now-button"
                  (click)="onBookNow()"
                  [disabled]="loading()"
                  class="book-now-button"
                >
                  Reservar Ahora
                </ion-button>

                <ion-button
                  expand="block"
                  fill="outline"
                  data-testid="contact-owner-button"
                  (click)="openChat()"
                  [disabled]="loading()"
                  class="contact-button"
                >
                  Contactar al Dueño
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>
        </div>
      }

      <!-- Chat Modal -->
      <ion-modal
        [isOpen]="showChatModal()"
        (didDismiss)="closeChat()"
        data-testid="chat-modal"
      >
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Chat con el Dueño</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeChat()" data-testid="close-chat-button">
                  <ion-icon name="close"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>

          <ion-content class="ion-padding">
            <!-- Message List -->
            <div class="messages-container" data-testid="chat-conversation">
              @for (msg of messages(); track msg.id) {
                <div class="message-item" data-testid="message-item">
                  <p>{{ msg.content }}</p>
                  <small>{{ msg.created_at }}</small>
                  @if (msg.sent) {
                    <span data-testid="message-sent-indicator" class="sent-indicator">✓</span>
                  }
                </div>
              }
            </div>

            <!-- Message Input -->
            <div class="message-input-container">
              <ion-textarea
                [(ngModel)]="messageText"
                data-testid="message-input"
                placeholder="Escribe tu mensaje..."
                [autoGrow]="true"
                rows="2"
              ></ion-textarea>
              <ion-button
                data-testid="send-message-button"
                (click)="sendMessage()"
                [disabled]="!messageText.trim() || sendingMessage()"
              >
                {{ sendingMessage() ? 'Enviando...' : 'Enviar' }}
              </ion-button>
            </div>
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: [`
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
    }

    .error-container {
      padding: 2rem;
    }

    .car-detail {
      max-width: 800px;
      margin: 0 auto;
    }

    .car-main-photo {
      width: 100%;
      height: 300px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .price {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--ion-color-primary);
      margin: 1rem 0;
    }

    .location,
    .rating,
    .year {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--ion-color-medium);
      margin: 0.5rem 0;
    }

    .rating {
      color: var(--ion-color-warning);
    }

    .car-specs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 1rem 0;
    }

    .book-now-button {
      margin-top: 1.5rem;
    }

    ion-icon {
      font-size: 1.2rem;
    }

    @media (max-width: 768px) {
      .car-main-photo {
        height: 200px;
      }
    }
  `]
})
export class CarDetailComponent implements OnInit {
  private readonly router = inject(Router)
  private readonly route = inject(ActivatedRoute)

  // Signals para state management
  readonly car = signal<CarDTO | null>(null)
  readonly loading = signal(true)  // Start with loading = true
  readonly error = signal<string | null>(null)
  readonly showChatModal = signal(false)
  readonly messages = signal<ChatMessage[]>([])
  readonly sendingMessage = signal(false)

  messageText = ''

  constructor() {
    // Register icons
    addIcons({ star, location, carSport, close })
  }

  ngOnInit(): void {
    // Get car ID from route params
    this.route.params.subscribe(params => {
      const carId = params['id'] as string
      if (carId) {
        void this.loadCar(carId)
      }
    })
  }

  async loadCar(carId: string): Promise<void> {
    this.loading.set(true)
    this.error.set(null)

    try {
      const carData = await carSDK.getById(carId)
      this.car.set(carData)
    } catch (err) {
      console.error('Error loading car:', err)
      this.error.set('No se pudo cargar el auto')
      this.car.set(null)
    } finally {
      this.loading.set(false)
    }
  }

  onBookNow(): void {
    const carId = this.car()?.id
    if (carId) {
      void this.router.navigate(['/bookings/create'], {
        queryParams: { carId },
      })
    }
  }

  openChat(): void {
    this.showChatModal.set(true)
  }

  closeChat(): void {
    this.showChatModal.set(false)
  }

  async sendMessage(): Promise<void> {
    const content = this.messageText.trim()
    if (!content || !this.car()?.owner_id) {
      return
    }

    this.sendingMessage.set(true)
    try {
      // Send message using SDK
      await messageSDK.create({
        sender_id: 'current-user-id', // TODO: Get from auth
        recipient_id: this.car()!.owner_id,
        body: content,
        car_id: this.car()!.id,
      })

      // Add message to local list
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        content,
        created_at: new Date().toISOString(),
        sent: true,
      }
      this.messages.update(msgs => [...msgs, newMessage])

      // Clear input
      this.messageText = ''
    } catch (error) {
      console.error('Error sending message:', error)
      // TODO: Show error toast to user
    } finally {
      this.sendingMessage.set(false)
    }
  }

  // Helper methods
  formatPrice(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`
  }

  formatFuelType(fuel: string): string {
    const map: Record<string, string> = {
      gasoline: 'Nafta',
      diesel: 'Gasoil',
      electric: 'Eléctrico',
      hybrid: 'Híbrido'
    }
    return map[fuel] ?? fuel
  }

  formatTransmission(transmission: string): string {
    const map: Record<string, string> = {
      automatic: 'Automático',
      manual: 'Manual'
    }
    return map[transmission] ?? transmission
  }
}
