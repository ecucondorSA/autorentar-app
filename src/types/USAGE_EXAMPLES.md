# 📘 GUÍA DE USO: DATABASE TYPES

**Generado:** 29 de Octubre 2025
**Types:** 10,977 líneas auto-generadas
**Tablas:** 98 tablas tipadas

---

## ✅ QUÉ SE GENERÓ

1. **`database.types.ts`** (355KB, 10,977 líneas)
   - 98 tablas con Row/Insert/Update types
   - 1,123 funciones RPC tipadas
   - Todos los enums
   - Relationships entre tablas

2. **`helpers.ts`** (150+ líneas)
   - Utilities para extraer types fácilmente
   - Types específicos de cada vertical
   - Types de utilidad (Pagination, ApiResponse, etc.)

---

## 📖 CÓMO USAR LOS TYPES

### 1. Importar Types Básicos

```typescript
// Opción A: Import directo desde helpers
import type { Car, Profile, Booking } from '@/types'

// Opción B: Import con helper genérico
import type { Tables } from '@/types'
type Car = Tables<'cars'>
```

### 2. Usar en Queries de Supabase

```typescript
import { supabase } from '@/lib/supabase'
import type { Car, CarInsert } from '@/types'

// Query con tipos automáticos
async function getCars(): Promise<Car[]> {
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .eq('status', 'active') // ← TypeScript valida 'active' existe en enum

  if (error) throw error
  return data // ← TypeScript sabe que es Car[]
}

// Insert con validación de tipos
async function createCar(carData: CarInsert): Promise<Car> {
  const { data, error } = await supabase
    .from('cars')
    .insert(carData) // ← TypeScript valida todos los campos requeridos
    .select()
    .single()

  if (error) throw error
  return data
}
```

### 3. Enums Type-Safe

```typescript
import type { CarStatus, BookingStatus, UserRole } from '@/types'

// TypeScript autocomplete y validación
const status: CarStatus = 'active' // ✅ OK
const status: CarStatus = 'invalid' // ❌ Error: Type '"invalid"' is not assignable

// Uso en funciones
function filterByStatus(status: CarStatus) {
  // TypeScript sabe que status solo puede ser:
  // "draft" | "active" | "rented" | "maintenance" | "inactive"
}
```

### 4. RPCs Type-Safe

```typescript
import type { CreateReviewArgs } from '@/types'

async function createReview(args: CreateReviewArgs) {
  const { data, error } = await supabase.rpc('create_review', args)
  // ↑ TypeScript valida que args tenga todos los campos correctos

  if (error) throw error
  return data // TypeScript sabe el tipo de retorno
}
```

### 5. Queries con Joins

```typescript
import type { Car, Profile } from '@/types'

// Definir tipo para query con join
interface CarWithOwner extends Car {
  owner: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'rating_avg'>
}

async function getCarsWithOwners(): Promise<CarWithOwner[]> {
  const { data, error } = await supabase
    .from('cars')
    .select(`
      *,
      owner:profiles!owner_id (
        id,
        full_name,
        avatar_url,
        rating_avg
      )
    `)

  if (error) throw error
  return data as CarWithOwner[]
}
```

### 6. Utility Types

```typescript
import type { PaginatedResponse, ApiResponse } from '@/types'

// Paginación type-safe
async function getCarsPaginated(
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<Car>> {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('cars')
    .select('*', { count: 'exact' })
    .range(from, to)

  if (error) throw error

  return {
    data: data || [],
    count,
    page,
    pageSize,
    hasMore: count ? to < count : false
  }
}

// API Response type-safe
async function getCarSafe(id: string): Promise<ApiResponse<Car>> {
  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code
    }
  }
}
```

### 7. Búsqueda Geoespacial con PostGIS

```typescript
import type { Car, Coordinates } from '@/types'

async function searchCarsNearby(
  userLocation: Coordinates,
  radiusMeters: number = 5000
): Promise<Car[]> {
  const { data, error } = await supabase.rpc('search_cars_nearby', {
    user_lat: userLocation.lat,
    user_lng: userLocation.lng,
    radius: radiusMeters
  })

  if (error) throw error
  return data
}
```

### 8. Tracking en Tiempo Real

```typescript
import type { CarTrackingPoint, TrackingPointWithCoords } from '@/types'

async function addTrackingPoint(
  sessionId: string,
  coords: Coordinates,
  speed: number
): Promise<void> {
  await supabase.from('car_tracking_points').insert({
    session_id: sessionId,
    location: `POINT(${coords.lng} ${coords.lat})`, // PostGIS
    speed,
    timestamp: new Date().toISOString()
  })
}
```

