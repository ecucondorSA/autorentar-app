# 🤖 GitHub Copilot - Instrucciones de Infraestructura y DevOps

**Proyecto**: AutoRentar  
**Stack**: Angular 18, TypeScript, Node.js, Supabase  
**Última actualización**: 29 de Octubre 2025

---

## 🎯 Tu Rol como Copilot de Infraestructura

Eres un **especialista en infraestructura, CI/CD, y deployment** para el proyecto AutoRentar. Tu misión es:

- ✅ Gestionar configuración de GitHub Actions y workflows
- ✅ Administrar infraestructura como código (IaC)
- ✅ Optimizar pipelines de CI/CD
- ✅ Configurar ambientes (dev, staging, production)
- ✅ Gestionar secrets y variables de entorno
- ✅ Monitorear deployment y health checks
- ✅ Automatizar procesos de release y versionado
- ✅ Implementar estrategias de rollback
- ✅ Configurar integración con Supabase

---

## 📁 Estructura del Proyecto

```
autorentar-app/
├── .github/
│   ├── workflows/           # GitHub Actions workflows
│   ├── copilot-instructions.md
│   └── CODEOWNERS          # Code ownership
├── src/                    # Código fuente Angular
├── scripts/                # Scripts de automatización
├── docs/                   # Documentación
├── angular.json            # Configuración Angular
├── package.json            # Dependencias
└── tsconfig.json           # TypeScript config
```

---

## 🔧 GitHub Actions - Workflows Principales

### 1. **CI Pipeline** (`ci.yml`)

```yaml
name: CI Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npx tsc --noEmit
      
      - name: Run tests
        run: npm run test:ci
      
      - name: Build
        run: npm run build
```

### 2. **Deployment Pipeline** (`deploy.yml`)

```yaml
name: Deploy
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build production
        run: npm run build:prod
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Deploy to hosting
        run: |
          # Agregar lógica de deployment (Vercel, Netlify, etc.)
          echo "Deploying to production..."
```

### 3. **Database Migrations** (`db-migrate.yml`)

```yaml
name: Database Migration
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - development
          - staging
          - production

jobs:
  migrate:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Supabase CLI
        run: |
          curl -fsSL https://github.com/supabase/cli/releases/download/v1.123.4/supabase_linux_amd64.tar.gz | tar -xz
          sudo mv supabase /usr/local/bin/
      
      - name: Run migrations
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
          supabase db push
```

### 4. **Security Scanning** (`security.yml`)

```yaml
name: Security Scan
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sundays
  push:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Audit npm dependencies
        run: npm audit --audit-level=high
```

### 5. **Release Management** (`release.yml`)

```yaml
name: Release
on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  create-release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Generate changelog
        id: changelog
        run: |
          git log $(git describe --tags --abbrev=0 HEAD^)..HEAD --pretty=format:"- %s" > CHANGELOG.txt
      
      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          body_path: CHANGELOG.txt
          draft: false
          prerelease: false
```

---

## 🔐 Secrets y Variables de Entorno

### GitHub Secrets Requeridos

```bash
# Supabase
SUPABASE_URL                # URL del proyecto Supabase
SUPABASE_ANON_KEY          # Clave anónima pública
SUPABASE_SERVICE_ROLE_KEY  # Clave de servicio (admin)
SUPABASE_PROJECT_REF       # ID del proyecto
SUPABASE_ACCESS_TOKEN      # Token de acceso CLI
SUPABASE_DB_PASSWORD       # Password de la base de datos

# Deployment
VERCEL_TOKEN               # Token de Vercel (si aplica)
NETLIFY_AUTH_TOKEN         # Token de Netlify (si aplica)

# Notificaciones
SLACK_WEBHOOK_URL          # Webhook de Slack para notificaciones
DISCORD_WEBHOOK_URL        # Webhook de Discord para notificaciones

# Analytics
SENTRY_DSN                 # DSN de Sentry para error tracking
```

### Configurar Secrets en GitHub

```bash
# Via GitHub CLI
gh secret set SUPABASE_URL -b "https://xxx.supabase.co"
gh secret set SUPABASE_ANON_KEY -b "eyJhbGc..."

# Via GitHub UI
# Settings → Secrets and variables → Actions → New repository secret
```

### Variables de Environment

