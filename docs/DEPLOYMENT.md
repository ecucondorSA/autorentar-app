# 🚀 Deployment Guide - AutoRentar

## Configuración Inicial

### 1. Variables de Entorno en GitHub

Configura los siguientes secrets en GitHub:
```bash
# Settings → Secrets and variables → Actions → New repository secret
```

**Secrets requeridos:**
- `SUPABASE_URL`: URL de tu proyecto Supabase
- `SUPABASE_ANON_KEY`: Clave anónima de Supabase
- `SUPABASE_PROJECT_REF`: ID del proyecto Supabase
- `SUPABASE_ACCESS_TOKEN`: Token de acceso de Supabase CLI
- `SUPABASE_DB_PASSWORD`: Password de la base de datos

**Secrets opcionales:**
- `VERCEL_TOKEN`: Token de Vercel (para deployment)
- `NETLIFY_AUTH_TOKEN`: Token de Netlify (para deployment)
- `SENTRY_DSN`: DSN de Sentry (para error tracking)

### 2. Configurar Environments en GitHub

1. Ve a: `Settings → Environments`
2. Crea los siguientes environments:
   - `development`
   - `staging`
   - `production`
3. Para `production`, habilita "Required reviewers"

## Workflows Disponibles

### CI Pipeline (`ci.yml`)
**Trigger:** Push o PR a `main` o `develop`

Ejecuta:
- Linter
- Type check
- Format check
- Unit tests
- E2E tests
- Build

### Deploy (`deploy.yml`)
**Trigger:** 
- Push a `main` (automático)
- Manual dispatch

Ejecuta:
- Tests
- Build production
- Deploy (cuando se configure hosting)

**Manual deployment:**
```bash
# Via GitHub UI
Actions → Deploy to Production → Run workflow

# Via GitHub CLI
gh workflow run deploy.yml -f environment=production
```

### Security Scan (`security.yml`)
**Trigger:**
- Semanal (domingos)
- Push a `main`
- Pull requests

Ejecuta:
- npm audit
- Dependency review
- CodeQL analysis

### Release Management (`release.yml`)
**Trigger:**
- Push de tags `v*.*.*`
- Manual dispatch

**Crear release:**
```bash
# Via git tags
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Via GitHub CLI
gh workflow run release.yml -f version=v1.0.0
```

### Database Migration (`db-migrate.yml`)
**Trigger:** Manual dispatch

**Ejecutar migración:**
```bash
# Via GitHub UI
Actions → Database Migration → Run workflow
# Selecciona environment y dirección

# Via GitHub CLI
gh workflow run db-migrate.yml -f environment=production -f migration_direction=up
```

## Scripts de Automatización

### Deploy local
```bash
./scripts/deploy.sh
```
Ejecuta: lint, tests, build y crea tag de deployment

### Check environment
```bash
./scripts/check-env.sh
```
Verifica que las variables de entorno estén configuradas

### Rollback
```bash
./scripts/rollback.sh <commit-sha>
```
Crea un revert commit para rollback

### Health check
```bash
./scripts/health-check.sh [URL]
```
Verifica el estado del servidor

## Flujo de Trabajo Recomendado

### 1. Desarrollo
```bash
# Crear feature branch
git checkout -b feature/nueva-funcionalidad

# Hacer cambios y commits
git add .
git commit -m "feat: agregar nueva funcionalidad"

# Push y crear PR
git push origin feature/nueva-funcionalidad
# Crear PR en GitHub
```

### 2. Pull Request
- El CI pipeline se ejecuta automáticamente
- Esperar approval de code owner
- Merge a `develop` o `main`

### 3. Deployment a Staging
```bash
# Merge a staging branch
git checkout staging
git merge develop
git push origin staging
```

### 4. Deployment a Production
```bash
# Merge a main
git checkout main
git merge staging
git push origin main

# O crear release tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### 5. Rollback (si es necesario)
```bash
# Opción 1: Via script
./scripts/rollback.sh HEAD~1
git push origin main

# Opción 2: Via GitHub
gh workflow run deploy.yml --ref <previous-tag>
```

## Monitoreo Post-Deployment

### Verificar deployment
```bash
# Health check
./scripts/health-check.sh https://autorentar.com

# Ver logs en GitHub Actions
gh run list --workflow=deploy.yml

# Ver último run
gh run view --log
```

### Ver status de workflows
```bash
# Todos los workflows
gh workflow list

# Runs recientes
gh run list --limit 5
```

## Troubleshooting

### Build falla en CI
```bash
# Verificar localmente
npm ci
npm run lint
npm run test:ci
npm run build
```

### Tests fallan
```bash
# Ejecutar tests localmente
npm run test
npm run e2e

# Con más detalle
npm run test -- --verbose
```

### Deploy falla
```bash
# Ver logs del workflow
gh run view --log-failed

# Verificar secrets
gh secret list

# Rollback si es necesario
./scripts/rollback.sh <commit-sha>
```

### Problemas con Supabase
```bash
# Verificar conexión
curl -I $SUPABASE_URL

# Ver proyectos
supabase projects list

# Reset local
supabase stop
supabase start
```

## Configurar Hosting

### Vercel

1. **Instalar Vercel CLI:**
```bash
npm install -g vercel
```

2. **Conectar proyecto:**
```bash
vercel login
vercel link
```

3. **Configurar secrets:**
```bash
gh secret set VERCEL_TOKEN -b "your-vercel-token"
```

4. **Descomentar en `.github/workflows/deploy.yml`:**
```yaml
- name: Deploy to Vercel
  run: |
    npm install -g vercel
    vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### Netlify

1. **Instalar Netlify CLI:**
```bash
npm install -g netlify-cli
```

2. **Conectar proyecto:**
```bash
netlify login
netlify link
```

3. **Configurar secrets:**
```bash
gh secret set NETLIFY_AUTH_TOKEN -b "your-netlify-token"
```

4. **Descomentar en `.github/workflows/deploy.yml`:**
```yaml
- name: Deploy to Netlify
  run: |
    npm install -g netlify-cli
    netlify deploy --prod --dir=dist --auth=${{ secrets.NETLIFY_AUTH_TOKEN }}
```

## Mejores Prácticas

1. **Siempre hacer PR:** Nunca push directo a `main`
2. **Tests obligatorios:** No mergear si los tests fallan
3. **Code review:** Mínimo 1 approval antes de merge
4. **Semantic commits:** Usar conventional commits
5. **Deployment gradual:** Dev → Staging → Production
6. **Monitoreo:** Verificar después de cada deployment
7. **Rollback plan:** Siempre tener plan B
8. **Documentation:** Actualizar docs con cada cambio mayor

## Comandos Rápidos

```bash
# Verificar ambiente
./scripts/check-env.sh

# Deploy completo
./scripts/deploy.sh

# Ver workflows
gh workflow list

# Ejecutar workflow
gh workflow run <workflow-name>

# Ver últimos runs
gh run list --limit 5

# Ver logs de último run
gh run view --log

# Crear release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Rollback
./scripts/rollback.sh <commit-sha>

# Health check
./scripts/health-check.sh https://autorentar.com
```

---

**Nota:** Este documento debe actualizarse conforme se agreguen nuevas features o se modifiquen los workflows.
