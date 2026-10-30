#!/bin/bash

# TestService - Script de restauracion de PostgreSQL
# Uso: bash scripts/restore.sh <archivo_backup.sql.gz>

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo "Uso: bash scripts/restore.sh <archivo_backup.sql.gz>"
    echo ""
    echo "Backups disponibles:"
    ls -1t ./backups/testservice_backup_*.sql.gz 2>/dev/null || echo "  (ninguno)"
    exit 1
fi

BACKUP_FILE="$1"

# Cargar variables de entorno
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

if [ ! -f ".env" ]; then
    echo -e "${RED}ERROR: No se encontro .env${NC}"
    exit 1
fi

source .env

echo "========================================"
echo "  TestService - Restauracion de PostgreSQL"
echo "========================================"
echo ""

# Validar que el archivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}ERROR: El archivo $BACKUP_FILE no existe.${NC}"
    exit 1
fi

# Verificar que es un archivo gzip valido
if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
    echo -e "${RED}ERROR: El archivo no es un backup gzip valido.${NC}"
    exit 1
fi

echo "Archivo de backup: $BACKUP_FILE"
echo "Base de datos: $POSTGRES_DB"
echo ""

# Advertencia
echo -e "${YELLOW}ADVERTENCIA: Esta operacion reemplazara los datos existentes en la base de datos.${NC}"
echo -e "${YELLOW}Se recomienda hacer un backup antes de restaurar.${NC}"
echo ""
read -p "¿Desea continuar? (s/N): " CONFIRM
if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
    echo "Restauracion cancelada."
    exit 0
fi
echo ""

# Verificar que PostgreSQL este disponible
echo "Verificando conexion a PostgreSQL..."
if ! docker compose -f docker/compose.yml exec -T postgres pg_isready -U "$POSTGRES_USER" > /dev/null 2>&1; then
    echo -e "${RED}ERROR: PostgreSQL no esta disponible.${NC}"
    exit 1
fi
echo -e "${GREEN}PostgreSQL disponible.${NC}"
echo ""

# Detener la aplicacion
echo "Deteniendo la aplicacion..."
docker compose -f docker/compose.yml stop app
echo ""

# Restaurar
echo "Restaurando backup..."
gunzip -c "$BACKUP_FILE" | docker compose -f docker/compose.yml exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: La restauracion fallo.${NC}"
    echo "Reiniciando la aplicacion..."
    docker compose -f docker/compose.yml start app
    exit 1
fi

echo -e "${GREEN}Restauracion completada.${NC}"
echo ""

# Reiniciar la aplicacion
echo "Reiniciando la aplicacion..."
docker compose -f docker/compose.yml start app

# Esperar a que la aplicacion responda
sleep 5
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${APP_PORT:-3000}" 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "307" ] || [ "$HTTP_STATUS" = "302" ]; then
    echo -e "${GREEN}Aplicacion respondiendo correctamente (HTTP $HTTP_STATUS).${NC}"
else
    echo -e "${YELLOW}ADVERTENCIA: La aplicacion respondio con HTTP $HTTP_STATUS.${NC}"
fi

echo ""
echo "========================================"
echo -e "${GREEN}  Restauracion completada${NC}"
echo "========================================"
echo ""