# 🔍 Análisis de Errores Backend - TypeScript

**Fecha**: 2025-10-30
**Proyecto**: autorentar-app
**Objetivo**: Arreglar errores TypeScript que bloquean compilación

---

## 📊 Resumen Ejecutivo

**Total de errores**: ~20 errores TypeScript
**Archivos afectados**: 2 (search.service.ts, dispute.sdk.ts)
**Causa raíz**:
1. Uso de propiedades que NO existen en tabla `cars` (instant_book)
2. Problemas con `exactOptionalPropertyTypes: true` en tipos nullable
3. Tipo incorrecto retornado por CarSDK.search()

---

## 🗄️ Verificación del Schema Real (PostgreSQL)

### Tabla: `cars`

**Columnas verificadas en DB**:
```sql
✅ doors              integer (nullable)
✅ rating_avg         numeric(3,2) (nullable)
✅ rating_count       integer (nullable)
❌ instant_book       NO EXISTE en la tabla
```

**Types generados (`database.types.ts`)**:
```typescript
Row: {
  doors: number | null           ✅ Coincide
  rating_avg: number | null      ✅ Coincide
  rating_count: number | null    ✅ Coincide
  instant_book: ???              ❌ NO está en los types
}
```

**Conclusión**: `instant_book` NO existe en la DB → Remover de código

---

### Tabla: `disputes`

**Columnas verificadas en DB**:
```sql
✅ resolved_by        uuid (nullable)
✅ resolved_at        timestamp with time zone (nullable)
✅ status             dispute_status (not null)
```

**Types generados**:
```typescript
Row: {
  resolved_by: string | null     ✅ Coincide
  resolved_at: string | null     ✅ Coincide
  status: "open" | "in_review" | "resolved" | "rejected"  ✅ Coincide
}

Update: {
  resolved_by?: string | null    ⚠️ Problema con exactOptionalPropertyTypes
  resolved_at?: string | null    ⚠️ Problema con exactOptionalPropertyTypes
  status?: "open" | ...          ⚠️ Problema con tipo string
}
```

**Problema**: Con `exactOptionalPropertyTypes: true`, no puedes hacer:
```typescript
const resolved_by: string | undefined = ...
updateData.resolved_by = resolved_by  // ❌ Error
// Porque updateData.resolved_by es: string | null (no acepta undefined)
```

---

## 🐛 Errores Detallados

### Error #1: `instant_book` No Existe

**Archivo**: `src/services/search.service.ts:226`

```typescript
// ❌ ERROR
if (filters.instant_book) {
  cars = cars.filter((car) => car.instant_book)  // Property 'instant_book' does not exist
}
```

**Solución**: Comentar o eliminar esta feature
```typescript
// ✅ SOLUCIÓN
// TODO: instant_book feature not yet implemented in DB
// if (filters.instant_book) {
//   cars = cars.filter((car) => car.instant_book)
// }
```

---

### Error #2: `PaginatedResponse<T>` vs `T[]`

**Archivo**: `src/services/search.service.ts:115-121`

```typescript
// ❌ ERROR
const cars = await this.carSDK.search({ status: 'active' })
// carSDK.search() retorna PaginatedResponse<Car>

const filtered = cars.filter((car) => { ... })
// Error: Property 'filter' does not exist on type 'PaginatedResponse<Car>'
```

**Causa**: `carSDK.search()` retorna:
```typescript
interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
}
```

**Solución**: Acceder a `.data`
```typescript
// ✅ SOLUCIÓN
const response = await this.carSDK.search({ status: 'active' })
const cars = response.data  // Ahora es Car[]
const filtered = cars.filter((car) => { ... })
```

---

### Error #3: Métodos que no existen en CarSDK

**Archivo**: `src/services/search.service.ts:154,185`

```typescript
// ❌ ERROR
cars = await this.carSDK.getNearby(lat, lng, radius)
// Property 'getNearby' does not exist on type 'CarSDK'

const availableCars = await this.carSDK.getAvailable(start, end)
// Property 'getAvailable' does not exist on type 'CarSDK'
```

**Solución**: Usar `.search()` con filtros apropiados o implementar los métodos
```typescript
// ✅ SOLUCIÓN (opción 1: usar search con filtros)
const response = await this.carSDK.search({
  radius,
  sortBy: 'distance_asc',
  page: 1,
  pageSize: 100,
  // Filtros adicionales...
})
const cars = response.data
```

---

### Error #4: `exactOptionalPropertyTypes` en Disputes

**Archivo**: `src/lib/sdk/dispute.sdk.ts:167`

```typescript
// ❌ ERROR
const resolvedBy: string | undefined = userId

const updateData: Database['public']['Tables']['disputes']['Update'] = {
  status: newStatus,
}

if (resolvedBy) {
  updateData.resolved_by = resolvedBy
  // Error: Type 'string | undefined' is not assignable to type 'string | null'
}
```

**Causa**: `exactOptionalPropertyTypes: true` es MUY estricto:
- `string | null` ≠ `string | undefined`
- No hace coerción automática

**Solución**: Convertir `undefined` a `null` explícitamente
```typescript
// ✅ SOLUCIÓN
if (resolvedBy) {
  updateData.resolved_by = resolvedBy  // resolvedBy es string (no undefined)
  updateData.resolved_at = new Date().toISOString()
}
```

