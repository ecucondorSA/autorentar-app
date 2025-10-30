import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'

import { MessageListComponent } from './message-list.component'

describe('MessageListComponent (TDD)', () => {
  let component: MessageListComponent
  let fixture: ComponentFixture<MessageListComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageListComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(MessageListComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display conversations list', () => {
    expect(compiled.querySelector('[data-testid="conversations-list"]')).toBeTruthy()
  })

  it('should display unread count badge', () => {
    void component.conversations.set([{ id: '1', unread_count: 3 } as any])
    fixture.detectChanges()
    expect(compiled.querySelector('[data-testid="unread-badge"]')).toBeTruthy()
  })

  it('should display last message preview', () => {
    void component.conversations.set([{ id: '1', last_message: 'Hello' } as any])
    fixture.detectChanges()
    expect(compiled.querySelector('[data-testid="last-message"]')).toBeTruthy()
  })
})
