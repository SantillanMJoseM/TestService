# Backup y Restauración - TestService

## Backup manual

### Ejecutar backup

```bash
bash scripts/backup.sh
```

### Backup con directorio personalizado

```bash
bash scripts/backup.sh /path/to/backups
```

### Verificar el backup

```bash
ls -lh backups/
gzip -t backups/testservice_backup_*.sql.gz && echo "Backup válido"
```

## Backup automático

### Linux (cron)

```bash
# Configurar backup diario a las 2:00 AM
echo "0 2 * * * cd /opt/testservice && bash scripts/backup.sh" | crontab -

# Verificar configuración
crontab -l
```

### Windows (Task Scheduler)

```powershell
# Ejecutar como Administrador
.\scripts\setup-backup-task.ps1
```

## Política de retención

Por defecto, se mantienen los últimos 7 backups. Los backups más antiguos se eliminan automáticamente.

Para cambiar la retención, editar `scripts/backup.sh` y modificar la variable `RETENTION`.

## Restauración

### Restaurar desde un backup

```bash
bash scripts/restore.sh /path/to/backup.sql.gz
```

El script:
1. Valida que el archivo existe y es un gzip válido
2. Solicita confirmación antes de restaurar
3. Advierte que una restauración puede reemplazar datos existentes
4. Verifica la conexión a PostgreSQL
5. Detiene la aplicación
6. Ejecuta la restauración
7. Reinicia la aplicación
8. Verifica que la aplicación responda

### Restauración manual

```bash
# 1. Detener la aplicación
docker compose -f docker/compose.yml stop app

# 2. Restaurar
gunzip -c backup.sql.gz | docker compose -f docker/compose.yml exec -T postgres psql -U postgres -d testing_uat

# 3. Reiniciar la aplicación
docker compose -f docker/compose.yml start app
```

## Verificación de integridad

### Verificar un backup

```bash
# Verificar que el gzip es válido
gzip -t backup.sql.gz && echo "OK"

# Verificar contenido (primeras líneas)
gunzip -c backup.sql.gz | head -20

# Contar tablas en el backup
gunzip -c backup.sql.gz | grep -c "CREATE TABLE"
```

## Recuperación ante fallos

### Si la base de datos se corrompe

1. Detener todos los servicios: `docker compose -f docker/compose.yml down`
2. Eliminar el volumen: `docker volume rm testservice_postgres_data`
3. Recrear el volumen: `docker compose -f docker/compose.yml up -d postgres`
4. Restaurar desde backup: `bash scripts/restore.sh backup.sql.gz`
5. Verificar: `docker compose -f docker/compose.yml exec postgres pg_isready -U postgres`

### Si se pierde el archivo .env

1. Recuperar de un backup del archivo (si existe)
2. O recrear manualmente con las credenciales correctas
3. Verificar permisos: `chmod 600 .env`

### Si se pierde el volumen de PostgreSQL

1. Crear un nuevo volumen: `docker volume create testservice_postgres_data`
2. Iniciar PostgreSQL: `docker compose -f docker/compose.yml up -d postgres`
3. Restaurar desde backup: `bash scripts/restore.sh backup.sql.gz`

## Permisos de archivos de backup

Los archivos de backup deben tener permisos restrictivos:

```bash
chmod 600 backups/*.sql.gz
```

Los backups deben almacenarse fuera del volumen de PostgreSQL y en un directorio con acceso restringido.