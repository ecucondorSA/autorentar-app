# 🏗️ Services Layer - Architecture Design

**Fecha**: 29 de Octubre 2025
**Fase**: Semanas 7-8

---

## 🎯 Propósito del Services Layer

Los **Services** contienen toda la **lógica de negocio** de AutoRentar. Se ubican entre:
- **API Routes** (arriba) - Manejan HTTP requests/responses
- **SDKs** (abajo) - Acceso a datos de Supabase

```
┌─────────────────────────────────────┐
│      API Routes (Controllers)       │  ← HTTP, Auth, Validation
│         /api/bookings/...           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Services (Business Logic)      │  ← WE ARE HERE
│    BookingService, PaymentService   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│       SDKs (Data Access Layer)      │  ← CRUD operations
│     bookingSDK, carSDK, etc...      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│          Supabase Database          │
└─────────────────────────────────────┘
```

---

## 📐 Arquitectura de BookingService

### Responsabilidades

#### 1️⃣ **createBooking()** - Crear nueva reserva
**Input**: `CreateBookingServiceInput`
**Output**: `BookingDTO`
**Business Logic**:
1. Validar que el car existe y está activo
2. Verificar disponibilidad del car (no bookings solapados)
3. Calcular pricing total:
   - Base price (días * precio por día)
   - Regional multiplier
   - Demand multiplier (weekends, holidays)
   - Duration discount (weekly, monthly)
   - Insurance premium (si se selecciona)
   - Extras (GPS, child seats, drivers adicionales)
4. Crear booking con status `pending`
5. Crear payment pendiente
6. Crear insurance policy (si aplica)
7. **TODO**: En caso de error, rollback

**Estados**:
```
pending → confirmed → active → completed
   ↓
cancelled (puede ocurrir desde pending o confirmed)
```

#### 2️⃣ **confirmBooking()** - Owner confirma reserva
**Input**: `{ bookingId, ownerId }`
**Output**: `BookingDTO`
**Business Logic**:
1. Obtener booking con car info (join)
2. Verificar que `ownerId` es el owner del car
3. Verificar que booking está en estado `pending`
4. Cambiar status a `confirmed`
5. Procesar payment (capturar hold o cobrar)
6. Enviar notificación al renter

**Validaciones**:
- ❌ Solo el owner puede confirmar
- ❌ Solo bookings `pending` pueden ser confirmados

#### 3️⃣ **cancelBooking()** - Cancelar reserva
**Input**: `{ bookingId, userId, reason }`
**Output**: `BookingDTO`
**Business Logic**:
1. Obtener booking
2. Verificar permisos:
   - Renter puede cancelar su propio booking
   - Owner puede cancelar bookings de su car
   - Admin puede cancelar cualquier booking
3. Verificar que booking NO está `active` o `completed`
4. Calcular refund según política de cancelación:
   - **Flexible**: 100% si cancela 24h antes, 0% después
   - **Moderate**: 100% si cancela 5 días antes, 50% si 2 días, 0% después
   - **Strict**: 100% si cancela 7 días antes, 0% después
   - **Excepción**: Si cancela owner/admin, siempre 100% refund al renter
5. Procesar refund (si aplica)
6. Cambiar status a `cancelled`
7. Liberar disponibilidad del car

**Políticas de cancelación**:
```typescript
type CancelPolicy = 'flexible' | 'moderate' | 'strict'

calculateRefund(booking: BookingDTO, cancelledBy: 'renter' | 'owner' | 'admin'): number {
  const hoursUntilStart = (booking.start_date - now) / 3600

  if (cancelledBy !== 'renter') return booking.total_price_cents // Full refund

  switch (booking.cancel_policy) {
    case 'flexible':
      return hoursUntilStart >= 24 ? booking.total_price_cents : 0
    case 'moderate':
      if (hoursUntilStart >= 120) return booking.total_price_cents
      if (hoursUntilStart >= 48) return booking.total_price_cents * 0.5
      return 0
    case 'strict':
      return hoursUntilStart >= 168 ? booking.total_price_cents : 0
  }
}
```

#### 4️⃣ **startBooking()** - Iniciar alquiler (pickup)
**Input**: `{ bookingId, actualStartDate, odometerKm }`
**Output**: `BookingDTO`
**Business Logic**:
1. Verificar que booking está `confirmed`
2. Cambiar status a `active`
3. Registrar `actual_start_date` y `odometer_km`
4. Marcar car como "en uso" (opcional)

#### 5️⃣ **completeBooking()** - Finalizar alquiler (dropoff)
**Input**: `{ bookingId, actualEndDate, finalOdometerKm }`
**Output**: `BookingDTO`
**Business Logic**:
1. Verificar que booking está `active`
2. Calcular cargos adicionales:
   - Exceso de kilometraje (si aplica)
   - Días adicionales (si devuelve tarde)
   - Daños (si hay insurance claim)
