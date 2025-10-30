import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

interface ConversationSummary {
  id: string;
  participant_name?: string | null;
  last_message?: string | null;
  unread_count?: number | null;
}

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section data-testid="conversations-list" class="conversation-list">
      <article *ngFor="let conversation of conversations()" (click)="open(conversation.id)">
        <h3>{{ conversation.participant_name || 'Conversación' }}</h3>
        <p data-testid="last-message">{{ conversation.last_message || 'Sin mensajes' }}</p>
        <ion-badge *ngIf="conversation.unread_count" data-testid="unread-badge">
          {{ conversation.unread_count }}
        </ion-badge>
      </article>
    </section>
  `,
  styles: [
    `
    .conversation-list {
      display: grid;
      gap: 1rem;
    }

    article {
      padding: 1rem;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
      background: #fff;
      cursor: pointer;
    }
    `,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MessageListComponent {
  readonly conversations = signal<ConversationSummary[]>([]);

  @Output() readonly conversationSelected = new EventEmitter<string>();

  open(id?: string | null): void {
    if (id) {
      this.conversationSelected.emit(id);
    }
  }
}
