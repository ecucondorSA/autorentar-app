#!/bin/bash
set -e

echo "🔍 Verificando variables de entorno para AutoRentar..."

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Variables requeridas
REQUIRED_VARS=(
  "SUPABASE_URL"
  "SUPABASE_ANON_KEY"
)

# Variables opcionales
OPTIONAL_VARS=(
  "SUPABASE_SERVICE_ROLE_KEY"
  "SENTRY_DSN"
  "VERCEL_TOKEN"
  "NETLIFY_AUTH_TOKEN"
)

# Verificar variables requeridas
echo "📋 Verificando variables requeridas..."
MISSING_REQUIRED=0

for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    echo -e "${RED}❌ Falta variable requerida: $VAR${NC}"
    MISSING_REQUIRED=1
  else
    echo -e "${GREEN}✅ $VAR configurada${NC}"
  fi
done

# Verificar variables opcionales
echo ""
echo "📋 Verificando variables opcionales..."
for VAR in "${OPTIONAL_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    echo -e "${YELLOW}⚠️  Variable opcional no configurada: $VAR${NC}"
  else
    echo -e "${GREEN}✅ $VAR configurada${NC}"
  fi
done

# Verificar archivo .env
echo ""
echo "📋 Verificando archivos de configuración..."
if [ -f ".env" ]; then
  echo -e "${GREEN}✅ .env encontrado${NC}"
else
  echo -e "${YELLOW}⚠️  .env no encontrado (puede ser normal en CI/CD)${NC}"
fi

if [ -f ".env.local" ]; then
  echo -e "${GREEN}✅ .env.local encontrado${NC}"
else
  echo -e "${YELLOW}⚠️  .env.local no encontrado${NC}"
fi

# Resultado final
echo ""
if [ $MISSING_REQUIRED -eq 1 ]; then
  echo -e "${RED}❌ Faltan variables requeridas. Por favor configúrelas antes de continuar.${NC}"
  echo ""
  echo "Para configurar variables localmente, crea un archivo .env con:"
  echo "SUPABASE_URL=https://xxx.supabase.co"
  echo "SUPABASE_ANON_KEY=eyJhbGc..."
  exit 1
else
  echo -e "${GREEN}✅ Todas las variables requeridas están configuradas${NC}"
  exit 0
fi