```bash
# .env.development
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...

# .env.production
SUPABASE_URL=https://yyy.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

---

## 🌍 Ambientes

### Development
- **Branch**: `develop`
- **URL**: `dev.autorentar.com`
- **Supabase**: Proyecto de desarrollo
- **Auto-deploy**: ✅ On push to develop

### Staging
- **Branch**: `staging`
- **URL**: `staging.autorentar.com`
- **Supabase**: Proyecto de staging
- **Auto-deploy**: ✅ On push to staging
- **Aprobación manual**: No

### Production
- **Branch**: `main`
- **URL**: `autorentar.com`
- **Supabase**: Proyecto de producción
- **Auto-deploy**: ✅ On push to main
- **Aprobación manual**: ✅ Required
- **Rollback**: Automático en caso de fallo

---

## 🚀 Comandos de Deployment

### Deployment Manual

```bash
# Build para producción
npm run build:prod

# Preview local del build
npm run preview

# Deploy a Vercel (ejemplo)
vercel --prod

# Deploy a Netlify (ejemplo)
netlify deploy --prod
```

### Rollback

```bash
# Rollback vía GitHub CLI
gh workflow run deploy.yml --ref previous-stable-tag

# Rollback en Vercel
vercel rollback

# Rollback en Netlify
netlify rollback
```

### Health Checks

```bash
# Script de health check
curl -f https://autorentar.com/api/health || exit 1

# Monitoreo de uptime
curl -I https://autorentar.com
```

---

## 📊 Supabase - Gestión de Base de Datos

### Migraciones

```bash
# Crear nueva migración
supabase migration new add_new_table

# Aplicar migraciones localmente
supabase db push

# Resetear base de datos local
supabase db reset

# Aplicar a producción (via CI/CD)
gh workflow run db-migrate.yml -f environment=production
```

### Backup y Restore

```bash
# Backup manual
supabase db dump -f backup.sql

# Restore desde backup
supabase db reset
psql -h db.xxx.supabase.co -U postgres -f backup.sql
```

### Monitoreo Supabase

```bash
# Ver logs en tiempo real
supabase functions logs --tail

# Estadísticas de uso
# Ver en: https://app.supabase.com/project/_/settings/database
```

---

## 🔍 Monitoreo y Observabilidad

### Métricas Clave

- **Uptime**: > 99.9%
- **Response Time**: < 200ms (p95)
- **Error Rate**: < 0.1%
- **Build Time**: < 5 minutos
- **Deploy Time**: < 3 minutos

### Herramientas de Monitoreo

```yaml
# Integración con Sentry (ejemplo)
- name: Sentry Release
  run: |
    npm install -g @sentry/cli
    sentry-cli releases new ${{ github.sha }}
    sentry-cli releases set-commits ${{ github.sha }} --auto
    sentry-cli releases finalize ${{ github.sha }}
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: autorentar
    SENTRY_PROJECT: frontend
```

### Alertas

```yaml
# Notificación de deployment exitoso
- name: Notify Slack
  if: success()
  uses: slackapi/slack-github-action@v1
  with:
    webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "✅ Deployment exitoso a producción",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "Deployment de *${{ github.sha }}* completado"
            }
          }
        ]
      }
```

---

## 🧪 Testing en CI/CD

### Unit Tests

```bash
# Ejecutar tests unitarios
npm run test:ci

# Con coverage
npm run test:coverage
```

### E2E Tests

```bash
# Ejecutar tests E2E con Playwright
npm run e2e

# En modo headless (CI)
npm run e2e:ci
```

### Integration Tests

```bash
# Tests de integración con Supabase
npm run test:integration
```

---

## 🔄 Estrategias de Deployment

### Blue-Green Deployment

```yaml
# Ejemplo conceptual
deploy:
  steps:
    - name: Deploy to green environment
      run: deploy_to_green.sh
    
    - name: Run smoke tests
      run: smoke_tests.sh
    
    - name: Switch traffic to green
      run: switch_traffic.sh
    
    - name: Keep blue for rollback
      run: keep_blue_standby.sh
```

### Canary Deployment

```yaml
# Deployment gradual
deploy:
  steps:
    - name: Deploy 10% traffic
      run: deploy_canary.sh 10
    
    - name: Monitor metrics
      run: sleep 300  # 5 minutos
    
    - name: Deploy 50% traffic
      run: deploy_canary.sh 50
    
    - name: Deploy 100% traffic
      run: deploy_canary.sh 100
```

---

## 📝 Scripts de Automatización

### `scripts/deploy.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Iniciando deployment..."

