# Contexto de Proyecto: Rediseño de UI en React

## Estructura del Repositorio
- `context-app/`: Contiene el código fuente (`src/`), componentes y `tailwind.config.js` de la aplicación funcional original. **Usar exclusivamente como referencia de lógica, modelos y flujos.**
- `src/`: Directorio activo de la nueva aplicación React donde implementaremos el rediseño.

## Pautas de Rediseño y UI/UX
- **Framework de estilos:** Tailwind CSS (respetar la paleta de colores, fuentes y tokens extendidos definidos en la configuración).
- **Lógica y funcionalidad:** Conservar intacta la lógica de estado, llamadas a APIs y flujo funcional que existen en `context-app/`.
- **Calidad de componentes:** Crear componentes funcionales, limpios, modulares y accesibles (estados focus, disabled, loading y empty states claros).
- **Iconografía y librerías:** Consultar `package.json` para reutilizar las dependencias instaladas antes de proponer librerías nuevas.

## Comandos Habituales
- Servidor de desarrollo: `npm run dev` (o `yarn dev`)
- Build de verificación: `npm run build`
- Linter / Formato: `npm run lint`

## Convención de Trabajo
1. Analizar el componente original en `context-app/src/...`.
2. Proponer la mejora de UI/UX justificando cambios en accesibilidad, espaciado o jerarquía visual.
3. Generar el nuevo componente modularizado en `src/...`.