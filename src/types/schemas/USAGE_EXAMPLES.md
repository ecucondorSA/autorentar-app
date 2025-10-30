# 📘 GUÍA DE USO: ZOD SCHEMAS

**Generado:** 29 de Octubre 2025
**Schemas:** 8 verticales, 40+ schemas
**Runtime validation:** Zod v3.x

---

## ✅ QUÉ SON LOS SCHEMAS

Los schemas de Zod proporcionan **validación runtime** para todos los inputs, updates y filtros en AutoRentar.

**Diferencia con Types:**
- **Types (TypeScript):** Validación en compile-time (desarrollo)
- **Schemas (Zod):** Validación en runtime (producción)

---

## 📖 EJEMPLOS BÁSICOS

### 1. Validación Simple

```typescript
import { CreateCarInputSchema } from '@/types'

const rawInput = {
  owner_id: 'abc-123',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2023,
  price_per_day: 5000,
  // ...
}

// Validar (throws si falla)
const validData = CreateCarInputSchema.parse(rawInput)

// Validar (no throws, retorna resultado)
const result = CreateCarInputSchema.safeParse(rawInput)

if (result.success) {
  console.log('Datos válidos:', result.data)
} else {
  console.error('Errores:', result.error.issues)
}
```

### 2. Validación con Errores Personalizados

```typescript
import { CreateBookingInputSchema } from '@/types'

try {
  const bookingData = CreateBookingInputSchema.parse(rawInput)
  // Continuar con booking
} catch (error) {
  if (error instanceof z.ZodError) {
    // Parsear errores para UI
    const errors = error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message
    }))

    console.error('Validación falló:', errors)
    // Mostrar en UI
  }
}
```

---

## 🎯 EJEMPLOS POR VERTICAL

### 🚗 Cars

#### Crear Auto

```typescript
import { CreateCarInputSchema, type CreateCarInput } from '@/types'

async function createCar(input: CreateCarInput) {
  // Validar input
  const validData = CreateCarInputSchema.parse(input)

  // Insert en Supabase
  const { data, error } = await supabase
    .from('cars')
    .insert(validData)
    .select()
    .single()

  if (error) throw error
  return data
}

// Uso
const newCar = await createCar({
  owner_id: user.id,
  brand: 'Honda',
  model: 'Civic',
  year: 2023,
  price_per_day: 8000,
  transmission: 'automatic',
  fuel_type: 'gasoline',
  seats: 5,
  doors: 4,
  location_lat: -34.6037,
  location_lng: -58.3816,
  location_address: 'Av. Corrientes 1234',
  location_city: 'Buenos Aires',
})
```

#### Búsqueda con Filtros

```typescript
import { CarSearchFiltersSchema, type CarSearchFilters } from '@/types'

async function searchCars(filters: CarSearchFilters) {
  // Validar filtros
  const validFilters = CarSearchFiltersSchema.parse(filters)

  let query = supabase
    .from('cars')
    .select('*', { count: 'exact' })

  // Aplicar filtros
  if (validFilters.city) {
    query = query.eq('location_city', validFilters.city)
  }

  if (validFilters.minPrice) {
    query = query.gte('price_per_day', validFilters.minPrice)
  }

  if (validFilters.transmission) {
    query = query.eq('transmission', validFilters.transmission)
  }

  // Paginación
  const from = (validFilters.page - 1) * validFilters.pageSize
  const to = from + validFilters.pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

  return {
    data,
    count,
    page: validFilters.page,
    pageSize: validFilters.pageSize,
    hasMore: count ? to < count : false,
  }
}

// Uso
const results = await searchCars({
  city: 'Buenos Aires',
  minPrice: 5000,
  maxPrice: 15000,
  transmission: 'automatic',
  hasAC: true,
  page: 1,
  pageSize: 20,
})
```

### 👤 Profile

#### Registro de Usuario

```typescript
import { CreateProfileInputSchema } from '@/types'

async function registerUser(userData: unknown) {
  // Validar datos de registro
  const validData = CreateProfileInputSchema.parse(userData)

  // Crear perfil en Supabase
  const { data, error } = await supabase
    .from('profiles')
    .insert(validData)
    .select()
    .single()

  if (error) throw error
  return data
}
```

#### KYC Submission

```typescript
import { KYCSubmissionSchema, validateMinimumAge } from '@/types'

async function submitKYC(kycData: unknown) {
  // Validar schema
  const validData = KYCSubmissionSchema.parse(kycData)

  // Validar edad mínima (18+)
  if (!validateMinimumAge(validData.date_of_birth)) {
    throw new Error('Debes ser mayor de 18 años')
  }

  // Subir documentos y crear registro KYC
  // ...

  return { success: true }
}
```

### 📅 Booking

#### Crear Reserva con Validación

