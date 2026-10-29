# Despliegue en Linux con Docker Compose

Este documento describe la instalación futura de TestService en un servidor Linux propio utilizando Docker Compose.

> **Estado:** Pendiente de implementación. Este documento es una guía de referencia para el despliegue en producción.

## Arquitectura de despliegue

- **Contenedor 1:** Aplicación Next.js (Node.js, modo standalone)
- **Contenedor 2:** PostgreSQL (base de datos)
- **Red interna:** Docker bridge para comunicación entre contenedores
- **Volumen:** Persistencia de datos de PostgreSQL

## Requisitos en el servidor Linux

- Docker Engine instalado
- Docker Compose instalado
- Acceso SSH al servidor
- Dominio o IP pública configurada

## Estructura esperada (pendiente de crear)

```
docker/
├── compose.yml
├── Dockerfile
├── postgres/
│   └── Dockerfile (opcional, se puede usar la imagen oficial)
└── nginx/ (opcional, proxy reverso)
```

## Pasos de despliegue (pendiente)

1. Copiar los archivos del proyecto al servidor.
2. Crear el archivo `.env` en el servidor con valores de producción.
3. Construir y levantar los contenedores:

   ```bash
   docker-compose up -d --build
   ```

4. Ejecutar migraciones dentro del contenedor de la aplicación:

   ```bash
   docker-compose exec app npx prisma migrate deploy
   ```

5. Verificar que la aplicación responde en el puerto configurado.

## Consideraciones de seguridad

- No exponer el puerto de PostgreSQL (5432) al exterior; solo acceso interno entre contenedores.
- Usar contraseñas seguras en `DATABASE_URL` y `NEXTAUTH_SECRET`.
- Configurar HTTPS mediante un proxy reverso (nginx o Traefik) con certificados SSL/TLS.
- Realizar backups periódicos del volumen de PostgreSQL.