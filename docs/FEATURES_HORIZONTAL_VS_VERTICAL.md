# 🏗️ Features Horizontales vs Verticales - AutoRentar

**Fecha**: 30 Octubre 2025
**Proyecto**: autorentar-app (Angular 20)
**Arquitectura**: Standalone Components + Signals

---

## 🎯 Definiciones

### ✅ FEATURES VERTICALES (Domain-Specific)

**Definición**: Features que pertenecen a un **único dominio de negocio** y operan dentro de ese contexto específico.

**Características**:
- ✅ Acoplados a una entidad/tabla principal
- ✅ Lógica de negocio específica del dominio
- ✅ No son reutilizables fuera de su contexto
- ✅ Tienen ciclo de vida independiente

**Ejemplo**: `CarListComponent` pertenece exclusivamente al dominio "Cars", usa `car` table, y no tiene sentido fuera de ese contexto.

---

### ✅ FEATURES HORIZONTALES (Cross-Cutting)

**Definición**: Features que **cruzan múltiples dominios verticales** y requieren colaboración entre roles/entidades para existir.

**Características**:
- ✅ Conectan diferentes roles/entidades (locador ↔ locatario)
- ✅ No pertenecen exclusivamente a un dominio
- ✅ Son reutilizables en múltiples contextos
- ✅ Afectan a TODAS las features verticales

**Ejemplo**: `Messaging` cruza entre locador y locatario. No puede existir en un solo dominio porque requiere la interacción de ambos roles.

---

## 📊 Criterio de Clasificación

### ¿Cómo saber si una feature es HORIZONTAL?

Pregúntate:

1. **¿Cruza múltiples dominios?**
   - ❌ No → Es vertical
   - ✅ Sí → Puede ser horizontal

2. **¿Conecta features verticales entre sí?**
   - ❌ No → Es vertical
   - ✅ Sí → Es horizontal

3. **¿Requiere colaboración entre roles/entidades?**
   - ❌ No → Es vertical
   - ✅ Sí → Es horizontal

4. **¿Puede existir independientemente de un dominio?**
   - ❌ No → Es vertical
   - ✅ Sí → Es horizontal

---

## 🗂️ Clasificación Completa

### 🟦 FEATURES VERTICALES

#### 1. **Auth** (Dominio: Autenticación)
```
features/auth/
├── login/
├── register/
├── reset-password/
└── profile/
```

**Por qué es vertical**:
- Pertenece al dominio de autenticación/perfiles
- Opera sobre tabla `profiles`
- Lógica específica de usuarios individuales

---

#### 2. **Cars** (Dominio: Autos)
```
features/cars/
├── car-list/
├── car-detail/
├── car-publish/
├── car-edit/
└── my-cars/
```

**Por qué es vertical**:
- Pertenece al dominio de gestión de autos
- Opera sobre tabla `cars`
- Lógica específica de publicación/edición de autos

**Tablas DB**:
- `cars`
- `car_photos`
- `car_brands`
- `car_models`
- `car_features`

---

#### 3. **Bookings** (Dominio: Reservas)
```
features/bookings/
├── booking-form/
├── booking-list/
├── booking-detail/
├── booking-confirmation/
├── my-bookings/
└── bookings-received/
```

**Por qué es vertical**:
- Pertenece al dominio de gestión de reservas
- Opera sobre tabla `bookings`
- Lógica específica del ciclo de vida de una reserva

**Tablas DB**:
- `bookings`
- `booking_calendar`
- `booking_extras`

---

#### 4. **Payments** (Dominio: Pagos)
```
features/payments/
├── payment-form/
├── payment-status/
└── payment-history/
```

**Por qué es vertical**:
- Pertenece al dominio de procesamiento de pagos
- Opera sobre tabla `payments`
- Lógica específica de transacciones de pago

**Tablas DB**:
- `payments`
- `payment_intents`
- `payment_splits`
- `refunds`

---

#### 5. **Wallet** (Dominio: Billetera)
```
features/wallet/
├── wallet-dashboard/
├── wallet-deposit/
├── wallet-withdraw/
└── transactions-list/
```

**Por qué es vertical**:
- Pertenece al dominio de gestión de saldo
- Opera sobre tabla `user_wallets`
- Lógica específica de transacciones de billetera

**Tablas DB**:
- `user_wallets`
- `wallet_transactions`
- `withdrawal_requests`

---

#### 6. **Insurance** (Dominio: Seguros)
```
features/insurance/
├── insurance-policies/
├── insurance-claims/
└── insurance-coverage/
```

