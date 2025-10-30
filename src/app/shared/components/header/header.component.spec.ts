import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'

import { HeaderComponent } from './header.component'

describe('HeaderComponent (TDD)', () => {
  let component: HeaderComponent
  let fixture: ComponentFixture<HeaderComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [provideRouter([])],
    }).compileComponents()

    fixture = TestBed.createComponent(HeaderComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have header with data-testid="app-header"', () => {
    expect(compiled.querySelector('ion-header[data-testid="app-header"]')).toBeTruthy()
  })

  it('should display logo/brand', () => {
    const logo = compiled.querySelector('[data-testid="brand-logo"]')
    expect(logo).toBeTruthy()
    expect(logo?.textContent).toContain('AutoRentar')
  })

  it('should have login button when not authenticated', () => {
    void component.isAuthenticated.set(false)
    fixture.detectChanges()
    expect(compiled.querySelector('ion-button[data-testid="login-button"]')).toBeTruthy()
  })

  it('should have user menu when authenticated', () => {
    void component.isAuthenticated.set(true)
    fixture.detectChanges()
    expect(compiled.querySelector('[data-testid="user-menu"]')).toBeTruthy()
  })

  it('should navigate to login when login button clicked', () => {
    void component.isAuthenticated.set(false)
    fixture.detectChanges()

    spyOn(component, 'goToLogin')
    const btn = compiled.querySelector('ion-button[data-testid="login-button"]')
    btn.click()

    expect(component.goToLogin).toHaveBeenCalled()
  })

  it('should have mobile menu toggle', () => {
    const toggle = compiled.querySelector('[data-testid="menu-toggle"]')
    expect(toggle).toBeTruthy()
  })
})
