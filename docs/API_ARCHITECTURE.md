# 🏗️ API Architecture - AutoRentar

**Stack**: Angular 18 + Supabase + TypeScript
**Última actualización**: 29 de Octubre 2025

---

## 📊 Arquitectura General

AutoRentar utiliza una **arquitectura híbrida** que combina:
- **Frontend (Angular 18)**: UI + Business Logic en cliente
- **Backend (Supabase)**: BaaS (Database, Auth, Storage)
- **Serverless (Edge Functions)**: Lógica sensible del servidor

```
┌─────────────────────────────────────────────────┐
│         Angular 18 Frontend (Client)            │
│                                                  │
│  ┌──────────────┐  ┌──────────────────────┐    │
│  │  Components  │──│  Guards/Interceptors │    │
│  └──────┬───────┘  └──────────────────────┘    │
│         │                                        │
│         ▼                                        │
│  ┌──────────────────────┐                       │
│  │  Services Layer      │  (Business Logic)     │
│  │  - BookingService    │                       │
│  │  - PaymentService    │                       │
│  │  - CarService        │                       │
│  │  - ProfileService    │                       │
│  │  - InsuranceService  │                       │
│  │  - WalletService     │                       │
│  └──────┬───────────────┘                       │
│         │                                        │
│         ▼                                        │
│  ┌──────────────────────┐                       │
│  │  SDKs (Data Access)  │                       │
│  │  - BookingSDK        │                       │
│  │  - CarSDK            │                       │
│  │  - PaymentSDK        │                       │
│  │  - etc.              │                       │
│  └──────┬───────────────┘                       │
└─────────┼──────────────────────────────────────┘
          │
          │ HTTPS
          │
          ▼
┌─────────────────────────────────────────────────┐
│            Supabase (Backend)                    │
│                                                  │
│  ┌──────────────┐  ┌─────────────────────┐     │
│  │  PostgreSQL  │  │  Auth (JWT)         │     │
│  │  Database    │  │  - Session mgmt     │     │
│  └──────────────┘  │  - RLS policies     │     │
│                    └─────────────────────┘     │
│                                                  │
│  ┌────────────────────────────────────────┐    │
│  │  Edge Functions (Serverless)           │    │
│  │  - payment-webhook                     │    │
│  │  - process-payment-split               │    │
│  └────────────────────────────────────────┘    │
│                                                  │
│  ┌──────────────┐  ┌─────────────────────┐     │
│  │  Storage     │  │  Realtime           │     │
│  │  (Files)     │  │  (WebSocket)        │     │
│  └──────────────┘  └─────────────────────┘     │
└─────────────────────────────────────────────────┘
          │
          │ External APIs
          │
          ▼
┌─────────────────────────────────────────────────┐
│       Payment Providers                          │
│       - MercadoPago                              │
│       - Stripe                                   │
└─────────────────────────────────────────────────┘
```

---

## 🔀 Data Flow Patterns

### Pattern 1: Client-Side Operation (Normal CRUD)

**Ejemplo**: Listar bookings, obtener detalles de un car

```
Angular Component
  ↓ calls
Service (e.g., BookingService)
  ↓ validates & applies business logic
SDK (e.g., BookingSDK)
  ↓ executes query
Supabase Client Library
  ↓ HTTPS POST
Supabase PostgreSQL + RLS
  ↓ returns data
Angular Component (renders)
```

**Ventajas**:
- ✅ Latencia baja (directo a DB)
- ✅ Realtime subscriptions posibles
- ✅ RLS policies protegen datos

**Código ejemplo**:
```typescript
// Component
async ngOnInit() {
  const bookings = await bookingService.getBookings(userId)
  this.bookings.set(bookings)
}
```

---

### Pattern 2: Server-Side Operation (Sensitive Logic)

**Ejemplo**: Procesar webhook de pago, split de pagos

```
Payment Provider (webhook)
  ↓ POST /functions/v1/payment-webhook
Supabase Edge Function
  ↓ verifies signature
  ↓ validates payload
  ↓ updates database
  ↓ triggers payment split
Supabase Database
  ↓ returns success
Payment Provider (receives 200 OK)
```

