# Figma Variables Web App

Una aplicación web simple para visualizar y exportar variables locales de Figma usando la API de Figma Variables.

## 🚀 Características

- 🌐 **Interfaz Web**: Aplicación web moderna y responsive
- 📊 **Visualización**: Muestra variables y colecciones de forma organizada
- 📤 **Exportación**: Múltiples formatos de exportación (JSON, Token Studio, CSV)
- 🔍 **Filtros**: Búsqueda y filtrado de variables por tipo y ubicación
- 🎨 **UI Moderna**: Interfaz atractiva con diseño profesional

## 📁 Archivos del Proyecto

- `index.html` - Página principal de la aplicación
- `script.js` - Lógica de la aplicación y manejo de la API
- `styles.css` - Estilos y diseño de la interfaz
- `README.md` - Este archivo de documentación

## 🛠️ Instalación y Uso

1. **Descarga los archivos** del proyecto
2. **Abre `index.html`** en tu navegador web
3. **Ingresa tus credenciales**:
   - Token de acceso de Figma
   - File Key del archivo de Figma
4. **Haz clic en "Fetch Variables"** para cargar las variables
5. **Explora y exporta** las variables según necesites

## 🔑 Obtener Credenciales

### Token de Acceso de Figma
1. Ve a [Figma Developer Settings](https://www.figma.com/developers/api#access-tokens)
2. Crea un nuevo token de acceso personal
3. Copia el token (formato: `figd_...`)

### File Key
1. Abre tu archivo de Figma en el navegador
2. Copia la URL: `https://www.figma.com/file/FILE_KEY/nombre-del-archivo`
3. El FILE_KEY es la parte después de `/file/`

## 📤 Formatos de Exportación

### 1. Variables Mostradas
- Exporta exactamente las variables que se muestran en la UI
- Solo variables locales (no remotas)
- Valores resueltos y procesados
- Incluye metadatos completos

### 2. Token Studio
- Formato compatible con Token Studio
- Estructura jerárquica por categorías
- Ideal para herramientas de diseño

### 3. Figma Raw
- Respuesta completa de la API de Figma
- Sin procesamiento ni filtrado
- Para análisis técnico avanzado

### 4. CSV
- Formato de hoja de cálculo
- Ideal para análisis en Excel/Google Sheets
- Incluye todos los campos de las variables

## 🎯 Funcionalidades Principales

### Visualización
- **Colecciones**: Muestra todas las colecciones de variables locales
- **Variables**: Lista detallada de variables con valores por modo
- **Estadísticas**: Contadores de colecciones y variables

### Filtros y Búsqueda
- **Búsqueda**: Busca por nombre de variable o colección
- **Filtro por tipo**: COLOR, FLOAT, STRING, BOOLEAN
- **Filtro por ubicación**: Local vs Remoto

### Exportación
- **Múltiples formatos**: JSON, Token Studio, CSV
- **Descarga automática**: Los archivos se descargan automáticamente
- **Nombres únicos**: Incluye timestamp para evitar sobrescritura

## 🔧 Requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Cuenta de Figma con acceso a la API
- Token de acceso válido
- Acceso al archivo de Figma

## 🚨 Limitaciones

- Solo funciona con variables **locales** (no remotas)
- Requiere cuenta Enterprise de Figma para acceso completo a la API
- Las variables remotas se filtran automáticamente

## 🆘 Solución de Problemas

### Error 401 - No autorizado
- Verifica que tu token de acceso sea válido
- Asegúrate de que el token tenga los permisos necesarios

### Error 403 - Prohibido
- Verifica que tengas acceso al archivo de Figma
- Confirma que tu cuenta tenga permisos Enterprise

### Error 404 - No encontrado
- Verifica que el File Key sea correcto
- Asegúrate de que el archivo exista y sea accesible

### Variables no aparecen
- Usa el botón "Debug Valores" para diagnosticar
- Verifica que las variables sean locales (no remotas)
- Revisa la consola del navegador para errores

## 📝 Notas

- La aplicación funciona completamente en el navegador (sin servidor)
- Los datos se almacenan temporalmente en localStorage
- Compatible con CORS de la API de Figma

---

**¡Disfruta explorando tus variables de Figma!** 🎨