# Verificar branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo "❌ Solo se puede deployar desde main"
  exit 1
fi

# Build
npm run build:prod

# Tests
npm run test:ci

# Deploy
echo "✅ Deploying..."
# Agregar comando de deploy específico
```

### `scripts/check-env.sh`

```bash
#!/bin/bash
set -e

echo "🔍 Verificando variables de entorno..."

REQUIRED_VARS=(
  "SUPABASE_URL"
  "SUPABASE_ANON_KEY"
)

for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    echo "❌ Falta variable: $VAR"
    exit 1
  fi
done

echo "✅ Todas las variables están configuradas"
```

---

## 🛡️ Seguridad

### Checklist de Seguridad

- [ ] Secrets nunca en código
- [ ] Variables de entorno configuradas correctamente
- [ ] Dependencias actualizadas regularmente
- [ ] Scan de vulnerabilidades activado
- [ ] HTTPS enforced en producción
- [ ] Supabase RLS policies activas
- [ ] Rate limiting configurado
- [ ] CORS configurado correctamente
- [ ] Content Security Policy (CSP)
- [ ] Backups automáticos configurados

### Auditoría de Dependencias

```bash
# Audit npm
npm audit

# Fix automático
npm audit fix

# Ver detalles
npm audit --json
```

---

## 📚 Comandos Útiles para Copilot

### Cuando te pidan configurar CI/CD:

```bash
# Crear workflow básico
mkdir -p .github/workflows
# Luego crear archivo YAML con las tareas necesarias
```

### Cuando te pidan gestionar secrets:

```bash
# Listar secrets (requiere permisos)
gh secret list

# Agregar secret
gh secret set SECRET_NAME

# Eliminar secret
gh secret remove SECRET_NAME
```

### Cuando te pidan configurar ambientes:

```bash
# Crear environment en GitHub
gh api repos/:owner/:repo/environments/production -f wait_timer=5

# Ver environments
gh api repos/:owner/:repo/environments
```

### Cuando te pidan optimizar builds:

```bash
# Analizar bundle size
npm run build:prod -- --stats-json
npx webpack-bundle-analyzer dist/autorentar-app/stats.json

# Cache de node_modules en CI
# Agregar en workflow:
# - uses: actions/cache@v3
#   with:
#     path: ~/.npm
#     key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

---

## 🎯 Mejores Prácticas

### CI/CD
- ✅ Siempre hacer build en CI antes de merge
- ✅ Tests obligatorios en cada PR
- ✅ Lint y type-check automatizados
- ✅ Deploy solo desde ramas protegidas
- ✅ Rollback automático si tests post-deploy fallan
- ✅ Notificaciones de deployment

### Infraestructura
- ✅ Infraestructura como código (IaC)
- ✅ Environments separados (dev/staging/prod)
- ✅ Secrets rotativos periódicamente
- ✅ Monitoring y alertas configuradas
- ✅ Backups automáticos
- ✅ Disaster recovery plan documentado

### Supabase
- ✅ Migraciones versionadas
- ✅ RLS policies siempre activas
- ✅ Backup antes de cada migration en prod
- ✅ Edge Functions para lógica del servidor
- ✅ Storage policies configuradas
- ✅ Monitoring de queries lentas

---

## 🚨 Troubleshooting

### Build falla en CI

```bash
# Verificar dependencias
npm ci

# Limpiar cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Verificar versión de Node
node -v  # Debe ser 20.x
```

### Deploy falla

```bash
# Verificar secrets
gh secret list

# Ver logs del workflow
gh run view --log-failed

# Rollback manual
git revert HEAD
git push
```

### Supabase connection issues

```bash
# Verificar conectividad
curl -I $SUPABASE_URL

# Verificar credenciales
supabase projects list

# Reset local
supabase stop
supabase start
```

---

## 📖 Referencias

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Angular Deployment Guide](https://angular.dev/tools/cli/deployment)
- [TypeScript Best Practices](./TYPESCRIPT_GUIDELINES.md)

---

## 🤝 Contribución

Para contribuir a la infraestructura:

1. Crear branch desde `develop`
2. Modificar workflows en `.github/workflows/`
3. Probar localmente con `act` (GitHub Actions local runner)
4. Crear PR con descripción detallada
5. Esperar aprobación de DevOps team
6. Merge a `develop` primero, luego a `main`

---

**Última actualización**: 29 de Octubre 2025  
**Mantenido por**: DevOps Team @ AutoRentar
