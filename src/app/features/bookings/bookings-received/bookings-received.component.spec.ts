/* eslint-disable @typescript-eslint/no-unsafe-argument -- Test file: TestBed.createComponent requires type assertion */
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'

import { BookingsReceivedComponent } from './bookings-received.component'

describe('BookingsReceivedComponent (TDD)', () => {
  let component: BookingsReceivedComponent
  let fixture: ComponentFixture<BookingsReceivedComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingsReceivedComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(BookingsReceivedComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display received bookings list', () => {
    expect(compiled.querySelector('[data-testid="received-bookings-list"]')).toBeTruthy()
  })

  it('should have approve button for pending bookings', () => {
    void component.bookings.set([{ status: 'pending' } as any])
    fixture.detectChanges()
    expect(compiled.querySelector('ion-button[data-testid="approve-booking"]')).toBeTruthy()
  })

  it('should have reject button for pending bookings', () => {
    void component.bookings.set([{ status: 'pending' } as any])
    fixture.detectChanges()
    expect(compiled.querySelector('ion-button[data-testid="reject-booking"]')).toBeTruthy()
  })
})