**Ventajas**:
- ✅ Lógica sensible en servidor (no expuesta)
- ✅ Webhook signature verification
- ✅ Serverless scaling automático

**Código ejemplo**:
```typescript
// Edge Function
serve(async (req) => {
  const payload = await req.json()
  const isValid = await verifySignature(payload)
  if (!isValid) return Response(401)

  await updatePaymentStatus(payload)
  return Response({ success: true })
})
```

---

## 🛡️ Security Layer

### 1. Authentication (Supabase Auth)

**Login Flow**:
```typescript
// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Get session
const { data: { session } } = await supabase.auth.getSession()

// Logout
await supabase.auth.signOut()
```

**Session management**:
- JWT tokens almacenados en localStorage
- Auto-refresh de tokens antes de expirar
- Supabase Client Library maneja automáticamente

---

### 2. Authorization (Angular Guards)

**Auth Guard**:
```typescript
// Protege rutas que requieren autenticación
export const authGuard: CanActivateFn = async (route, state) => {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } })
    return false
  }

  return true
}
```

**Role Guard**:
```typescript
// Protege rutas que requieren roles específicos
export const roleGuard = (role: 'renter' | 'owner' | 'admin'): CanActivateFn => {
  return async () => {
    const profile = await getProfile()
    return profile.role === role
  }
}
```

**Usage en routes**:
```typescript
const routes: Routes = [
  {
    path: 'bookings',
    component: BookingsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [roleGuard('admin')]
  }
]
```

---

### 3. Row Level Security (RLS Policies)

**Ejemplo**: Solo el owner puede ver/editar su car

```sql
CREATE POLICY "Cars are viewable by everyone"
  ON cars FOR SELECT
  USING (status = 'active');

CREATE POLICY "Owners can update their own cars"
  ON cars FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = renter_id OR auth.uid() IN (
    SELECT owner_id FROM cars WHERE id = bookings.car_id
  ));
```

---

## 🚀 Supabase Edge Functions

### 1. Payment Webhook Handler

**Endpoint**: `POST /functions/v1/payment-webhook`
**Auth**: Public (signature verification required)

**Purpose**: Recibe webhooks de payment providers (MercadoPago, Stripe)

**Flow**:
1. Verifica signature del provider
2. Parsea evento (payment.completed, payment.failed, etc.)
3. Actualiza status del payment en DB
4. Trigger acciones (split payment, notificaciones)

**Deployment**:
```bash
supabase functions deploy payment-webhook
```

**Testing**:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/payment-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "mercadopago",
    "event_type": "payment.completed",
    "payment_id": "uuid",
    "status": "completed"
  }'
```

---

### 2. Process Payment Split

**Endpoint**: `POST /functions/v1/process-payment-split`
**Auth**: Service role required

**Purpose**: Distribuye pagos entre owner (85%), platform (10%), insurance (5%)

**Flow**:
1. Verifica que payment está completed
2. Calcula splits según configuración
3. Crea wallet transactions para cada recipient
4. Retorna IDs de transacciones creadas

**Invocation desde client**:
```typescript
const { data, error } = await supabase.functions.invoke('process-payment-split', {
  body: {
    payment_id: 'uuid',
    owner_id: 'uuid',
    config: {
      owner_percentage: 85,
      platform_percentage: 10,
      insurance_percentage: 5
    }
  }
})
```

---

## 🔧 Angular Interceptors

### 1. Error Interceptor

**Purpose**: Manejo global de errores HTTP

**Features**:
- Captura errores de red y HTTP (4xx, 5xx)
- User-friendly error messages
- Auto-logout en 401 Unauthorized
- Error logging

**Usage**:
```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([errorInterceptor, retryInterceptor, loadingInterceptor])
    )
  ]
}
```

---

### 2. Retry Interceptor

**Purpose**: Reintentos automáticos para peticiones fallidas

**Features**:
- Solo reintenta GET requests
- Exponential backoff (1s, 2s, 4s)
- Solo para errores de red o 5xx

---

### 3. Loading Interceptor

**Purpose**: Indicador global de loading

**Features**:
- Contador de requests activos
- Actualiza clase CSS en body
- Integrable con spinner global

---

## 📦 Component Example

### Create Booking Component

**Location**: `src/app/features/bookings/create-booking.component.ts`

**Features**:
- Reactive Forms con validación
- Cálculo de pricing en tiempo real
- Integración con BookingService
- Error handling
- Loading states

**Key methods**:
```typescript
async onSubmit() {
  const input: CreateBookingServiceInput = { /* form data */ }
  const booking = await bookingService.createBooking(input)
  await router.navigate(['/bookings', booking.id])
}

