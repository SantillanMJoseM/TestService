#!/bin/bash

# TestService - Script de instalación inicial
# Ejecutar como: bash scripts/install.sh

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "  TestService - Instalación inicial"
echo "========================================"
echo ""

# 1. Verificar Docker
echo "Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERROR: Docker no está instalado.${NC}"
    echo "Instalar Docker: https://docs.docker.com/engine/install/"
    exit 1
fi

# Verificar Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${RED}ERROR: Docker Compose no está disponible.${NC}"
    echo "Instalar Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}Docker y Docker Compose disponibles.${NC}"
echo ""

# 2. Verificar que se ejecuta desde el directorio correcto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [ ! -f "$PROJECT_DIR/package.json" ]; then
    echo -e "${RED}ERROR: No se encontró package.json. Ejecutar desde el directorio del proyecto.${NC}"
    exit 1
fi

cd "$PROJECT_DIR"
echo "Directorio del proyecto: $PROJECT_DIR"
echo ""

# 3. Crear .env si no existe
if [ -f ".env" ]; then
    echo -e "${YELLOW}El archivo .env ya existe. No se reemplazará.${NC}"
else
    echo "Creando .env desde .env.example..."
    if [ ! -f ".env.example" ]; then
        echo -e "${RED}ERROR: No se encontró .env.example.${NC}"
        exit 1
    fi
    cp .env.example .env
    
    # Generar contraseñas aleatorias
    POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)
    NEXTAUTH_SECRET=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
    
    # Solicitar IP/URL de acceso
    echo ""
    read -p "Ingrese la IP o URL de acceso (ej: 192.168.1.100 o localhost) [localhost]: " ACCESS_IP
    ACCESS_IP=${ACCESS_IP:-localhost}
    
    # Actualizar .env con valores generados
    sed -i "s/^POSTGRES_PASSWORD=$/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" .env
    sed -i "s/^NEXTAUTH_SECRET=$/NEXTAUTH_SECRET=$NEXTAUTH_SECRET/" .env
    sed -i "s/^NEXTAUTH_URL=.*/NEXTAUTH_URL=http:\/\/$ACCESS_IP:3000/" .env
    sed -i "s/^NEXT_PUBLIC_APP_URL=.*/NEXT_PUBLIC_APP_URL=http:\/\/$ACCESS_IP:3000/" .env
    
    # Aplicar permisos restringidos
    chmod 600 .env
    
    echo -e "${GREEN}.env creado con contraseñas generadas automáticamente.${NC}"
    echo -e "${YELLOW}IMPORTANTE: Guardar las credenciales en un lugar seguro.${NC}"
    echo ""
fi

# 4. Validar Docker Compose
echo "Validando configuración de Docker Compose..."
if ! docker compose -f docker/compose.yml config > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Configuración de Docker Compose inválida.${NC}"
    docker compose -f docker/compose.yml config
    exit 1
fi
echo -e "${GREEN}Configuración de Docker Compose válida.${NC}"
echo ""

# 5. Construir e iniciar servicios
echo "Construyendo e iniciando servicios..."
docker compose -f docker/compose.yml up -d --build

if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Fallo al iniciar los servicios.${NC}"
    exit 1
fi
echo -e "${GREEN}Servicios iniciados.${NC}"
echo ""

# 6. Esperar a que PostgreSQL esté saludable
echo "Esperando a que PostgreSQL esté listo..."
MAX_WAIT=60
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if docker compose -f docker/compose.yml exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}PostgreSQL está listo.${NC}"
        break
    fi
    sleep 2
    WAITED=$((WAITED + 2))
    echo "Esperando... ($WAITED/$MAX_WAIT segundos)"
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo -e "${RED}ERROR: PostgreSQL no respondió en $MAX_WAIT segundos.${NC}"
    exit 1
fi
echo ""

# 7. Ejecutar migraciones
echo "Ejecutando migraciones de Prisma..."
docker compose -f docker/compose.yml exec -T app node /app/node_modules/prisma/build/index.js migrate deploy
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Fallo al ejecutar migraciones.${NC}"
    exit 1
fi
echo -e "${GREEN}Migraciones aplicadas.${NC}"
echo ""

# 8. Verificar funcionamiento
echo "Verificando funcionamiento de la aplicación..."
sleep 5
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "307" ] || [ "$HTTP_STATUS" = "302" ]; then
    echo -e "${GREEN}Aplicación respondiendo correctamente (HTTP $HTTP_STATUS).${NC}"
else
    echo -e "${YELLOW}ADVERTENCIA: La aplicación respondió con HTTP $HTTP_STATUS.${NC}"
    echo "Verificar logs: docker compose -f docker/compose.yml logs app"
fi

echo ""
echo "========================================"
echo -e "${GREEN}  Instalación completada${NC}"
echo "========================================"
echo ""
echo "Acceder a la aplicación en: http://$ACCESS_IP:3000"
echo ""
echo "Comandos útiles:"
echo "  Ver logs:     docker compose -f docker/compose.yml logs -f"
echo "  Detener:      docker compose -f docker/compose.yml down"
echo "  Actualizar:   bash scripts/deploy.sh"
echo ""