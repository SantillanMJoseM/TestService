# TestService

Aplicacion web de gestion de testing funcional y UAT (User Acceptance Testing), con interfaz en espanol. Permite administrar proyectos, modulos, versiones, casos de prueba, ejecuciones, incidencias y aprobaciones de usuarios de negocio.

## Descripcion y objetivo

TestService es una plataforma disenada para equipos de calidad y usuarios de negocio que necesitan planificar, ejecutar y hacer seguimiento de pruebas funcionales y de aceptacion (UAT). El sistema centraliza la informacion de casos de prueba, ciclos de prueba, ejecuciones, incidencias y aprobaciones, facilitando la trazabilidad y la toma de decisiones antes de cada release.

## Funcionalidades

- Gestion de proyectos (alta, edicion, consulta, eliminacion)
- Gestion de modulos por proyecto
- Gestion de versiones de software
- Catalogo de casos de prueba con pasos y resultado esperado
- Ciclos de prueba (test cycles) asociados a versiones
- Ejecuciones de casos de prueba con estado (Pendiente, Aprobado, Rechazado, Bloqueado, No ejecutado)
- Registro de incidencias (defectos) vinculadas a ejecuciones
- Aprobaciones UAT por usuarios de negocio
- Autenticacion de usuarios con roles (Admin, Tester, BusinessUser, Viewer)
- Dashboard con metricas y resumen del estado de testing
- Exportacion de datos a CSV, Excel y PDF
- Auditoria de cambios y acciones
- Notificaciones de incidencias criticas
- Interfaz en espanol

## Tecnologias elegidas

| Tecnologia | Funcion |
|------------|---------|
| Next.js 15 | Framework de React para renderizado del frontend y rutas API |
| TypeScript | Tipado estatico para JavaScript |
| PostgreSQL 17 | Base de datos relacional |
| Prisma ORM | Mapeo objeto-relacional y migraciones de base de datos |
| Tailwind CSS | Estilos utilitarios para la interfaz de usuario |
| Zod | Validacion de esquemas |
| Jest | Framework de pruebas unitarias y de integracion |
| bcryptjs | Hash de contrasenas |
| jsPDF | Generacion de reportes PDF |
| xlsx (SheetJS) | Generacion de reportes Excel |

## Requisitos para desarrollar localmente en Windows

- Git (2.24 o superior)
- Node.js (18 o superior, se recomienda LTS)
- PostgreSQL (14 o superior, recomendado 17)
- npm (incluido con Node.js)
- Editor de codigo: Visual Studio Code

## Instalacion y ejecucion del proyecto

### 1. Clonar el repositorio

    git clone https://github.com/SantillanMJoseM/TestService.git
    cd TestService

### 2. Instalar dependencias

    npm install

### 3. Configurar variables de entorno

    copy .env.example .env

Editar .env con los valores correctos de tu entorno local (especialmente DATABASE_URL).

### 4. Configurar PostgreSQL

1. Instalar PostgreSQL en Windows y crear una base de datos llamada testing_uat.
2. Configurar el usuario y contrasena en DATABASE_URL dentro de .env:
   DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/testing_uat?schema=public"

## Configuracion de variables de entorno

Copiar .env.example a .env y completar los valores:

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| DATABASE_URL | Cadena de conexion a PostgreSQL | postgresql://postgres:password@localhost:5432/testing_uat |
| NEXTAUTH_SECRET | Secreto para firmar sesiones | Cambiar en produccion por un valor seguro |
| NEXTAUTH_URL | URL base de la aplicacion | http://localhost:3000 |
| NEXT_PUBLIC_APP_URL | URL publica de la app | http://localhost:3000 |
| PORT | Puerto del servidor | 3000 |

> Importante: Nunca subas el archivo .env al repositorio. Esta incluido en .gitignore.

## Configuracion de PostgreSQL y Prisma

1. Instalar PostgreSQL en Windows y crear una base de datos llamada testing_uat.
2. Configurar el usuario y contrasena en DATABASE_URL dentro de .env.
3. Ejecutar npx prisma generate para generar el cliente Prisma.
4. Ejecutar npx prisma migrate dev para aplicar las migraciones iniciales.
5. (Opcional) Ejecutar npx prisma studio para visualizar y editar datos con una interfaz grafica.

## Ejecucion de migraciones

    # Crear una nueva migracion
    npx prisma migrate dev --name nombre_de_la_migracion

    # Aplicar migraciones pendientes en produccion
    npx prisma migrate deploy

    # Abrir Prisma Studio (GUI de la base de datos)
    npx prisma studio

## Comandos de desarrollo, compilacion y pruebas

| Comando | Descripcion |
|---------|-------------|
| npm run dev | Inicia el servidor de desarrollo con recarga en caliente |
| npm run build | Compila la aplicacion para produccion |
| npm run start | Inicia el servidor en modo produccion |
| npm run lint | Ejecuta ESLint para revisar el codigo |
| npm run test | Ejecuta pruebas unitarias |
| npm run test:unit | Ejecuta pruebas unitarias |
| npm run test:integration | Ejecuta pruebas de integracion (requiere servidor corriendo) |
| npx prisma generate | Genera el cliente de Prisma desde el schema |
| npx prisma migrate dev | Ejecuta migraciones en entorno de desarrollo |
| npx prisma studio | Abre la interfaz grafica de Prisma |

