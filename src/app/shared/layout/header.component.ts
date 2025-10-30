import { Component, inject, signal, type OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonBadge,
  IonPopover,
  IonList,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  notifications,
  person,
  logOut,
  chatbubbles,
  home,
  car,
  wallet,
} from 'ionicons/icons';

import { notificationSDK } from '@/lib/sdk/notification.sdk';
import type { NotificationDTO } from '@/types';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonBadge,
    IonPopover,
    IonList,
    IonItem,
    IonLabel,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>AutoRentar</ion-title>

        <ion-buttons slot="end">
          <!-- Home Button -->
          <ion-button routerLink="/home" data-testid="home-button">
            <ion-icon name="home"></ion-icon>
          </ion-button>

          <!-- Cars Button -->
          <ion-button routerLink="/cars" data-testid="cars-button">
            <ion-icon name="car"></ion-icon>
          </ion-button>

          <!-- Messages Button -->
          <ion-button
            routerLink="/messages"
            data-testid="messages-button"
          >
            <ion-icon name="chatbubbles"></ion-icon>
            @if (unreadMessages() > 0) {
              <ion-badge
                color="danger"
                data-testid="unread-messages-badge"
              >
                {{ unreadMessages() }}
              </ion-badge>
            }
          </ion-button>

          <!-- Notifications Button -->
          <ion-button
            (click)="toggleNotifications($event)"
            data-testid="notifications-button"
          >
            <ion-icon name="notifications"></ion-icon>
            @if (unreadNotifications() > 0) {
              <ion-badge
                color="danger"
                data-testid="notification-badge"
              >
                {{ unreadNotifications() }}
              </ion-badge>
            }
          </ion-button>

          <!-- User Menu Button -->
          <ion-button
            (click)="toggleUserMenu($event)"
            data-testid="user-menu"
          >
            <ion-icon name="person"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <!-- Notifications Popover -->
    <ion-popover
      [isOpen]="showNotifications()"
      (didDismiss)="showNotifications.set(false)"
      [event]="notificationEvent"
      data-testid="notifications-panel"
    >
      <ng-template>
        <ion-list>
          <ion-item>
            <ion-label>
              <h2>Notificaciones</h2>
            </ion-label>
          </ion-item>

          @if (notifications().length === 0) {
            <ion-item>
              <ion-label>
                <p>No hay notificaciones</p>
              </ion-label>
            </ion-item>
          }

          @for (notification of notifications(); track notification.id) {
            <ion-item
              button
              (click)="onNotificationClick(notification)"
              data-testid="notification-item"
              [class.unread]="!notification.is_read"
            >
              <ion-label>
                <h3>{{ notification.title }}</h3>
                <p>{{ notification.body }}</p>
                <small>{{ formatDate(notification.created_at) }}</small>
              </ion-label>
            </ion-item>
          }
        </ion-list>
      </ng-template>
    </ion-popover>

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

          <ion-item button routerLink="/profile">
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
  `,
  styles: [
    `
      ion-badge {
        position: absolute;
        top: 4px;
        right: 4px;
        font-size: 10px;
        min-width: 16px;
        height: 16px;
      }

      ion-button {
        position: relative;
      }

      .unread {
        --background: var(--ion-color-light);
        font-weight: bold;
      }
    `,
  ],
})
export class HeaderComponent implements OnInit {
  private readonly router = inject(Router);

  // Signals
  readonly showNotifications = signal(false);
  readonly showUserMenu = signal(false);
  readonly notifications = signal<NotificationDTO[]>([]);
  readonly unreadNotifications = signal(0);
  readonly unreadMessages = signal(0);

  notificationEvent: Event | undefined;
  userMenuEvent: Event | undefined;

  constructor() {
    addIcons({
      notifications,
      person,
      logOut,
      chatbubbles,
      home,
      car,
      wallet,
    });
  }

  ngOnInit(): void {
    void this.loadNotifications();
  }

  async loadNotifications(): Promise<void> {
    try {
      // TODO: Get current user ID from auth service
      const userId = 'current-user-id'; // Placeholder

      const result = await notificationSDK.getUserNotifications({
        user_id: userId,
        unread_only: false,
        limit: 10,
        offset: 0,
      });

      this.notifications.set(result);
      this.unreadNotifications.set(
        result.filter((n: NotificationDTO) => !n.is_read).length
      );
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  toggleNotifications(event: Event): void {
    this.notificationEvent = event;
    this.showNotifications.update((v) => !v);
  }

  toggleUserMenu(event: Event): void {
    this.userMenuEvent = event;
    this.showUserMenu.update((v) => !v);
  }

  async onNotificationClick(notification: NotificationDTO): Promise<void> {
    try {
      // Mark as read
      if (!notification.is_read) {
        await notificationSDK.markAsRead(notification.id);
        await this.loadNotifications();
      }

      // Navigate based on notification type
      if (notification.type === 'new_chat_message') {
        await this.router.navigate(['/messages']);
      } else if (notification.type === 'new_booking_for_owner') {
        await this.router.navigate(['/bookings/received']);
      }

      this.showNotifications.set(false);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  }

  async onLogout(): Promise<void> {
    try {
      // TODO: Call auth service logout
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays}d`;
  }
}
