/* eslint-disable @typescript-eslint/no-unsafe-argument -- Test file: TestBed.createComponent requires type assertion */
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'

import { RegisterComponent } from './register.component'

describe('RegisterComponent (TDD)', () => {
  let component: RegisterComponent
  let fixture: ComponentFixture<RegisterComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideRouter([])],
    }).compileComponents()

    fixture = TestBed.createComponent(RegisterComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have register form', () => {
    expect(compiled.querySelector('form[data-testid="register-form"]')).toBeTruthy()
  })

  it('should have email input', () => {
    expect(compiled.querySelector('[data-testid="email-input"]')).toBeTruthy()
  })

  it('should have password input', () => {
    expect(compiled.querySelector('[data-testid="password-input"]')).toBeTruthy()
  })

  it('should have password confirmation input', () => {
    expect(compiled.querySelector('[data-testid="password-confirm-input"]')).toBeTruthy()
  })

  it('should have name input', () => {
    expect(compiled.querySelector('[data-testid="name-input"]')).toBeTruthy()
  })

  it('should have submit button', () => {
    expect(compiled.querySelector('ion-button[data-testid="submit-register"]')).toBeTruthy()
  })

  it('should show error when passwords do not match', () => {
    void component.registerForm.patchValue({
      password: 'password123',
      passwordConfirm: 'different',
    })
    fixture.detectChanges()
    expect(compiled.querySelector('[data-testid="password-match-error"]')).toBeTruthy()
  })
})
/* eslint-enable @typescript-eslint/no-unsafe-argument -- Re-enable after test file */
