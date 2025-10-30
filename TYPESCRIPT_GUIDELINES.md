# TypeScript Configuration Best Practices

## Strict Mode

Este proyecto usa TypeScript en modo estricto para prevenir errores comunes:

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "strictBindCallApply": true,
  "strictPropertyInitialization": true,
  "noImplicitThis": true,
  "alwaysStrict": true
}
```

## Reglas de Importación

### ✅ Correcto - Type-only imports
```typescript
import type { Profile, Car } from '@types/database.types';
import { CarService } from '@services/car.service';
```

### ❌ Incorrecto - Mixed imports
```typescript
import { Profile, CarService } from '@types/database.types'; // NO!
```

## Type Safety Rules

### 1. NO usar `any`
```typescript
// ❌ Incorrecto
function getData(input: any): any {
  return input.value;
}

// ✅ Correcto
function getData<T>(input: { value: T }): T {
  return input.value;
}
```

### 2. Usar strict boolean expressions
```typescript
// ❌ Incorrecto
if (value) { }
if (array.length) { }
if (str) { }

// ✅ Correcto
if (value !== null && value !== undefined) { }
if (array.length > 0) { }
if (str !== '') { }
if (Boolean(value)) { }
```

### 3. NO hacer type assertions innecesarias
```typescript
// ❌ Incorrecto
const car = getCar() as Car;

// ✅ Correcto
const car: Car = getCar();
```

### 4. Usar Nullish Coalescing
```typescript
// ❌ Incorrecto
const value = input || 'default';

// ✅ Correcto
const value = input ?? 'default';
```

### 5. Usar Optional Chaining
```typescript
// ❌ Incorrecto
const city = user && user.address && user.address.city;

// ✅ Correcto
const city = user?.address?.city;
```

## Import Order

Los imports deben seguir este orden:

1. Built-in modules de Node.js
2. External modules (@angular, rxjs, etc.)
3. Internal modules (@app, @services, etc.)
4. Parent imports (../)
5. Sibling imports (./)
6. Index imports
7. Type imports

```typescript
// 1. External
import { Component } from '@angular/core';
import { Observable } from 'rxjs';

// 2. Internal
import { CarService } from '@app/services/car.service';
import { BookingService } from '@app/services/booking.service';

// 3. Types
import type { Car, Booking } from '@app/types/database.types';
```

## Naming Conventions

### Variables y Funciones: camelCase
```typescript
const userName = 'John';
function getUserProfile() { }
```

### Classes, Interfaces, Types, Enums: PascalCase
```typescript
class CarService { }
interface UserProfile { }
type BookingStatus = 'pending' | 'confirmed';
enum PaymentStatus { }
```

### Constants: UPPER_CASE
```typescript
const MAX_RETRIES = 3;
const API_BASE_URL = 'https://api.example.com';
```

### Private members: _prefixed
```typescript
class Service {
  private _cache: Map<string, unknown>;
}
```

### Interfaces: NO usar prefijo "I"
```typescript
// ❌ Incorrecto
interface IUser { }

// ✅ Correcto
interface User { }
```

## Evitar Duplicación

### 1. Extraer tipos comunes
```typescript
// ❌ Incorrecto
function createCar(data: { title: string; year: number }) { }
function updateCar(data: { title: string; year: number }) { }

// ✅ Correcto
interface CarData {
  title: string;
  year: number;
}
function createCar(data: CarData) { }
function updateCar(data: CarData) { }
```

### 2. Usar utility types
```typescript
type CreateCar = Omit<Car, 'id' | 'created_at'>;
type UpdateCar = Partial<CreateCar>;
type CarWithOwner = Car & { owner: Profile };
```

## Circular Dependencies

### ❌ Evitar imports circulares
```typescript
// car.service.ts
import { BookingService } from './booking.service';

// booking.service.ts
import { CarService } from './car.service'; // CIRCULAR!
```

### ✅ Solución: Usar barrel exports o interfaces
```typescript
// interfaces/car-service.interface.ts
export interface ICarService {
  getCar(id: string): Promise<Car>;
}

// car.service.ts
export class CarService implements ICarService { }

// booking.service.ts
import type { ICarService } from '@interfaces/car-service.interface';
```

## Complexity Limits

- **Max depth:** 4 niveles de anidamiento
- **Max nested callbacks:** 3 callbacks anidados
- **Cyclomatic complexity:** Máximo 15

```typescript
// ❌ Muy complejo (complexity > 15)
function processBooking(booking: Booking) {
  if (booking.status === 'pending') {
    if (booking.payment_method === 'card') {
      if (booking.guarantee_type === 'hold') {
        // ... muchas más condiciones
      }
    }
  }
}

// ✅ Refactorizado
function processBooking(booking: Booking) {
  if (!isValidBooking(booking)) {
    return;
  }
  
  const processor = getPaymentProcessor(booking);
  return processor.process(booking);
}
```

## ESLint Scripts

```bash
# Verificar código
npm run lint

# Arreglar automáticamente
npm run lint:fix

# Verificar types
npx tsc --noEmit
```

## Excepciones en Tests

En archivos de test, algunas reglas son más relajadas:
- Se permite `any` 
- Se permite `no-unsafe-*`
- Se permite mayor anidamiento de callbacks

## Pre-commit Hooks

Se recomienda usar husky para validar antes de commit:

```bash
npm run lint && npm run test:ci
```
