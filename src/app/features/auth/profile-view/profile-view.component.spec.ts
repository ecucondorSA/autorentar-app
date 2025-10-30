import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'

import { profileSDK } from '@/lib/sdk/profile.sdk'

import { ProfileViewComponent } from './profile-view.component'

describe('ProfileViewComponent (TDD)', () => {
  let component: ProfileViewComponent
  let fixture: ComponentFixture<ProfileViewComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileViewComponent],
      providers: [provideRouter([])],
    }).compileComponents()

    fixture = TestBed.createComponent(ProfileViewComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    spyOn(profileSDK, 'getCurrent').and.returnValue(Promise.resolve({
      id: 'user-id',
      email: 'test@example.com',
      full_name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    } as any))
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display user avatar', async () => {
    await component.ngOnInit()
    fixture.detectChanges()
    expect(compiled.querySelector('img[data-testid="user-avatar"]')).toBeTruthy()
  })

  it('should display user name', async () => {
    await component.ngOnInit()
    fixture.detectChanges()
    const name = compiled.querySelector('[data-testid="user-name"]')
    expect(name?.textContent).toContain('Test User')
  })

  it('should display user email', async () => {
    await component.ngOnInit()
    fixture.detectChanges()
    const email = compiled.querySelector('[data-testid="user-email"]')
    expect(email?.textContent).toContain('test@example.com')
  })

  it('should have edit button', async () => {
    await component.ngOnInit()
    fixture.detectChanges()
    expect(compiled.querySelector('ion-button[data-testid="edit-profile-button"]')).toBeTruthy()
  })
})
