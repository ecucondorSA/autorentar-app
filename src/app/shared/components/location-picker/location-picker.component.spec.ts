/* eslint-disable @typescript-eslint/no-unsafe-argument -- Test file: TestBed.createComponent requires type assertion */
import { provideHttpClient } from '@angular/common/http'
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'
import { ReactiveFormsModule } from '@angular/forms'

import { LocationPickerComponent } from './location-picker.component'

describe('LocationPickerComponent (TDD)', () => {
  let component: LocationPickerComponent
  let fixture: ComponentFixture<LocationPickerComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationPickerComponent, ReactiveFormsModule],
      providers: [provideHttpClient()]
    }).compileComponents()

    fixture = TestBed.createComponent(LocationPickerComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have location search input', () => {
    expect(compiled.querySelector('input[data-testid="location-search"]')).toBeTruthy()
  })

  it('should display suggestions on type', async () => {
    const input = compiled.querySelector('input[data-testid="location-search"]')

    input.value = 'Buenos'
    input.dispatchEvent(new Event('input'))
    fixture.detectChanges()
    await fixture.whenStable()

    expect(compiled.querySelector('[data-testid="location-suggestions"]')).toBeTruthy()
  })

  it('should show map container', () => {
    expect(compiled.querySelector('[data-testid="map-container"]')).toBeTruthy()
  })

  it('should emit location when suggestion clicked', () => {
    spyOn(component.locationSelected, 'emit')

    void component.suggestions.set([
      { id: '1', city: 'Buenos Aires', country: 'Argentina' }
    ])
    fixture.detectChanges()

    const suggestion = compiled.querySelector('[data-testid="location-suggestion"]')
    suggestion?.click()

    expect(component.locationSelected.emit).toHaveBeenCalled()
  })

  it('should display current location button', () => {
    expect(compiled.querySelector('[data-testid="current-location-button"]')).toBeTruthy()
  })

  it('should show selected location marker', () => {
    void component.selectedLocation.set({
      lat: -34.603722,
      lng: -58.381592,
      city: 'Buenos Aires'
    })
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="location-marker"]')).toBeTruthy()
  })

  it('should have confirm button', () => {
    expect(compiled.querySelector('[data-testid="confirm-location-button"]')).toBeTruthy()
  })

  it('should disable confirm when no location selected', () => {
    void component.selectedLocation.set(null)
    fixture.detectChanges()

    const confirmBtn = compiled.querySelector('[data-testid="confirm-location-button"]')
    expect(confirmBtn?.disabled).toBeTruthy()
  })
})
/* eslint-enable @typescript-eslint/no-unsafe-argument -- Re-enable after test file */
