/* eslint-disable @typescript-eslint/no-unsafe-argument -- Test file: TestBed.createComponent requires type assertion */
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'

import { SearchBarComponent } from './search-bar.component'

describe('SearchBarComponent (TDD)', () => {
  let component: SearchBarComponent
  let fixture: ComponentFixture<SearchBarComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchBarComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(SearchBarComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have search form with data-testid="search-form"', () => {
    expect(compiled.querySelector('form[data-testid="search-form"]')).toBeTruthy()
  })

  it('should have location input', () => {
    expect(compiled.querySelector('[data-testid="location-input"]')).toBeTruthy()
  })

  it('should have date range inputs', () => {
    expect(compiled.querySelector('[data-testid="start-date-input"]')).toBeTruthy()
    expect(compiled.querySelector('[data-testid="end-date-input"]')).toBeTruthy()
  })

  it('should have search button', () => {
    expect(compiled.querySelector('ion-button[data-testid="search-button"]')).toBeTruthy()
  })

  it('should emit search event on submit', () => {
    spyOn(component.search, 'emit')
    
    void component.searchForm.patchValue({
      location: 'Buenos Aires',
      startDate: '2024-01-01',
      endDate: '2024-01-05',
    })

    const form = compiled.querySelector('form[data-testid="search-form"]')
    form.dispatchEvent(new Event('submit'))

    expect(component.search.emit).toHaveBeenCalled()
  })

  it('should disable search button when form invalid', () => {
    void component.searchForm.patchValue({
      location: '',
      startDate: '',
      endDate: '',
    })
    fixture.detectChanges()

    const btn = compiled.querySelector('ion-button[data-testid="search-button"]')
    expect(btn.disabled).toBeTruthy()
  })
})
/* eslint-enable @typescript-eslint/no-unsafe-argument -- Re-enable after test file */
