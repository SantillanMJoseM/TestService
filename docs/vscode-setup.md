# Configuración de VS Code para TestService

## Extensiones recomendadas

Instala las siguientes extensiones en VS Code para una mejor experiencia de desarrollo:

1. **ESLint** (`dbaeumer.vscode-eslint`) — Linting en tiempo real
2. **Prettier** (`esbenp.prettier-vscode`) — Formateo de código
3. **Prisma** (`Prisma.prisma`) — Soporte para schema.prisma
4. **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) — Autocompletado de clases Tailwind
5. **TypeScript Importer** (`pmneo.tsimporter`) — Importación automática

## Configuración del workspace

El archivo `.vscode/settings.json` configura:

- **TypeScript del workspace**: Usa la versión de TypeScript instalada en `node_modules` (no la global de VS Code).
- **ESLint Flat Config**: Desactivado para usar el formato legacy `.eslintrc.json` (compatible con Next.js).
- **Validación ESLint**: Habilitada para archivos JavaScript, JSX, TypeScript y TSX.

## Problemas comunes y soluciones

### "75 errors and 4 warnings" en el panel de Problemas

Si VS Code muestra errores en el panel de Problemas, las causas más comunes son:

1. **Versión de TypeScript incorrecta**: VS Code puede usar su propia versión de TypeScript en lugar de la del proyecto. Solución: El archivo `.vscode/settings.json` configura `typescript.tsdk` para usar la versión del workspace. Si el problema persiste, ejecuta `Ctrl+Shift+P` → "TypeScript: Select TypeScript Version" → "Use Workspace Version".

2. **ESLint Flat Config**: ESLint 9 usa el formato flat config por defecto. TestService incluye tanto `.eslintrc.json` (legacy) como `eslint.config.mjs` (flat) para compatibilidad. El setting `eslint.useFlatConfig: false` fuerza el uso del formato legacy.

3. **Archivos generados en `.next/`**: VS Code puede mostrar errores en archivos generados en `.next/types/`. Estos archivos se regeneran con `npm run build` y no deben editarse manualmente. Si causan problemas, elimina la carpeta `.next/` y reconstruye.

4. **Tipos de Jest no encontrados**: Si ves errores como "Cannot find name 'describe'", asegúrate de que `@types/jest` está instalado (`npm install --save-dev @types/jest`).

### Verificación manual

Para verificar que el proyecto no tiene errores reales:

```powershell
$env:PATH = 'C:\Program Files\nodejs;' + $env:PATH
npx tsc --noEmit          # TypeScript: debe pasar sin errores
npm run lint              # ESLint: debe pasar sin warnings ni errores
npm run build             # Build: debe compilar exitosamente
npm run test              # Pruebas: 28/28 tests deben pasar
```

### Extensiones recomendadas (extensions.json)

El archivo `.vscode/extensions.json` (rastreado en Git) lista las extensiones recomendadas para el proyecto. VS Code las sugerirá automáticamente al abrir el proyecto.