## Estructura de carpetas

    TestService/
    ├── README.md
    ├── .gitignore
    ├── .env.example
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── postcss.config.js
    ├── jest.config.js
    ├── jest.integration.config.js
    ├── prisma/
    │   ├── schema.prisma
    │   └── migrations/
    ├── docker/
    │   ├── Dockerfile
    │   └── compose.yml
    ├── docs/
    │   ├── architecture.md
    │   ├── data-model.md

## Estado actual del proyecto

### Version: v1.0.0-rc.6 (Release Candidate)

El proyecto se encuentra en fase release candidate. Se han implementado todos los modulos funcionales:

### Modulos implementados

- Proyectos — CRUD completo con busqueda y paginacion
- Modulos — CRUD con asociacion a proyectos
- Versiones — Gestion de versiones de software por proyecto
- Casos de prueba — Catalogo con pasos, resultado esperado, prioridad y tipo
- Ciclos de prueba — Agrupacion de ejecuciones por version
- Ejecuciones — Registro de resultados con estado y evidencia
- Incidencias (Defectos) — Reporte de defectos vinculados a ejecuciones
- Aprobaciones UAT — Aprobaciones por usuarios de negocio
- Usuarios — Gestion de usuarios con roles
- Autenticacion — Registro, login, logout con sesiones en base de datos
- Dashboard — Metricas y resumen del estado de testing
- Exportacion — Exportacion de datos a CSV, Excel y PDF
- Auditoria — Log de cambios y acciones (tabla audit_logs)
- Middleware — Proteccion de rutas (redirige a login si no autenticado)
- Notificaciones — Alertas de incidencias criticas
- Internacionalizacion — Archivos de traduccion es/en

### Infraestructura

- Base de datos PostgreSQL 17 configurada y migrada
- Docker Compose para despliegue (Dockerfile + compose.yml)
- Script de backup de PostgreSQL (scripts/backup.ps1)
- Task Scheduler para backup automatico (scripts/setup-backup-task.ps1)
- ESLint + TypeScript configurados
- 28 pruebas unitarias pasando
- 6 pruebas de integracion

### Funcionalidades pendientes para futuras versiones

- Pruebas de integracion completas (tests para todos los API routes)
- Edicion y eliminacion en UI para modulos restantes
- Notificaciones en tiempo real (WebSockets)
- Exportacion avanzada (PDF con graficos, Excel con formato)
- Internacionalizacion completa (integrar next-intl)
- Auditoria completa (log de todas las acciones)
- Backup automatico programado

### Correcciones aplicadas en RC6

- Corregida estructura del bloque if en install.sh
- Corregido grep -v con || true en deploy.sh
- Reubicado manejo de errores de Git en deploy.sh
- Migraciones ejecutadas solo desde scripts (no desde compose.yml)
- Validacion de sintaxis bash con bash -n para todos los scripts

## Licencia

Este proyecto es de uso privado. Todos los derechos reservados.
    │   ├── development-setup.md
    │   ├── deployment.md
    │   └── vscode-setup.md
    ├── scripts/
    │   ├── backup.ps1
    │   └── setup-backup-task.ps1
    ├── public/
    ├── src/
    │   ├── app/
    │   │   ├── api/
    │   │   ├── dashboard/
    │   │   ├── projects/
    │   │   ├── modules/
    │   │   ├── versions/
    │   │   ├── test-cases/
    │   │   ├── test-cycles/
    │   │   ├── executions/
    │   │   ├── defects/
    │   │   ├── uat/
    │   │   ├── users/
    │   │   ├── login/
    │   │   └── register/
    │   ├── components/
    │   ├── hooks/
    │   ├── i18n/
    │   ├── lib/
    │   └── middleware.ts
    └── tests/
        ├── unit/
        └── integration/

## Estrategia de ramas, commits y publicacion

- Rama principal: main
- Ramas de funcionalidad: feature/nombre-de-la-funcionalidad
- Ramas de correccion: fix/descripcion-del-fix
- Convencion de commits: Conventional Commits
  - feat: nueva funcionalidad
  - fix: correccion de error
  - docs: documentacion
  - style: formato, punto y coma, etc.
  - refactor: refactorizacion de codigo
  - test: pruebas
  - chore: tareas de mantenimiento

## Consideraciones de seguridad y backups

- No commitear nunca archivos .env con credenciales reales.
- NEXTAUTH_SECRET debe ser un valor aleatorio y seguro en produccion.
- Las contrasenas de usuarios se almacenan hasheadas (bcryptjs).
- Realizar backups periodicos de la base de datos PostgreSQL.
- El acceso a la base de datos debe restringirse a la red interna de la infraestructura.
- Script de backup disponible en scripts/backup.ps1.

### 5. Generar el cliente de Prisma

    npx prisma generate

### 6. Ejecutar migraciones de base de datos

    npx prisma migrate dev --name init

> Nota: En produccion (Docker), las migraciones se ejecutan automaticamente
> mediante scripts/install.sh o scripts/deploy.sh, NO desde docker-compose.yml.
> El comando de inicio de la aplicacion es solo "node server.js".

### 7. Iniciar el servidor de desarrollo

    npm run dev

### 8. Abrir en el navegador

http://localhost:3000