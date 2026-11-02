# Flujo de trabajo en TestService

Este documento describe cómo se utiliza TestService para gestionar pruebas funcionales y UAT de múltiples proyectos/empresas desde una sola instancia.

## 1. Objetivo
TestService permite centralizar la gestión de calidad de varios proyectos sin necesidad de desplegar una instancia por cliente o empresa. El aislamiento se logra mediante usuarios, roles, permisos y asignación de proyectos.

## 2. Roles y permisos
1. El administrador ingresa con el usuario inicial (`admin`).
2. En **Roles y permisos** (`/roles`) crea roles (ej. Tester, Líder de testing, Usuario UAT, Auditor).
3. A cada rol se le asignan permisos por sección y acción (view, create, edit, delete, approve, export).
4. El rol **Administrador** tiene todos los permisos y acceso a todos los proyectos.

## 3. Usuarios y asignación a proyectos
1. Los usuarios pueden registrarse desde `/register`; la solicitud queda pendiente.
2. El administrador revisa las solicitudes en **Solicitudes** (`/registration-requests`).
3. Al aprobar, se asigna un rol y uno o más proyectos.
4. En **Usuarios → Editar** se puede ajustar rol, estado, contraseña y proyectos asignados.
5. Un usuario no administrador solo ve y opera sobre los proyectos asignados.

## 4. Gestión de un proyecto
1. Crear proyecto en **Proyectos** (`/projects`) con nombre, descripción y clave.
2. Crear módulos del proyecto en **Módulos**.
3. Crear versiones del software en **Versiones**.
4. Registrar casos de prueba en **Casos de prueba**, asociándolos a proyecto, módulo y versión.
5. Crear ciclos de prueba en **Ciclos**, asociados a proyecto y versión.

## 5. Ejecución de pruebas
1. Registrar ejecuciones de casos de prueba en **Ejecuciones**.
2. Cada ejecución tiene estado (Pendiente, Aprobado, Rechazado, Bloqueado, No ejecutado), evidencia y notas.
3. Si una ejecución falla, se puede registrar una incidencia en **Incidencias**.

## 6. UAT y aprobaciones
1. Registrar aprobaciones UAT por versión en **UAT**.
2. Los usuarios de negocio pueden aprobar o rechazar con comentarios.
3. El dashboard muestra métricas y estado general del testing.

## 7. Exportación y auditoría
1. Exportar datos a CSV, Excel o PDF desde los módulos correspondientes.
2. La auditoría registra acciones relevantes (creación, edición, eliminación, aprobaciones).
3. Solo usuarios con permiso `audit.view` pueden consultar los logs.

## 8. Aislamiento multi-proyecto
- Las consultas de proyectos, módulos, versiones, casos, ciclos, ejecuciones, incidencias y aprobaciones se filtran por los proyectos asignados al usuario.
- Un mismo despliegue puede atender a varias empresas o proyectos sin mezclar datos.

## 9. Despliegue y mantenimiento
- Instalación inicial: `bash scripts/install.sh`
- Actualización: `bash scripts/deploy.sh`
- Backup: `bash scripts/backup.sh`
- Restauración: `bash scripts/restore.sh <archivo>`
- Migraciones: `npx prisma migrate deploy`
- Seed inicial: `npm run prisma:seed`
