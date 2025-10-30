import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="document-upload">
      <input data-testid="file-input" type="file" (change)="onFileSelected($event)" />
      <ion-button data-testid="upload-button" [disabled]="!selectedFile()" (click)="startUpload()">
        Subir documento
      </ion-button>

      <div *ngIf="selectedFile()" data-testid="file-preview">
        Archivo: {{ selectedFile()?.name }}
      </div>

      <div *ngIf="uploading()" data-testid="upload-progress">
        Subiendo... {{ progress() }}%
      </div>
    </div>
  `,
  styles: [
    `
    .document-upload {
      display: grid;
      gap: 1rem;
    }
    `,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DocumentUploadComponent {
  readonly selectedFile = signal<File | null>(null);
  readonly uploading = signal(false);
  readonly progress = signal(0);

  @Output() readonly upload = new EventEmitter<File>();

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.item(0) ?? null;
    this.selectedFile.set(file);
  }

  startUpload(): void {
    const file = this.selectedFile();
    if (!file) {
      return;
    }
    this.uploading.set(true);
    this.progress.set(25);
    this.upload.emit(file);
    // Simulate progress complete
    this.progress.set(100);
    this.uploading.set(false);
  }
}
