# Estrategia de Chunking — Contenido Bloque II

## El problema: rutas de menú rotas

Microsoft Support está organizado como documentación técnica: una página puede tener 50+ secciones
pequeñas. Si hacemos chunking naïve por párrafo, obtenemos:

**Página:** "Insertar imágenes en Word"
**Párrafo 1:** "Para insertar una imagen, haz clic en la pestaña **Insertar**."
**Párrafo 2:** "En el grupo **Ilustraciones**, haz clic en **Imágenes**."
**Párrafo 3:** "Selecciona **Este dispositivo** para buscar en tu equipo."

→ Si el RAG recupera solo el párrafo 2, Claude no sabe que es "Insertar > Ilustraciones > Imágenes".
→ Las preguntas de examen: "¿En qué pestaña está el comando Imágenes?" requieren el contexto completo.

## La solución: chunking por objeto funcional completo

Un **objeto funcional** es una tarea de usuario completa e indivisible:
- "Insertar tabla en Word" → incluye TODO: ruta de menú completa + atajos + variantes
- "Filtrar datos en Excel" → incluye: ruta + tipos de filtro + cómo quitar el filtro

### Reglas de chunking

1. **Unidad mínima**: Una tarea de usuario que se puede aprender como unidad
2. **Tamaño objetivo**: 200-800 palabras por chunk (equiv. ~1 procedimiento con contexto)
3. **Máximo**: ~2000 tokens (≈1500 palabras) — si es más largo, dividir por subtarea
4. **Siempre incluir en el chunk**:
   - Ruta completa de menú (Pestaña > Grupo > Comando)
   - Atajo de teclado si existe
   - Variantes importantes (ej: diferencia entre "Pegar" y "Pegado especial")
5. **Título del chunk**: Debe ser una query de búsqueda válida en sí mismo
   - ✅ "Cómo insertar tabla en Word 365"
   - ✅ "Atajos de teclado de Word 365"
   - ✅ "Funciones SUMA y SUMA.SI en Excel"
   - ❌ "Insertar" (demasiado genérico)
   - ❌ "Paso 3 de cómo crear tabla" (no es autosuficiente)

## Estructura de chunks por tipo de contenido

### Para comandos de ribbon (pestañas/grupos/comandos)

```
TÍTULO: [Acción] en [Producto]
CONTENIDO:
  Ruta: [Pestaña] > [Grupo] > [Comando]
  Atajo: [Ctrl+X si existe]
  Descripción: [qué hace exactamente]
  Variantes: [si hay submenu o opciones]
  Nota: [casos especiales, versiones]
```

### Para procedimientos (tareas multi-paso)

```
TÍTULO: Cómo [hacer X] en [Producto]
CONTENIDO:
  Pasos:
    1. [Paso 1 con ruta de menú completa]
    2. [Paso 2]
    ...
  Resultado esperado: [qué pasa cuando se hace bien]
  Atajos alternativos: [si existen]
```

### Para conceptos (teoría + definición)

```
TÍTULO: [Concepto] en [contexto]
CONTENIDO:
  Definición: [qué es]
  Para qué sirve: [uso práctico]
  Cómo acceder: [ruta si aplica]
  Ejemplo: [caso concreto]
```

## Análisis de páginas de Microsoft Support

### Estructura típica de una página de Support

```html
<h1>Título de la página</h1>
<section>
  <h2>Subtítulo</h2>
  <p>Descripción...</p>
  <ol><li>Paso 1...</li><li>Paso 2...</li></ol>
  <p class="alert">Nota: ...</p>
</section>
<section>
  <h2>Otro subtítulo</h2>
  ...
</section>
```

**Estrategia de extracción:**
1. Seleccionar cada `<section>` con su `<h2>` como unidad candidata
2. Si la section es <200 palabras: combinar con la siguiente section del mismo tema
3. Si la section es >1500 palabras: dividir por `<h3>` o por pasos de lista numerada
4. Prefixar siempre con "Producto: [nombre]" para dar contexto a búsquedas

### Manejo de tablas de atajos de teclado

Las tablas de atajos son un caso especial: cada fila (atajo + descripción) es muy corta pero
hay 50-100 atajos por producto.

**Estrategia:** Agrupar en chunks temáticos:
- "Atajos de formato de texto en Word" (Ctrl+B, Ctrl+I, Ctrl+U, etc.)
- "Atajos de navegación en Word" (Ctrl+Inicio, Ctrl+Fin, etc.)
- "Atajos de tablas en Word" (Tab, Shift+Tab, etc.)

NO hacer un chunk gigante con todos los atajos del producto.

## Señales de calidad en el output

### Chunk de buena calidad
```json
{
  "titulo": "Insertar tabla en Word 365",
  "contenido": "Para insertar una tabla en Word 365:\n\nRuta: Pestaña Insertar > grupo Tablas > Tabla.\n\nOpciones:\n- Cuadrícula visual: arrastra para seleccionar número de filas/columnas\n- Insertar tabla: especifica dimensiones exactas y comportamiento de autoajuste\n- Dibujar tabla: dibuja manualmente celdas irregulares\n- Hoja de cálculo de Excel: inserta tabla de Excel incrustada\n- Tablas rápidas: plantillas predefinidas\n\nAtajos: No hay atajo de teclado directo para insertar tabla.\n\nPara agregar filas: presiona Tab en la última celda de la última fila.",
  "subtema": "Tablas"
}
```

### Chunk de mala calidad ❌
```json
{
  "titulo": "Tablas",
  "contenido": "Las tablas son una función útil. Para acceder, ir a la pestaña correspondiente.",
  "subtema": "Tablas"
}
```

## Fuentes validadas por tema

| Tema | URL principal | URL complementaria |
|------|-----------|-------------------|
| 22 (Windows 11) | https://support.microsoft.com/es-es/windows | - |
| 23 (Explorador) | https://support.microsoft.com/es-es/windows/explorador | - |
| 24 (Word) | https://support.microsoft.com/es-es/word | https://support.microsoft.com/es-es/office/atajos-de-teclado-de-word |
| 25 (Excel) | https://support.microsoft.com/es-es/excel | https://support.microsoft.com/es-es/office/funciones-de-excel |
| 26 (Access) | https://support.microsoft.com/es-es/access | - |
| 27 (Outlook) | https://support.microsoft.com/es-es/outlook | - |
| 28 (Internet) | Contenido educativo propio | - |
