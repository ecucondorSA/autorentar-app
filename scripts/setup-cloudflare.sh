#!/bin/bash
set -e

echo "🔧 Configurando Cloudflare Pages para AutoRentar..."

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Cloudflare Pages Setup - AutoRentar                 ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Paso 1: Verificar si gh CLI está instalado
echo -e "${YELLOW}1️⃣  Verificando GitHub CLI...${NC}"
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI no está instalado${NC}"
    echo "Instálalo desde: https://cli.github.com/"
    exit 1
fi
echo -e "${GREEN}✅ GitHub CLI instalado${NC}"
echo ""

# Paso 2: Instrucciones para obtener Cloudflare API Token
echo -e "${YELLOW}2️⃣  Necesitamos configurar Cloudflare API Token${NC}"
echo ""
echo "Sigue estos pasos:"
echo "1. Ve a: https://dash.cloudflare.com/profile/api-tokens"
echo "2. Click en 'Create Token'"
echo "3. Usa el template 'Edit Cloudflare Workers'"
echo "4. O crea un token personalizado con permisos:"
echo "   - Account > Cloudflare Pages > Edit"
echo "5. Copia el token generado"
echo ""
read -p "¿Ya tienes el API Token? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Por favor, crea el API Token y vuelve a ejecutar este script${NC}"
    exit 0
fi

# Paso 3: Solicitar datos de Cloudflare
echo ""
echo -e "${YELLOW}3️⃣  Configurando secrets de Cloudflare...${NC}"
echo ""

read -p "Cloudflare API Token: " CLOUDFLARE_API_TOKEN
read -p "Cloudflare Account ID: " CLOUDFLARE_ACCOUNT_ID
read -p "Cloudflare Project Name (autorentar): " CLOUDFLARE_PROJECT_NAME
CLOUDFLARE_PROJECT_NAME=${CLOUDFLARE_PROJECT_NAME:-autorentar}

# Paso 4: Configurar GitHub Secrets
echo ""
echo -e "${YELLOW}4️⃣  Guardando secrets en GitHub...${NC}"

gh secret set CLOUDFLARE_API_TOKEN -b "$CLOUDFLARE_API_TOKEN"
echo -e "${GREEN}✅ CLOUDFLARE_API_TOKEN configurado${NC}"

gh secret set CLOUDFLARE_ACCOUNT_ID -b "$CLOUDFLARE_ACCOUNT_ID"
echo -e "${GREEN}✅ CLOUDFLARE_ACCOUNT_ID configurado${NC}"

gh secret set CLOUDFLARE_PROJECT_NAME -b "$CLOUDFLARE_PROJECT_NAME"
echo -e "${GREEN}✅ CLOUDFLARE_PROJECT_NAME configurado${NC}"

# Paso 5: Verificar secrets
echo ""
echo -e "${YELLOW}5️⃣  Verificando secrets configurados...${NC}"
gh secret list
echo ""

# Paso 6: Crear proyecto en Cloudflare
echo -e "${YELLOW}6️⃣  Configuración de Cloudflare Pages${NC}"
echo ""
echo "Ahora ve a Cloudflare Dashboard:"
echo "1. Ve a: https://dash.cloudflare.com/"
echo "2. Workers & Pages → Create application → Pages → Connect to Git"
echo "3. Conecta tu repositorio de GitHub"
echo "4. Configuración del build:"
echo "   - Framework preset: Angular"
echo "   - Build command: npm run build:prod"
echo "   - Build output directory: dist/autorentar-app/browser"
echo "5. Variables de entorno:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_ANON_KEY"
echo ""

# Paso 7: Configurar variables de Supabase
echo -e "${YELLOW}7️⃣  ¿Ya configuraste las variables de Supabase en GitHub? (y/n)${NC}"
read -p "> " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}✅ Excelente!${NC}"
else
    echo ""
    echo "Configúralas con:"
    echo "gh secret set SUPABASE_URL -b \"https://xxx.supabase.co\""
    echo "gh secret set SUPABASE_ANON_KEY -b \"eyJhbGc...\""
    echo "gh secret set SUPABASE_PROJECT_REF -b \"xxx\""
    echo "gh secret set SUPABASE_ACCESS_TOKEN -b \"xxx\""
    echo "gh secret set SUPABASE_DB_PASSWORD -b \"xxx\""
fi

# Resumen
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  ✅ CONFIGURACIÓN COMPLETA                   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Secrets configurados en GitHub:${NC}"
echo "✓ CLOUDFLARE_API_TOKEN"
echo "✓ CLOUDFLARE_ACCOUNT_ID"
echo "✓ CLOUDFLARE_PROJECT_NAME"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "1. Termina la configuración en Cloudflare Dashboard"
echo "2. Crea los GitHub Environments (development, staging, production)"
echo "3. Prueba el deployment:"
echo "   git checkout -b test/deployment"
echo "   git commit --allow-empty -m 'test: deployment to Cloudflare'"
echo "   git push origin test/deployment"
echo "4. Crea un PR y verifica que el CI pase"
echo "5. Merge a main para deployment automático"
echo ""
echo -e "${GREEN}🎉 ¡Todo listo para deployar a Cloudflare Pages!${NC}"
