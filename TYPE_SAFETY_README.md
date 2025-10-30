# 🛡️ Type Safety & Code Quality - AutoRentar

## ✅ What's Included

Esta infraestructura proporciona type safety completo y reglas estrictas para prevenir errores:

### 📝 Database Types (`src/types/`)
- **database.types.ts**: Tipos TypeScript generados desde el schema de Supabase
- Enums para todos los valores predefinidos
- Interfaces para todas las tablas
- Utility types (Create, Update, Partial, etc.)
- API response types

### 🔍 Type Guards (`src/utils/type-guards.ts`)
- Runtime validation de tipos
- Type predicates para type narrowing
- Assertion functions
- Guards para todas las entidades principales

### ✅ Validation (`src/utils/validation.ts`)
- Result type para manejo de errores funcional
- Validators comunes (email, UUID, phone, etc.)
- Sanitizers para limpiar inputs
- Type-safe parsers

### 🎯 ESLint Configuration
- **Modo estricto** con 100+ reglas
- Prevención de `any`, `unsafe-*`
- Import/export validation
- Complexity limits
- Anti-patterns detection

### 📚 Documentation
- `DATABASE_DOCUMENTATION.md`: Documentación completa del schema
- `TYPESCRIPT_GUIDELINES.md`: Guías de uso de TypeScript
- `ANTI_PATTERNS.md`: Patrones prohibidos con ejemplos

## 🚀 Quick Start

### Import Types

```typescript
// ✅ Correcto - Type-only imports
import type { Booking, Car, Profile } from '@types/database.types';
import { BookingStatus, CarStatus } from '@types/database.types';

// ✅ Use path aliases
import type { Booking } from '@types';
import { isBooking, assertBooking } from '@utils/type-guards';
```

### Validate Data

```typescript
import { isBooking, assertBooking } from '@utils/type-guards';
import type { Booking } from '@types';

// Type guard
if (isBooking(data)) {
  // data is Booking
  console.log(data.total_amount);
}

// Assertion
assertBooking(data); // Throws if invalid
// data is Booking here
```

### Use Validators

```typescript
import { validate, Validators } from '@utils/validation';

const result = validate(email, [
  Validators.required(),
  Validators.email(),
]);

if (!result.isValid) {
  console.error(result.errors);
}
```

### Result Type

```typescript
import { type Result, Ok, Err, isOk } from '@utils/validation';

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return Err('Division by zero');
  }
  return Ok(a / b);
}

const result = divide(10, 2);
if (isOk(result)) {
  console.log(result.value); // 5
} else {
  console.error(result.error);
}
```

## 🔧 Scripts

```bash
# Type checking
npm run type-check          # Verify TypeScript types

# Linting
npm run lint                # Check for errors
npm run lint:fix            # Auto-fix errors

# Formatting
npm run format:check        # Check Prettier formatting
npm run format:write        # Auto-format code

# All validations
npm run validate            # Run all checks
```

## 📋 Rules Summary

### TypeScript Strict Rules
- ✅ `strict: true`
- ✅ `noImplicitAny: true`
- ✅ `strictNullChecks: true`
- ✅ `noUnusedLocals: true`
- ✅ `noUnusedParameters: true`
- ✅ `noUncheckedIndexedAccess: true`

### ESLint Rules
- 🚫 NO `any` types
- 🚫 NO unsafe operations
- 🚫 NO floating promises
- 🚫 NO circular dependencies
- 🚫 NO unused imports/variables
- 🚫 NO duplicate imports
- 🚫 NO default exports
- 🚫 NO `console.log` (use logger)
- ✅ Explicit return types
- ✅ Type-only imports when possible
- ✅ Consistent naming conventions
- ✅ Complexity limits (max 15)
- ✅ Depth limits (max 4)
- ✅ Line length limit (max 120)

## 📖 Naming Conventions

