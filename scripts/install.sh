#!/bin/bash

# TestService - Script de instalacion inicial
# Ejecutar como: bash scripts/install.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================"
echo "  TestService - Instalacion inicial"
echo "========================================"
echo ""

# 1. Verificar que se ejecuta desde el directorio correcto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [ ! -f "$PROJECT_DIR/package.json" ]; then
    echo -e "${RED}ERROR: No se encontro package.json. Ejecutar desde el directorio del proyecto.${NC}"
    exit 1
fi

cd "$PROJECT_DIR"
echo "Directorio del proyecto: $PROJECT_DIR"
echo ""

# 2. Verificar herramientas necesarias
echo "Verificando herramientas..."
MISSING_TOOLS=0

for tool in docker git openssl curl; do
    if ! command -v $tool &> /dev/null; then
        echo -e "${RED}ERROR: $tool no esta instalado.${NC}"
        MISSING_TOOLS=1
    fi
done

if ! docker compose version &> /dev/null; then
    echo -e "${RED}ERROR: Docker Compose no esta disponible.${NC}"
    MISSING_TOOLS=1
fi

if [ $MISSING_TOOLS -eq 1 ]; then
    echo -e "${RED}Instalar las herramientas faltantes antes de continuar.${NC}"
    exit 1
fi

echo -e "${GREEN}Todas las herramientas necesarias estan disponibles.${NC}"
echo ""

# 3. Detectar instalacion existente
if [ -f ".env" ]; then
    echo -e "${YELLOW}ADVERTENCIA: Ya existe un archivo .env.${NC}"
    echo "Esto indica que TestService ya fue instalado anteriormente."
    echo ""
    read -p "¿Desea continuar? Las credenciales existentes se conservaran. (s/N): " CONTINUE
    if [ "$CONTINUE" != "s" ] && [ "$CONTINUE" != "S" ]; then
        echo "Instalacion cancelada."
        exit 0
    fi
    echo ""
fi

# 4. Crear .env si no existe
if [ ! -f ".env" ]; then
    echo "Creando .env desde .env.example..."
    if [ ! -f ".env.example" ]; then
        echo -e "${RED}ERROR: No se encontro .env.example.${NC}"
        exit 1
    fi
    cp .env.example .env

    POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)
    NEXTAUTH_SECRET=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)

    echo ""
    read -p "Ingrese la IP o URL de acceso (ej: 192.168.1.22 o localhost) [localhost]: " ACCESS_IP
    ACCESS_IP=${ACCESS_IP:-localhost}

    sed -i "s/^POSTGRES_USER=$/POSTGRES_USER=postgres/" .env
    sed -i "s/^POSTGRES_PASSWORD=$/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" .env
    sed -i "s/^POSTGRES_DB=testing_uat/POSTGRES_DB=testing_uat/" .env
    sed -i "s/^NEXTAUTH_SECRET=$/NEXTAUTH_SECRET=$NEXTAUTH_SECRET/" .env
    sed -i "s/^NEXTAUTH_URL=.*/NEXTAUTH_URL=http:\/\/$ACCESS_IP:3000/" .env
    sed -i "s/^NEXT_PUBLIC_APP_URL=.*/NEXT_PUBLIC_APP_URL=http:\/\/$ACCESS_IP:3000/" .env
    sed -i "s/^APP_PORT=3000/APP_PORT=3000/" .env

    chmod 600 .env

    echo ""
    echo -e "${GREEN}.env creado con credenciales generadas automaticamente.${NC}"
    echo -e "${YELLOW}IMPORTANTE: Guardar las credenciales en un lugar seguro.${NC}"
    echo -e "${YELLOW}El archivo .env tiene permisos 600.${NC}"
    echo ""
else
    echo -e "${GREEN}.env existente conservado. No se modificaron credenciales.${NC}"
    echo ""
fi

# 5. Validar variables obligatorias
echo "Validando variables de entorno..."
source .env

REQUIRED_VARS=("POSTGRES_USER" "POSTGRES_PASSWORD" "POSTGRES_DB" "NEXTAUTH_SECRET" "NEXTAUTH_URL" "NEXT_PUBLIC_APP_URL" "APP_PORT")
MISSING=0

