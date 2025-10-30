#!/bin/bash
set -e

echo "🚀 Iniciando deployment de AutoRentar..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que estamos en la rama correcta
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo -e "${RED}❌ Solo se puede deployar desde la rama 'main'${NC}"
  echo -e "${YELLOW}⚠️  Rama actual: $BRANCH${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Rama verificada: $BRANCH${NC}"

# Verificar que no hay cambios sin commitear
if [[ -n $(git status -s) ]]; then
  echo -e "${RED}❌ Hay cambios sin commitear${NC}"
  git status -s
  exit 1
fi

echo -e "${GREEN}✅ Working directory limpio${NC}"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm ci

# Ejecutar linter
echo "🔍 Ejecutando linter..."
npm run lint

# Ejecutar type check
echo "🔍 Ejecutando type check..."
npm run type-check

# Ejecutar tests
echo "🧪 Ejecutando tests..."
npm run test:ci

# Build para producción
echo "🏗️  Building para producción..."
npm run build

echo -e "${GREEN}✅ Build completado exitosamente${NC}"

# Crear tag de deployment
DEPLOY_TAG="deploy-$(date +%Y%m%d-%H%M%S)"
echo "🏷️  Creando tag de deployment: $DEPLOY_TAG"
git tag -a "$DEPLOY_TAG" -m "Deployment $(date)"

echo ""
echo -e "${GREEN}✅ Deployment preparado exitosamente!${NC}"
echo ""
echo "Próximos pasos:"
echo "1. Verificar el build en dist/"
echo "2. Ejecutar: git push origin $DEPLOY_TAG"
echo "3. El workflow de GitHub Actions se encargará del resto"
echo ""
