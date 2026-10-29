# Preparación del entorno local

Esta guía describe cómo configurar el entorno de desarrollo en Windows para el proyecto TestService.

## Prerrequisitos

1. **Git:** [Descargar e instalar](https://git-scm.com/download/win)
2. **Node.js:** [Descargar e instalar LTS](https://nodejs.org/) (incluye npm)
3. **PostgreSQL:** [Descargar e instalar para Windows](https://www.postgresql.org/download/windows/)
4. **Visual Studio Code:** [Descargar e instalar](https://code.visualstudio.com/)

## Pasos de configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/SantillanMJoseM/TestService.git
cd TestService
```

### 2. Instalar dependencias de Node.js

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
copy .env.example .env
```

Editar el archivo `.env` y ajustar al menos `DATABASE_URL` con las credenciales de tu PostgreSQL local:

```
DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/testservice?schema=public"
```

### 4. Crear la base de datos

En PostgreSQL (usando pgAdmin o `psql`), crear una base de datos llamada `testservice`:

```sql
CREATE DATABASE testservice;
```

### 5. Generar el cliente de Prisma

```bash
npx prisma generate
```

### 6. Ejecutar la migración inicial

```bash
npx prisma migrate dev --name init
```

### 7. Iniciar la aplicación

```bash
npm run dev
```

Abrir http://localhost:3000 en el navegador.

## Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `npx prisma studio` | Abre la interfaz gráfica para inspeccionar la base de datos |
| `npx prisma migrate dev --name <nombre>` | Crea y aplica una nueva migración |
| `npx prisma generate` | Regenera el cliente Prisma tras cambios en el schema |
| `npm run lint` | Ejecuta el linter |
| `npm run test` | Ejecuta las pruebas |

## Notas para Windows

- Usar PowerShell o Terminal de VS Code para ejecutar los comandos.
- Si PostgreSQL no está en el PATH, agregar el directorio `bin` de PostgreSQL a las variables de entorno del sistema.
- El comando `copy` (en lugar de `cp`) es propio de Windows PowerShell/CMD.