import { CommonModule } from '@angular/common'
import { Component, signal, computed, inject } from '@angular/core'
import { RouterOutlet, RouterLink, Router } from '@angular/router'
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonIcon,
  IonButtons,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonBadge,
  IonAvatar,
  IonLabel,
  IonPopover,
  IonList,
  IonItem,
} from '@ionic/angular/standalone'
import { addIcons } from 'ionicons'
import {
  home,
  search,
  calendar,
  car,
  wallet,
  person,
  notifications,
  add,
  logOut,
} from 'ionicons/icons'

type UserRole = 'renter' | 'owner'

interface TabConfig {
  id: string
  label: string
  icon: string
  route: string
  testId: string
}

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
    IonTabBar,
    IonTabButton,
    IonTabs,
    IonIcon,
    IonButtons,
    IonButton,
    IonSelect,
    IonSelectOption,
    IonBadge,
    IonAvatar,
    IonLabel,
    IonPopover,
    IonList,
    IonItem,
  ],
  template: `
    <!-- Header -->
    <ion-header data-testid="app-header">
      <ion-toolbar>
        <!-- Logo -->
        <ion-title data-testid="app-logo">
          <a routerLink="/home" class="logo-link">AutoRentar</a>
        </ion-title>

        <ion-buttons slot="end">
          <!-- Role Selector -->
          <ion-select
            [value]="currentRole()"
            (ionChange)="onRoleChange($event)"
            interface="popover"
            data-testid="role-selector"
            class="role-selector"
          >
            <ion-select-option value="renter">Renter</ion-select-option>
            <ion-select-option value="owner">Owner</ion-select-option>
          </ion-select>

          <!-- Notifications -->
          <ion-button data-testid="notifications-button">
            <ion-icon slot="icon-only" name="notifications"></ion-icon>
            @if (notificationCount() > 0) {
              <ion-badge color="danger" class="notification-badge">
                {{ notificationCount() }}
              </ion-badge>
            }
          </ion-button>

          <!-- User Avatar -->
          <ion-button
            data-testid="user-menu"
            (click)="toggleUserMenu($event)"
          >
            <ion-avatar class="user-avatar">
              <img
                [src]="userAvatar()"
                alt="User avatar"
              />
            </ion-avatar>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <!-- User Menu Popover -->
    <ion-popover
      [isOpen]="showUserMenu()"
      (didDismiss)="showUserMenu.set(false)"
      [event]="userMenuEvent"
      data-testid="user-menu-popover"
    >
      <ng-template>
        <ion-list>
          <ion-item button routerLink="/dashboard">
            <ion-icon name="home" slot="start"></ion-icon>
            <ion-label>Dashboard</ion-label>
          </ion-item>

          <ion-item button routerLink="/account">
            <ion-icon name="person" slot="start"></ion-icon>
            <ion-label>Mi Perfil</ion-label>
          </ion-item>

          <ion-item button routerLink="/wallet">
            <ion-icon name="wallet" slot="start"></ion-icon>
            <ion-label>Billetera</ion-label>
          </ion-item>

          <ion-item
            button
            (click)="onLogout()"
            data-testid="logout-button"
            color="danger"
          >
            <ion-icon name="log-out" slot="start"></ion-icon>
            <ion-label>Cerrar Sesión</ion-label>
          </ion-item>
        </ion-list>
      </ng-template>
    </ion-popover>

    <!-- Tabs with Content -->
    <ion-tabs>
      <!-- Content -->
      <ion-content data-testid="main-content">
        <router-outlet></router-outlet>
      </ion-content>

      <!-- Bottom Tab Bar (contextual based on role) -->
      <ion-tab-bar slot="bottom" data-testid="bottom-tab-bar">
        @for (tab of currentTabs(); track tab.id) {
          <ion-tab-button
            [tab]="tab.id"
            [attr.data-testid]="tab.testId"
            [routerLink]="tab.route"
          >
            <ion-icon [name]="tab.icon"></ion-icon>
            <ion-label>{{ tab.label }}</ion-label>
          </ion-tab-button>
        }
      </ion-tab-bar>
    </ion-tabs>
  `,
  styles: [
    `
      /* Header Styles */
      .logo-link {
        text-decoration: none;
        color: inherit;
        font-weight: bold;
        font-size: 1.2rem;
      }

      .role-selector {
        font-size: 0.875rem;
        max-width: 120px;
      }

      .notification-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        font-size: 0.625rem;
        min-width: 16px;
        height: 16px;
      }

      .user-avatar {
        width: 32px;
        height: 32px;
      }

      ion-header {
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      /* Tab Bar Styles */
      ion-tab-bar {
        border-top: 1px solid var(--ion-color-light);
        --background: var(--ion-color-light);
      }

      ion-tab-button {
        --color: var(--ion-color-medium);
        --color-selected: var(--ion-color-primary);
      }

      /* Responsive: Hide tab bar on desktop, show sidebar instead */
      @media (min-width: 768px) {
        /* TODO: Implement sidebar for desktop in future iteration */
      }
    `,
  ],
})
export class LayoutComponent {
  private readonly router = inject(Router)

