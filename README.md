# 🚗 AutoRentar App

Plataforma web de renta de vehículos construida con Angular 18, TypeScript y Supabase.

[![CI Pipeline](https://github.com/ecucondorSA/autorentar-app/actions/workflows/ci-enhanced.yml/badge.svg)](https://github.com/ecucondorSA/autorentar-app/actions/workflows/ci-enhanced.yml)
[![Deployment](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-orange)](https://a83d39dd.autorentar.pages.dev)
[![codecov](https://codecov.io/gh/ecucondorSA/autorentar-app/branch/main/graph/badge.svg)](https://codecov.io/gh/ecucondorSA/autorentar-app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Angular](https://img.shields.io/badge/Angular-18-red)](https://angular.dev)
[![Tests](https://img.shields.io/badge/Tests-E2E%20%2B%20Unit-green)](https://github.com/ecucondorSA/autorentar-app/actions)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🚀 Quick Start

### Prerrequisitos
- Node.js 20.x
- npm 10.x
- Git

### Instalación

```bash
# Clonar repositorio
git clone <repository-url>
cd autorentar-app

# Instalar dependencias
npm ci

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Verificar ambiente
npm run deploy:check

# Iniciar servidor de desarrollo
npm start
```

La aplicación estará disponible en `http://localhost:4200/`

---

## 📦 Stack Tecnológico

- **Frontend:** Angular 18 (Standalone Components)
- **Lenguaje:** TypeScript 5.9
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Styling:** SCSS
- **Testing:** Jasmine + Karma, Playwright
- **CI/CD:** GitHub Actions
- **Hosting:** Cloudflare Pages
- **Code Quality:** ESLint, Prettier, Husky

---

## 🏗️ Estructura del Proyecto

```
autorentar-app/
├── .github/
│   ├── workflows/          # GitHub Actions (CI/CD)
│   ├── copilot-instructions.md
│   ├── CODEOWNERS
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/                   # Documentación
│   ├── CLOUDFLARE_DEPLOYMENT.md
│   ├── CLOUDFLARE_SETUP_CHECKLIST.md
│   ├── DEPLOYMENT.md
│   └── CI-CD-IMPLEMENTATION.md
├── scripts/                # Scripts de automatización
│   ├── setup-cloudflare.sh
│   ├── deploy.sh
│   ├── check-env.sh
│   ├── rollback.sh
│   └── health-check.sh
├── src/                    # Código fuente
│   ├── app/
│   ├── assets/
│   └── environments/
├── public/                 # Assets públicos
│   ├── _headers           # Cloudflare headers
│   └── _redirects         # Cloudflare redirects
├── e2e/                   # Tests E2E
├── angular.json           # Configuración Angular
├── package.json           # Dependencias
└── tsconfig.json          # Configuración TypeScript
```

---

## 🛠️ Scripts Disponibles

### Desarrollo
```bash
npm start              # Servidor de desarrollo
npm run watch          # Build con watch mode
npm run type-check     # Verificar tipos TypeScript
npm run lint           # Linter
npm run lint:fix       # Fix automático de linting
npm run format:check   # Verificar formato
npm run format:write   # Formatear código
```

### Build
```bash
npm run build          # Build desarrollo
npm run build:prod     # Build producción
npm run build:staging  # Build staging
```

### Testing
```bash
npm test               # Tests unitarios (watch)
npm run test:ci        # Tests unitarios (CI mode)
npm run test:coverage  # Tests con coverage
npm run e2e            # Tests E2E
npm run e2e:ci         # Tests E2E (CI mode)
```

### Deployment
```bash
npm run deploy:cloudflare  # Setup Cloudflare Pages
npm run deploy:check       # Verificar variables de entorno
npm run deploy:local       # Deploy preparation local
npm run health-check       # Health check del servidor
```

### Validación
```bash
npm run validate       # Lint + type-check + format
npm run ci:gates       # Validación completa para CI
```

---

## 🚀 CI/CD Pipeline

### Workflows Automáticos

#### CI Pipeline
- **Trigger:** Push/PR a `main` o `develop`
- **Ejecuta:** Lint, tests, type-check, build, E2E
- **Workflow:** `.github/workflows/ci.yml`

#### Deployment
- **Trigger:** Push a `main` o manual
- **Ejecuta:** Tests, build, deploy a Cloudflare Pages
- **Workflow:** `.github/workflows/deploy.yml`
- **Environments:** development, staging, production

#### Security Scan
- **Trigger:** Semanal, push a `main`, PRs
- **Ejecuta:** npm audit, dependency review, CodeQL
- **Workflow:** `.github/workflows/security.yml`

#### Release Management
- **Trigger:** Tags `v*.*.*`
- **Ejecuta:** Build, tests, changelog, GitHub Release
- **Workflow:** `.github/workflows/release.yml`

### Deployment Manual

```bash
# Via GitHub CLI
gh workflow run deploy.yml -f environment=production

# Via script local
./scripts/deploy.sh
```

---

## ☁️ Cloudflare Pages Setup

### Primera vez

```bash
# Ejecutar script de setup
npm run deploy:cloudflare

# O manualmente
./scripts/setup-cloudflare.sh
```

### Configuración Requerida

1. **GitHub Secrets:**
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_PROJECT_NAME`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

2. **GitHub Environments:**
   - `development`
   - `staging`
   - `production` (con required reviewers)

3. **Cloudflare Dashboard:**
   - Build command: `npm run build:prod`
   - Build output: `dist/autorentar-app/browser`

📖 **Guía completa:** `docs/CLOUDFLARE_DEPLOYMENT.md`

---

## 🗄️ Supabase Configuration

### Variables de Entorno

```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_PROJECT_REF=xxx
SUPABASE_ACCESS_TOKEN=xxx
SUPABASE_DB_PASSWORD=xxx
```

### Database Migrations

```bash
# Via GitHub Actions
gh workflow run db-migrate.yml -f environment=production -f migration_direction=up
```

---

## 🧪 Testing

### Unit Tests
```bash
npm test                 # Watch mode
npm run test:ci          # CI mode
npm run test:coverage    # Con coverage
```

### E2E Tests
```bash
npm run e2e              # Todos los navegadores
npm run e2e:ci           # Solo Chromium (CI)
npm run e2e:chromium     # Chromium
npm run e2e:firefox      # Firefox
npm run e2e:webkit       # WebKit
npm run e2e:ui           # UI mode
```

---

## 📝 Code Quality

### Linting & Formatting
- **ESLint:** Configuración strict con TypeScript
- **Prettier:** Formato consistente
- **Husky:** Pre-commit hooks
- **lint-staged:** Solo archivos modificados

### Type Safety
- TypeScript strict mode habilitado
- Type-check en CI
- Zod para validación en runtime

---

## 🔒 Seguridad

- ✅ Branch protection en `main`
- ✅ Required reviews antes de merge
- ✅ Security scanning automático
- ✅ Dependency review en PRs
- ✅ Secrets management via GitHub
- ✅ Security headers en Cloudflare
- ✅ CSP configurado

---

## 🤝 Contributing

1. Crear feature branch desde `develop`
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```

2. Hacer cambios y commits
   ```bash
   git add .
   git commit -m "feat: agregar nueva funcionalidad"
   ```

3. Push y crear PR
   ```bash
   git push origin feature/nueva-funcionalidad
   gh pr create
   ```

4. Esperar CI green ✅ y approval
5. Merge!

📖 **Guía de contribución:** `docs/DEPLOYMENT.md`

---

## 📚 Documentación

- 📘 [Deployment Guide](docs/DEPLOYMENT.md) - Guía general de deployment
- 📗 [Cloudflare Deployment](docs/CLOUDFLARE_DEPLOYMENT.md) - Configuración de Cloudflare Pages
- 📕 [Cloudflare Setup Checklist](docs/CLOUDFLARE_SETUP_CHECKLIST.md) - Checklist paso a paso
- 📙 [CI/CD Implementation](docs/CI-CD-IMPLEMENTATION.md) - Detalles de implementación
- 📓 [Copilot Instructions](.github/copilot-instructions.md) - Guía para GitHub Copilot
- 📖 [TypeScript Guidelines](TYPESCRIPT_GUIDELINES.md) - Mejores prácticas de TypeScript
- 📄 [Type Safety README](TYPE_SAFETY_README.md) - Type safety en el proyecto

---

## 🔗 Links Útiles

- **Production:** [autorentar.pages.dev](https://autorentar.pages.dev)
- **Staging:** [staging-autorentar.pages.dev](https://staging-autorentar.pages.dev)
- **Cloudflare Dashboard:** [dash.cloudflare.com](https://dash.cloudflare.com)
- **Supabase Dashboard:** [app.supabase.com](https://app.supabase.com)
- **GitHub Repository:** [GitHub](https://github.com)

---

## 📊 Status

| Feature | Status |
|---------|--------|
| CI Pipeline | ✅ Activo |
| Deployment (Cloudflare) | ✅ Configurado |
| Security Scanning | ✅ Activo |
| Type Safety | ✅ Strict mode |
| Testing | ✅ Unit + E2E |
| Documentation | ✅ Completa |

---

## 📞 Soporte

- **Issues:** [GitHub Issues](https://github.com)
- **Documentación:** `docs/`
- **DevOps Team:** Ver CODEOWNERS

---

## 📄 Licencia

[MIT License](LICENSE)

---

**🎉 Proyecto generado con Angular CLI 20.3.7**
