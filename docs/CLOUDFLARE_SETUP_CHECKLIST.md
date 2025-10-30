# ☁️ Cloudflare Pages - Setup Checklist

**Proyecto:** AutoRentar  
**Hosting:** Cloudflare Pages  
**Fecha:** 29 de Octubre 2025

---

## 📋 Checklist de Configuración

### ✅ Paso 1: Preparar Credenciales de Cloudflare

- [ ] **Obtener API Token:**
  1. Ve a: https://dash.cloudflare.com/profile/api-tokens
  2. Click en "Create Token"
  3. Usa template "Edit Cloudflare Workers" o personalizado
  4. Permisos: Account → Cloudflare Pages → Edit
  5. Copia el token

- [ ] **Obtener Account ID:**
  1. Ve a: https://dash.cloudflare.com/
  2. Selecciona tu cuenta
  3. Copia el "Account ID" de la barra lateral

### ✅ Paso 2: Configurar GitHub Secrets

#### Opción A: Automática (Recomendado)
```bash
cd /home/edu/Documentos/AUTORENTAR/autorentar-app
./scripts/setup-cloudflare.sh
```

#### Opción B: Manual
```bash
# Cloudflare
gh secret set CLOUDFLARE_API_TOKEN -b "tu-api-token"
gh secret set CLOUDFLARE_ACCOUNT_ID -b "tu-account-id"
gh secret set CLOUDFLARE_PROJECT_NAME -b "autorentar"

# Supabase (si aún no están)
gh secret set SUPABASE_URL -b "https://xxx.supabase.co"
gh secret set SUPABASE_ANON_KEY -b "eyJhbGc..."
gh secret set SUPABASE_PROJECT_REF -b "xxx"
gh secret set SUPABASE_ACCESS_TOKEN -b "xxx"
gh secret set SUPABASE_DB_PASSWORD -b "xxx"
```

- [ ] Secrets de Cloudflare configurados
- [ ] Secrets de Supabase configurados
- [ ] Verificado con: `gh secret list`

### ✅ Paso 3: Crear Proyecto en Cloudflare Pages

- [ ] **Ir a Cloudflare Dashboard:**
  - URL: https://dash.cloudflare.com/

- [ ] **Crear proyecto Pages:**
  1. Workers & Pages → Create application → Pages
  2. Connect to Git → Selecciona repositorio
  3. **Build settings:**
     - Framework: Angular
     - Build command: `npm run build:prod`
     - Build output: `dist/autorentar-app/browser`
     - Root directory: `/`

- [ ] **Variables de entorno en Cloudflare:**
  - `NODE_VERSION`: `20`
  - `SUPABASE_URL`: Tu URL de Supabase
  - `SUPABASE_ANON_KEY`: Tu clave anónima

- [ ] Click en "Save and Deploy"
- [ ] Esperar primer deployment (5-10 min)
- [ ] Verificar que el sitio funcione

### ✅ Paso 4: Configurar GitHub Environments

```bash
# Via GitHub UI: Settings → Environments → New environment
```

- [ ] **Environment: development**
  - Variables de Supabase de desarrollo
  
- [ ] **Environment: staging**
  - Variables de Supabase de staging
  
- [ ] **Environment: production**
  - Variables de Supabase de producción
  - ✅ Habilitar "Required reviewers"
  - ✅ Agregar reviewers

### ✅ Paso 5: Configurar Branch Protection

```bash
# Via GitHub UI: Settings → Branches → Add rule
```

- [ ] **Regla para branch `main`:**
  - ✅ Require pull request before merging
  - ✅ Require approvals (1 mínimo)
  - ✅ Require status checks to pass
    - ✅ Lint & Test
    - ✅ E2E Tests
  - ✅ Require branches to be up to date
  - ✅ Do not allow bypassing

### ✅ Paso 6: Configurar Custom Domain (Opcional)

- [ ] **En Cloudflare Pages:**
  1. Tu proyecto → Custom domains
  2. Set up a custom domain
  3. Ingresa: `autorentar.com`
  4. Cloudflare configura DNS automáticamente
  5. Esperar certificado SSL (5-10 min)

- [ ] **Subdominios adicionales:**
  - `staging.autorentar.com` → branch staging
  - `dev.autorentar.com` → branch develop

### ✅ Paso 7: Probar CI/CD Pipeline

#### Test 1: CI Pipeline
```bash
cd /home/edu/Documentos/AUTORENTAR/autorentar-app

# Crear branch de test
git checkout -b test/ci-pipeline

# Commit vacío para trigger CI
git commit --allow-empty -m "test: verificar CI pipeline"

# Push
git push origin test/ci-pipeline
```

- [ ] CI pipeline ejecutado
- [ ] Todos los checks pasaron (lint, test, build)
- [ ] Revisar logs en GitHub Actions