**Por qué es vertical**:
- Pertenece al dominio de seguros
- Opera sobre tabla `insurance_policies`
- Lógica específica de coberturas y reclamos

**Tablas DB**:
- `insurance_policies`
- `insurance_claims`
- `insurance_claim_evidence`

---

#### 7. **Documents** (Dominio: Documentos KYC)
```
features/documents/
├── kyc-upload/
├── document-verification/
└── document-list/
```

**Por qué es vertical**:
- Pertenece al dominio de verificación KYC
- Opera sobre tabla `user_documents`
- Lógica específica de validación de documentos

**Tablas DB**:
- `user_documents`
- `vehicle_documents`
- `document_templates`

---

#### 8. **Admin** (Dominio: Administración)
```
features/admin/
├── admin-dashboard/
├── users-management/
├── cars-moderation/
└── reports/
```

**Por qué es vertical**:
- Pertenece al dominio de administración
- Opera sobre múltiples tablas pero con rol admin
- Lógica específica de moderación y gestión

---

### 🟧 FEATURES HORIZONTALES

#### 1. **Messaging** 🔴 CRÍTICO (NO EXISTE)
```
shared/features/messaging/
├── services/
│   ├── message.service.ts
│   └── message.sdk.ts
├── components/
│   ├── chat-container/
│   ├── chat-list/
│   ├── chat-conversation/
│   └── chat-input/
└── models/
    └── message.dto.ts
```

**Por qué es horizontal**:
- ✅ Cruza dominios: Locador ↔ Locatario
- ✅ Conecta features verticales (Auth + Bookings)
- ✅ Requiere colaboración entre roles
- ✅ No pertenece a un solo dominio

**Tablas DB**:
- `messages` (con Supabase Realtime activo)
- `conversations`
- `conversation_participants`

**Usado por**:
- `features/bookings/booking-detail/` (chat entre owner-renter)
- `features/admin/support/` (chat admin-user) [futuro]
- `features/disputes/` (chat con evidencia) [futuro]

**Prioridad**: 🔴 CRÍTICO (BACKEND_GAPS.md)

---

#### 2. **Notifications** 🟡 IMPORTANTE (PARCIAL)
```
shared/features/notifications/
├── services/
│   ├── notification.service.ts
│   └── notification.sdk.ts
├── components/
│   ├── notification-bell/
│   ├── notification-list/
│   └── notification-item/
└── models/
    └── notification.dto.ts
```

**Por qué es horizontal**:
- ✅ Afecta a TODOS los roles (admin, locador, locatario)
- ✅ Usado en TODAS las features verticales
- ✅ Sistema de notificaciones global

**Tablas DB**:
- `notifications` (con Supabase Realtime activo)
- `push_tokens`
- `notification_preferences`

**Usado por**:
- TODAS las features verticales
- Header component (notification bell)
- Dashboard (notification center)

**Prioridad**: 🟡 IMPORTANTE

---

#### 3. **Reviews** 🟡 IMPORTANTE (PARCIAL)
```
shared/features/reviews/
├── services/
│   ├── review.service.ts
│   └── review.sdk.ts
├── components/
│   ├── review-form/
│   ├── review-list/
│   └── review-card/
└── models/
    └── review.dto.ts
```

**Por qué es horizontal**:
- ✅ Bidireccional: Locador → Locatario, Locatario → Auto
- ✅ Cruza dominios: Profile + Cars + Bookings
- ✅ Conecta múltiples entidades

**Tablas DB**:
- `reviews`
- `review_responses`

**Usado por**:
- `features/cars/car-detail/` (reviews del auto)
- `features/auth/profile/` (reviews del usuario)
- `features/bookings/booking-detail/` (crear review post-booking)

**Prioridad**: 🟡 IMPORTANTE (ReviewSDK existe, falta componentes)

---

#### 4. **Search** 🟡 IMPORTANTE (NO EXISTE)
```
shared/features/search/
├── services/
│   └── search.service.ts
├── components/
│   ├── search-bar/
│   ├── search-filters/
│   └── search-results/
└── models/
    └── search.dto.ts
```

**Por qué es horizontal**:
- ✅ Usado en múltiples páginas (home, cars, bookings)
- ✅ Sistema de búsqueda global
- ✅ Full-text search cross-domain

**Tablas DB**:
- `cars` (con full-text search)
- `profiles`
- `bookings`

