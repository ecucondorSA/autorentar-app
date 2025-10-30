#!/bin/bash
set -e

echo "🏥 Health check de AutoRentar..."

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuración
URL=${1:-"http://localhost:4200"}
TIMEOUT=10

echo "🌐 Verificando: $URL"

# Verificar conectividad básica
echo "1️⃣  Verificando conectividad..."
if curl -f -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$URL" >/dev/null 2>&1; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$URL")
  if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Servidor respondiendo (HTTP $HTTP_CODE)${NC}"
  else
    echo -e "${YELLOW}⚠️  Servidor respondió con código: $HTTP_CODE${NC}"
  fi
else
  echo -e "${RED}❌ Servidor no responde${NC}"
  exit 1
fi

# Verificar tiempo de respuesta
echo "2️⃣  Verificando tiempo de respuesta..."
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time $TIMEOUT "$URL")
RESPONSE_MS=$(echo "$RESPONSE_TIME * 1000" | bc)
echo "⏱️  Tiempo de respuesta: ${RESPONSE_MS%.*}ms"

if [ $(echo "$RESPONSE_TIME < 1.0" | bc) -eq 1 ]; then
  echo -e "${GREEN}✅ Tiempo de respuesta aceptable${NC}"
else
  echo -e "${YELLOW}⚠️  Tiempo de respuesta alto${NC}"
fi

# Verificar headers de seguridad (si aplica)
echo "3️⃣  Verificando headers de seguridad..."
HEADERS=$(curl -s -I "$URL")

if echo "$HEADERS" | grep -q "X-Frame-Options"; then
  echo -e "${GREEN}✅ X-Frame-Options presente${NC}"
else
  echo -e "${YELLOW}⚠️  X-Frame-Options no encontrado${NC}"
fi

# Resumen
echo ""
echo -e "${GREEN}✅ Health check completado${NC}"
echo "URL: $URL"
echo "Tiempo de respuesta: ${RESPONSE_MS%.*}ms"
echo "Timestamp: $(date)"
