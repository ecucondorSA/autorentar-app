import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { RouterOutlet, RouterLink } from '@angular/router'
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFooter,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone'
import { addIcons } from 'ionicons'
import { home, car, person, logIn } from 'ionicons/icons'

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFooter,
    IonButtons,
    IonButton,
    IonIcon,
  ],
  template: `
    <ion-header data-testid="app-header">
      <ion-toolbar>
        <ion-title data-testid="app-logo">
          <a routerLink="/" class="logo-link">AutoRentar</a>
        </ion-title>

        <ion-buttons slot="end" data-testid="main-nav">
          <ion-button routerLink="/cars">
            <ion-icon slot="icon-only" name="car"></ion-icon>
          </ion-button>
          <ion-button routerLink="/login">
            <ion-icon slot="icon-only" name="log-in"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content data-testid="main-content">
      <router-outlet></router-outlet>
    </ion-content>

    <ion-footer data-testid="app-footer">
      <ion-toolbar>
        <div class="footer-content">
          <p data-testid="footer-copyright">
            © 2025 AutoRentar. Todos los derechos reservados.
          </p>
        </div>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [`
    .logo-link {
      text-decoration: none;
      color: inherit;
      font-weight: bold;
      font-size: 1.2rem;
    }

    .footer-content {
      text-align: center;
      padding: 1rem;
      font-size: 0.875rem;
      color: var(--ion-color-medium);
    }

    .footer-content p {
      margin: 0;
    }

    ion-header {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    ion-footer {
      border-top: 1px solid var(--ion-color-light);
    }
  `]
})
/* eslint-disable @typescript-eslint/no-extraneous-class -- Layout component only initializes icons in constructor */
export class LayoutComponent {
  constructor() {
    // Register icons
    addIcons({ home, car, person, logIn })
  }
}
/* eslint-enable @typescript-eslint/no-extraneous-class -- Re-enable after layout component */
