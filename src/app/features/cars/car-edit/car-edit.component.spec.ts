/* eslint-disable @typescript-eslint/no-unsafe-argument -- Test file: TestBed.createComponent requires type assertion */
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'

import { CarEditComponent } from './car-edit.component'

describe('CarEditComponent (TDD)', () => {
  let component: CarEditComponent
  let fixture: ComponentFixture<CarEditComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarEditComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(CarEditComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have edit form', () => {
    expect(compiled.querySelector('form[data-testid="car-edit-form"]')).toBeTruthy()
  })

  it('should have price input', () => {
    expect(compiled.querySelector('[data-testid="price-input"]')).toBeTruthy()
  })

  it('should have save button', () => {
    expect(compiled.querySelector('ion-button[data-testid="save-button"]')).toBeTruthy()
  })

  it('should have delete button', () => {
    expect(compiled.querySelector('ion-button[data-testid="delete-button"]')).toBeTruthy()
  })
})
/* eslint-enable @typescript-eslint/no-unsafe-argument -- Re-enable after test file */