```typescript
import {
  CreateBookingInputSchema,
  CheckAvailabilityInputSchema,
  CalculateBookingPriceInputSchema,
} from '@/types'

async function createBookingFlow(bookingInput: unknown) {
  // 1. Validar input básico
  const validInput = CreateBookingInputSchema.parse(bookingInput)

  // 2. Verificar disponibilidad
  const availabilityCheck = CheckAvailabilityInputSchema.parse({
    car_id: validInput.car_id,
    start_date: validInput.start_date,
    end_date: validInput.end_date,
  })

  const isAvailable = await checkCarAvailability(availabilityCheck)
  if (!isAvailable) {
    throw new Error('Auto no disponible en esas fechas')
  }

  // 3. Calcular precio
  const priceInput = CalculateBookingPriceInputSchema.parse({
    car_id: validInput.car_id,
    start_date: validInput.start_date,
    end_date: validInput.end_date,
    insurance_coverage_level: validInput.insurance_coverage_level,
    extra_driver_count: validInput.extra_driver_count,
  })

  const pricing = await calculateBookingPrice(priceInput)

  // 4. Crear booking
  const bookingData = {
    ...validInput,
    base_price_cents: pricing.base_price_cents,
    service_fee_cents: pricing.service_fee_cents,
    tax_cents: pricing.tax_cents,
    total_price_cents: pricing.total_cents,
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert(bookingData)
    .select()
    .single()

  if (error) throw error
  return data
}
```

### 💰 Wallet

#### Retiro de Fondos

```typescript
import { WithdrawalRequestSchema } from '@/types'

async function requestWithdrawal(withdrawalData: unknown) {
  // Validar request
  const validData = WithdrawalRequestSchema.parse(withdrawalData)

  // Verificar balance suficiente
  const { data: wallet } = await supabase
    .from('user_wallets')
    .select('available_balance_cents')
    .eq('user_id', validData.user_id)
    .single()

  if (!wallet || wallet.available_balance_cents < validData.amount_cents) {
    throw new Error('Balance insuficiente')
  }

  // Procesar retiro
  // ...

  return { success: true }
}
```

### 💳 Payment

#### Crear Payment con MercadoPago

```typescript
import { CreateMercadoPagoPreferenceSchema } from '@/types'

async function createMercadoPagoPayment(paymentData: unknown) {
  // Validar datos
  const validData = CreateMercadoPagoPreferenceSchema.parse(paymentData)

  // Crear preferencia en MercadoPago
  const preference = await mercadopago.preferences.create({
    items: [
      {
        title: validData.title,
        quantity: 1,
        unit_price: validData.amount_cents / 100,
      },
    ],
    back_urls: {
      success: validData.success_url,
      failure: validData.failure_url,
      pending: validData.pending_url,
    },
    auto_return: validData.auto_return,
    external_reference: validData.external_reference,
  })

  return preference
}
```

### ⭐ Review

#### Crear Reseña con Validación

```typescript
import { CreateReviewInputSchema } from '@/types'

async function createReview(reviewData: unknown) {
  // Validar input
  const validData = CreateReviewInputSchema.parse(reviewData)

  // Verificar elegibilidad (booking completado, no duplicado, etc.)
  const isEligible = await checkReviewEligibility({
    booking_id: validData.booking_id,
    reviewer_id: validData.reviewer_id,
  })

  if (!isEligible) {
    throw new Error('No puedes dejar reseña para este booking')
  }

  // Crear reseña usando RPC
  const { data, error } = await supabase.rpc('create_review', {
    p_booking_id: validData.booking_id,
    p_reviewer_id: validData.reviewer_id,
    p_reviewee_id: validData.reviewee_id,
    p_car_id: validData.car_id,
    p_review_type: validData.review_type,
    p_rating_cleanliness: validData.rating_cleanliness,
    p_rating_communication: validData.rating_communication,
    p_rating_accuracy: validData.rating_accuracy,
    p_rating_location: validData.rating_location,
    p_rating_checkin: validData.rating_checkin,
    p_rating_value: validData.rating_value,
    p_comment_public: validData.comment_public,
  })

  if (error) throw error
  return data
}
```

### 🛡️ Insurance

#### Solicitar Cotización de Seguro

```typescript
import { InsuranceQuoteRequestSchema } from '@/types'

async function getInsuranceQuote(quoteData: unknown) {
  // Validar request
  const validData = InsuranceQuoteRequestSchema.parse(quoteData)

  // Calcular cotización basado en factores
  const quote = await calculateInsuranceQuote({
    car_value: validData.car_value_cents,
    car_year: validData.car_year,
    user_age: validData.user_age,
    driving_experience: validData.driving_experience_years,
    rental_days: validData.rental_days,
    coverage_level: validData.coverage_level,
  })

  return quote
}
```

### 💰 Pricing

#### Calcular Precio Dinámico

