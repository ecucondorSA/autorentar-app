import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'

import { ProfileEditComponent } from './profile-edit.component'

describe('ProfileEditComponent (TDD)', () => {
  let component: ProfileEditComponent
  let fixture: ComponentFixture<ProfileEditComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileEditComponent],
      providers: [provideRouter([])],
    }).compileComponents()

    fixture = TestBed.createComponent(ProfileEditComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have edit form', () => {
    expect(compiled.querySelector('form[data-testid="profile-edit-form"]')).toBeTruthy()
  })

  it('should have name input', () => {
    expect(compiled.querySelector('[data-testid="name-input"]')).toBeTruthy()
  })

  it('should have avatar upload button', () => {
    expect(compiled.querySelector('[data-testid="avatar-upload"]')).toBeTruthy()
  })

  it('should have save button', () => {
    expect(compiled.querySelector('ion-button[data-testid="save-profile"]')).toBeTruthy()
  })

  it('should have cancel button', () => {
    expect(compiled.querySelector('ion-button[data-testid="cancel-edit"]')).toBeTruthy()
  })
})
