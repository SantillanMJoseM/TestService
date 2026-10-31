#!/bin/bash

# TestService - Script de despliegue/actualizacion
# Ejecutar como: bash scripts/deploy.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================"
echo "  TestService - Despliegue"
echo "========================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [ ! -f "$PROJECT_DIR/package.json" ]; then
    echo -e "${RED}ERROR: No se encontro package.json.${NC}"
    exit 1
fi

cd "$PROJECT_DIR"
echo "Directorio del proyecto: $PROJECT_DIR"
echo ""

if [ ! -f ".env" ]; then
    echo -e "${RED}ERROR: No se encontro el archivo .env.${NC}"
    echo "Ejecutar primero: bash scripts/install.sh"
    exit 1
fi

ENV_PERMS=$(stat -c %a .env 2>/dev/null || stat -f %Lp .env 2>/dev/null)
if [ "$ENV_PERMS" != "600" ] && [ "$ENV_PERMS" != "400" ]; then
    echo -e "${YELLOW}ADVERTENCIA: Permisos de .env no restrictivos ($ENV_PERMS). Recomendado: 600.${NC}"
    chmod 600 .env
    echo "Permisos corregidos a 600."
fi

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
    echo -e "${YELLOW}ADVERTENCIA: POSTGRES_PASSWORD usa un valor inseguro por defecto.${NC}"
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

echo "Validando configuracion de Docker Compose..."
if ! docker compose -f docker/compose.yml config > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Configuracion de Docker Compose invalida.${NC}"
    docker compose -f docker/compose.yml config
    exit 1
fi
echo -e "${GREEN}Configuracion valida.${NC}"
echo ""

echo "Verificando estado del repositorio..."
if [ -d ".git" ]; then
    UNTRACKED=$(git status --porcelain 2>/dev/null | grep -v '^?? \.env' | grep -v '^?? docker/\.env' | grep -v '^ M \.env' | grep -v '^ M docker/\.env' || true)
    if [ -n "$UNTRACKED" ]; then
        echo -e "${YELLOW}ADVERTENCIA: Hay cambios locales sin commitear:${NC}"
        echo "$UNTRACKED"
        echo ""
        read -p "¿Continuar de todos modos? (s/N): " CONTINUE
        if [ "$CONTINUE" != "s" ] && [ "$CONTINUE" != "S" ]; then
            echo "Despliegue cancelado."
            exit 1
        fi
    fi
    echo -e "${GREEN}Estado del repositorio verificado.${NC}"
else
    echo -e "${YELLOW}No es un repositorio Git. Saltando verificacion.${NC}"
fi
echo ""

# 6. Obtener la ultima version del repositorio
if [ -d ".git" ]; then
    echo "Obteniendo ultima version del repositorio..."
    if ! git fetch origin; then
        echo -e "${RED}ERROR: Fallo al ejecutar git fetch.${NC}"
        exit 1
    fi
    if ! git pull origin main; then
        echo -e "${RED}ERROR: Fallo al ejecutar git pull.${NC}"
        exit 1
    fi
    echo -e "${GREEN}Repositorio actualizado.${NC}"
    echo ""
fi

# 7. Reconstruir la imagen de la aplicacion
echo "Reconstruyendo imagen de la aplicacion..."
docker compose -f docker/compose.yml build app

if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Fallo al construir la imagen.${NC}"
    exit 1
fi
echo -e "${GREEN}Imagen construida.${NC}"
echo ""

# 8. Levantar los servicios sin eliminar los volumenes
echo "Levantando servicios (sin eliminar volumenes)..."
docker compose -f docker/compose.yml up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Fallo al levantar los servicios.${NC}"
    exit 1
fi
echo -e "${GREEN}Servicios levantados.${NC}"
echo ""

# 9. Esperar a que PostgreSQL este saludable
echo "Esperando a que PostgreSQL este saludable..."
MAX_WAIT=60
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if docker compose -f docker/compose.yml exec -T postgres pg_isready -U "$POSTGRES_USER" > /dev/null 2>&1; then
        echo -e "${GREEN}PostgreSQL esta saludable.${NC}"
        break
    fi
    sleep 2
    WAITED=$((WAITED + 2))
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo -e "${RED}ERROR: PostgreSQL no respondio en $MAX_WAIT segundos.${NC}"
    echo "Verificar logs: docker compose -f docker/compose.yml logs postgres"
    exit 1
fi
echo ""

# 10. Ejecutar las migraciones Prisma
echo "Ejecutando migraciones de Prisma..."
docker compose -f docker/compose.yml exec -T app node /app/node_modules/prisma/build/index.js migrate deploy

if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Fallo al ejecutar migraciones.${NC}"
    echo "Verificar logs: docker compose -f docker/compose.yml logs app"
    exit 1
fi
echo -e "${GREEN}Migraciones aplicadas.${NC}"
echo ""

# 10.1 Ejecutar seed (idempotente)
echo "Ejecutando seed (creacion de admin y roles)..."
docker compose -f docker/compose.yml exec -T app node /app/prisma/seed.js
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Fallo al ejecutar seed.${NC}"
    exit 1
fi
echo -e "${GREEN}Seed ejecutado.${NC}"
echo ""

# 11. Verificar que Next.js responda correctamente
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

# 12. Mostrar el resultado del despliegue
echo "========================================"
echo -e "${GREEN}  Despliegue completado${NC}"
echo "========================================"
echo ""
echo "Servicios:"
docker compose -f docker/compose.yml ps
echo ""
echo "Acceder a la aplicacion en: http://localhost:${APP_PORT:-3000}"
echo ""
echo "Comandos utiles:"
echo "  Ver logs:     docker compose -f docker/compose.yml logs -f"
echo "  Detener:      docker compose -f docker/compose.yml down"
echo "  Backup DB:    bash scripts/backup.sh"
echo ""