```typescript
import { CalculatePricingSchema, PricingConstants } from '@/types'

async function calculateDynamicPrice(pricingData: unknown) {
  // Validar input
  const validData = CalculatePricingSchema.parse(pricingData)

  // Obtener precio base del auto
  const { data: car } = await supabase
    .from('cars')
    .select('price_per_day')
    .eq('id', validData.car_id)
    .single()

  // Calcular días
  const days = validData.rental_days

  // Aplicar descuentos por duración
  let durationDiscount = 1.0
  if (days >= PricingConstants.MONTHLY_RENTAL_MIN_DAYS) {
    durationDiscount = 1 - PricingConstants.MONTHLY_DISCOUNT / 100
  } else if (days >= PricingConstants.WEEKLY_RENTAL_MIN_DAYS) {
    durationDiscount = 1 - PricingConstants.WEEKLY_DISCOUNT / 100
  }

  // Calcular subtotal
  const basePrice = car.price_per_day * days
  const subtotal = basePrice * durationDiscount

  // Agregar seguros
  let insuranceCost = 0
  if (validData.insurance_coverage_level === 'basic') {
    insuranceCost = PricingConstants.BASIC_INSURANCE_PER_DAY_CENTS * days
  } else if (validData.insurance_coverage_level === 'standard') {
    insuranceCost = PricingConstants.STANDARD_INSURANCE_PER_DAY_CENTS * days
  } else if (validData.insurance_coverage_level === 'premium') {
    insuranceCost = PricingConstants.PREMIUM_INSURANCE_PER_DAY_CENTS * days
  }

  // Service fee y tax
  const serviceFee = subtotal * (PricingConstants.DEFAULT_SERVICE_FEE_PERCENTAGE / 100)
  const tax = subtotal * (PricingConstants.DEFAULT_TAX_PERCENTAGE / 100)

  // Total
  const total = subtotal + insuranceCost + serviceFee + tax

  return {
    base_price_cents: basePrice,
    rental_days: days,
    duration_discount: durationDiscount,
    subtotal_cents: subtotal,
    insurance_cents: insuranceCost,
    service_fee_cents: serviceFee,
    tax_cents: tax,
    total_cents: total,
  }
}
```

---

## 🔧 PATRONES AVANZADOS

### 1. Validación con Transformaciones

```typescript
import { z } from 'zod'
import { CreateCarInputSchema } from '@/types'

// Extender schema con transformaciones
const CreateCarWithTimestamps = CreateCarInputSchema.transform(data => ({
  ...data,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}))

// Uso
const carData = CreateCarWithTimestamps.parse(rawInput)
// Ahora incluye created_at y updated_at automáticamente
```

### 2. Validación Condicional

```typescript
import { z } from 'zod'

const BookingWithInsurance = z.object({
  // ... campos básicos
  needs_insurance: z.boolean(),
  insurance_level: z.enum(['basic', 'standard', 'premium']).optional(),
}).refine(
  data => {
    // Si needs_insurance es true, insurance_level es requerido
    if (data.needs_insurance) {
      return !!data.insurance_level
    }
    return true
  },
  {
    message: 'insurance_level es requerido si needs_insurance es true',
    path: ['insurance_level'],
  }
)
```

### 3. Validación de Arrays

```typescript
import { CreateCarInputSchema } from '@/types'

// Validar array de autos
const CarsArraySchema = z.array(CreateCarInputSchema).min(1).max(50)

const cars = CarsArraySchema.parse(rawCarsArray)
```

### 4. Validación Parcial para Updates

```typescript
import { UpdateCarInputSchema } from '@/types'

// Actualizar solo algunos campos
const updateData = {
  price_per_day: 6000,
  description: 'Nueva descripción actualizada',
}

// Schema valida solo los campos presentes
const validUpdate = UpdateCarInputSchema.parse(updateData)

await supabase
  .from('cars')
  .update(validUpdate)
  .eq('id', carId)
```

---

## ✅ MEJORES PRÁCTICAS

### 1. Usar safeParse en Producción

```typescript
// ❌ Evitar en producción (throws error)
const data = schema.parse(input)

// ✅ Mejor en producción (maneja error)
const result = schema.safeParse(input)
if (!result.success) {
  // Manejar error gracefully
  return { error: result.error.format() }
}
```

### 2. Validar Input del Usuario Siempre

```typescript
// En API endpoints
export async function POST(req: Request) {
  const body = await req.json()

  // SIEMPRE validar
  const result = CreateCarInputSchema.safeParse(body)

  if (!result.success) {
    return Response.json({ error: result.error }, { status: 400 })
  }

  // Continuar con datos válidos
}
```

### 3. No Validar Datos Internos

```typescript
// Si los datos vienen de tu BD (ya validados), no re-validar
const car = await supabase.from('cars').select('*').eq('id', id).single()

// car.data ya está validado por BD, no necesita Zod
```

---

## 🎯 PRÓXIMOS PASOS

Ahora que tienes validación runtime, puedes:

1. **Crear SDKs** (Semana 3-6)
   - Encapsular validación + queries
   - Error handling centralizado

2. **Crear Services** (Semana 7-10)
   - Business logic con validación
   - State management con Signals

3. **Crear Components** (Semana 11-14)
   - Formularios con validación inline
   - Mensajes de error friendly

**La validación runtime está lista. Ahora a construir sobre ella.**

---

**Generado por:** Claude Code AI
**Schemas:** Zod v3.x
**Fecha:** 29 de Octubre 2025