3. Cambiar status a `completed`
4. Registrar `actual_end_date` y `final_odometer_km`
5. Distribuir pago (payment split):
   - **Owner**: 85% del total
   - **Platform**: 10% del total
   - **Insurance**: 5% del total (si aplica)
6. Actualizar estadísticas:
   - `car_stats`: total_bookings++, revenue+=amount
   - `user_stats` (renter): total_bookings_as_renter++
   - `user_stats` (owner): total_bookings_as_owner++, earnings+=amount
7. Habilitar sistema de reviews (ambos pueden reviewearse)

**Payment Split**:
```typescript
async splitPayment(payment: PaymentDTO, booking: BookingDTO) {
  const splits = [
    { recipient_id: booking.car.owner_id, amount: payment.amount * 0.85, type: 'owner' },
    { recipient_id: PLATFORM_WALLET_ID, amount: payment.amount * 0.10, type: 'platform' },
  ]

  if (booking.insurance_policy_id) {
    splits.push({
      recipient_id: INSURANCE_WALLET_ID,
      amount: payment.amount * 0.05,
      type: 'insurance'
    })
  }

  return paymentSDK.createSplits(payment.id, splits)
}
```

---

## 🔄 State Machine

```
┌──────────┐
│ pending  │ ← Booking creado, esperando confirmación del owner
└─────┬────┘
      │ confirmBooking()
      ▼
┌──────────┐
│confirmed │ ← Owner confirmó, esperando pickup
└─────┬────┘
      │ startBooking()
      ▼
┌──────────┐
│  active  │ ← Alquiler en curso
└─────┬────┘
      │ completeBooking()
      ▼
┌──────────┐
│completed │ ← Alquiler finalizado, puede reviewearse
└──────────┘

      ┌─────────────┐
      │  cancelled  │ ← Puede ocurrir desde pending o confirmed
      └─────────────┘
```

**Transiciones válidas**:
- `pending` → `confirmed` (confirmBooking)
- `pending` → `cancelled` (cancelBooking)
- `confirmed` → `active` (startBooking)
- `confirmed` → `cancelled` (cancelBooking)
- `active` → `completed` (completeBooking)

**Transiciones inválidas** (deben rechazarse):
- ❌ `active` → `cancelled` (no se puede cancelar alquiler en curso)
- ❌ `completed` → cualquier otro estado (finalizado es terminal)
- ❌ Saltar estados (ej: `pending` → `active` sin pasar por `confirmed`)

---

## 🏗️ Estructura de BookingService

```typescript
import { bookingSDK } from '@/lib/sdk/booking.sdk'
import { carSDK } from '@/lib/sdk/car.sdk'
import { paymentSDK } from '@/lib/sdk/payment.sdk'
import { pricingSDK } from '@/lib/sdk/pricing.sdk'
import { insuranceSDK } from '@/lib/sdk/insurance.sdk'
import { profileSDK } from '@/lib/sdk/profile.sdk'
import type { BookingDTO, CreateBookingServiceInput } from '@/types'

export class BookingService {
  constructor(
    private bookingSDK = bookingSDK,
    private carSDK = carSDK,
    private paymentSDK = paymentSDK,
    private pricingSDK = pricingSDK,
    private insuranceSDK = insuranceSDK,
    private profileSDK = profileSDK
  ) {}

  async createBooking(input: CreateBookingServiceInput): Promise<BookingDTO> {
    // Business logic here
  }

  async confirmBooking(bookingId: string, ownerId: string): Promise<BookingDTO> {
    // Business logic here
  }

  async cancelBooking(
    bookingId: string,
    userId: string,
    reason?: string
  ): Promise<BookingDTO> {
    // Business logic here
  }

  async startBooking(
    bookingId: string,
    input: StartBookingInput
  ): Promise<BookingDTO> {
    // Business logic here
  }

  async completeBooking(
    bookingId: string,
    input: CompleteBookingInput
  ): Promise<BookingDTO> {
    // Business logic here
  }

  // Helper methods
  private async validateCarAvailability(
    carId: string,
    startDate: string,
    endDate: string
  ): Promise<boolean>

  private calculateRefundAmount(
    booking: BookingDTO,
    cancelledBy: 'renter' | 'owner' | 'admin'
  ): number

  private async splitPayment(
    payment: PaymentDTO,
    booking: BookingDTO
  ): Promise<void>
}
```

---

## 🛡️ Error Handling

### Tipos de errores:

```typescript
class BookingError extends Error {
  constructor(
    message: string,
    public code: BookingErrorCode,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'BookingError'
  }
}

enum BookingErrorCode {
  CAR_NOT_AVAILABLE = 'CAR_NOT_AVAILABLE',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  BOOKING_NOT_FOUND = 'BOOKING_NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}
```

### Manejo de errores:

