import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing'

import { carSDK } from '@/lib/sdk/car.sdk'

import { MyCarsComponent } from './my-cars.component'

describe('MyCarsComponent (TDD)', () => {
  let component: MyCarsComponent
  let fixture: ComponentFixture<MyCarsComponent>
  let compiled: HTMLElement

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyCarsComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(MyCarsComponent)
    component = fixture.componentInstance
    compiled = fixture.nativeElement as HTMLElement
    spyOn(carSDK, 'search').and.returnValue(Promise.resolve({ data: [], count: 0, page: 1, pageSize: 20, hasMore: false }))
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display empty state when no cars', async () => {
    await component.ngOnInit()
    fixture.detectChanges()
    expect(compiled.querySelector('[data-testid="empty-state"]')).toBeTruthy()
  })

  it('should have add car button', () => {
    expect(compiled.querySelector('ion-button[data-testid="add-car-button"]')).toBeTruthy()
  })

  it('should display car list', async () => {
    (carSDK.search as jasmine.Spy).and.returnValue(Promise.resolve({ 
      data: [{ id: '1', brand: 'Toyota' } as any], 
      count: 1, 
      page: 1, 
      pageSize: 20, 
      hasMore: false 
    }))
    await component.ngOnInit()
    fixture.detectChanges()
    expect(compiled.querySelector('[data-testid="car-list"]')).toBeTruthy()
  })
})
