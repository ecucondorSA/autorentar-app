import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

interface NotificationItem {
  id: string;
  title?: string | null;
  message?: string | null;
  read: boolean;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="notifications">
      <header>
        <h2>Notificaciones</h2>
        <ion-button data-testid="mark-all-read" (click)="markAllRead()">Marcar como leídas</ion-button>
      </header>

      <div *ngIf="notifications().length === 0" data-testid="empty-notifications">
        No tenés notificaciones.
      </div>

      <ul data-testid="notifications-list" *ngIf="notifications().length">
        <li
          *ngFor="let notification of notifications()"
          [class.unread]="!notification.read"
          [attr.data-testid]="notification.read ? null : 'unread-notification'"
        >
          <h3>{{ notification.title || 'Notificación' }}</h3>
          <p>{{ notification.message || '' }}</p>
        </li>
      </ul>
    </section>
  `,
  styles: [
    `
    .notifications {
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

    li.unread {
      border-color: #2563eb;
      background: #eff6ff;
    }
    `,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NotificationsComponent {
  readonly notifications = signal<NotificationItem[]>([]);

  @Output() readonly markRead = new EventEmitter<void>();

  markAllRead(): void {
    this.notifications.update((items) => items.map((item) => ({ ...item, read: true })));
    this.markRead.emit();
  }
}
