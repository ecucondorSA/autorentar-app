/* eslint-disable @typescript-eslint/no-unsafe-argument -- Test file: TestBed.createComponent requires type assertion */
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'

import { CarPublishComponent } from './car-publish.component'

describe('CarPublishComponent (TDD)', () => {
  let component: CarPublishComponent
  let fixture: ComponentFixture<CarPublishComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarPublishComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(CarPublishComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have car form', () => {
    expect(compiled.querySelector('form[data-testid="car-publish-form"]')).toBeTruthy()
  })

  it('should have brand input', () => {
    expect(compiled.querySelector('[data-testid="brand-input"]')).toBeTruthy()
  })

  it('should have model input', () => {
    expect(compiled.querySelector('[data-testid="model-input"]')).toBeTruthy()
  })

  it('should have year input', () => {
    expect(compiled.querySelector('[data-testid="year-input"]')).toBeTruthy()
  })

  it('should have price input', () => {
    expect(compiled.querySelector('[data-testid="price-input"]')).toBeTruthy()
  })

  it('should have photo upload', () => {
    expect(compiled.querySelector('[data-testid="photo-upload"]')).toBeTruthy()
  })

  it('should have location input', () => {
    expect(compiled.querySelector('[data-testid="location-input"]')).toBeTruthy()
  })

  it('should have publish button', () => {
    expect(compiled.querySelector('ion-button[data-testid="publish-button"]')).toBeTruthy()
  })
})
