/* eslint-disable @typescript-eslint/no-unsafe-argument -- Test file: TestBed.createComponent requires type assertion */
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'

import { FooterComponent } from './footer.component'

describe('FooterComponent (TDD)', () => {
  let component: FooterComponent
  let fixture: ComponentFixture<FooterComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(FooterComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have footer element', () => {
    expect(compiled.querySelector('ion-footer[data-testid="app-footer"]')).toBeTruthy()
  })

  it('should display copyright text', () => {
    expect(compiled.querySelector('[data-testid="copyright"]')).toBeTruthy()
  })

  it('should have social links', () => {
    expect(compiled.querySelector('[data-testid="social-links"]')).toBeTruthy()
  })

  it('should have legal links', () => {
    expect(compiled.querySelector('[data-testid="legal-links"]')).toBeTruthy()
  })
})
/* eslint-enable @typescript-eslint/no-unsafe-argument -- Re-enable after test file */