**Usado por**:
- `features/home/` (search bar principal)
- `features/cars/car-list/` (filtros avanzados)
- `features/bookings/my-bookings/` (buscar reservas)
- `features/admin/` (buscar usuarios, autos)

**Prioridad**: 🟡 IMPORTANTE (BACKEND_GAPS.md)

---

#### 5. **Analytics** 🟢 NICE-TO-HAVE (NO EXISTE)
```
shared/features/analytics/
├── services/
│   └── analytics.service.ts
└── models/
    └── event.dto.ts
```

**Por qué es horizontal**:
- ✅ Trackea eventos de TODAS las features
- ✅ Sistema de métricas global
- ✅ Cross-cutting concern

**Usado por**:
- TODAS las features verticales (track user behavior)
- Admin dashboard (visualización de métricas)

**Prioridad**: 🟢 NICE-TO-HAVE (se puede usar Google Analytics)

---

#### 6. **Error Handling** ✅ EXISTE (Core)
```
core/services/
└── error-handler.service.ts
```

**Por qué es horizontal**:
- ✅ Maneja errores de TODAS las features
- ✅ Global error interceptor
- ✅ Cross-cutting concern

---

#### 7. **Loading States** ✅ EXISTE (Shared Components)
```
shared/components/
└── loading-spinner/
```

**Por qué es horizontal**:
- ✅ Usado en TODAS las features
- ✅ Estado de carga global

---

## 📁 Estructura de Carpetas Completa

```
src/app/
│
├── features/                          # ← VERTICALES (por dominio)
│   ├── auth/
│   │   ├── login/
│   │   ├── register/
│   │   └── profile/
│   │
│   ├── cars/
│   │   ├── car-list/
│   │   ├── car-detail/
│   │   ├── car-publish/
│   │   └── my-cars/
│   │
│   ├── bookings/
│   │   ├── booking-form/
│   │   ├── booking-list/
│   │   └── booking-detail/
│   │
│   ├── payments/
│   │   ├── payment-form/
│   │   └── payment-status/
│   │
│   ├── wallet/
│   │   ├── wallet-dashboard/
│   │   └── transactions-list/
│   │
│   ├── insurance/
│   │   ├── insurance-policies/
│   │   └── insurance-claims/
│   │
│   ├── documents/
│   │   ├── kyc-upload/
│   │   └── document-list/
│   │
│   └── admin/
│       ├── admin-dashboard/
│       └── users-management/
│
├── shared/
│   ├── components/                    # Componentes UI reutilizables
│   │   ├── header/
│   │   ├── footer/
│   │   ├── car-card/
│   │   ├── date-range-picker/
│   │   ├── location-picker/
│   │   ├── upload-image/
│   │   └── loading-spinner/
│   │
│   ├── pipes/
│   │   ├── currency-format.pipe.ts
│   │   └── date-format.pipe.ts
│   │
│   ├── directives/
│   │   └── lazy-load-image.directive.ts
│   │
│   └── features/                      # ← HORIZONTALES (cross-cutting)
│       ├── messaging/                 # 🔴 CRÍTICO (NO EXISTE)
│       │   ├── services/
│       │   ├── components/
│       │   └── models/
│       │
│       ├── notifications/             # 🟡 IMPORTANTE (PARCIAL)
│       │   ├── services/
│       │   ├── components/
│       │   └── models/
│       │
│       ├── reviews/                   # 🟡 IMPORTANTE (PARCIAL)
│       │   ├── services/
│       │   ├── components/
│       │   └── models/
│       │
│       ├── search/                    # 🟡 IMPORTANTE (NO EXISTE)
│       │   ├── services/
│       │   ├── components/
│       │   └── models/
│       │
│       └── analytics/                 # 🟢 NICE-TO-HAVE (NO EXISTE)
│           ├── services/
│           └── models/
│
└── core/                              # Servicios singleton (también horizontal)
    ├── guards/
    │   ├── auth.guard.ts
    │   └── owner.guard.ts
    │
    ├── interceptors/
    │   ├── auth.interceptor.ts
    │   └── error.interceptor.ts
    │
    └── services/
        ├── auth.service.ts
        └── error-handler.service.ts
```

---

## 📊 Resumen de Gaps (Horizontales Faltantes)

