# Despliegue en Debian 13 con Docker Compose

## 1. Requisitos del servidor

### Hardware minimo
- CPU: 2 cores
- RAM: 4 GB
- Disco: 20 GB (SSD recomendado)

### Software
- Debian 13 (Trixie) o superior
- Docker Engine 24+
- Docker Compose v2+
- Git
- curl
- openssl

## 2. Preparacion del servidor Debian 13

### Actualizar el sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### Instalar Docker Engine
```bash
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
docker --version
docker compose version
```

### Instalar Git y herramientas
```bash
sudo apt install -y git curl openssl
```

### Crear directorio de instalacion
```bash
sudo mkdir -p /opt/testservice
sudo chown $USER:$USER /opt/testservice
```

## 3. Instalacion inicial

### Clonar el repositorio
```bash
git clone https://github.com/SantillanMJoseM/TestService.git /opt/testservice
cd /opt/testservice
```

### Ejecutar el instalador
```bash
bash scripts/install.sh
```

El instalador realiza automaticamente:
1. Verifica Docker, Docker Compose, Git, OpenSSL y curl
2. Detecta si ya existe una instalacion previa
3. Crea .env desde .env.example (solo si no existe)
4. Genera contrasenas seguras para PostgreSQL y NextAuth
5. Solicita la IP o URL de acceso
6. Aplica permisos 600 a .env
7. Valida las variables obligatorias
8. Valida la configuracion de Docker Compose
9. Construye e inicia los servicios
10. Espera a que PostgreSQL este saludable
11. Ejecuta las migraciones de Prisma
12. Verifica que la aplicacion responda

### Verificar la instalacion
```bash
docker compose -f docker/compose.yml ps
docker compose -f docker/compose.yml logs app --tail=20
curl -s http://localhost:3000 | head -20
```

## 4. Configuracion de variables de entorno

El archivo .env en la raiz del proyecto contiene todas las configuraciones:

    POSTGRES_USER=postgres
    POSTGRES_PASSWORD=<generado automaticamente>
    POSTGRES_DB=testing_uat
    NEXTAUTH_SECRET=<generado automaticamente>
    NEXTAUTH_URL=http://192.168.1.22:3000
    NEXT_PUBLIC_APP_URL=http://192.168.1.22:3000
    APP_PORT=3000

### Rotacion de credenciales de PostgreSQL

Modificar POSTGRES_PASSWORD en .env no cambia la contrasena de un PostgreSQL ya inicializado. Para rotar:

```bash
docker compose -f docker/compose.yml exec postgres psql -U postgres -d testing_uat
# ALTER USER postgres WITH PASSWORD 'nueva-contrasena-segura';
# Actualizar .env
docker compose -f docker/compose.yml restart app
```

## 5. Actualizacion del sistema


## 6. Persistencia de datos

### Volumen PostgreSQL

Los datos de PostgreSQL se almacenan en el volumen Docker nombrado `postgres_data`. Este volumen:

- No se elimina durante `docker compose down`
- No se elimina durante `docker compose up --build`
- Solo se elimina con `docker compose down -v` (NO recomendado)
- Persiste entre reinicios del servidor

### Verificar el volumen

```bash
docker volume ls | grep postgres
docker volume inspect testservice_postgres_data
```

### Backup de datos

```bash
# Backup manual
bash scripts/backup.sh

# Backup con directorio personalizado
bash scripts/backup.sh /path/to/backups

# Configurar backup automatico (cron)
echo "0 2 * * * cd /opt/testservice && bash scripts/backup.sh" | crontab -
```

### Restaurar datos

```bash
# Restaurar desde un backup
bash scripts/restore.sh /path/to/backup.sql.gz
```

## 7. Migraciones de Prisma

### Ejecutar migraciones manualmente

```bash
docker compose -f docker/compose.yml exec app node /app/node_modules/prisma/build/index.js migrate deploy
```

### Verificar estado de migraciones

```bash
docker compose -f docker/compose.yml exec app node /app/node_modules/prisma/build/index.js migrate status
```

### Crear nueva migracion (desarrollo)

```bash
npx prisma migrate dev --name nombre_de_la_migracion
```

## 8. Seguridad

### Proteccion de PostgreSQL

- El puerto 5432 no se publica al exterior (solo red interna de Docker)
- La comunicacion entre la app y PostgreSQL usa el nombre del servicio `postgres`
- Las credenciales se configuran en `.env` (permisos 600)

### Usuario no privilegiado

La aplicacion se ejecuta como usuario `nextjs` (UID 1001) en el contenedor.

### Secretos

- `.env` esta en `.gitignore` y nunca se sube al repositorio
- Las contrasenas se generan automaticamente durante la instalacion
- NEXTAUTH_SECRET debe ser un valor aleatorio y seguro en produccion

