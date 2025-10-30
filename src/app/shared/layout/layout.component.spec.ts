import type { ComponentFixture } from '@angular/core/testing'
import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'

import { LayoutComponent } from './layout.component'

describe('LayoutComponent (TDD)', () => {
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

  it('should have header section', () => {
    const header = compiled.querySelector('[data-testid="app-header"]')
    expect(header).toBeTruthy()
  })

  it('should have main content area', () => {
    const main = compiled.querySelector('[data-testid="main-content"]')
    expect(main).toBeTruthy()
  })

  it('should have footer section', () => {
    const footer = compiled.querySelector('[data-testid="app-footer"]')
    expect(footer).toBeTruthy()
  })

  it('should have router outlet in main content', () => {
    const outlet = compiled.querySelector('router-outlet')
    expect(outlet).toBeTruthy()
  })

  it('should display app logo in header', () => {
    const logo = compiled.querySelector('[data-testid="app-logo"]')
    expect(logo).toBeTruthy()
    expect(logo?.textContent).toContain('AutoRentar')
  })

  it('should have navigation menu in header', () => {
    const nav = compiled.querySelector('[data-testid="main-nav"]')
    expect(nav).toBeTruthy()
  })

  it('should display copyright in footer', () => {
    const copyright = compiled.querySelector('[data-testid="footer-copyright"]')
    expect(copyright).toBeTruthy()
    expect(copyright?.textContent).toContain('2025')
  })
})
