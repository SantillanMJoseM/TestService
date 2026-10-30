# Operaciones y Mantenimiento - TestService

## Comandos habituales

### Estado de los servicios

```bash
# Ver estado de contenedores
docker compose -f docker/compose.yml ps

# Ver logs en tiempo real
docker compose -f docker/compose.yml logs -f

# Ver logs de la aplicacion
docker compose -f docker/compose.yml logs app --tail=50

# Ver logs de PostgreSQL
docker compose -f docker/compose.yml logs postgres --tail=50
```

### Reiniciar servicios

```bash
# Reiniciar todos los servicios
docker compose -f docker/compose.yml restart

# Reiniciar solo la aplicacion
docker compose -f docker/compose.yml restart app

# Detener servicios
docker compose -f docker/compose.yml down

# Iniciar servicios
docker compose -f docker/compose.yml up -d
```

### Reconstruir imagen

```bash
# Reconstruir sin cache
docker compose -f docker/compose.yml build --no-cache

# Reconstruir y reiniciar
docker compose -f docker/compose.yml up -d --build
```

### Actualizar la aplicacion

```bash
cd /opt/testservice
bash scripts/deploy.sh
```

### Verificar motor Prisma en el contenedor

```bash
docker exec testservice-app ls /app/node_modules/.prisma/client/libquery_engine*
# Debe mostrar: libquery_engine-debian-openssl-3.0.x.so.node
# NO debe mostrar: libquery_engine-linux-musl*.so.node
```

### Verificar sistema operativo del contenedor

```bash
docker exec testservice-app cat /etc/os-release | grep -E "^(NAME|VERSION)="
# Debe mostrar: NAME="Debian GNU/Linux" VERSION="13 (trixie)"
```

### Verificar OpenSSL

```bash
docker exec testservice-app openssl version
# Debe mostrar: OpenSSL 3.x.x
```

### Verificar migraciones

```bash
docker compose -f docker/compose.yml exec app node /app/node_modules/prisma/build/index.js migrate status
```

### Verificar conexion a PostgreSQL

```bash
docker compose -f docker/compose.yml exec postgres pg_isready -U postgres
```

## Diagnostico de problemas

### Verificar que la aplicacion responde

```bash
curl -s http://localhost:3000 | head -20
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

### Verificar uso de recursos

```bash
docker stats --no-stream
```

### Verificar espacio en disco

```bash
df -h
docker system df
```

### Limpiar imagenes no utilizadas

```bash
docker image prune -f
```

## Errores frecuentes y soluciones

### Error: sh: 1: prisma: not found

**Causa**: Prisma CLI no esta disponible en la imagen final.

**Solucion**: Usar `node /app/node_modules/prisma/build/index.js` en lugar de `npx prisma`. Esta correccion ya esta aplicada.

### Error: Error loading shared library libssl.so.1.1

**Causa**: Incompatibilidad de OpenSSL entre Prisma y la imagen Docker.

**Solucion**: Usar imagen `node:20-slim` (Debian) en lugar de `node:20-alpine`. Instalar `openssl` en todas las etapas del Dockerfile. Esta correccion ya esta aplicada.

### Error: PostgreSQL no responde

**Causa**: PostgreSQL no ha terminado de inicializar.

**Solucion**: Esperar a que el healthcheck pase. Verificar logs: `docker compose -f docker/compose.yml logs postgres`.

### Error: Migracion fallida

**Causa**: La base de datos tiene un estado inconsistente.

**Solucion**: Verificar el estado con `docker compose -f docker/compose.yml exec app node /app/node_modules/prisma/build/index.js migrate status`. Si es necesario, resolver manualmente.

### Error: Contenedor en loop de reinicio

**Causa**: La aplicacion falla al iniciar (error de Prisma, conexion a DB, etc.).

**Solucion**: Verificar logs con `docker compose -f docker/compose.yml logs app --tail=50`. Corregir la causa del error y reiniciar.

### Error: Permisos de .env

**Causa**: El archivo .env tiene permisos demasiado abiertos.

**Solucion**: `chmod 600 .env`

### Error: Variables de entorno no definidas

**Causa**: Falta una variable obligatoria en .env.

**Solucion**: Verificar que todas las variables en .env.example esten definidas en .env. El script deploy.sh valida esto automaticamente.

## Monitoreo

### Verificar salud de los contenedores

```bash
docker compose -f docker/compose.yml ps
```

### Verificar que la aplicacion responde

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

### Verificar espacio en disco

```bash
df -h
docker system df
```

### Limpiar imagenes no utilizadas

```bash
docker image prune -f
```