```typescript
async createBooking(input: CreateBookingServiceInput): Promise<BookingDTO> {
  try {
    // 1. Validate car exists
    const car = await this.carSDK.getById(input.car_id)
    if (car.status !== 'active') {
      throw new BookingError(
        'Car is not available for booking',
        BookingErrorCode.CAR_NOT_AVAILABLE,
        400
      )
    }

    // 2. Check availability
    const isAvailable = await this.validateCarAvailability(...)
    if (!isAvailable) {
      throw new BookingError(
        'Car is not available for selected dates',
        BookingErrorCode.CAR_NOT_AVAILABLE,
        409
      )
    }

    // 3. Calculate pricing
    const pricing = await this.pricingSDK.calculate(...)

    // 4. Create booking (transaction would be ideal)
    const booking = await this.bookingSDK.create({
      ...input,
      total_price_cents: pricing.total_cents,
      status: 'pending',
    })

    // 5. Create payment
    try {
      await this.paymentSDK.create({
        booking_id: booking.id,
        payer_id: input.renter_id,
        amount_cents: pricing.total_cents,
        status: 'pending',
      })
    } catch (paymentError) {
      // Compensating transaction: delete booking
      await this.bookingSDK.delete(booking.id)
      throw new BookingError(
        'Failed to create payment',
        BookingErrorCode.PAYMENT_FAILED,
        500
      )
    }

    return booking
  } catch (error) {
    if (error instanceof BookingError) throw error
    throw toError(error)
  }
}
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
describe('BookingService', () => {
  describe('createBooking', () => {
    it('should create booking when car is available', async () => {
      // Arrange
      const mockCarSDK = { getById: jest.fn().mockResolvedValue(activeCar) }
      const service = new BookingService({ carSDK: mockCarSDK, ... })

      // Act
      const booking = await service.createBooking(validInput)

      // Assert
      expect(booking.status).toBe('pending')
      expect(mockCarSDK.getById).toHaveBeenCalledWith(validInput.car_id)
    })

    it('should throw error when car is not available', async () => {
      // Test unavailable car
    })
  })

  describe('cancelBooking', () => {
    it('should apply flexible cancellation policy correctly', () => {
      // Test refund calculation
    })

    it('should give full refund when owner cancels', () => {
      // Test owner cancellation
    })
  })
})
```

### Integration Tests

```typescript
describe('BookingService Integration', () => {
  it('should create booking end-to-end', async () => {
    // Real Supabase test client
    const service = new BookingService()
    const booking = await service.createBooking(testInput)

    // Verify booking in DB
    const dbBooking = await supabase.from('bookings').select().eq('id', booking.id)
    expect(dbBooking).toBeDefined()

    // Verify payment created
    const payment = await supabase.from('payments').select().eq('booking_id', booking.id)
    expect(payment.status).toBe('pending')
  })
})
```

---

## 📊 Performance Considerations

### Caching Strategy
- Cache car availability calendar (15 minutes)
- Cache pricing calculations (5 minutes)
- Invalidate cache on booking creation/cancellation

### Database Optimization
- Index on `bookings.car_id + start_date + end_date` (availability checks)
- Index on `bookings.renter_id` (user bookings)
- Index on `bookings.status` (filtering)

### Rate Limiting
- Max 10 booking creations per user per hour
- Max 3 cancellations per user per day

---

## 🔄 Transaction Handling

**Problema**: Supabase no soporta transacciones distribuidas fácilmente.

**Soluciones**:

### Opción 1: Compensating Transactions (Actual)
```typescript
try {
  const booking = await createBooking()
  try {
    const payment = await createPayment()
    try {
      const insurance = await createInsurance()
      return booking
    } catch (e) {
      await deletePayment(payment.id)
      await deleteBooking(booking.id)
      throw e
    }
  } catch (e) {
    await deleteBooking(booking.id)
    throw e
  }
} catch (e) {
  throw e
}
```

### Opción 2: Postgres Transactions (Futuro)
```typescript
await supabase.rpc('create_booking_transaction', {
  p_car_id: input.car_id,
  p_renter_id: input.renter_id,
  // ... all params
})
```

Postgres function:
```sql
CREATE OR REPLACE FUNCTION create_booking_transaction(...)
RETURNS bookings AS $$
BEGIN
  INSERT INTO bookings (...) VALUES (...) RETURNING * INTO booking;
  INSERT INTO payments (...) VALUES (...);
  INSERT INTO insurance_policies (...) VALUES (...);
  RETURN booking;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;  -- Rollback automático
END;
$$ LANGUAGE plpgsql;
```

### Opción 3: Event Sourcing (Avanzado)
- Crear eventos: `BookingCreated`, `PaymentProcessed`, etc.
- Event handlers procesan de forma eventual
- Permite audit trail completo

---

## 🚀 Deployment Checklist

- [ ] Unit tests > 80% coverage
- [ ] Integration tests para flujos críticos
- [ ] Error handling completo
- [ ] Input validation con Zod
- [ ] Logging de operaciones importantes
- [ ] Rate limiting configurado
- [ ] Performance testing (< 200ms p95)
- [ ] Documentation actualizada

---

**Next**: Implementar `BookingService` siguiendo este diseño.
