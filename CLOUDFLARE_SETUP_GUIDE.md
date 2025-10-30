# ☁️ Guía Rápida: Setup Cloudflare Pages

**Tiempo estimado:** 10-15 minutos

---

## 🎯 Objetivo

Configurar deployment automático de AutoRentar a Cloudflare Pages con GitHub Actions.

---

## ✅ Pre-requisitos

- [ ] Cuenta de Cloudflare (gratuita)
- [ ] Cuenta de GitHub con el repositorio AutoRentar
- [ ] GitHub CLI instalado (`gh --version`)
- [ ] Acceso de administrador al repositorio

---

## 🚀 Pasos

### 1️⃣ Obtener Credenciales de Cloudflare (5 min)

#### API Token
1. Abre: https://dash.cloudflare.com/profile/api-tokens
2. **Create Token**
3. Usa template **"Edit Cloudflare Workers"**
4. **Copia el token** (¡solo se muestra una vez!)

#### Account ID
1. Abre: https://dash.cloudflare.com/
2. Encuentra **"Account ID"** en la sidebar derecha
3. Cópialo

---

### 2️⃣ Ejecutar Script de Setup (2 min)

```bash
cd /home/edu/Documentos/AUTORENTAR/autorentar-app
./scripts/setup-cloudflare.sh
```

El script te pedirá:
- ✅ API Token (del paso 1)
- ✅ Account ID (del paso 1)
- ✅ Project Name (usa: `autorentar`)

---

### 3️⃣ Crear Proyecto en Cloudflare (5 min)

1. Abre: https://dash.cloudflare.com/
2. **Workers & Pages** → **Create application** → **Pages**
3. **Connect to Git** → Selecciona tu repositorio de GitHub
4. Configurar build:

```
Framework preset:      Angular
Build command:         npm run build:prod
Build output:          dist/autorentar-app/browser
Root directory:        /
```

5. **Environment variables:**
```
NODE_VERSION:          20
SUPABASE_URL:          https://xxx.supabase.co
SUPABASE_ANON_KEY:     eyJhbGc...
```

6. **Save and Deploy**

---

### 4️⃣ Crear GitHub Environments (3 min)

1. Ve a tu repositorio en GitHub
2. **Settings** → **Environments** → **New environment**
3. Crea estos environments:
   - `development`
   - `staging`
   - `production`

4. Para `production`:
   - ✅ Habilita **"Required reviewers"**
   - ✅ Agrega tu usuario como reviewer

---

### 5️⃣ Probar Deployment (5 min)

```bash
# Crear branch de test
git checkout -b test/cloudflare

# Commit vacío
git commit --allow-empty -m "test: Cloudflare deployment"

# Push
git push origin test/cloudflare

# Crear PR
gh pr create --title "Test Cloudflare Deployment" --body "Testing deployment"

# Verificar CI
gh run list --workflow=ci.yml

# Si CI pasa, merge
gh pr merge --squash

# Verificar deployment
gh run list --workflow=deploy.yml
gh run view --log
```

---

## ✅ Verificación

### Checklist Final

- [ ] Cloudflare API Token configurado en GitHub Secrets
- [ ] Account ID configurado en GitHub Secrets
- [ ] Project Name configurado en GitHub Secrets
- [ ] Variables de Supabase configuradas
- [ ] Proyecto creado en Cloudflare Dashboard
- [ ] Environments creados en GitHub
- [ ] Branch protection configurado en `main`
- [ ] CI pipeline ejecutándose correctamente
- [ ] Deployment exitoso
- [ ] Sitio accesible en Cloudflare URL

### URLs para verificar

```bash
# Ver secrets configurados
gh secret list

# Ver workflows
gh workflow list

# Ver último deployment
gh run list --workflow=deploy.yml --limit 5

# Ver logs
gh run view --log
```

---

## 🌐 Resultados

Después del setup, tendrás:

✅ **URL de Production:** `https://autorentar.pages.dev`  
✅ **URL de Staging:** `https://staging-autorentar.pages.dev` (si configuraste)  
✅ **Deployment automático:** Push a `main` = Deploy a producción  
✅ **Preview deployments:** Cada PR tiene su preview  
✅ **SSL/TLS:** Certificado automático gratuito  
✅ **CDN Global:** 300+ data centers  

---

## 🆘 Troubleshooting

### Error: "API Token inválido"
```bash
# Verifica que copiaste el token completo
# Genera uno nuevo si es necesario
gh secret set CLOUDFLARE_API_TOKEN
```

### Error: "Build failed"
```bash
# Prueba el build localmente
npm ci
npm run build:prod

# Verifica que dist/autorentar-app/browser existe
ls -la dist/autorentar-app/browser
```

### Error: "404 en rutas de Angular"
- Verifica que `public/_redirects` existe
- Debe contener: `/*    /index.html   200`

### No se ven las variables de entorno
- Configúralas en Cloudflare Dashboard
- Workers & Pages → Tu proyecto → Settings → Environment variables

---

## 📚 Documentación Completa

Para más detalles, revisa:

- 📘 `docs/CLOUDFLARE_DEPLOYMENT.md` - Guía completa
- 📗 `docs/CLOUDFLARE_SETUP_CHECKLIST.md` - Checklist detallado
- 📕 `docs/DEPLOYMENT.md` - Deployment general
- 📙 `README.md` - Información del proyecto

---

## 💡 Próximos Pasos

Después del setup básico:

1. **Configurar Custom Domain:**
   - Cloudflare Pages → Custom domains
   - Agrega tu dominio

2. **Configurar Monitoring:**
   - Cloudflare Analytics
   - Sentry para errors
   - Uptime monitoring

3. **Optimizar Performance:**
   - Revisar bundle size
   - Configurar caching
   - Lighthouse audit

---

## 🎉 ¡Listo!

Tu aplicación está ahora deployada en Cloudflare Pages con CI/CD automático.

Cada push a `main` desplegará automáticamente a producción. 🚀

---

**¿Necesitas ayuda?** Abre un issue en GitHub o revisa la documentación completa.