```typescript
// Variables & Functions: camelCase
const userName = 'John';
function getUserData() { }

// Classes, Interfaces, Types: PascalCase
class UserService { }
interface UserProfile { }
type UserId = string;

// Enums: PascalCase (members: UPPER_CASE)
enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed'
}

// Constants: UPPER_CASE
const MAX_RETRIES = 3;
const API_URL = 'https://api.example.com';

// Private members: _prefixed
class Service {
  private _cache: Map<string, unknown>;
}

// NO "I" prefix for interfaces
// ❌ interface IUser { }
// ✅ interface User { }
```

## 🎯 Import Order

Imports are automatically organized in this order:

1. Built-in Node.js modules
2. External packages (@angular, rxjs)
3. Internal modules (@app, @services)
4. Parent imports (../)
5. Sibling imports (./)
6. Type imports

Example:
```typescript
import { Component } from '@angular/core';
import { Observable } from 'rxjs';

import { CarService } from '@app/services/car.service';
import { BookingService } from '@app/services/booking.service';

import type { Car, Booking } from '@app/types/database.types';
```

## 🛠️ Path Aliases

Configured in `tsconfig.json`:

```typescript
import { CarService } from '@app/services/car.service';
import type { Booking } from '@types/database.types';
import { isBooking } from '@utils/type-guards';
import { validate } from '@utils/validation';
```

Available aliases:
- `@app/*` → `src/app/*`
- `@types/*` → `src/types/*`
- `@utils/*` → `src/utils/*`
- `@lib/*` → `src/lib/*`
- `@services/*` → `src/app/services/*`
- `@components/*` → `src/app/components/*`

## 🚨 Common Errors & Solutions

### Error: Type 'any' is not allowed

```typescript
// ❌ Wrong
function getData(input: any) { }

// ✅ Right
function getData<T>(input: T): T { }
```

### Error: Promise returned is not awaited

```typescript
// ❌ Wrong
function save(data: Booking) {
  database.save(data); // Floating promise!
}

// ✅ Right
async function save(data: Booking): Promise<void> {
  await database.save(data);
}
```

### Error: Unsafe assignment

```typescript
// ❌ Wrong
const data: Booking = await fetchData(); // fetchData returns unknown

// ✅ Right
const data = await fetchData();
assertBooking(data); // Now data is Booking
```

### Error: Unsafe member access

```typescript
// ❌ Wrong
if (user.profile.name) { } // user might be undefined

// ✅ Right
if (user?.profile?.name !== undefined) { }
```

## 📊 Quality Metrics

Expected metrics:
- **ESLint errors:** 0
- **TypeScript errors:** 0
- **Test coverage:** >80%
- **Average complexity:** <10
- **Max complexity:** 15
- **Max depth:** 4

## 🔄 CI/CD Integration

These checks run automatically in CI/CD:

```yaml
# .github/workflows/code-quality.yml
- run: npm run type-check
- run: npm run lint
- run: npm run format:check
- run: npm run test:ci
```

Build fails if any check fails.

## 📝 Pre-commit Hook

Install husky to validate before commit:

```bash
npm install -D husky lint-staged

npx husky install
npx husky add .husky/pre-commit "npm run validate"
```

## 🎓 Learning Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [TypeScript ESLint](https://typescript-eslint.io/)
- Database docs: `docs/DATABASE_DOCUMENTATION.md`
- TypeScript guidelines: `TYPESCRIPT_GUIDELINES.md`
- Anti-patterns: `docs/ANTI_PATTERNS.md`

## 🤝 Contributing

Before submitting a PR:

1. Run `npm run validate` - All checks must pass
2. Fix any ESLint errors
3. Fix any TypeScript errors
4. Update types if schema changed
5. Add tests for new code

## ✨ Benefits

This infrastructure provides:

- ✅ **Type Safety**: Catch errors at compile time
- ✅ **IntelliSense**: Better IDE autocomplete
- ✅ **Refactoring**: Safe renames and moves
- ✅ **Documentation**: Types serve as docs
- ✅ **Consistency**: Enforced code style
- ✅ **Quality**: Automated quality checks
- ✅ **Prevention**: Stop bugs before they happen

---

**Remember:** Type safety is not optional. It's mandatory for production code quality.
