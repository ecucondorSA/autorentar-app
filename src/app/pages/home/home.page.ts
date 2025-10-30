import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

type FeaturedCar = {
  id: string;
  brand?: string | null;
  model?: string | null;
  photo_main_url?: string | null;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section data-testid="hero-section" class="hero">
      <div class="hero__content">
        <h1 data-testid="main-heading">AutoRenta - Tu auto cuando lo necesitas</h1>
        <p>Encuentra autos asegurados y listos para compartir en minutos.</p>
        <form data-testid="search-form" (submit)="search()">
          <label class="visually-hidden" for="home-search">Buscar autos</label>
          <input id="home-search" type="search" placeholder="¿A dónde viajás?" />
          <ion-button data-testid="cta-button" type="submit" color="primary">Explorar autos</ion-button>
        </form>
      </div>
    </section>

    <section data-testid="featured-cars" class="featured">
      <header>
        <h2>Autos destacados</h2>
      </header>

      <div *ngIf="loadingFeatured(); else featuredList" data-testid="featured-loading" class="loading">
        Cargando vehículos...
      </div>

      <ng-template #featuredList>
        <div class="featured__grid">
          <article *ngFor="let car of featuredCars()" data-testid="car-card">
            <figure>
              <img [src]="car.photo_main_url || 'https://placehold.co/600x400'" alt="Carro destacado" />
            </figure>
            <h3>{{ car.brand }} {{ car.model }}</h3>
          </article>
        </div>
      </ng-template>
    </section>

    <section data-testid="how-it-works" class="how">
      <h2>¿Cómo funciona?</h2>
      <ol>
        <li>Busca el auto ideal</li>
        <li>Reserva con seguro incluido</li>
        <li>Retirá y disfrutá tu viaje</li>
      </ol>
    </section>

    <section data-testid="benefits-section" class="benefits">
      <h2>Beneficios</h2>
      <ul>
        <li>Seguros integrados</li>
        <li>Wallet con fondos protegidos</li>
        <li>Pagos flexibles</li>
      </ul>
    </section>

    <section data-testid="testimonials" class="testimonials">
      <h2>Personas que confían en AutoRenta</h2>
      <blockquote>
        "Me permitió viajar sin complicaciones y con seguro total" — María P.
      </blockquote>
    </section>
  `,
  styles: [
    `
    .hero {
      padding: 3rem 1rem;
      background: linear-gradient(135deg, #1f2933, #3f4c6b);
      color: white;
      text-align: center;
    }

    form {
      margin-top: 1.5rem;
      display: inline-flex;
      gap: 0.75rem;
      align-items: center;
    }

    input {
      padding: 0.75rem 1rem;
      border-radius: 999px;
      border: none;
      min-width: 16rem;
    }

    .featured {
      padding: 2rem 1rem;
      display: grid;
      gap: 1.5rem;
    }

    .featured__grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    }

    article {
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      overflow: hidden;
      background: white;
    }

    article img {
      width: 100%;
      height: 160px;
      object-fit: cover;
    }
    `,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HomePage {
  readonly featuredCars = signal<FeaturedCar[]>([]);
  readonly loadingFeatured = signal(false);

  constructor(private readonly router: Router) {}

  search(): void {
    this.goToCarList();
  }

  goToCarList(): void {
    void this.router.navigate(['/cars']);
  }
}
