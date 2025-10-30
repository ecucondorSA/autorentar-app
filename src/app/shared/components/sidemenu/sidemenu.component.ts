import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-sidemenu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside data-testid="sidemenu-container" class="sidemenu">
      <section *ngIf="isAuthenticated(); else loginSection" data-testid="user-profile">
        <p class="user-name">{{ userName() || 'Invitado' }}</p>
      </section>

      <ng-template #loginSection>
        <ion-button data-testid="login-menu-item" expand="block" (click)="navigate('/auth/login')">
          Iniciar sesión
        </ion-button>
      </ng-template>

      <nav data-testid="nav-items" class="sidemenu__nav">
        <a
          data-testid="dashboard-link"
          [class.active]="currentRoute() === '/dashboard'"
          (click)="navigate('/dashboard')"
        >Panel</a>
        <a
          data-testid="my-cars-link"
          [class.active]="currentRoute() === '/cars/mine'"
          (click)="navigate('/cars/mine')"
        >Mis autos</a>
        <a
          data-testid="bookings-link"
          [class.active]="currentRoute() === '/bookings'"
          (click)="navigate('/bookings')"
        >Reservas</a>
        <a
          data-testid="wallet-link"
          [class.active]="currentRoute() === '/wallet'"
          (click)="navigate('/wallet')"
        >Wallet</a>
      </nav>

      <ion-button
        *ngIf="isAuthenticated()"
        data-testid="logout-button"
        expand="block"
        color="medium"
        (click)="handleLogout()"
      >
        Cerrar sesión
      </ion-button>
    </aside>
  `,
  styles: [
    `
    .sidemenu {
      display: grid;
      gap: 1rem;
      padding: 1.5rem;
      background: #f8fafc;
      min-width: 220px;
    }

    .sidemenu__nav {
      display: grid;
      gap: 0.5rem;
    }

    a {
      color: inherit;
      text-decoration: none;
      padding: 0.5rem 0;
    }

    a.active {
      font-weight: 600;
      color: #2563eb;
    }

    .user-name {
      font-weight: 600;
    }
    `,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SidemenuComponent {
  readonly isAuthenticated = signal(false);
  readonly userName = signal<string>('');
  readonly currentRoute = signal<string>('');

  @Output() readonly logout = new EventEmitter<void>();

  constructor(private readonly router: Router) {}

  navigate(path: string): void {
    this.currentRoute.set(path);
    void this.router.navigate([path]);
  }

  handleLogout(): void {
    this.logout.emit();
  }
}