### HTTPS y proxy reverso

Para exponer la aplicacion en Internet, se recomienda usar un proxy reverso (nginx o Traefik) con certificados SSL/TLS:

```bash
sudo apt install -y nginx
# Configurar proxy_pass a http://localhost:3000
# Configurar certificados SSL con Let's Encrypt
sudo certbot --nginx -d testservice.ejemplo.com
```

### Actualizar .env para HTTPS

```bash
NEXTAUTH_URL=https://testservice.ejemplo.com
NEXT_PUBLIC_APP_URL=https://testservice.ejemplo.com
```

## 9. Operacion y mantenimiento

### Comandos habituales

```bash
# Ver estado de contenedores
docker compose -f docker/compose.yml ps

# Ver logs en tiempo real
docker compose -f docker/compose.yml logs -f

# Ver logs de la aplicacion
docker compose -f docker/compose.yml logs app --tail=50

# Ver logs de PostgreSQL
docker compose -f docker/compose.yml logs postgres --tail=50

# Reiniciar servicios
docker compose -f docker/compose.yml restart

# Detener servicios
docker compose -f docker/compose.yml down

# Iniciar servicios
docker compose -f docker/compose.yml up -d

# Reconstruir imagen
docker compose -f docker/compose.yml build --no-cache

# Actualizar la aplicacion
bash scripts/deploy.sh

# Backup de base de datos
bash scripts/backup.sh

# Restaurar backup
bash scripts/restore.sh /path/to/backup.sql.gz
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

## 10. Errores frecuentes y soluciones

### Error: sh: 1: prisma: not found

Causa: Prisma CLI no esta disponible en la imagen final.

Solucion: Usar node /app/node_modules/prisma/build/index.js en lugar de npx prisma. Esta correccion ya esta aplicada.

### Error: Error loading shared library libssl.so.1.1

Causa: Incompatibilidad de OpenSSL entre Prisma y la imagen Docker.

Solucion: Usar imagen node:20-slim (Debian) en lugar de node:20-alpine. Instalar openssl en todas las etapas del Dockerfile. Esta correccion ya esta aplicada.

### Error: PostgreSQL no responde

Causa: PostgreSQL no ha terminado de inicializar.

Solucion: Esperar a que el healthcheck pase. Verificar logs: docker compose -f docker/compose.yml logs postgres.

### Error: Migracion fallida

Causa: La base de datos tiene un estado inconsistente.

Solucion: Verificar el estado con docker compose -f docker/compose.yml exec app node /app/node_modules/prisma/build/index.js migrate status. Si es necesario, resolver manualmente.

### Error: Contenedor en loop de reinicio

Causa: La aplicacion falla al iniciar (error de Prisma, conexion a DB, etc.).

Solucion: Verificar logs con docker compose -f docker/compose.yml logs app --tail=50. Corregir la causa del error y reiniciar.

### Error: Permisos de .env

Causa: El archivo .env tiene permisos demasiado abiertos.

Solucion: chmod 600 .env

## 11. Despliegue en produccion (HTTPS)

Para exponer la aplicacion en Internet con HTTPS:

### Usando nginx como proxy reverso

```bash
sudo apt install -y nginx
# Configurar proxy_pass a http://localhost:3000
# Configurar certificados SSL con Let's Encrypt
sudo certbot --nginx -d testservice.ejemplo.com
```

### Actualizar .env para HTTPS

```bash
NEXTAUTH_URL=https://testservice.ejemplo.com
NEXT_PUBLIC_APP_URL=https://testservice.ejemplo.com
```

## 12. Licencia

Este proyecto es de uso privado. Todos los derechos reservados.
### Procedimiento de actualizacion

```bash
cd /opt/testservice
bash scripts/deploy.sh
```

El script realiza automaticamente:
1. Verifica que existe .env
2. Valida las variables obligatorias
3. Verifica la configuracion de Docker Compose
4. Comprueba el estado del repositorio
5. Obtiene la ultima version (git pull)
6. Reconstruye la imagen de la aplicacion
7. Levanta los servicios sin eliminar volumenes
8. Espera a que PostgreSQL este saludable
9. Ejecuta las migraciones de Prisma
10. Verifica que Next.js responda correctamente
11. Muestra el resultado del despliegue

### Que se conserva durante la actualizacion

- Archivo .env (nunca se sobrescribe)
- Volumen postgres_data (datos de PostgreSQL)
- Configuraciones locales

### Que se modifica durante la actualizacion

- Codigo fuente (src/, prisma/, etc.) via git pull
- Imagen Docker de la aplicacion (reconstruida)
- node_modules/ (reinstalado)
- .next/ (recompilado)

### Rollback a version anterior

```bash
cd /opt/testservice
git log --oneline -5
git checkout <commit-hash>
docker compose -f docker/compose.yml up -d --build
```