async calculatePricing() {
  const pricing = await pricingSDK.calculate({ /* params */ })
  this.pricingEstimate.set(pricing)
}
```

---

## 🗺️ API Endpoints Summary

### Supabase Edge Functions

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/functions/v1/payment-webhook` | POST | Public | Recibir webhooks de payment providers |
| `/functions/v1/process-payment-split` | POST | Service | Distribuir pagos (owner/platform/insurance) |

### Supabase Database (via SDKs)

| Table | RLS | Operations |
|-------|-----|------------|
| `bookings` | Yes | CRUD by renter/owner |
| `cars` | Yes | Public read, owner write |
| `payments` | Yes | Read by payer, write by system |
| `profiles` | Yes | Read by all, write by owner |
| `wallets` | Yes | Read/write by owner only |
| `insurance_policies` | Yes | Read by insured, write by system |
| `reviews` | Yes | Public read, write by reviewer |

---

## 🚀 Deployment

### Supabase Edge Functions

```bash
# Login to Supabase
supabase login

# Link to project
supabase link --project-ref your-project-ref

# Deploy function
supabase functions deploy payment-webhook
supabase functions deploy process-payment-split

# Set environment variables
supabase secrets set PLATFORM_WALLET_ID=uuid
supabase secrets set INSURANCE_WALLET_ID=uuid
supabase secrets set MERCADOPAGO_SECRET=xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=xxx
```

### Angular App

```bash
# Production build
ng build --configuration production

# Deploy to hosting (Vercel, Netlify, etc.)
vercel deploy --prod
# or
netlify deploy --prod
```

---

## 🧪 Testing

### Unit Tests (Services)

```typescript
describe('BookingService', () => {
  it('should create booking', async () => {
    const input: CreateBookingServiceInput = { /* test data */ }
    const booking = await bookingService.createBooking(input)
    expect(booking.status).toBe('pending')
  })
})
```

### Integration Tests (Edge Functions)

```bash
# Test webhook locally
supabase functions serve payment-webhook

# Send test webhook
curl -X POST http://localhost:54321/functions/v1/payment-webhook \
  -H "Content-Type: application/json" \
  -d @test-payload.json
```

### E2E Tests (Angular)

```typescript
describe('Booking Flow', () => {
  it('should create booking end-to-end', () => {
    cy.visit('/bookings/new')
    cy.get('[formControlName="car_id"]').select('car-uuid')
    cy.get('[formControlName="start_date"]').type('2025-11-01')
    cy.get('[formControlName="end_date"]').type('2025-11-05')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/bookings/')
  })
})
```

---

## 🔒 Security Checklist

- [x] Authentication con Supabase Auth (JWT)
- [x] Authorization con Angular Guards (auth, role)
- [x] RLS policies en todas las tablas sensibles
- [x] Webhook signature verification en Edge Functions
- [x] HTTPS enforced (Supabase default)
- [x] Service role key solo en Edge Functions (server-side)
- [x] Anon key en cliente (limitado por RLS)
- [x] Password hashing (Supabase bcrypt default)
- [x] Rate limiting (Supabase default)
- [ ] CORS configurado correctamente
- [ ] Content Security Policy (CSP)
- [ ] Input sanitization
- [ ] SQL injection prevention (Supabase parametrized queries)

---

## 📚 Referencias

- [Supabase Documentation](https://supabase.com/docs)
- [Angular Documentation](https://angular.dev)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Angular Guards](https://angular.dev/guide/routing/common-router-tasks#preventing-unauthorized-access)
- [Angular Interceptors](https://angular.dev/guide/http/interceptors)

---

**Next steps**: Implementar más Edge Functions según necesidades (notificaciones, reportes, cron jobs)