| Feature Horizontal | Estado | Prioridad | Tablas DB | Impacto |
|-------------------|--------|-----------|-----------|---------|
| **Messaging** | ❌ NO EXISTE | 🔴 CRÍTICO | `messages`, `conversations` | Comunicación locador-locatario |
| **Notifications** | ⚠️ PARCIAL | 🟡 IMPORTANTE | `notifications`, `push_tokens` | Sistema de notificaciones |
| **Reviews** | ⚠️ PARCIAL | 🟡 IMPORTANTE | `reviews` | Rating system |
| **Search** | ❌ NO EXISTE | 🟡 IMPORTANTE | `cars`, `profiles` | Búsqueda global |
| **Analytics** | ❌ NO EXISTE | 🟢 NICE-TO-HAVE | N/A | Tracking de eventos |

---

## 🎯 Plan de Implementación

### Fase 1: Features Horizontales Críticas (Semana 1-2)

#### 1. **Messaging** (2 días) 🔴 PRIORIDAD MÁXIMA

**Backend**:
- [ ] Crear `MessageDTO` y schemas de Zod
- [ ] Crear `MessageSDK` con métodos CRUD
- [ ] Crear `MessageService` con lógica de negocio
- [ ] Escribir tests para SDK y Service

**Frontend**:
- [ ] Crear `shared/features/messaging/`
- [ ] Componente `chat-container`
- [ ] Componente `chat-conversation`
- [ ] Componente `chat-input`
- [ ] Integrar en `booking-detail`

**Tablas DB** (ya existen):
```sql
messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations,
  sender_id UUID REFERENCES profiles,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

conversations (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES bookings,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

conversation_participants (
  conversation_id UUID REFERENCES conversations,
  user_id UUID REFERENCES profiles,
  joined_at TIMESTAMPTZ DEFAULT NOW()
)
```

---

#### 2. **Notifications** (1 día) 🟡

**Backend**:
- [ ] Crear `NotificationDTO` y schemas
- [ ] Crear `NotificationSDK` con métodos CRUD
- [ ] Completar `NotificationService`
- [ ] Escribir tests

**Frontend**:
- [ ] Crear `shared/features/notifications/`
- [ ] Componente `notification-bell` (header)
- [ ] Componente `notification-list`
- [ ] Integrar Supabase Realtime

**Tablas DB** (ya existen):
```sql
notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  read_at TIMESTAMPTZ,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

---

#### 3. **Search** (1 día) 🟡

**Backend**:
- [ ] Crear `SearchService` con full-text search
- [ ] Métodos: `searchCars()`, `searchUsers()`, `autocomplete()`
- [ ] Escribir tests

**Frontend**:
- [ ] Crear `shared/features/search/`
- [ ] Componente `search-bar` (global)
- [ ] Componente `search-filters`
- [ ] Integrar en `home` y `car-list`

---

### Fase 2: Features Horizontales Importantes (Semana 3)

#### 4. **Reviews** (Completar componentes) 🟡

**Frontend** (ReviewSDK ya existe):
- [ ] Crear `shared/features/reviews/`
- [ ] Componente `review-form`
- [ ] Componente `review-list`
- [ ] Componente `review-card`
- [ ] Integrar en `car-detail` y `profile`

---

### Fase 3: Nice-to-Have (Opcional)

#### 5. **Analytics** 🟢

**Backend**:
- [ ] Crear `AnalyticsService`
- [ ] Métodos: `trackEvent()`, `trackPageView()`

**Frontend**:
- [ ] Crear wrapper para Google Analytics
- [ ] Integrar en componentes clave

---

## 🔑 Reglas de Oro

### ✅ DO:
1. **Horizontal features en `shared/features/`**
2. **Vertical features en `features/{domain}/`**
3. **Preguntarte siempre**: ¿Esta feature cruza dominios?
4. **Usar Services, no SDKs directamente** en componentes
5. **Documentar por qué** una feature es horizontal

### ❌ DON'T:
1. **No poner horizontales en `features/`** (solo verticales)
2. **No duplicar lógica** entre features verticales (extraer a horizontal)
3. **No asumir** que algo es vertical sin analizar dependencias
4. **No crear horizontales** si solo se usa en un dominio (YAGNI)

---

## 📚 Referencias

- **Backend Gaps**: `docs/BACKEND_GAPS.md` (lista servicios faltantes)
- **Architecture**: `docs/SERVICES_ARCHITECTURE.md` (estructura de capas)
- **TDD Guide**: `docs/TDD_ARQUITECTURA_CORRECTA.md` (6 capas)
- **Frontend Guide**: `docs/FRONTEND_DEVELOPMENT_GUIDE.md` (cómo usar servicios)

---

**Última actualización**: 30 Octubre 2025
**Próximo paso**: Implementar Messaging (feature horizontal crítica)
