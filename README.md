# TestService

Aplicación web de gestión de testing funcional y UAT (User Acceptance Testing), con interfaz en español. Permite administrar proyectos, módulos, versiones, casos de prueba, ejecuciones, incidencias y aprobaciones de usuarios de negocio.

## Descripción y objetivo


## Funcionalidades previstas

- Gestión de proyectos (alta, edición, consulta)
- Gestión de módulos por proyecto
- Gestión de versiones de software
- Catálogo de casos de prueba con pasos y resultado esperado
- Ciclos de prueba (test cycles) asociados a versiones
- Ejecuciones de casos de prueba con estado (Pendiente, Aprobado, Rechazado, Bloqueado)
- Registro de incidencias (defectos) vinculadas a ejecuciones
- Aprobaciones UAT por usuarios de negocio
- Autenticación de usuarios con roles (Admin, Tester, BusinessUser, Viewer)
- Interfaz en español

## Tecnologías elegidas

| Tecnología | Función |
|------------|---------|
| Next.js 15 | Framework de React para renderizado del frontend y rutas API |
| TypeScript | Tipado estático para JavaScript |

## Requisitos para desarrollar localmente en Windows

- [Git](https://git-scm.com/) (2.24 o superior)
- [Node.js](https://nodejs.org/) (18 o superior, se recomienda LTS)
- [PostgreSQL](https://www.postgresql.org/download/windows/) (14 o superior)
- [npm](https://www.npmjs.com/) (incluido con Node.js)
- Editor de código: [Visual Studio Code](https://code.visualstudio.com/)

## Instalación y ejecución del proyecto

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/SantillanMJoseM/TestService.git
   cd TestService
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Copiar el archivo de variables de entorno:
   ```bash

## Configuración de variables de entorno

Copiar `.env.example` a `.env` y completar los valores:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL | `postgresql://usuario:password@localhost:5432/testservice` |
| `NEXTAUTH_SECRET` | Secreto para firmar sesiones | Cambiar en producción por un valor seguro |
| `NEXTAUTH_URL` | URL base de la aplicación | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app | `http://localhost:3000` |
| `PORT` | Puerto del servidor | `3000` |

> **Importante:** Nunca subas el archivo `.env` al repositorio. Está incluido en `.gitignore`.
   copy .env.example .env

## Configuración de PostgreSQL y Prisma

1. Instalar PostgreSQL en Windows y crear una base de datos llamada `testservice`.
2. Configurar el usuario y contraseña en `DATABASE_URL` dentro de `.env`.
3. Ejecutar `npx prisma generate` para generar el cliente Prisma.
4. Ejecutar `npx prisma migrate dev` para aplicar las migraciones iniciales.
5. (Opcional) Ejecutar `npx prisma studio` para visualizar y editar datos con una interfaz gráfica.

## Ejecución de migraciones

```bash
# Crear una nueva migración
npx prisma migrate dev --name nombre_de_la_migracion

# Aplicar migraciones pendientes en producción
npx prisma migrate deploy

# Abrir Prisma Studio (GUI de la base de datos)
npx prisma studio
```

## Comandos de desarrollo, compilación y pruebas

| Comando | Descripción |
|---------|-------------|

## Estructura de carpetas

```
TestService/
├── README.md
├── .gitignore
├── .env.example
├── package.json
├── tsconfig.json
├── next.config.ts
├── prisma/
│   └── schema.prisma
├── docker/
│   └── postgres/
├── docs/
│   ├── architecture.md
│   ├── data-model.md
│   ├── development-setup.md
│   └── deployment.md
├── scripts/
├── public/
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   │   ├── projects/
│   │   ├── modules/
│   │   ├── versions/
│   │   ├── test-cases/
│   │   ├── test-cycles/
│   │   ├── executions/
│   │   ├── defects/
│   │   └── uat/
│   ├── lib/
│   ├── services/
│   ├── types/
│   └── styles/
└── tests/
    ├── unit/
    └── integration/
```

## Estrategia de ramas, commits y publicación

- **Rama principal:** `main` (está protegida, solo se integra mediante pull requests)
- **Ramas de funcionalidad:** `feature/nombre-de-la-funcionalidad`
- **Ramas de corrección:** `fix/descripcion-del-fix`
- **Convención de commits:** [Conventional Commits](https://www.conventionalcommits.org/)
  - `feat:` nueva funcionalidad
  - `fix:` corrección de error
  - `docs:` documentación
  - `style:` formato, punto y coma, etc.
  - `refactor:` refactorización de código
  - `test:` pruebas
  - `chore:` tareas de mantenimiento

## Consideraciones de seguridad y backups

- No commitear nunca archivos `.env` con credenciales reales.
- `NEXTAUTH_SECRET` debe ser un valor aleatorio y seguro en producción.
- Las contraseñas de usuarios se almacenan hasheadas (no en texto plano).
- Realizar backups periódicos de la base de datos PostgreSQL.
- El acceso a la base de datos debe restringirse a la red interna de la infraestructura.

## Estado actual del proyecto y funcionalidades pendientes

### Estado: Inicialización

El proyecto se encuentra en fase de inicialización. Se han creado:

- Estructura de carpetas base
- Archivos de configuración (Next.js, TypeScript, Prisma)
- Schema de base de datos con Prisma
- Documentación inicial (README, arquitectura, modelo de datos, setup, despliegue)

### Funcionalidades pendientes (no implementadas en esta entrega)

- Implementación de rutas y páginas de la aplicación (`src/app`)
- Componentes de interfaz de usuario (`src/components`)
- Lógica de negocio por feature (`src/features/*`)
- Capa de servicios y utilidades (`src/lib`, `src/services`)
- Tipos compartidos (`src/types`)
- Estilos globales (`src/styles`)
- Pruebas unitarias y de integración (`tests/*`)
- Autenticación completa con NextAuth o similar
- Docker Compose para despliegue en Linux

> Esta base está lista para comenzar el desarrollo de las funcionalidades descritas arriba.
| `npm run dev` | Inicia el servidor de desarrollo con recarga en caliente |
| `npm run build` | Compila la aplicación para producción |
| `npm run start` | Inicia el servidor en modo producción |
| `npm run lint` | Ejecuta ESLint para revisar el código |
| `npm run test` | Ejecuta todas las pruebas |
| `npm run test:unit` | Ejecuta pruebas unitarias |
| `npm run test:integration` | Ejecuta pruebas de integración |
| `npx prisma generate` | Genera el cliente de Prisma desde el schema |
| `npx prisma migrate dev` | Ejecuta migraciones en entorno de desarrollo |
| `npx prisma studio` | Abre la interfaz gráfica de Prisma |
   ```

4. Editar `.env` con los valores correctos de tu entorno local (especialmente `DATABASE_URL`).

5. Generar el cliente de Prisma:
   ```bash
   npx prisma generate
   ```

6. Ejecutar migraciones de base de datos:
   ```bash
   npx prisma migrate dev --name init
   ```

7. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

8. Abrir en el navegador: http://localhost:3000
| PostgreSQL | Base de datos relacional |
| Prisma ORM | Mapeo objeto-relacional y migraciones de base de datos |
| Tailwind CSS | Estilos utilitarios para la interfaz de usuario |
| Zod | Validación de esquemas |
| Jest | Framework de pruebas unitarias y de integración |
TestService es una plataforma diseñada para equipos de calidad y usuarios de negocio que necesitan planificar, ejecutar y hacer seguimiento de pruebas funcionales y de aceptación (UAT). El sistema centraliza la información de casos de prueba, ciclos de prueba, ejecuciones, incidencias y aprobaciones, facilitando la trazabilidad y la toma de decisiones antes de cada release.