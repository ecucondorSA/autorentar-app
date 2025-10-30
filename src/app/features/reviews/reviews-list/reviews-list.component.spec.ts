import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'

import { ReviewsListComponent } from './reviews-list.component'

describe('ReviewsListComponent (TDD)', () => {
  let component: ReviewsListComponent
  let fixture: ComponentFixture<ReviewsListComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewsListComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(ReviewsListComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display reviews list', () => {
    expect(compiled.querySelector('[data-testid="reviews-list"]')).toBeTruthy()
  })

  it('should display average rating', () => {
    expect(compiled.querySelector('[data-testid="average-rating"]')).toBeTruthy()
  })

  it('should display empty state when no reviews', () => {
    void component.reviews.set([])
    fixture.detectChanges()
    expect(compiled.querySelector('[data-testid="empty-reviews"]')).toBeTruthy()
  })
})
