/* eslint-disable @typescript-eslint/no-unsafe-argument -- Test file: TestBed.createComponent requires type assertion */
import { provideHttpClient } from '@angular/common/http'
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'

import { VehicleDocumentsComponent } from './vehicle-documents.component'

describe('VehicleDocumentsComponent (TDD)', () => {
  let component: VehicleDocumentsComponent
  let fixture: ComponentFixture<VehicleDocumentsComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleDocumentsComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(VehicleDocumentsComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have documents list container', () => {
    expect(compiled.querySelector('[data-testid="documents-list"]')).toBeTruthy()
  })

  it('should display upload button', () => {
    expect(compiled.querySelector('[data-testid="upload-document-button"]')).toBeTruthy()
  })

  it('should show document type filter', () => {
    expect(compiled.querySelector('[data-testid="document-type-filter"]')).toBeTruthy()
  })

  it('should display document verification status', () => {
    void component.documents.set([
      { id: '1', type: 'cedula_verde', status: 'pending', url: 'test.pdf' } as any
    ])
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="document-status"]')).toBeTruthy()
  })

  it('should show download button for verified documents', () => {
    void component.documents.set([
      { id: '1', type: 'cedula_verde', status: 'verified', url: 'test.pdf' } as any
    ])
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="download-document-button"]')).toBeTruthy()
  })

  it('should emit delete event when delete button clicked', () => {
    void component.documents.set([
      { id: '1', type: 'cedula_verde', status: 'pending', url: 'test.pdf' } as any
    ])
    spyOn(component.deleteDocument, 'emit')
    fixture.detectChanges()

    const deleteBtn = compiled.querySelector('[data-testid="delete-document-button"]')
    deleteBtn?.click()

    expect(component.deleteDocument.emit).toHaveBeenCalledWith('1')
  })

  it('should show loading spinner when loading', () => {
    void component.loading.set(true)
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="loading-spinner"]')).toBeTruthy()
  })

  it('should display empty state when no documents', () => {
    void component.documents.set([])
    void component.loading.set(false)
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="empty-documents"]')).toBeTruthy()
  })
})
/* eslint-enable @typescript-eslint/no-unsafe-argument -- Re-enable after test file */
