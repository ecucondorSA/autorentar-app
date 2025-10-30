import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, EventEmitter, Output, computed, signal } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

interface VehicleDocument {
  id: string;
  type: string;
  status: 'pending' | 'verified' | 'rejected';
  url?: string | null;
}

@Component({
  selector: 'app-vehicle-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="vehicle-documents">
      <header>
        <ion-select data-testid="document-type-filter" [(ngModel)]="activeFilter">
          <ion-select-option value="all">Todas</ion-select-option>
          <ion-select-option value="pending">Pendientes</ion-select-option>
          <ion-select-option value="verified">Verificadas</ion-select-option>
          <ion-select-option value="rejected">Rechazadas</ion-select-option>
        </ion-select>
        <ion-button data-testid="upload-document-button" (click)="triggerUpload()">
          Subir documento
        </ion-button>
      </header>

      <ion-spinner *ngIf="loading()" data-testid="loading-spinner"></ion-spinner>

      <div *ngIf="!loading() && filteredDocuments().length === 0" data-testid="empty-documents">
        No hay documentos cargados.
      </div>

      <ul data-testid="documents-list" *ngIf="filteredDocuments().length">
        <li *ngFor="let doc of filteredDocuments()">
          <span>{{ doc.type }}</span>
          <span data-testid="document-status">{{ doc.status | titlecase }}</span>

          <div class="actions">
            <ion-button
              *ngIf="doc.status === 'verified' && doc.url"
              data-testid="download-document-button"
              fill="clear"
              size="small"
              (click)="download(doc)"
            >
              Descargar
            </ion-button>
            <ion-button
              data-testid="delete-document-button"
              fill="clear"
              color="danger"
              size="small"
              (click)="delete(doc.id)"
            >
              Eliminar
            </ion-button>
          </div>
        </li>
      </ul>
    </section>
  `,
  styles: [
    `
    .vehicle-documents {
      display: grid;
      gap: 1.5rem;
    }

    header {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    ul {
      display: grid;
      gap: 1rem;
    }

    li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
      background: #fff;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }
    `,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class VehicleDocumentsComponent {
  readonly loading = signal(false);
  readonly documents = signal<VehicleDocument[]>([]);
  activeFilter: 'all' | 'pending' | 'verified' | 'rejected' = 'all';

  @Output() readonly uploadDocument = new EventEmitter<void>();
  @Output() readonly deleteDocument = new EventEmitter<string>();

  filteredDocuments = computed(() => {
    const docs = this.documents();
    if (this.activeFilter === 'all') {
      return docs;
    }
    return docs.filter((doc) => doc.status === this.activeFilter);
  });

  triggerUpload(): void {
    this.uploadDocument.emit();
  }

  download(doc: VehicleDocument): void {
    if (!doc.url) {
      return;
    }
    if (typeof window !== 'undefined') {
      window.open(doc.url, '_blank');
    }
  }

  delete(id: string): void {
    this.deleteDocument.emit(id);
  }
}