---

### Error #5: Type Mismatch en `status`

**Archivo**: `src/lib/sdk/dispute.sdk.ts:173`

```typescript
// ❌ ERROR
const updateData = {
  status: newStatus,  // newStatus es string
}

await this.supabase
  .from('disputes')
  .update(updateData)
  // Error: Type 'string' is not assignable to type '"open" | "in_review" | "resolved" | "rejected"'
```

**Solución**: Type cast o validación
```typescript
// ✅ SOLUCIÓN
const updateData: Database['public']['Tables']['disputes']['Update'] = {
  status: newStatus as Database['public']['Enums']['dispute_status'],
}
```

---

### Error #6: Fuel Type Enum Mismatch

**Archivo**: `src/services/search.service.ts:211`

```typescript
// ❌ ERROR
car.fuel_type === filters.features?.fuel_type
// Error: Types '"gasoline" | "diesel" | "electric" | "hybrid"' and
//        '"nafta" | "gasoil" | "hibrido" | "electrico"' have no overlap
```

**Causa**: Dos enums diferentes con valores distintos:
- **DB**: `gasoline`, `diesel`, `electric`, `hybrid`
- **Filters**: `nafta`, `gasoil`, `hibrido`, `electrico` (español)

**Solución**: Mapear entre enums
```typescript
// ✅ SOLUCIÓN
const fuelTypeMap: Record<string, string> = {
  'nafta': 'gasoline',
  'gasoil': 'diesel',
  'hibrido': 'hybrid',
  'electrico': 'electric',
}

if (filters.features?.fuel_type) {
  const dbFuelType = fuelTypeMap[filters.features.fuel_type]
  cars = cars.filter((car) => car.fuel === dbFuelType)
}
```

---

### Error #7: Missing Required Parameters

**Archivo**: `src/services/search.service.ts:115,157,259`

```typescript
// ❌ ERROR
const cars = await this.carSDK.search({ status: 'active' })
// Error: Missing properties: radius, sortBy, page, pageSize
```

**Causa**: `carSDK.search()` requiere parámetros obligatorios

**Solución**: Proveer parámetros default
```typescript
// ✅ SOLUCIÓN
const response = await this.carSDK.search({
  status: 'active',
  radius: 50,  // km
  sortBy: 'price_asc',
  page: 1,
  pageSize: 100,
})
const cars = response.data
```

---

### Error #8: Unused Function

**Archivo**: `src/services/search.service.ts:354`

```typescript
// ⚠️ WARNING (no bloquea compilación)
private calculateDistance(...) {
  // Function declared but never used
}
```

**Solución**: Remover o usar
```typescript
// ✅ SOLUCIÓN (comentar si se usará después)
// private calculateDistance(...) { ... }

// O usarla si es necesaria
```

---

## 🔧 Plan de Fixes

### Prioridad 1 (Bloqueantes de compilación):

1. ✅ **search.service.ts línea 226** - Comentar `instant_book`
2. ✅ **search.service.ts línea 115,157,259** - Agregar parámetros requeridos
3. ✅ **search.service.ts línea 121** - Acceder a `.data` de PaginatedResponse
4. ✅ **search.service.ts línea 154** - Reemplazar `getNearby()` con `search()`
5. ✅ **search.service.ts línea 185** - Reemplazar `getAvailable()` con `search()`
6. ✅ **search.service.ts línea 211** - Mapear fuel types
7. ✅ **dispute.sdk.ts línea 167** - Ya funciona (resolvedBy es string)
8. ✅ **dispute.sdk.ts línea 173** - Type cast a dispute_status

### Prioridad 2 (Warnings):

9. ⚠️ **search.service.ts línea 354** - Comentar `calculateDistance()`

---

## 📝 Archivos a Modificar

```
src/
├── services/
│   └── search.service.ts      (15+ errores) ❌ CRÍTICO
│
└── lib/sdk/
    └── dispute.sdk.ts         (2 errores) ⚠️ MEDIO
```

---

## ⏱️ Tiempo Estimado de Fixes

- **search.service.ts**: 45 minutos (muchos cambios)
- **dispute.sdk.ts**: 5 minutos (cambio simple)
- **Testing**: 10 minutos (verificar que compile)

**Total**: ~1 hora

---

## 🎯 Resultado Esperado

Después de los fixes:
```bash
npm run type-check
# ✅ 0 errors
# ✅ 0 warnings

npm run start
# ✅ Server starts successfully
# ✅ http://localhost:4200 funciona

npm run test
# ✅ Tests pueden ejecutarse

npm run e2e
# ✅ Tests E2E pueden ejecutarse
```

---

## 📚 Referencias

- **DB Schema**: PostgreSQL en aws-1-us-east-2.pooler.supabase.com
- **Types**: `/src/types/database.types.ts`
- **CarSDK**: `/src/lib/sdk/car.sdk.ts`
- **SearchService**: `/src/services/search.service.ts`

---

**Conclusión**: La mayoría de errores son por:
1. Feature `instant_book` no implementada en DB
2. Mal uso de `PaginatedResponse<T>` (olvidar `.data`)
3. Llamadas a métodos que no existen en SDKs

**Siguiente paso**: Aplicar fixes uno por uno, verificando compilación después de cada cambio.
