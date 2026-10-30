#!/bin/bash

# TestService - Script de backup de PostgreSQL
# Uso: bash scripts/backup.sh [directorio_destino]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Cargar variables de entorno
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

if [ ! -f ".env" ]; then
    echo -e "${RED}ERROR: No se encontro .env${NC}"
    exit 1
fi

source .env

# Configuracion
BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="testservice_backup_${TIMESTAMP}.sql"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Crear directorio de backups
mkdir -p "$BACKUP_DIR"

echo "========================================"
echo "  TestService - Backup de PostgreSQL"
echo "========================================"
echo ""
echo "Base de datos: $POSTGRES_DB"
echo "Host: postgres (interno Docker)"
echo "Directorio: $BACKUP_DIR"
echo ""

# Verificar que PostgreSQL esta disponible
echo "Verificando conexion a PostgreSQL..."
if ! docker compose -f docker/compose.yml exec -T postgres pg_isready -U "$POSTGRES_USER" > /dev/null 2>&1; then
    echo -e "${RED}ERROR: PostgreSQL no esta disponible.${NC}"
    exit 1
fi
echo -e "${GREEN}PostgreSQL disponible.${NC}"
echo ""

# Ejecutar backup
echo "Generando backup..."
docker compose -f docker/compose.yml exec -T postgres \
    pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -F p \
    > "$BACKUP_PATH" 2>/dev/null

if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: El backup fallo.${NC}"
    rm -f "$BACKUP_PATH"
    exit 1
fi

# Verificar que el archivo se genero
if [ ! -s "$BACKUP_PATH" ]; then
    echo -e "${RED}ERROR: El archivo de backup esta vacio.${NC}"
    rm -f "$BACKUP_PATH"
    exit 1
fi

# Comprimir
echo "Comprimiendo backup..."
gzip -f "$BACKUP_PATH"
COMPRESSED_PATH="${BACKUP_PATH}.gz"

if [ ! -f "$COMPRESSED_PATH" ]; then
    echo -e "${RED}ERROR: Fallo la compresion.${NC}"
    exit 1
fi

# Verificar integridad
echo "Verificando integridad del backup..."
if gzip -t "$COMPRESSED_PATH" 2>/dev/null; then
    echo -e "${GREEN}Backup verificado correctamente.${NC}"
else
    echo -e "${RED}ERROR: El backup esta corrupto.${NC}"
    exit 1
fi

# Mostrar informacion
FILE_SIZE=$(du -h "$COMPRESSED_PATH" | cut -f1)
echo ""
echo "========================================"
echo -e "${GREEN}  Backup completado${NC}"
echo "========================================"
echo "Archivo: $COMPRESSED_PATH"
echo "Tamano: $FILE_SIZE"
echo ""

# Politica de retencion (mantener ultimos 7 backups)
RETENTION=7
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/testservice_backup_*.sql.gz 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt "$RETENTION" ]; then
    echo "Aplicando politica de retencion (mantener ultimos $RETENTION)..."
    ls -1t "$BACKUP_DIR"/testservice_backup_*.sql.gz | tail -n +$((RETENTION + 1)) | xargs rm -f
    echo "Se eliminaron $((BACKUP_COUNT - RETENTION)) backups antiguos."
fi

echo ""
echo "Para restaurar: bash scripts/restore.sh $COMPRESSED_PATH"