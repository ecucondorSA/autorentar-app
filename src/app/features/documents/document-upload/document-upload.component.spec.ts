/* eslint-disable @typescript-eslint/no-unsafe-argument -- Test file: TestBed.createComponent requires type assertion */
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'

import { DocumentUploadComponent } from './document-upload.component'

describe('DocumentUploadComponent (TDD)', () => {
  let component: DocumentUploadComponent
  let fixture: ComponentFixture<DocumentUploadComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentUploadComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(DocumentUploadComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have file input', () => {
    expect(compiled.querySelector('input[data-testid="file-input"]')).toBeTruthy()
  })

  it('should have upload button', () => {
    expect(compiled.querySelector('ion-button[data-testid="upload-button"]')).toBeTruthy()
  })

  it('should display file preview after selection', () => {
    void component.selectedFile.set({ name: 'document.pdf' } as any)
    fixture.detectChanges()
    expect(compiled.querySelector('[data-testid="file-preview"]')).toBeTruthy()
  })

  it('should display upload progress', () => {
    void component.uploading.set(true)
    void component.progress.set(50)
    fixture.detectChanges()
    expect(compiled.querySelector('[data-testid="upload-progress"]')).toBeTruthy()
  })
})
