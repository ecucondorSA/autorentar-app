import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at?: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="chat">
      <div data-testid="messages-container" class="chat__messages">
        <article *ngFor="let message of messages()" class="chat__message">
          <div data-testid="message-avatar" class="chat__avatar">{{ message.sender_id[0] | uppercase }}</div>
          <p>{{ message.content }}</p>
        </article>
      </div>

      <form class="chat__input" (ngSubmit)="send()">
        <ion-textarea
          data-testid="message-input"
          [(ngModel)]="draft"
          name="message"
          autoGrow="true"
          placeholder="Escribí un mensaje"
        ></ion-textarea>
        <ion-button data-testid="send-message" type="submit" [disabled]="!draft.trim()">Enviar</ion-button>
      </form>
    </section>
  `,
  styles: [
    `
    .chat {
      display: grid;
      gap: 1rem;
      height: 100%;
    }

    .chat__messages {
      display: grid;
      gap: 0.75rem;
      max-height: 320px;
      overflow-y: auto;
    }

    .chat__message {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
    }

    .chat__avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #1d4ed8;
      color: white;
      display: grid;
      place-items: center;
      font-weight: 600;
    }

    .chat__input {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }
    `,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ChatComponent {
  readonly messages = signal<ChatMessage[]>([]);
  draft = '';

  @Output() readonly messageSent = new EventEmitter<string>();

  send(): void {
    const content = this.draft.trim();
    if (!content) {
      return;
    }
    this.messageSent.emit(content);
    this.draft = '';
  }
}
