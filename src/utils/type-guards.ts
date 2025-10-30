/**
 * Type Guards - AutoRentar
 * 
 * Type-safe runtime checks for database types
 */

import {
  type Booking,
  BookingStatus,
  type Car,
  CarStatus,
  type Payment,
  PaymentStatus,
  type Profile,
  UserRole,
} from '../types/database.types';

// ============================================================================
// BOOKING TYPE GUARDS
// ============================================================================

export function isBooking(value: unknown): value is Booking {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.car_id === 'string' &&
    typeof obj.renter_id === 'string' &&
    typeof obj.start_at === 'string' &&
    typeof obj.end_at === 'string' &&
    isBookingStatus(obj.status)
  );
}

export function isBookingStatus(value: unknown): value is BookingStatus {
  return (
    typeof value === 'string' &&
    Object.values(BookingStatus).includes(value as BookingStatus)
  );
}

export function isPendingBooking(booking: Booking): boolean {
  return booking.status === BookingStatus.PENDING;
}

export function isActiveBooking(booking: Booking): boolean {
  return booking.status === BookingStatus.ACTIVE;
}

export function isCompletedBooking(booking: Booking): boolean {
  return booking.status === BookingStatus.COMPLETED;
}

export function isCancelledBooking(booking: Booking): boolean {
  return booking.status === BookingStatus.CANCELLED;
}

// ============================================================================
// CAR TYPE GUARDS
// ============================================================================

export function isCar(value: unknown): value is Car {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.owner_id === 'string' &&
    typeof obj.title === 'string' &&
    isCarStatus(obj.status)
  );
}

export function isCarStatus(value: unknown): value is CarStatus {
  return (
    typeof value === 'string' &&
    Object.values(CarStatus).includes(value as CarStatus)
  );
}

export function isActiveCar(car: Car): boolean {
  return car.status === CarStatus.ACTIVE;
}

export function isDraftCar(car: Car): boolean {
  return car.status === CarStatus.DRAFT;
}

// ============================================================================
// PAYMENT TYPE GUARDS
// ============================================================================

export function isPayment(value: unknown): value is Payment {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.booking_id === 'string' &&
    isPaymentStatus(obj.status) &&
    typeof obj.amount === 'number'
  );
}

export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return (
    typeof value === 'string' &&
    Object.values(PaymentStatus).includes(value as PaymentStatus)
  );
}

export function isSuccessfulPayment(payment: Payment): boolean {
  return payment.status === PaymentStatus.SUCCEEDED;
}

export function isPendingPayment(payment: Payment): boolean {
  return (
    payment.status === PaymentStatus.REQUIRES_PAYMENT ||
    payment.status === PaymentStatus.PROCESSING
  );
}

export function isFailedPayment(payment: Payment): boolean {
  return (
    payment.status === PaymentStatus.FAILED ||
    payment.status === PaymentStatus.CANCELED
  );
}

// ============================================================================
// PROFILE TYPE GUARDS
// ============================================================================

export function isProfile(value: unknown): value is Profile {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    isUserRole(obj.role) &&
    typeof obj.country === 'string'
  );
}

export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === 'string' &&
    Object.values(UserRole).includes(value as UserRole)
  );
}

export function isAdmin(profile: Profile): boolean {
  return profile.is_admin === true;
}

export function isOwner(profile: Profile): boolean {
  return profile.role === UserRole.OWNER || profile.role === UserRole.BOTH;
}

export function isRenter(profile: Profile): boolean {
  return profile.role === UserRole.RENTER || profile.role === UserRole.BOTH;
}

export function isVerified(profile: Profile): boolean {
  return (
    profile.email_verified === true &&
    profile.phone_verified === true &&
    profile.id_verified === true
  );
}

// ============================================================================
// UTILITY TYPE GUARDS
// ============================================================================

export function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isUUID(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(value);
}

export function isISODate(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const date = new Date(value);
  return !isNaN(date.getTime());
}

// ============================================================================
// ASSERTION FUNCTIONS
// ============================================================================

export function assertBooking(value: unknown): asserts value is Booking {
  if (!isBooking(value)) {
    throw new Error('Invalid booking object');
  }
}

export function assertCar(value: unknown): asserts value is Car {
  if (!isCar(value)) {
    throw new Error('Invalid car object');
  }
}

export function assertPayment(value: unknown): asserts value is Payment {
  if (!isPayment(value)) {
    throw new Error('Invalid payment object');
  }
}

export function assertProfile(value: unknown): asserts value is Profile {
  if (!isProfile(value)) {
    throw new Error('Invalid profile object');
  }
}

export function assertNonNullable<T>(
  value: T,
  message?: string
): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(message ?? 'Value is null or undefined');
  }
}

export function assertUUID(value: unknown, message?: string): asserts value is string {
  if (!isUUID(value)) {
    throw new Error(message ?? 'Invalid UUID');
  }
}
