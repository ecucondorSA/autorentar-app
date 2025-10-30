# 🌥️ Cloudflare Pages Deployment Guide - AutoRentar

## Configuración Inicial

### 1. Obtener credenciales de Cloudflare

#### API Token
1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click en **"Create Token"**
3. Selecciona el template **"Edit Cloudflare Workers"** o crea uno personalizado
4. Permisos necesarios:
   - Account → Cloudflare Pages → Edit
   - Account → Account Settings → Read
5. Click en **"Continue to summary"** → **"Create Token"**
6. **Copia el token** (solo se muestra una vez)

#### Account ID
1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Selecciona tu cuenta
3. En la barra lateral derecha verás **"Account ID"**
4. Copia el ID

### 2. Configurar GitHub Secrets

#### Opción A: Usar el script de setup (Recomendado)
```bash
./scripts/setup-cloudflare.sh
```

#### Opción B: Configuración manual
```bash
# Cloudflare credentials
gh secret set CLOUDFLARE_API_TOKEN -b "your-api-token"
gh secret set CLOUDFLARE_ACCOUNT_ID -b "your-account-id"
gh secret set CLOUDFLARE_PROJECT_NAME -b "autorentar"

# Supabase credentials (si aún no están configuradas)
gh secret set SUPABASE_URL -b "https://xxx.supabase.co"
gh secret set SUPABASE_ANON_KEY -b "eyJhbGc..."
gh secret set SUPABASE_PROJECT_REF -b "xxx"
gh secret set SUPABASE_ACCESS_TOKEN -b "xxx"
gh secret set SUPABASE_DB_PASSWORD -b "xxx"
```

#### Verificar secrets
```bash
gh secret list
```

### 3. Crear proyecto en Cloudflare Pages

#### Opción A: Conectar con Git (Recomendado para deployments automáticos)
1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. **Workers & Pages** → **Create application** → **Pages**
3. **Connect to Git** → Selecciona tu repositorio
4. Configuración del build:
   ```
   Framework preset: Angular
   Build command: npm run build:prod
   Build output directory: dist/autorentar-app/browser
   Root directory: /
   ```
5. **Variables de entorno:**
   - `NODE_VERSION`: `20`
   - `SUPABASE_URL`: Tu URL de Supabase
   - `SUPABASE_ANON_KEY`: Tu clave anónima de Supabase

6. Click en **"Save and Deploy"**

#### Opción B: Deploy directo (vía GitHub Actions)
El workflow `.github/workflows/deploy.yml` ya está configurado para deployar automáticamente.

### 4. Crear GitHub Environments

```bash
# Via GitHub UI
# Settings → Environments → New environment

# Crear estos environments:
# - development
# - staging  
# - production (con "Required reviewers" habilitado)
```

Para cada environment, configura las variables específicas:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Estructura de Build

### Angular Build Output
```
dist/
└── autorentar-app/
    └── browser/          ← Este es el directorio que se despliega
        ├── index.html
        ├── main-*.js
        ├── polyfills-*.js
        ├── styles-*.css
        └── assets/
```

### Cloudflare Pages Configuration

El archivo `wrangler.toml` no es necesario, pero puedes crearlo para configuraciones avanzadas.

## Workflow de Deployment

### 1. Deployment Automático (Push a main)
```bash
git checkout main
git merge develop
git push origin main
```
→ Se activa automáticamente el workflow de deploy

### 2. Deployment Manual
```bash
# Via GitHub UI
Actions → Deploy to Production → Run workflow
→ Selecciona environment

# Via GitHub CLI
gh workflow run deploy.yml -f environment=production
```

### 3. Deployment a Staging
```bash
# Via GitHub UI
Actions → Deploy to Production → Run workflow
→ Selecciona "staging"

# Via GitHub CLI
gh workflow run deploy.yml -f environment=staging
```

## Configuración de Dominios

### Custom Domain en Cloudflare Pages

1. Ve a tu proyecto en Cloudflare Pages
2. **Custom domains** → **Set up a custom domain**
3. Ingresa tu dominio (ej: `autorentar.com`)
4. Cloudflare configurará automáticamente los DNS
5. Espera a que se emita el certificado SSL (automático)

### Subdominios para Environments

Configuración recomendada:
- **Production:** `autorentar.com` o `www.autorentar.com`
- **Staging:** `staging.autorentar.com`
- **Development:** `dev.autorentar.com`

## Variables de Entorno por Environment

