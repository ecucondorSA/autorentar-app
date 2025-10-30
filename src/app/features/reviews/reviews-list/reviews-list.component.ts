import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

interface ReviewItem {
  id: string;
  rating: number;
  comment?: string | null;
  author?: string | null;
}

@Component({
  selector: 'app-reviews-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="reviews">
      <header>
        <h2>Opiniones</h2>
        <div data-testid="average-rating">Promedio: {{ averageRating() }}</div>
      </header>

      <p *ngIf="reviews().length === 0" data-testid="empty-reviews">Sin reseñas disponibles.</p>

      <ul data-testid="reviews-list" *ngIf="reviews().length">
        <li *ngFor="let review of reviews()">
          <strong>{{ review.author || 'Usuario' }}</strong>
          <span>⭐ {{ review.rating }}</span>
          <p>{{ review.comment || '' }}</p>
        </li>
      </ul>
    </section>
  `,
  styles: [
    `
    .reviews {
      display: grid;
      gap: 1rem;
    }

    ul {
      display: grid;
      gap: 0.75rem;
    }

    li {
      padding: 1rem;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
      background: #fff;
    }
    `,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ReviewsListComponent {
  readonly reviews = signal<ReviewItem[]>([]);

  readonly averageRating = computed(() => {
    const items = this.reviews();
    if (!items.length) {
      return '0.0';
    }
    const sum = items.reduce((total, item) => total + (item.rating ?? 0), 0);
    return (sum / items.length).toFixed(1);
  });
}
