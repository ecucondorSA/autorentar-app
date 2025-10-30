#!/bin/bash
# Script para iniciar el servidor de desarrollo de AutoRentar
# Uso: ./start-dev.sh o bash start-dev.sh

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Asegurar que estamos en el directorio correcto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  AutoRentar - Servidor de Desarrollo${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Directorio de trabajo:${NC} $SCRIPT_DIR"
echo ""

# Verificar que existe package.json
if [ ! -f "package.json" ]; then
    echo -e "${RED}ERROR: No se encontró package.json${NC}"
    echo "Asegúrate de estar en el directorio correcto"
    exit 1
fi

# Verificar que existe node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}No se encontró node_modules. Instalando dependencias...${NC}"
    npm install
fi

# Iniciar el servidor de desarrollo
echo -e "${GREEN}Iniciando servidor de desarrollo...${NC}"
echo -e "${GREEN}Servidor disponible en: http://localhost:4200/${NC}"
echo ""

npm start
