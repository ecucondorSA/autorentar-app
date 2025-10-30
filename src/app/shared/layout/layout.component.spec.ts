import type { ComponentFixture } from '@angular/core/testing'
import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'

import { LayoutComponent } from './layout.component'

describe('LayoutComponent (TDD) - Tabs Contextuales', () => {
  let component: LayoutComponent
  let fixture: ComponentFixture<LayoutComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutComponent],
      providers: [provideRouter([])],
    }).compileComponents()

    fixture = TestBed.createComponent(LayoutComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  // Header Tests
  it('should have header section', () => {
    const header = compiled.querySelector('[data-testid="app-header"]')
    expect(header).toBeTruthy()
  })

  it('should display app logo in header', () => {
    const logo = compiled.querySelector('[data-testid="app-logo"]')
    expect(logo).toBeTruthy()
    expect(logo?.textContent).toContain('AutoRentar')
  })

  it('should have role selector in header', () => {
    const roleSelector = compiled.querySelector('[data-testid="role-selector"]')
    expect(roleSelector).toBeTruthy()
  })

  it('should have notifications button in header', () => {
    const notifications = compiled.querySelector('[data-testid="notifications-button"]')
    expect(notifications).toBeTruthy()
  })

  it('should have user avatar in header', () => {
    const avatar = compiled.querySelector('[data-testid="user-avatar"]')
    expect(avatar).toBeTruthy()
  })

  // Content Tests
  it('should have main content area', () => {
    const main = compiled.querySelector('[data-testid="main-content"]')
    expect(main).toBeTruthy()
  })

  it('should have router outlet in main content', () => {
    const outlet = compiled.querySelector('router-outlet')
    expect(outlet).toBeTruthy()
  })

  // Tab Bar Tests
  it('should have bottom tab bar', () => {
    const tabBar = compiled.querySelector('[data-testid="bottom-tab-bar"]')
    expect(tabBar).toBeTruthy()
  })

  it('should display 5 tabs in tab bar', () => {
    const tabs = compiled.querySelectorAll('[data-testid^="tab-"]')
    expect(tabs.length).toBe(5)
  })

  // Renter Mode Tests
  it('should show renter tabs when role is renter (default)', () => {
    // Default role should be 'renter'
    expect(component.currentRole()).toBe('renter')

    // Check for renter-specific tabs
    const homeTab = compiled.querySelector('[data-testid="tab-home"]')
    const exploreTab = compiled.querySelector('[data-testid="tab-explore"]')
    const bookingsTab = compiled.querySelector('[data-testid="tab-bookings"]')
    const walletTab = compiled.querySelector('[data-testid="tab-wallet"]')
    const accountTab = compiled.querySelector('[data-testid="tab-account"]')

    expect(homeTab).toBeTruthy()
    expect(exploreTab).toBeTruthy()
    expect(bookingsTab).toBeTruthy()
    expect(walletTab).toBeTruthy()
    expect(accountTab).toBeTruthy()
  })

  // Owner Mode Tests
  it('should show owner tabs when role is owner', () => {
    // Switch to owner role
    component.switchRole('owner')
    fixture.detectChanges()

    expect(component.currentRole()).toBe('owner')

    // Check for owner-specific tabs
    const homeTab = compiled.querySelector('[data-testid="tab-home"]')
    const myCarsTab = compiled.querySelector('[data-testid="tab-my-cars"]')
    const publishTab = compiled.querySelector('[data-testid="tab-publish"]')
    const walletTab = compiled.querySelector('[data-testid="tab-wallet"]')
    const accountTab = compiled.querySelector('[data-testid="tab-account"]')

    expect(homeTab).toBeTruthy()
    expect(myCarsTab).toBeTruthy()
    expect(publishTab).toBeTruthy()
    expect(walletTab).toBeTruthy()
    expect(accountTab).toBeTruthy()
  })

  // Role Switching Test
  it('should switch tabs when role changes', () => {
    // Start as renter
    expect(component.currentRole()).toBe('renter')
    let exploreTab = compiled.querySelector('[data-testid="tab-explore"]')
    expect(exploreTab).toBeTruthy()

    // Switch to owner
    component.switchRole('owner')
    fixture.detectChanges()

    // Explore tab should disappear, my-cars should appear
    exploreTab = compiled.querySelector('[data-testid="tab-explore"]')
    const myCarsTab = compiled.querySelector('[data-testid="tab-my-cars"]')

    expect(exploreTab).toBeFalsy()
    expect(myCarsTab).toBeTruthy()
  })
})
