import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import type { CarDTO } from '@/types';

@Component({
  selector: 'app-car-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ion-card
      data-testid="car-card"
      button
      (click)="handleClick()"
      *ngIf="car"
    >
      <ion-img
        data-testid="car-image"
        [src]="car.photo_main_url || placeholder"
        alt="Imagen del auto"
      ></ion-img>

      <ion-card-header>
        <ion-card-title data-testid="car-title">{{ title() }}</ion-card-title>
        <ion-card-subtitle data-testid="car-location">{{ location() }}</ion-card-subtitle>
      </ion-card-header>

      <ion-card-content>
        <strong data-testid="car-price">{{ pricePerDay() }}</strong>
      </ion-card-content>
    </ion-card>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CarCardComponent {
  @Input() car: CarDTO | null = null;
  @Output() readonly cardClick = new EventEmitter<string>();

  readonly placeholder = 'https://placehold.co/600x400';

  readonly title = computed(() =>
    this.car ? `${this.car.brand} ${this.car.model}` : ''
  );

  readonly location = computed(() => {
    if (!this.car) {
      return '';
    }
    const city = this.car.location_city ?? '';
    const country = this.car.location_country ?? '';
    return [city, country].filter(Boolean).join(', ');
  });

  readonly pricePerDay = computed(() => {
    if (!this.car) {
      return '';
    }
    const base = (this.car.price_per_day_cents ?? 0) / 100;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(base);
  });

  handleClick(): void {
    if (!this.car) {
      return;
    }
    this.cardClick.emit(this.car.id);
  }
}
