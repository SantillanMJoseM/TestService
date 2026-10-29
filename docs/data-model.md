# Modelo de datos

El modelo de datos se define en `prisma/schema.prisma` y se implementa en PostgreSQL mediante Prisma ORM.

## Entidades

| Entidad | Descripción |
|---------|-------------|
| **Project** | Proyecto de testing. Agrupa módulos, versiones, casos de prueba, ejecuciones, incidencias y aprobaciones UAT. |
| **Module** | Módulo funcional dentro de un proyecto. |
| **Version** | Versión de software asociada a un proyecto (ej. "1.0.0"). |
| **TestCase** | Caso de prueba con título, descripción, precondiciones, pasos, resultado esperado, prioridad y tipo. |
| **TestCycle** | Ciclo de prueba que agrupa ejecuciones para una versión de un proyecto. |
| **Execution** | Ejecución de un caso de prueba con estado, evidencia, notas y usuario ejecutor. |
| **Defect** | Incidencia detectada durante una ejecución, vinculada a un proyecto y opcionalmente a una ejecución. |
| **User** | Usuario del sistema con nombre de usuario, email, contraseña hasheada y rol. |
| **UatApproval** | Aprobación de usuario de negocio para una versión de un proyecto. |
| **Session** | Sesión de autenticación activa. |
| **VerificationToken** | Tokens de verificación (recuperación de contraseña, cambio de email). |

## Relaciones principales

```
Project (1) ──< (N) Module
Project (1) ──< (N) Version
Project (1) ──< (N) TestCase
Project (1) ──< (N) TestCycle
Project (1) ──< (N) Execution
Project (1) ──< (N) Defect
Project (1) ──< (N) UatApproval

Module (1) ──< (N) TestCase
Version (1) ──< (N) TestCycle
Version (1) ──< (N) TestCase (opcional)
TestCase (1) ──< (N) Execution
TestCycle (1) ──< (N) Execution
Execution (1) ──< (0..1) Defect
User (1) ──< (N) Execution
User (1) ──< (N) Defect
User (1) ──< (N) UatApproval
UatApproval (1) ──< (1) Project
UatApproval (1) ──< (1) Version
UatApproval (1) ──< (1) User
```

## Notas

- Los campos `createdAt` y `updatedAt` se gestionan automáticamente con Prisma (`@default(now())` y `@updatedAt`).
- Los identificadores utilizan `uuid()` como valor predeterminado.
- Las claves foráneas usan `onDelete: Cascade` o `onDelete: SetNull` según corresponda para mantener la integridad referencial.