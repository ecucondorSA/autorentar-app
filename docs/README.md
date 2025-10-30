# AutoRentar Documentation Index

**Bienvenido a la documentación de AutoRentar**

Esta documentación está diseñada para que futuras sesiones de Claude (u otros desarrolladores) puedan crear el frontend sin errores de tipos.

---

## 📚 Documentos Disponibles

### 1. 🎯 **QUICK_REFERENCE.md** - START HERE
**Para**: Desarrollo rápido, copiar y pegar snippets
**Contiene**:
- Imports comunes
- Type reference cheat sheet
- Common operations
- Errores comunes y cómo evitarlos
- Enum values completos

👉 **Úsalo cuando**: Necesites referencias rápidas de tipos o ejemplos de código

---

### 2. 📖 **BACKEND_API_REFERENCE.md** - COMPLETE REFERENCE
**Para**: Referencia completa del backend
**Contiene**:
- Todos los DTOs con todos sus campos
- Todos los Services con todos sus métodos
- Todos los SDKs con sus signatures
- Schemas de validación (Zod)
- Database types y enums
- Error handling completo
- Ejemplos detallados

👉 **Úsalo cuando**: Necesites información completa sobre un tipo o servicio

---

### 3. 🏗️ **FRONTEND_DEVELOPMENT_GUIDE.md** - HOW TO CODE
**Para**: Guía paso a paso para crear componentes
**Contiene**:
- Template de componente correcto
- Template de formulario correcto
- Errores comunes detallados
- Auth patterns
- Component checklist
- Data flow patterns
- Testing patterns

👉 **Úsalo cuando**: Vayas a crear un nuevo componente Angular

---

### 4. 🔧 **ARCHITECTURE_UPGRADE.md** - EXISTING
**Para**: Contexto histórico y estrategia de arquitectura
**Contiene**:
- Historia del proyecto
- Decisiones de arquitectura
- Upgrade strategy

---

### 5. 🚀 **API_ARCHITECTURE.md** - EXISTING
**Para**: Arquitectura general de la API
**Contiene**:
- Layers (SDKs, Services, Components)
- Security patterns
- Deployment guides

---

## 🎯 Flujo de Trabajo Recomendado

### Para Crear un Nuevo Componente:

```
1. Lee QUICK_REFERENCE.md
   ↓
2. Identifica los tipos que necesitas
   ↓
3. Lee FRONTEND_DEVELOPMENT_GUIDE.md
   ↓
4. Copia el template apropiado
   ↓
5. Consulta BACKEND_API_REFERENCE.md para detalles
   ↓
6. Codea el componente
   ↓
7. Run `npm run lint` antes de commit
   ↓
8. Pre-commit hook valida automáticamente
```

---

## ⚠️ REGLAS CRÍTICAS

Antes de escribir código, **SIEMPRE**:

1. ✅ Consulta `QUICK_REFERENCE.md` para nombres exactos de campos
2. ✅ Usa `CreateBookingInput` (NO `CreateBookingServiceInput`)
3. ✅ Usa `kyc` field (NO `kyc_status`)
4. ✅ Usa valor `verified` (NO `approved`)
5. ✅ NO uses campos removidos (`extra_wifi`)
6. ✅ Usa Services, NO SDKs directamente
7. ✅ Maneja errores con try/catch
8. ✅ Usa signals para estado reactivo

---

## 📊 Estado del Proyecto

### Backend: 95% COMPLETO ✅
- Types: ✅ 100%
- DTOs: ✅ 100%
- SDKs: ✅ 100%
- Services: ✅ 100%
- Database: ✅ 92% (66 tablas, 22 wallet RPCs)
- Edge Functions: ✅ 90% (21 functions deployed)

### Frontend: 0% ⚠️
- UI Components: 0 (listo para empezar)
- Infrastructure: ✅ Guards + Interceptors
- Guardrails: ✅ Pre-commit + Pre-push hooks

### CI/CD: 95% COMPLETO ✅
- Linting: ✅ 0 errores
- Build: ✅ 0 errores
- Husky hooks: ✅ Activos
- GitHub Actions: ✅ Configuradas

---

## 🏃 Quick Start

```bash
# 1. Read documentation
cat docs/QUICK_REFERENCE.md

# 2. Generate component
ng generate component features/home/home --standalone

# 3. Copy template from FRONTEND_DEVELOPMENT_GUIDE.md

# 4. Code your component

# 5. Lint before commit
npm run lint

# 6. Commit (pre-commit hook validates)
git add .
git commit -m "feat: create home component"
```

---

## 🔗 Enlaces Útiles

### Scripts
- `scripts/README.md` - Scripts de automatización (guardrails, migration)
- `Makefile` - Shortcuts de desarrollo

### Types
- `src/types/dto.ts` - Definiciones de DTOs
- `src/types/schemas.ts` - Schemas de validación
- `src/types/database.types.ts` - Types auto-generados de DB

### Services
- `src/services/*.service.ts` - Business logic

### SDKs
- `src/lib/sdk/*.sdk.ts` - Data access layer

---

## 📝 Ejemplos Rápidos

### Crear Booking
```typescript
import { bookingService } from '@/services/booking.service'
import type { CreateBookingInput } from '@/types'

const input: CreateBookingInput = {
  car_id: 'uuid',
  renter_id: 'uuid',
  start_date: '2025-11-01T10:00:00Z',
  end_date: '2025-11-05T10:00:00Z',
  extra_driver_count: 1,
  extra_child_seat_count: 0,
  extra_gps: true,
  insurance_coverage_level: 'standard',
}

const booking = await bookingService.createBooking(input)
```

### Buscar Autos
```typescript
import { carSDK } from '@/lib/sdk/car.sdk'

const cars = await carSDK.getAvailable('2025-11-01', '2025-11-05')
```

---

## 🎓 Aprende Más

1. Start with `QUICK_REFERENCE.md`
2. Deep dive into `BACKEND_API_REFERENCE.md`
3. Follow patterns in `FRONTEND_DEVELOPMENT_GUIDE.md`

---

## 🆘 Problemas Comunes

**Error**: `Cannot find name 'CreateBookingServiceInput'`
**Solución**: Usa `CreateBookingInput` de `@/types`

**Error**: `Property 'kyc_status' does not exist`
**Solución**: Usa `kyc` (no `kyc_status`)

**Error**: `Type '"approved"' is not assignable to type 'KYCStatus'`
**Solución**: Usa `'verified'` (no `'approved'`)

**Error**: `Property 'extra_wifi' does not exist`
**Solución**: Campo removido, usa `extra_gps` en su lugar

---

## 📞 Soporte

Para más información, consulta:
- `BACKEND_API_REFERENCE.md` - API completa
- `FRONTEND_DEVELOPMENT_GUIDE.md` - Guía de desarrollo
- `QUICK_REFERENCE.md` - Referencia rápida

---

**¡Buena suerte con el desarrollo! 🚀**

**Last updated**: 30 October 2025
**Version**: 1.0.0
