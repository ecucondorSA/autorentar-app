import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { carSDK } from '@/lib/sdk/car.sdk';
import type { CarDTO } from '@/types';

@Component({
  selector: 'app-my-cars',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="my-cars">
      <header>
        <h2>Mis autos</h2>
        <ion-button data-testid="add-car-button" (click)="goToPublish()">Agregar auto</ion-button>
      </header>

      <div *ngIf="loading()">Cargando...</div>

      <div *ngIf="!loading() && cars().length === 0" data-testid="empty-state" class="empty">
        No tenés autos publicados todavía.
      </div>

      <ul *ngIf="cars().length" data-testid="car-list">
        <li *ngFor="let car of cars()">{{ car.brand }} {{ car.model }}</li>
      </ul>
    </section>
  `,
  styles: [
    `
    .my-cars {
      display: grid;
      gap: 1rem;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .empty {
      padding: 2rem;
      text-align: center;
      background: #f8fafc;
      border-radius: 1rem;
    }
    `,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MyCarsComponent implements OnInit {
  readonly loading = signal(false);
  readonly cars = signal<CarDTO[]>([]);

  constructor(private readonly router: Router) {}

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      const result = await carSDK.search({ radius: 100, sortBy: 'price_asc', page: 1, pageSize: 20 });
      this.cars.set(result.data as CarDTO[]);
    } finally {
      this.loading.set(false);
    }
  }

  goToPublish(): void {
    void this.router.navigate(['/cars/publish']);
  }
}
