import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, computed, signal } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

type DateRange = {
  start?: string | null;
  end?: string | null;
};

type CalendarDay = {
  iso: string;
  label: number;
  isUnavailable: boolean;
  isDisabled: boolean;
  isInRange: boolean;
};

@Component({
  selector: 'app-availability-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section data-testid="calendar-container" class="calendar">
      <header class="calendar__header">
        <ion-button data-testid="prev-month-button" fill="clear" (click)="goToPreviousMonth()">
          ◀
        </ion-button>
        <h2 data-testid="current-month">{{ currentMonthLabel() }}</h2>
        <ion-button data-testid="next-month-button" fill="clear" (click)="goToNextMonth()">
          ▶
        </ion-button>
      </header>

      <div data-testid="calendar-days" class="calendar__grid">
        <button
          *ngFor="let day of calendarDays()"
          type="button"
          data-testid="calendar-day"
          [attr.data-testid-unavailable]="day.isUnavailable ? 'unavailable-day' : null"
          [attr.data-testid-disabled]="day.isDisabled ? 'disabled-day' : null"
          [attr.data-testid-selected]="day.isInRange ? 'selected-range' : null"
          [disabled]="day.isDisabled || day.isUnavailable"
          (click)="selectDate(day)"
        >
          {{ day.label }}
        </button>
      </div>
    </section>
  `,
  styles: [
    `
    .calendar {
      display: grid;
      gap: 1rem;
      padding: 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      background: #fff;
    }

    .calendar__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .calendar__grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.5rem;
    }

    button {
      padding: 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid #cbd5f5;
      background: #f8fafc;
      cursor: pointer;
      position: relative;
    }

    button[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    `,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AvailabilityCalendarComponent {
  readonly currentMonth = signal(new Date());
  readonly unavailableDates = signal<string[]>([]);
  readonly disablePastDates = signal(false);
  readonly selectedRange = signal<DateRange | null>(null);

  @Output() readonly dateSelected = new EventEmitter<string>();

  readonly calendarDays = computed<CalendarDay[]>(() => {
    const base = this.currentMonth();
    const year = base.getFullYear();
    const month = base.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const unavailable = new Set(this.unavailableDates());
    const disablePast = this.disablePastDates();
    const todayIso = this.toISO(new Date());

    const range = this.selectedRange();
    const start = range?.start ? new Date(range.start) : null;
    const end = range?.end ? new Date(range.end) : null;

    return Array.from({ length: daysInMonth }, (_, index) => {
      const dayNumber = index + 1;
      const current = new Date(year, month, dayNumber);
      const iso = this.toISO(current);

      const isUnavailable = unavailable.has(iso);
      const isDisabled = disablePast ? iso < todayIso : false;
      const isInRange = Boolean(start && end && current >= start && current <= end);

      return {
        iso,
        label: dayNumber,
        isUnavailable,
        isDisabled,
        isInRange,
      } satisfies CalendarDay;
    });
  });

  currentMonthLabel(): string {
    return this.currentMonth().toLocaleDateString('es-AR', {
      month: 'long',
      year: 'numeric',
    });
  }

  goToPreviousMonth(): void {
    const base = this.currentMonth();
    this.currentMonth.set(new Date(base.getFullYear(), base.getMonth() - 1, 1));
  }

  goToNextMonth(): void {
    const base = this.currentMonth();
    this.currentMonth.set(new Date(base.getFullYear(), base.getMonth() + 1, 1));
  }

  selectDate(day: CalendarDay): void {
    if (day.isUnavailable || day.isDisabled) {
      return;
    }

    this.dateSelected.emit(day.iso);
  }

  private toISO(value: Date): string {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
