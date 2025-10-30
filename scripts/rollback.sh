#!/bin/bash
set -e

echo "🔄 Preparando rollback de AutoRentar..."

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar argumentos
if [ $# -eq 0 ]; then
  echo -e "${YELLOW}Uso: $0 <commit-sha o tag>${NC}"
  echo ""
  echo "Ejemplos:"
  echo "  $0 abc123                    # Rollback a commit específico"
  echo "  $0 v1.0.0                    # Rollback a tag"
  echo "  $0 HEAD~1                    # Rollback al commit anterior"
  echo ""
  echo "Últimos tags disponibles:"
  git tag -l --sort=-v:refname | head -5
  exit 1
fi

TARGET=$1

# Verificar que el target existe
if ! git rev-parse "$TARGET" >/dev/null 2>&1; then
  echo -e "${RED}❌ El commit o tag '$TARGET' no existe${NC}"
  exit 1
fi

echo -e "${YELLOW}⚠️  ADVERTENCIA: Esto creará un revert commit${NC}"
echo "Target: $TARGET"
echo ""
read -p "¿Estás seguro de continuar? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Rollback cancelado${NC}"
  exit 0
fi

# Obtener el commit SHA
TARGET_SHA=$(git rev-parse "$TARGET")
echo "🔄 Rollback a: $TARGET_SHA"

# Crear un revert commit
echo "📝 Creando revert commit..."
git revert --no-commit "$TARGET_SHA"..HEAD

# Verificar el estado
if [[ -n $(git status -s) ]]; then
  echo ""
  echo -e "${GREEN}✅ Cambios preparados para rollback${NC}"
  echo ""
  echo "Archivos afectados:"
  git status -s
  echo ""
  echo "Para completar el rollback:"
  echo "1. Revisar los cambios: git diff --staged"
  echo "2. Commit: git commit -m 'Rollback to $TARGET'"
  echo "3. Push: git push origin main"
else
  echo -e "${YELLOW}⚠️  No hay cambios para hacer rollback${NC}"
fi