---

## 🎯 EJEMPLOS POR VERTICAL

### 👤 Auth & Profiles

```typescript
import type { Profile, ProfileUpdate } from '@/types'

// Obtener perfil actual
async function getMyProfile(): Promise<Profile> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data
}

// Actualizar perfil
async function updateProfile(updates: ProfileUpdate): Promise<Profile> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}
```

### 🚗 Cars

```typescript
import type { Car, CarInsert, CarUpdate, CarStatus } from '@/types'

// Crear auto
async function publishCar(carData: CarInsert): Promise<Car> {
  const { data, error } = await supabase
    .from('cars')
    .insert(carData)
    .select()
    .single()

  if (error) throw error
  return data
}

// Buscar autos por ciudad
async function searchCarsByCity(city: string): Promise<Car[]> {
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .eq('location_city', city)
    .eq('status', 'active')

  if (error) throw error
  return data || []
}

// Cambiar estado
async function updateCarStatus(
  carId: string,
  status: CarStatus
): Promise<void> {
  const { error } = await supabase
    .from('cars')
    .update({ status })
    .eq('id', carId)

  if (error) throw error
}
```

### 📅 Bookings

```typescript
import type { Booking, BookingInsert, BookingStatus } from '@/types'

// Crear reserva
async function createBooking(bookingData: BookingInsert): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .insert(bookingData)
    .select()
    .single()

  if (error) throw error
  return data
}

// Mis reservas
async function getMyBookings(): Promise<Booking[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('renter_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}
```

### 💰 Wallet

```typescript
import type { UserWallet, WalletTransaction } from '@/types'

// Obtener balance
async function getBalance(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('user_wallets')
    .select('available_balance_cents')
    .eq('user_id', user.id)
    .single()

  if (error) throw error
  return data.available_balance_cents / 100 // centavos a pesos
}

// Historial de transacciones
async function getTransactions(): Promise<WalletTransaction[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data || []
}
```

### ⭐ Reviews

```typescript
import type { Review } from '@/types'

// Crear review con RPC
async function submitReview(
  bookingId: string,
  revieweeId: string,
  ratings: {
    cleanliness: number
    communication: number
    accuracy: number
    location: number
    checkin: number
    value: number
  },
  comment: string
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase.rpc('create_review', {
    p_booking_id: bookingId,
    p_reviewer_id: user.id,
    p_reviewee_id: revieweeId,
    p_car_id: null, // Si es review de usuario
    p_review_type: 'user_to_user',
    p_rating_cleanliness: ratings.cleanliness,
    p_rating_communication: ratings.communication,
    p_rating_accuracy: ratings.accuracy,
    p_rating_location: ratings.location,
    p_rating_checkin: ratings.checkin,
    p_rating_value: ratings.value,
    p_comment_public: comment
  })

  if (error) throw error
  return data // Returns review_id
}
```

---

## 🔄 ACTUALIZAR TYPES CUANDO BD CAMBIA

Cuando la base de datos cambie (nuevas tablas, nuevos campos), regenerar types:

```bash
cd /home/edu/Documentos/AUTORENTAR/autorentar-app

supabase gen types typescript \
  --project-id obxvffplochgeiclibng \
  --schema public \
  > src/types/database.types.ts

# TypeScript detectará automáticamente breaking changes
npm run type-check
```

---

## ✅ BENEFICIOS OBTENIDOS

1. **Type Safety Completo**
   - Autocomplete en IDE
   - Errores en compile-time, no runtime
   - Refactoring seguro

2. **Documentación Viva**
   - Types = documentación que siempre está actualizada
   - No más "¿qué campos tiene esta tabla?"

3. **Menos Bugs**
   - Typos detectados por TypeScript
   - Campos faltantes detectados
   - Tipos incorrectos detectados

4. **Desarrollo Más Rápido**
   - Autocomplete acelera escritura
   - No necesitas ver la BD constantemente
   - Refactoring es trivial

---

## 🎯 PRÓXIMOS PASOS

Ahora que tienes los types, puedes:

1. ✅ **Crear Zod Schemas** (Semana 2)
   - Validación runtime
   - Input sanitization

2. ✅ **Crear SDKs** (Semana 3-6)
   - Encapsular queries
   - Error handling centralizado

3. ✅ **Crear Services** (Semana 7-10)
   - Business logic
   - State management con Signals

4. ✅ **Crear Components** (Semana 11-14)
   - UI consumiendo services

**La fundación está lista. Ahora a construir sobre ella.**

---

**Generado por:** Claude Code AI
**Types:** Auto-generados desde BD Supabase
**Fecha:** 29 de Octubre 2025
