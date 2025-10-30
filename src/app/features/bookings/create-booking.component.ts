/**
 * Create Booking Component
 * Example component demonstrating how to use BookingService in Angular
 *
 * Features:
 * - Form validation with reactive forms
 * - Error handling
 * - Loading states
 * - Integration with BookingService
 */

import { Component, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router } from '@angular/router'
import { bookingService } from '@/services/booking.service'
import { carService } from '@/services/car.service'
import { pricingSDK } from '@/lib/sdk/pricing.sdk'
import type { CarDTO, BookingDTO } from '@/types'
import type { CreateBookingServiceInput } from '@/types/service-types'

@Component({
  selector: 'app-create-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container">
      <h1>Create New Booking</h1>

      @if (errorMessage()) {
        <div class="alert alert-error">
          {{ errorMessage() }}
        </div>
      }

      @if (loading()) {
        <div class="loading-spinner">Processing...</div>
      }

      <form [formGroup]="bookingForm" (ngSubmit)="onSubmit()">
        <!-- Car Selection -->
        <div class="form-group">
          <label for="car">Select Car</label>
          <select id="car" formControlName="car_id" (change)="onCarSelected()">
            <option value="">Choose a car...</option>
            @for (car of availableCars(); track car.id) {
              <option [value]="car.id">
                {{ car.make }} {{ car.model }} {{ car.year }} - ${{ car.price_per_day_cents / 100 }}/day
              </option>
            }
          </select>
          @if (bookingForm.get('car_id')?.invalid && bookingForm.get('car_id')?.touched) {
            <span class="error">Please select a car</span>
          }
        </div>

        <!-- Dates -->
        <div class="form-row">
          <div class="form-group">
            <label for="start_date">Start Date</label>
            <input
              id="start_date"
              type="date"
              formControlName="start_date"
              [min]="minDate"
              (change)="calculatePricing()"
            />
          </div>

          <div class="form-group">
            <label for="end_date">End Date</label>
            <input
              id="end_date"
              type="date"
              formControlName="end_date"
              [min]="bookingForm.get('start_date')?.value"
              (change)="calculatePricing()"
            />
          </div>
        </div>

        <!-- Insurance -->
        <div class="form-group">
          <label>Insurance Coverage</label>
          <select formControlName="insurance_coverage_level" (change)="calculatePricing()">
            <option value="none">None</option>
            <option value="basic">Basic ($5k coverage)</option>
            <option value="standard">Standard ($10k coverage)</option>
            <option value="premium">Premium ($20k coverage)</option>
          </select>
        </div>

        <!-- Extras -->
        <div class="form-group">
          <label>Extras</label>
          <div class="checkbox-group">
            <label>
              <input type="checkbox" formControlName="extra_gps" (change)="calculatePricing()">
              GPS Navigation (+$5/day)
            </label>
            <label>
              <input type="checkbox" formControlName="extra_wifi" (change)="calculatePricing()">
              WiFi Hotspot (+$3/day)
            </label>
          </div>
        </div>

        <div class="form-group">
          <label for="extra_driver_count">Additional Drivers</label>
          <input
            id="extra_driver_count"
            type="number"
            formControlName="extra_driver_count"
            min="0"
            max="3"
            (change)="calculatePricing()"
          />
        </div>

        <!-- Pricing Summary -->
        @if (pricingEstimate()) {
          <div class="pricing-summary">
            <h3>Pricing Estimate</h3>
            <div class="price-row">
              <span>Base Price:</span>
              <span>\${{ (pricingEstimate()!.base_price_cents / 100).toFixed(2) }}</span>
            </div>
            @if (pricingEstimate()!.addons.insurance_cents > 0) {
              <div class="price-row">
                <span>Insurance:</span>
                <span>\${{ (pricingEstimate()!.addons.insurance_cents / 100).toFixed(2) }}</span>
              </div>
            }
            @if (pricingEstimate()!.addons.extras_cents > 0) {
              <div class="price-row">
                <span>Extras:</span>
                <span>\${{ (pricingEstimate()!.addons.extras_cents / 100).toFixed(2) }}</span>
              </div>
            }
            <div class="price-row total">
              <span>Total:</span>
              <span>\${{ (pricingEstimate()!.total_cents / 100).toFixed(2) }}</span>
            </div>
          </div>
        }

        <!-- Submit -->
        <div class="form-actions">
          <button
            type="submit"
            [disabled]="bookingForm.invalid || loading()"
            class="btn btn-primary"
          >
            Create Booking
          </button>
          <button
            type="button"
            (click)="onCancel()"
            class="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .pricing-summary {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 8px;
      margin: 1rem 0;
    }

    .price-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
    }

    .price-row.total {
      border-top: 2px solid #333;
      font-weight: bold;
      margin-top: 0.5rem;
    }

    .alert {
      padding: 1rem;
      margin-bottom: 1rem;
      border-radius: 4px;
    }

    .alert-error {
      background: #fee;
      color: #c00;
      border: 1px solid #fcc;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
    }
  `]
})
export class CreateBookingComponent implements OnInit {
  bookingForm: FormGroup
  availableCars = signal<CarDTO[]>([])
  pricingEstimate = signal<any>(null)
  loading = signal(false)
  errorMessage = signal('')
  minDate = new Date().toISOString().split('T')[0]

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.bookingForm = this.fb.group({
      car_id: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      insurance_coverage_level: ['none'],
      extra_driver_count: [0, [Validators.min(0), Validators.max(3)]],
      extra_child_seat_count: [0, [Validators.min(0), Validators.max(3)]],
      extra_gps: [false],
      extra_wifi: [false],
      promo_code: ['']
    })
  }

  async ngOnInit() {
    await this.loadAvailableCars()
  }

  async loadAvailableCars() {
    try {
      this.loading.set(true)
      // TODO: Get available cars from CarService
      // For now, mock data
      this.availableCars.set([])
    } catch (error) {
      this.errorMessage.set('Failed to load available cars')
      console.error(error)
    } finally {
      this.loading.set(false)
    }
  }

  async onCarSelected() {
    await this.calculatePricing()
  }

  async calculatePricing() {
    const formValue = this.bookingForm.value

    if (!formValue.car_id || !formValue.start_date || !formValue.end_date) {
      this.pricingEstimate.set(null)
      return
    }

    try {
      const selectedCar = this.availableCars().find(c => c.id === formValue.car_id)
      if (!selectedCar) {return}

      const rentalDays = this.calculateRentalDays(formValue.start_date, formValue.end_date)

      const pricing = await pricingSDK.calculate({
        car_id: formValue.car_id,
        start_date: formValue.start_date,
        end_date: formValue.end_date,
        rental_days: rentalDays,
        base_price_per_day_cents: selectedCar.price_per_day_cents,
        insurance_coverage_level: formValue.insurance_coverage_level,
        extra_driver_count: formValue.extra_driver_count,
        extra_child_seat_count: formValue.extra_child_seat_count,
        extra_gps: formValue.extra_gps,
        extra_wifi: formValue.extra_wifi,
        promo_code: formValue.promo_code,
        user_id: '' // TODO: Get from auth service
      })

      this.pricingEstimate.set(pricing)
    } catch (error) {
      console.error('Failed to calculate pricing:', error)
    }
  }

  async onSubmit() {
    if (this.bookingForm.invalid) {return}

    this.loading.set(true)
    this.errorMessage.set('')

    try {
      const formValue = this.bookingForm.value

      const input: CreateBookingServiceInput = {
        car_id: formValue.car_id,
        renter_id: '', // TODO: Get from auth service
        start_date: formValue.start_date,
        end_date: formValue.end_date,
        insurance_coverage_level: formValue.insurance_coverage_level,
        extra_driver_count: formValue.extra_driver_count,
        extra_child_seat_count: formValue.extra_child_seat_count,
        extra_gps: formValue.extra_gps,
        extra_wifi: formValue.extra_wifi,
        promo_code: formValue.promo_code || undefined
      }

      const booking: BookingDTO = await bookingService.createBooking(input)

      // Success! Redirect to booking details
      await this.router.navigate(['/bookings', booking.id])

    } catch (error: any) {
      this.errorMessage.set(error.message || 'Failed to create booking')
      console.error('Booking creation error:', error)
    } finally {
      this.loading.set(false)
    }
  }

  onCancel() {
    this.router.navigate(['/'])
  }

  private calculateRentalDays(startDate: string, endDate: string): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(diffDays, 1)
  }
}
