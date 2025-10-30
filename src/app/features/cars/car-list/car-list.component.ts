import { CommonModule } from '@angular/common'
import type { OnInit} from '@angular/core';
import { Component, inject, signal } from '@angular/core'
import { Router } from '@angular/router'
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
} from '@ionic/angular/standalone'

// ✅ STEP 1: Importar TYPES reales
import { carSDK } from '@/lib/sdk/car.sdk'
import type { CarDTO } from '@/types'

// ✅ STEP 2: Importar SDK real

@Component({
  selector: 'app-car-list',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSpinner,
  ],
  template: `
    <ion-content class="ion-padding" data-testid="car-list-content">
      @if (loading()) {
        <div class="loading-container">
          <ion-spinner data-testid="loading-spinner"></ion-spinner>
        </div>
      }

      @if (!loading() && cars().length === 0) {
        <div class="empty-state">
          <p>No se encontraron autos disponibles</p>
        </div>
      }

      <div class="car-grid">
        @for (car of cars(); track car.id) {
          <ion-card
            data-testid="car-card"
            (click)="onCarClick(car.id)"
            button
          >
            @if (car.photo_main_url) {
              <img
                [src]="car.photo_main_url"
                [alt]="car.brand + ' ' + car.model"
              />
            }

            <ion-card-header>
              <ion-card-title data-testid="car-title">
                {{ car.brand }} {{ car.model }}
              </ion-card-title>
            </ion-card-header>

            <ion-card-content>
              <p data-testid="car-price" class="price">
                {{ formatPrice(car.price_per_day_cents) }}/día
              </p>

              <p data-testid="car-location" class="location">
                📍 {{ car.location_city }}, {{ car.location_country }}
              </p>

              @if (car.rating_avg) {
                <p class="rating">
                  ⭐ {{ car.rating_avg }} ({{ car.rating_count }} reviews)
                </p>
              }

              <p class="car-specs">
                🚗 {{ car.transmission === 'automatic' ? 'Automático' : 'Manual' }}
                • ⛽ {{ formatFuelType(car.fuel_type) }}
                • 👥 {{ car.seats }} asientos
              </p>
            </ion-card-content>
          </ion-card>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: var(--ion-color-medium);
    }

    .car-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    ion-card {
      margin: 0;
      cursor: pointer;
      transition: transform 0.2s;
    }

    ion-card:hover {
      transform: translateY(-4px);
    }

    ion-card img {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }

    .price {
      font-size: 1.25rem;
      font-weight: bold;
      color: var(--ion-color-primary);
      margin: 0.5rem 0;
    }

    .location {
      color: var(--ion-color-medium);
      margin: 0.25rem 0;
    }

    .rating {
      color: var(--ion-color-warning);
      margin: 0.25rem 0;
    }

    .car-specs {
      font-size: 0.875rem;
      color: var(--ion-color-medium);
      margin-top: 0.5rem;
    }

    @media (max-width: 768px) {
      .car-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CarListComponent implements OnInit {
  private readonly router = inject(Router)

  // ✅ Signals para state management
  readonly cars = signal<CarDTO[]>([])
  readonly loading = signal(false)

  ngOnInit(): void {
    void this.loadCars()
  }

  async loadCars(): Promise<void> {
    this.loading.set(true)
    try {
      // ✅ Llamada al SDK real (que retorna DTOs validados)
      const response = await carSDK.search({
        status: 'active',
        radius: 100,
        sortBy: 'price_asc',
        page: 1,
        pageSize: 20
      })

      // ✅ Los datos ya vienen validados con Zod desde el SDK
      this.cars.set(response.data)
    } catch (error) {
      console.error('Error loading cars:', error)
      this.cars.set([])
      // TODO: Show error toast to user
    } finally {
      this.loading.set(false)
    }
  }

  onCarClick(carId: string): void {
    void this.router.navigate(['/cars', carId])
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
}
