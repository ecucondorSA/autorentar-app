# Scripts de Automatización

Estos scripts automatizan la configuración de guardrails y migraciones de base de datos.

## 🚀 Quick Start

```bash
# Setup completo (recomendado)
make setup

# O ejecutar manualmente
./scripts/setup-all.sh
```

## 📦 Scripts Disponibles

### `setup-all.sh` - Setup Completo

Ejecuta todos los pasos en orden:
1. Instala guardrails (Husky + CI)
2. Ejecuta migración de Wallet RPCs (si `SUPABASE_DB_URL` está configurado)

**Uso**:
```bash
./scripts/setup-all.sh
```

---

### `setup-guardrails.sh` - Instalar Guardrails

Instala:
- **Husky pre-commit**: Lint, typecheck, ban `as never`
- **Husky pre-push**: Tests de contrato + build
- **GitHub Actions**: CI en cada push/PR

**Uso**:
```bash
./scripts/setup-guardrails.sh
```

**Qué hace**:
1. Instala Husky
2. Crea `.husky/pre-commit` y `.husky/pre-push`
3. Crea `.github/workflows/contracts.yaml`

---

### `migrate-wallet-rpcs.sh` - Migrar Wallet RPCs

Ejecuta la migración SQL para operaciones atómicas de wallet.

**Requisitos**:
- `SUPABASE_DB_URL` configurado en `.env`

**Uso**:
```bash
# Configurar SUPABASE_DB_URL
export SUPABASE_DB_URL="postgresql://postgres.[PROJECT]:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

# Ejecutar migración
./scripts/migrate-wallet-rpcs.sh
```

**Qué hace**:
1. Valida que `SUPABASE_DB_URL` esté configurado
2. Ejecuta `supabase/migrations/20251030_wallet_atomic_rpcs.sql`
3. Regenera tipos TypeScript con `pnpm types:gen`
4. Ejecuta build para verificar que no hay errores

**RPCs creadas**:
- `wallet_hold_funds()` - Reserva fondos atómicamente
- `wallet_capture_hold()` - Captura fondos reservados y transfiere
- `wallet_release_hold()` - Libera fondos reservados (refund)

---

## 🛡️ Guardrails Instalados

### Pre-commit Hook

Se ejecuta **antes de cada commit**:

```bash
✓ Regenera tipos si database.types.ts cambió
✓ ESLint --fix (auto-corrige)
✓ Type check
✓ Ban "as never" (excepto en database.types.ts)
```

### Pre-push Hook

Se ejecuta **antes de cada push**:

```bash
✓ Contract tests
✓ Build
```

### GitHub Actions

Se ejecuta en **cada push/PR**:

```yaml
name: Contract Tests
on: [push, pull_request]
jobs:
  - Check banned patterns
  - Type check
  - Contract tests
  - Build
```

---

## 🧪 Tests de Contrato

Los tests de contrato validan que:
1. **Wallet RPCs** funcionan correctamente (atómicas, sin race conditions)
2. **Enums** no cambian sin actualizar código

**Ubicación**: `tests/contracts/`

**⚠️ Nota**: Los contract tests están escritos en Vitest. Este proyecto usa Karma/Jasmine por defecto. Para ejecutar los contract tests, necesitas:
1. Instalar Vitest: `pnpm add -D vitest @vitest/ui`
2. Crear `vitest.config.ts`
3. Agregar script en `package.json`: `"test:vitest": "vitest"`

**Ejecutar** (después de configurar Vitest):
```bash
# Todos los tests de contrato
pnpm test:vitest tests/contracts

# Solo wallet RPCs
pnpm test:vitest tests/contracts/wallet-rpcs.test.ts

# Solo enums
pnpm test:vitest tests/contracts/enums.snapshot.test.ts
```

**Actualizar snapshots**:
```bash
pnpm test:vitest tests/contracts/enums.snapshot.test.ts -u
```

**Alternativa**: Los contract tests son ejemplos de validación. Puedes adaptarlos a Karma/Jasmine si prefieres mantener un solo test runner.

---

## 🔧 Makefile

El Makefile provee shortcuts para tareas comunes:

```bash
make help        # Ver todos los comandos
make setup       # Setup completo
make guardrails  # Solo guardrails
make migrate     # Solo migración
make test        # Contract tests
make check       # Type check + lint
make build       # Build
make ci          # Todos los checks (como CI)
make clean       # Limpiar artifacts
```

---

## 🗂️ Estructura de Archivos

```
scripts/
├── README.md                      # Este archivo
├── setup-all.sh                   # Setup completo
├── setup-guardrails.sh            # Instalar hooks + CI
└── migrate-wallet-rpcs.sh         # Migrar Wallet RPCs

supabase/
└── migrations/
    └── 20251030_wallet_atomic_rpcs.sql

.husky/
├── pre-commit                     # Hook pre-commit
└── pre-push                       # Hook pre-push

.github/
└── workflows/
    └── contracts.yaml             # CI workflow

tests/
└── contracts/
    ├── wallet-rpcs.test.ts        # Tests de Wallet RPCs
    └── enums.snapshot.test.ts     # Tests de enums

Makefile                           # Shortcuts
```

---

## ❓ FAQ

### ¿Cómo configuro SUPABASE_DB_URL?

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Settings → Database → Connection string
3. Copia el Pooler connection string
4. Agrega a `.env`:

```env
SUPABASE_DB_URL="postgresql://postgres.[PROJECT]:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
```

### ¿Qué hago si un hook falla?

**Pre-commit falló**:
```bash
# Revisar el error
git status

# Fix manualmente
pnpm lint --fix
pnpm typecheck

# Commit de nuevo
git commit
```

**Pre-push falló**:
```bash
# Revisar tests
pnpm test tests/contracts --run

# Fix y commit
git add .
git commit -m "fix: tests"
```

### ¿Puedo saltarme los hooks?

**NO recomendado**, pero si es necesario:

```bash
# Saltear pre-commit
git commit --no-verify

# Saltear pre-push
git push --no-verify
```

⚠️ **Advertencia**: Los hooks previenen errores. Saltearlos puede romper CI.

### ¿Cómo actualizo las migraciones?

1. Crea nueva migración en `supabase/migrations/`
2. Nombre formato: `YYYYMMDD_descripcion.sql`
3. Ejecuta:

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/NUEVA_MIGRACION.sql
pnpm types:gen
```

---

## 🔗 Links Útiles

- [Documentación Supabase](https://supabase.com/docs)
- [Husky Docs](https://typicode.github.io/husky/)
- [Vitest Docs](https://vitest.dev/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
