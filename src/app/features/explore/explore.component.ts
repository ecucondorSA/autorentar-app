import { Component, type OnInit, signal, inject } from '@angular/core'
import { Router } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonSearchbar,
  IonButton,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone'
import { addIcons } from 'ionicons'
import { list, map } from 'ionicons/icons'

import { carSDK } from '@/lib/sdk/car.sdk'
import type { CarDTO } from '@/types'

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonCard,
    IonCardContent,
    IonSearchbar,
    IonButton,
    IonIcon,
    IonSpinner,
  ],
  template: `
    <ion-content class="ion-padding">
      <div class="explore-container">
        <!-- Header con búsqueda -->
        <div class="explore-header">
          <h1>Explorar Autos Disponibles</h1>

          <div class="search-controls">
            <ion-searchbar
              [(ngModel)]="searchQuery"
              placeholder="Buscar por ubicación, marca o modelo..."
              (ionChange)="onSearchChange()"
              data-testid="search-input"
            ></ion-searchbar>

            <div class="view-toggles">
              <ion-button
                [fill]="viewMode() === 'map' ? 'solid' : 'outline'"
                (click)="viewMode.set('map')"
                data-testid="map-view-button"
              >
                <ion-icon name="map" slot="start"></ion-icon>
                Mapa
              </ion-button>

              <ion-button
                [fill]="viewMode() === 'list' ? 'solid' : 'outline'"
                (click)="viewMode.set('list')"
                data-testid="list-view-button"
              >
                <ion-icon name="list" slot="start"></ion-icon>
                Lista
              </ion-button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        @if (loading()) {
          <div class="loading-container">
            <ion-spinner></ion-spinner>
            <p>Cargando autos disponibles...</p>
          </div>
        }

        <!-- Map View -->
        @if (!loading() && viewMode() === 'map') {
          <div class="map-view" data-testid="map-view">
            <ion-card>
              <ion-card-content>
                <p>Vista de mapa disponible próximamente</p>
              </ion-card-content>
            </ion-card>
          </div>
        }

        <!-- List View -->
        @if (!loading() && viewMode() === 'list') {
          <div class="list-view" data-testid="list-view">
            @if (cars().length === 0) {
              <ion-card>
                <ion-card-content>
                  <p>No se encontraron autos disponibles</p>
                </ion-card-content>
              </ion-card>
            }

            @for (car of cars(); track car.id) {
              <ion-card
                button
                (click)="onCarClick(car)"
                data-testid="car-card"
              >
                <div class="car-card-content">
                  @if (car.photo_main_url) {
                    <img
                      [src]="car.photo_main_url"
                      [alt]="car.brand + ' ' + car.model"
                      class="car-image"
                    />
                  }

                  <div class="car-info">
                    <h2>{{ car.brand }} {{ car.model }} {{ car.year }}</h2>
                    <p class="car-price">
                      \${{ formatPrice(car.price_per_day_cents) }}/día
                    </p>
                    <p class="car-location">
                      📍 {{ car.location_city }}, {{ car.location_country }}
                    </p>
                    <p class="car-specs">
                      🚗 {{ car.transmission === 'automatic' ? 'Automático' : 'Manual' }}
                      • 👥 {{ car.seats }} asientos
                    </p>
                  </div>
                </div>
              </ion-card>
            }
          </div>
        }

        <!-- Stats -->
        <div class="stats-bar">
          <p>{{ cars().length }} autos disponibles</p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .explore-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        gap: 1rem;
      }

      .explore-header h1 {
        margin: 0 0 1rem 0;
        font-size: 1.5rem;
      }

      .search-controls {
        display: flex;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
      }

      .search-controls ion-searchbar {
        flex: 1;
        min-width: 200px;
      }

      .view-toggles {
        display: flex;
        gap: 0.5rem;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 300px;
        gap: 1rem;
      }

      .map-view {
        flex: 1;
        min-height: 500px;
        border-radius: 8px;
        overflow: hidden;
      }

      .list-view {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .car-card-content {
        display: flex;
        gap: 1rem;
      }

      .car-image {
        width: 150px;
        height: 120px;
        object-fit: cover;
        border-radius: 8px;
      }

      .car-info {
        flex: 1;
      }

      .car-info h2 {
        margin: 0 0 0.5rem 0;
        font-size: 1.2rem;
      }

      .car-price {
        color: #3498db;
        font-size: 1.1rem;
        font-weight: bold;
        margin: 0.25rem 0;
      }

      .car-location,
      .car-specs {
        margin: 0.25rem 0;
        color: #666;
        font-size: 0.9rem;
      }

      .stats-bar {
        padding: 0.5rem;
        background: #f5f5f5;
        border-radius: 4px;
        text-align: center;
        font-size: 0.9rem;
        color: #666;
      }

      @media (max-width: 768px) {
        .search-controls {
          flex-direction: column;
        }

        .search-controls ion-searchbar {
          width: 100%;
        }

        .car-card-content {
          flex-direction: column;
        }

        .car-image {
          width: 100%;
          height: 200px;
        }
      }
    `,
  ],
})
export class ExploreComponent implements OnInit {
  private readonly router = inject(Router)

  // State
  readonly cars = signal<CarDTO[]>([])
  readonly loading = signal(true)
  readonly viewMode = signal<'map' | 'list'>('map')
  searchQuery = ''

  constructor() {
    addIcons({ list, map })
  }

  ngOnInit(): void {
    void this.loadCars()
  }

  async loadCars(): Promise<void> {
    this.loading.set(true)
    try {
      const response = await carSDK.search({
        status: 'active',
        radius: 100,
        sortBy: 'price_asc',
        page: 1,
        pageSize: 50,
      })

      this.cars.set(response.data)
    } catch (error) {
      console.error('Error loading cars:', error)
      this.cars.set([])
    } finally {
      this.loading.set(false)
    }
  }

  onSearchChange(): void {
    // TODO: Implement search filtering
    console.log('Search query:', this.searchQuery)
  }

  onCarClick(car: CarDTO): void {
    void this.router.navigate(['/cars', car.id])
  }

  formatPrice(cents: number): string {
    return (cents / 100).toFixed(2)
  }
}