#### Test 2: Deployment Pipeline
```bash
# Crear PR
gh pr create --title "Test: CI/CD Pipeline" --body "Testing deployment"

# Esperar CI green
# Merge a develop (o main según tu workflow)
gh pr merge --squash

# Verificar deployment
gh run list --workflow=deploy.yml
gh run view --log
```

- [ ] Deployment exitoso a Cloudflare
- [ ] Sitio accesible en URL de Cloudflare
- [ ] Sin errores en consola del navegador

#### Test 3: Rollback
```bash
# Probar script de rollback
./scripts/rollback.sh HEAD~1

# Verificar cambios
git status
```

- [ ] Script de rollback funciona
- [ ] Proceso de rollback entendido

### ✅ Paso 8: Verificar Funcionalidades

- [ ] **Homepage carga correctamente**
- [ ] **Rutas de Angular funcionan** (sin 404)
- [ ] **Conexión a Supabase funciona**
- [ ] **Assets se cargan correctamente**
- [ ] **Sin errores en consola**
- [ ] **Headers de seguridad aplicados**
- [ ] **Cache funcionando correctamente**

### ✅ Paso 9: Monitoreo y Performance

- [ ] **Cloudflare Analytics:**
  - Workers & Pages → Tu proyecto → Analytics
  - Verificar requests, bandwidth, etc.

- [ ] **Performance:**
  - Lighthouse audit: https://pagespeed.web.dev/
  - Core Web Vitals aceptables
  - Bundle size optimizado

- [ ] **GitHub Actions:**
  - Workflows ejecutándose sin errores
  - Notifications configuradas (si aplica)

### ✅ Paso 10: Documentación Final

- [ ] **Actualizar README.md** con:
  - URL de producción
  - URL de staging
  - Comandos de deployment
  - Contactos del equipo

- [ ] **Documentar ambiente local:**
  - Copiar `.env.example` a `.env`
  - Configurar variables locales
  - Documentar en README

---

## 🎯 Verificación Final

```bash
# Verificar estructura
tree .github/ scripts/ docs/ public/ -L 2

# Verificar secrets
gh secret list

# Verificar workflows
gh workflow list

# Verificar último deployment
gh run list --workflow=deploy.yml --limit 5

# Health check
npm run health-check https://autorentar.pages.dev
```

---

## 🚀 Comandos Rápidos

```bash
# Setup completo de Cloudflare
npm run deploy:cloudflare

# Verificar ambiente local
npm run deploy:check

# Build local
npm run build:prod

# Preview local
npx http-server dist/autorentar-app/browser -p 8080

# Deploy manual a production
gh workflow run deploy.yml -f environment=production

# Deploy manual a staging
gh workflow run deploy.yml -f environment=staging

# Ver logs de deployment
gh run view --log

# Rollback
./scripts/rollback.sh <commit-sha>
```

---

## 📊 Estado Actual

| Item | Estado | Notas |
|------|--------|-------|
| Workflows GitHub Actions | ✅ | 5 workflows creados |
| Scripts de automatización | ✅ | 5 scripts listos |
| Documentación | ✅ | 5 documentos creados |
| Cloudflare setup script | ✅ | Listo para ejecutar |
| Headers y redirects | ✅ | Configurados |
| Deployment configurado | ✅ | Ready |
| Secrets GitHub | ⏳ | Pendiente configurar |
| Environments GitHub | ⏳ | Pendiente crear |
| Proyecto Cloudflare | ⏳ | Pendiente crear |
| Custom domain | ⏳ | Opcional |

---

## 📝 Notas Importantes

### Costos
- **Cloudflare Pages Free Tier:**
  - 500 builds/mes - ✅ Gratis
  - Unlimited requests - ✅ Gratis
  - Unlimited bandwidth - ✅ Gratis
  - Custom domains - ✅ Gratis
  - SSL certificates - ✅ Gratis

### Performance
- **CDN Global:** 300+ data centers
- **HTTP/3:** Habilitado automáticamente
- **Brotli:** Compresión automática
- **DDoS Protection:** Incluido

### Seguridad
- ✅ Headers de seguridad configurados
- ✅ SSL/TLS automático
- ✅ Secrets nunca en código
- ✅ Branch protection habilitado
- ✅ Required reviews en production

---

## 🆘 Ayuda

Si encuentras problemas:

1. **Revisa documentación:**
   - `docs/CLOUDFLARE_DEPLOYMENT.md`
   - `docs/DEPLOYMENT.md`
   - `.github/copilot-instructions.md`

2. **Verifica logs:**
   ```bash
   gh run view --log
   ```

3. **Test local:**
   ```bash
   npm run build:prod
   npx http-server dist/autorentar-app/browser -p 8080
   ```

4. **Cloudflare Status:**
   - https://www.cloudflarestatus.com/

---

**✅ Siguiente paso:** Ejecutar `./scripts/setup-cloudflare.sh`
