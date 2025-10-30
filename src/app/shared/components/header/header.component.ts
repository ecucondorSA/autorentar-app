import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ion-header data-testid="app-header">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button data-testid="menu-toggle" fill="clear" (click)="toggleMenu()">
            ☰
          </ion-button>
        </ion-buttons>

        <ion-title data-testid="brand-logo" (click)="goHome()">
          AutoRentar
        </ion-title>

        <ion-buttons slot="end">
          @if (isAuthenticated()) {
            <ion-button data-testid="user-menu" fill="clear" (click)="goToDashboard()">
              Mi cuenta
            </ion-button>
          } @else {
            <ion-button data-testid="login-button" color="primary" (click)="goToLogin()">
              Iniciar sesión
            </ion-button>
          }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HeaderComponent {
  readonly isAuthenticated = signal(false);
  readonly menuOpen = signal(false);

  constructor(private readonly router: Router) {}

  toggleMenu(): void {
    this.menuOpen.update((value) => !value);
  }

  goHome(): void {
    void this.router.navigate(['/']);
  }

  goToLogin(): void {
    void this.router.navigate(['/auth/login']);
  }

  goToDashboard(): void {
    void this.router.navigate(['/dashboard']);
  }
}
