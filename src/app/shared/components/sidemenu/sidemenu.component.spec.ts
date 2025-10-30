/* eslint-disable @typescript-eslint/no-unsafe-argument -- Test file: TestBed.createComponent requires type assertion */
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'

import { SidemenuComponent } from './sidemenu.component'

describe('SidemenuComponent (TDD)', () => {
  let component: SidemenuComponent
  let fixture: ComponentFixture<SidemenuComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidemenuComponent],
      providers: [provideRouter([])]
    }).compileComponents()

    fixture = TestBed.createComponent(SidemenuComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have menu container', () => {
    expect(compiled.querySelector('[data-testid="sidemenu-container"]')).toBeTruthy()
  })

  it('should display user profile section', () => {
    void component.isAuthenticated.set(true)
    void component.userName.set('Juan Pérez')
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="user-profile"]')).toBeTruthy()
  })

  it('should show login button when not authenticated', () => {
    void component.isAuthenticated.set(false)
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="login-menu-item"]')).toBeTruthy()
  })

  it('should have navigation items', () => {
    expect(compiled.querySelector('[data-testid="nav-items"]')).toBeTruthy()
  })

  it('should display dashboard link', () => {
    void component.isAuthenticated.set(true)
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="dashboard-link"]')).toBeTruthy()
  })

  it('should show my cars link', () => {
    void component.isAuthenticated.set(true)
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="my-cars-link"]')).toBeTruthy()
  })

  it('should display bookings link', () => {
    void component.isAuthenticated.set(true)
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="bookings-link"]')).toBeTruthy()
  })

  it('should show wallet link', () => {
    void component.isAuthenticated.set(true)
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="wallet-link"]')).toBeTruthy()
  })

  it('should have logout button when authenticated', () => {
    void component.isAuthenticated.set(true)
    fixture.detectChanges()

    expect(compiled.querySelector('[data-testid="logout-button"]')).toBeTruthy()
  })

  it('should emit logout event when logout clicked', () => {
    void component.isAuthenticated.set(true)
    spyOn(component.logout, 'emit')
    fixture.detectChanges()

    const logoutBtn = compiled.querySelector('[data-testid="logout-button"]') as HTMLElement | null
    (logoutBtn as HTMLElement)?.click()

    expect(component.logout.emit).toHaveBeenCalled()
  })

  it('should highlight active route', () => {
    void component.currentRoute.set('/dashboard')
    fixture.detectChanges()

    const activeLink = compiled.querySelector('[data-testid="dashboard-link"]')
    expect(activeLink?.classList.contains('active')).toBeTruthy()
  })
})
/* eslint-enable @typescript-eslint/no-unsafe-argument -- Re-enable after test file */
