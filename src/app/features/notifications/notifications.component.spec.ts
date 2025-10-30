/* eslint-disable @typescript-eslint/no-unsafe-argument -- Test file: TestBed.createComponent requires type assertion */
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'

import { NotificationsComponent } from './notifications.component'

describe('NotificationsComponent (TDD)', () => {
  let component: NotificationsComponent
  let fixture: ComponentFixture<NotificationsComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationsComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(NotificationsComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display notifications list', () => {
    expect(compiled.querySelector('[data-testid="notifications-list"]')).toBeTruthy()
  })

  it('should display unread notifications differently', () => {
    void component.notifications.set([{ id: '1', read: false } as any])
    fixture.detectChanges()
    expect(compiled.querySelector('[data-testid="unread-notification"]')).toBeTruthy()
  })

  it('should have mark all read button', () => {
    expect(compiled.querySelector('ion-button[data-testid="mark-all-read"]')).toBeTruthy()
  })

  it('should display empty state when no notifications', () => {
    void component.notifications.set([])
    fixture.detectChanges()
    expect(compiled.querySelector('[data-testid="empty-notifications"]')).toBeTruthy()
  })
})
/* eslint-enable @typescript-eslint/no-unsafe-argument -- Re-enable after test file */
