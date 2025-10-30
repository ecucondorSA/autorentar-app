/* eslint-disable @typescript-eslint/no-unsafe-argument -- Test file: TestBed.createComponent requires type assertion */
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'

import { ChatComponent } from './chat.component'

describe('ChatComponent (TDD)', () => {
  let component: ChatComponent
  let fixture: ComponentFixture<ChatComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(ChatComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display messages list', () => {
    expect(compiled.querySelector('[data-testid="messages-container"]')).toBeTruthy()
  })

  it('should have message input', () => {
    expect(compiled.querySelector('[data-testid="message-input"]')).toBeTruthy()
  })

  it('should have send button', () => {
    expect(compiled.querySelector('ion-button[data-testid="send-message"]')).toBeTruthy()
  })

  it('should display user avatar in messages', () => {
    void component.messages.set([{ id: '1', sender_id: 'user1', content: 'Hello' } as any])
    fixture.detectChanges()
    expect(compiled.querySelector('[data-testid="message-avatar"]')).toBeTruthy()
  })
})
/* eslint-enable @typescript-eslint/no-unsafe-argument -- Re-enable after test file */
