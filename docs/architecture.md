# Arquitectura del proyecto TestService

## Visión general

TestService es una aplicación web monolítica construida con Next.js 15, TypeScript, PostgreSQL y Prisma. La aplicación se aloja en infraestructura propia (no en Vercel) y utiliza autenticación basada en usuarios y contraseñas propios.

## Capas de la aplicación

```
+---------------------+
|   Capa de presentación  |  Next.js (App Router, React Server Components)
+---------------------+
|   Capa de aplicación  |  Rutas API de Next.js, lógica de features
+---------------------+
|   Capa de acceso a datos | Prisma ORM
+---------------------+
|   Capa de datos       | PostgreSQL
+---------------------+
```

### Frontend
- **Framework:** Next.js 15 con App Router
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **Componentes:** Organizados en `src/features/` por dominio (proyectos, módulos, versiones, casos de prueba, etc.)
- **Idioma:** Español

### Backend
- **API:** Rutas de Next.js (`src/app/api/`)
- **ORM:** Prisma con cliente generado
- **Base de datos:** PostgreSQL
- **Autenticación:** Usuarios y contraseñas propios (sesiones gestionadas en base de datos mediante tabla `sessions`)

### Infraestructura
- **Servidor:** Node.js ejecutando Next.js en modo standalone (`output: "standalone"` en `next.config.ts`)
- **Base de datos:** PostgreSQL (instalado localmente o en contenedor Docker)
- **Despliegue:** Infraestructura propia en Linux mediante Docker Compose (ver `docs/deployment.md`)

## Flujo de datos

1. El usuario accede a la aplicación a través del navegador.
2. Next.js renderiza la página en el servidor o en el cliente según la ruta.
3. Las acciones del usuario (ejecutar prueba, reportar defecto, aprobar UAT) envían peticiones a las rutas API de Next.js.
4. Las rutas API utilizan Prisma para consultar o modificar datos en PostgreSQL.
5. La respuesta se devuelve al cliente y se actualiza la interfaz.

## Decisiones de diseño

- **Monorepo no requerido:** Todo el código vive en un único repositorio.
- **No se usan servicios cloud externos:** La aplicación se despliega en infraestructura propia.
- **Autenticación propia:** No se delega en proveedores externos de identidad (OAuth, etc.).
- **Prisma como única capa de acceso a datos:** No se usan consultas SQL crudas salvo excepciones justificadas.