for var in "${REQUIRED_VARS[@]}"; do
    value="${!var}"
    if [ -z "$value" ]; then
        echo -e "${RED}ERROR: Variable obligatoria $var no esta definida.${NC}"
        MISSING=1
    fi
done

if [ "$POSTGRES_PASSWORD" = "postgres" ] || [ "$POSTGRES_PASSWORD" = "password" ]; then
    echo -e "${RED}ERROR: POSTGRES_PASSWORD usa un valor inseguro por defecto.${NC}"
    MISSING=1
fi

if [ "$NEXTAUTH_SECRET" = "cambiar-por-un-secreto-seguro-en-produccion" ] || [ -z "$NEXTAUTH_SECRET" ]; then
    echo -e "${RED}ERROR: NEXTAUTH_SECRET no esta configurado.${NC}"
    MISSING=1
fi

if [ $MISSING -eq 1 ]; then
    echo -e "${RED}Corregir las variables en .env antes de continuar.${NC}"
    exit 1
fi

echo -e "${GREEN}Variables de entorno validas.${NC}"
echo ""

# 6. Validar configuracion de Docker Compose
echo "Validando configuracion de Docker Compose..."
if ! docker compose -f docker/compose.yml config > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Configuracion de Docker Compose invalida.${NC}"
    docker compose -f docker/compose.yml config
    exit 1
fi
echo -e "${GREEN}Configuracion valida.${NC}"
echo ""

# 7. Construir e iniciar servicios
echo "Construyendo e iniciando servicios..."
docker compose -f docker/compose.yml up -d --build

if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Fallo al iniciar los servicios.${NC}"
    exit 1
fi
echo -e "${GREEN}Servicios iniciados.${NC}"
echo ""

# 8. Esperar a que PostgreSQL este saludable
echo "Esperando a que PostgreSQL este listo..."
MAX_WAIT=60
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if docker compose -f docker/compose.yml exec -T postgres pg_isready -U "$POSTGRES_USER" > /dev/null 2>&1; then
        echo -e "${GREEN}PostgreSQL esta listo.${NC}"
        break
    fi
    sleep 2
    WAITED=$((WAITED + 2))
    echo "Esperando... ($WAITED/$MAX_WAIT segundos)"
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo -e "${RED}ERROR: PostgreSQL no respondio en $MAX_WAIT segundos.${NC}"
    exit 1
fi
echo ""

# 9. Ejecutar migraciones
echo "Ejecutando migraciones de Prisma..."
docker compose -f docker/compose.yml exec -T app node /app/node_modules/prisma/build/index.js migrate deploy

if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Fallo al ejecutar migraciones.${NC}"
    echo "Verificar logs: docker compose -f docker/compose.yml logs app"
    exit 1
fi
echo -e "${GREEN}Migraciones aplicadas.${NC}"
echo ""

# 10. Ejecutar seed
echo "Ejecutando seed (creacion de admin y roles)..."
docker compose -f docker/compose.yml exec -T app node /app/prisma/seed.js
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Fallo al ejecutar seed.${NC}"
    exit 1
fi
echo -e "${GREEN}Seed ejecutado.${NC}"
echo ""

# 10. Verificar funcionamiento
echo "Verificando funcionamiento de la aplicacion..."
sleep 5
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${APP_PORT:-3000}" 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "307" ] || [ "$HTTP_STATUS" = "302" ]; then
    echo -e "${GREEN}Aplicacion respondiendo correctamente (HTTP $HTTP_STATUS).${NC}"
else
    echo -e "${YELLOW}ADVERTENCIA: La aplicacion respondio con HTTP $HTTP_STATUS.${NC}"
    echo "Verificar logs: docker compose -f docker/compose.yml logs app"
fi

echo ""
echo "========================================"
echo -e "${GREEN}  Instalacion completada${NC}"
echo "========================================"
echo ""
echo "Acceder a la aplicacion en: http://localhost:${APP_PORT:-3000}"
echo ""
echo "Comandos utiles:"
echo "  Ver logs:     docker compose -f docker/compose.yml logs -f"
echo "  Detener:      docker compose -f docker/compose.yml down"
echo "  Actualizar:   bash scripts/deploy.sh"
echo "  Backup DB:    bash scripts/backup.sh"
echo ""