### Production
```bash
NODE_VERSION=20
SUPABASE_URL=https://prod.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...prod...
```

### Staging
```bash
NODE_VERSION=20
SUPABASE_URL=https://staging.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...staging...
```

### Development
```bash
NODE_VERSION=20
SUPABASE_URL=https://dev.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...dev...
```

## Monitoreo y Logs

### Ver deployments
```bash
# En Cloudflare Dashboard
Workers & Pages → Tu proyecto → Deployments
```

### Ver logs de build
```bash
# En GitHub Actions
gh run list --workflow=deploy.yml
gh run view --log
```

### Rollback
```bash
# Opción 1: En Cloudflare Dashboard
Workers & Pages → Deployments → Selecciona deployment anterior → Rollback

# Opción 2: Via script
./scripts/rollback.sh <commit-sha>
git push origin main
```

## Optimizaciones para Cloudflare Pages

### Headers personalizados
Crea `public/_headers`:
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable
```

### Redirects
Crea `public/_redirects`:
```
# Redirect all to index.html for Angular routing
/*    /index.html   200

# Redirect www to non-www (o viceversa)
https://www.autorentar.com/*  https://autorentar.com/:splat  301!
```

### SPA Routing
Cloudflare Pages detecta automáticamente Angular, pero asegúrate de tener configurado:

En `angular.json`:
```json
{
  "outputPath": "dist/autorentar-app",
  "index": "src/index.html"
}
```

## Performance

### Características automáticas de Cloudflare
✅ **CDN Global** - 300+ data centers
✅ **HTTP/3** - Habilitado por defecto
✅ **Brotli Compression** - Habilitado por defecto
✅ **Automatic minification** - HTML, CSS, JS
✅ **DDoS Protection** - Incluido
✅ **SSL/TLS** - Certificado gratis

### Build optimizations
Ya configurado en `angular.json`:
```json
{
  "optimization": true,
  "sourceMap": false,
  "namedChunks": false,
  "extractLicenses": true,
  "outputHashing": "all"
}
```

## Troubleshooting

### Build falla en Cloudflare
```bash
# Verifica localmente primero
npm ci
npm run build:prod

# Verifica que dist/autorentar-app/browser existe
ls -la dist/autorentar-app/browser
```

### 404 en rutas de Angular
Asegúrate de tener `_redirects` configurado:
```
/*    /index.html   200
```

### Variables de entorno no funcionan
- Las variables deben estar en Cloudflare Dashboard
- O configuradas como secrets en GitHub
- No uses archivos .env en el build

### Deployment tarda mucho
- Primera vez puede tardar 5-10 minutos
- Deployments subsecuentes: 2-3 minutos
- Verifica el tamaño del bundle

## Comandos Útiles

```bash
# Setup completo
./scripts/setup-cloudflare.sh

# Build local
npm run build:prod

# Preview local del build
npx http-server dist/autorentar-app/browser -p 8080

# Deploy manual
gh workflow run deploy.yml -f environment=production

# Ver status
gh run list --workflow=deploy.yml

# Ver logs
gh run view --log

# Rollback
./scripts/rollback.sh HEAD~1
```

## Costos

Cloudflare Pages - Free Tier:
- ✅ **500 builds/mes** - Gratis
- ✅ **Unlimited requests** - Gratis
- ✅ **Unlimited bandwidth** - Gratis
- ✅ **Custom domains** - Gratis
- ✅ **SSL certificates** - Gratis
- ✅ **DDoS protection** - Gratis

Para más builds: $5/mes por 5000 builds adicionales

## Mejores Prácticas

1. **Branch Protection**: Habilita en GitHub para main
2. **Required Reviews**: Configura en production environment
3. **Staging First**: Siempre prueba en staging primero
4. **Monitor Performance**: Usa Cloudflare Analytics
5. **Keep Dependencies Updated**: Ejecuta `npm audit` regularmente
6. **Use Environment Variables**: No hardcodees credenciales
7. **Enable Caching**: Usa los headers recomendados
8. **Test Locally**: Siempre prueba builds localmente primero

## Links Útiles

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare Dashboard](https://dash.cloudflare.com/)
- [Cloudflare Status](https://www.cloudflarestatus.com/)
- [Angular Deployment Guide](https://angular.dev/tools/cli/deployment)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

**¿Necesitas ayuda?** Revisa la documentación completa en `docs/DEPLOYMENT.md`
