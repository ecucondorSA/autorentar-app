/* eslint-disable @typescript-eslint/no-unsafe-argument -- Test file: TestBed.createComponent requires type assertion */
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'

import { MyBookingsComponent } from './my-bookings.component'

describe('MyBookingsComponent (TDD)', () => {
  let component: MyBookingsComponent
  let fixture: ComponentFixture<MyBookingsComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyBookingsComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(MyBookingsComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display bookings list', () => {
    expect(compiled.querySelector('[data-testid="bookings-list"]')).toBeTruthy()
  })

  it('should display empty state when no bookings', () => {
    void component.bookings.set([])
    fixture.detectChanges()
    expect(compiled.querySelector('[data-testid="empty-bookings"]')).toBeTruthy()
  })

  it('should filter by status tabs', () => {
    expect(compiled.querySelector('[data-testid="status-tabs"]')).toBeTruthy()
  })
})
/* eslint-enable @typescript-eslint/no-unsafe-argument -- Re-enable after test file */
