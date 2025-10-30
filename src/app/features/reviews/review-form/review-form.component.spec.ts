/* eslint-disable @typescript-eslint/no-unsafe-argument -- Test file: TestBed.createComponent requires type assertion */
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'

import { ReviewFormComponent } from './review-form.component'

describe('ReviewFormComponent (TDD)', () => {
  let component: ReviewFormComponent
  let fixture: ComponentFixture<ReviewFormComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewFormComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(ReviewFormComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have rating input', () => {
    expect(compiled.querySelector('[data-testid="rating-input"]')).toBeTruthy()
  })

  it('should have comment textarea', () => {
    expect(compiled.querySelector('[data-testid="comment-input"]')).toBeTruthy()
  })

  it('should have submit button', () => {
    expect(compiled.querySelector('ion-button[data-testid="submit-review"]')).toBeTruthy()
  })
})