  // State
  readonly currentRole = signal<UserRole>('renter')
  readonly notificationCount = signal(0)
  readonly userAvatar = signal('https://via.placeholder.com/150')
  readonly showUserMenu = signal(false)

  userMenuEvent: Event | undefined

  // Tab configurations
  private readonly renterTabs: TabConfig[] = [
    {
      id: 'home',
      label: 'Inicio',
      icon: 'home',
      route: '/home',
      testId: 'tab-home',
    },
    {
      id: 'explore',
      label: 'Explorar',
      icon: 'search',
      route: '/explore',
      testId: 'tab-explore',
    },
    {
      id: 'bookings',
      label: 'Reservas',
      icon: 'calendar',
      route: '/bookings',
      testId: 'tab-bookings',
    },
    {
      id: 'wallet',
      label: 'Wallet',
      icon: 'wallet',
      route: '/wallet',
      testId: 'tab-wallet',
    },
    {
      id: 'account',
      label: 'Cuenta',
      icon: 'person',
      route: '/account',
      testId: 'tab-account',
    },
  ]

  private readonly ownerTabs: TabConfig[] = [
    {
      id: 'home',
      label: 'Inicio',
      icon: 'home',
      route: '/home',
      testId: 'tab-home',
    },
    {
      id: 'my-cars',
      label: 'Mis Autos',
      icon: 'car',
      route: '/my-cars',
      testId: 'tab-my-cars',
    },
    {
      id: 'publish',
      label: 'Publicar',
      icon: 'add',
      route: '/publish',
      testId: 'tab-publish',
    },
    {
      id: 'wallet',
      label: 'Wallet',
      icon: 'wallet',
      route: '/wallet',
      testId: 'tab-wallet',
    },
    {
      id: 'account',
      label: 'Cuenta',
      icon: 'person',
      route: '/account',
      testId: 'tab-account',
    },
  ]

  // Computed: tabs change based on current role
  readonly currentTabs = computed(() => {
    return this.currentRole() === 'renter' ? this.renterTabs : this.ownerTabs
  })

  constructor() {
    // Register icons
    addIcons({
      home,
      search,
      calendar,
      car,
      wallet,
      person,
      notifications,
      add,
      logOut,
    })
  }

  // Public methods for testing
  switchRole(role: UserRole): void {
    this.currentRole.set(role)
  }

  toggleUserMenu(event: Event): void {
    this.userMenuEvent = event
    this.showUserMenu.update((v) => !v)
  }

  async onLogout(): Promise<void> {
    try {
      // TODO: Call auth service logout
      this.showUserMenu.set(false)
      await this.router.navigate(['/login'])
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  // Event handlers
  onRoleChange(event: CustomEvent<{ value: UserRole }>): void {
    const role = event.detail.value
    this.switchRole(role)
  }
}
