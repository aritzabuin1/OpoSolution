# Contenido Bloque II — Ofimática e Informática

## Contexto

El **Bloque II** del temario de Auxiliar Administrativo del Estado (temas 17-28) cubre
administración electrónica, informática básica y Microsoft 365. Es el 50% de la Parte 2
del examen (50 preguntas de las 110 totales).

A diferencia del Bloque I (legislación), aquí no hay BOE — las fuentes son:
- **Microsoft Support/Learn** para temas de M365 (temas 22-28)
- **Normativa oficial** para administración electrónica (temas 17-21)

## Schema JSON esperado

```json
{
  "tema_nombre": "Word 365",
  "tema_numero": 24,
  "bloque": "ofimatica",
  "fuente_url": "https://support.microsoft.com/es-es/word",
  "secciones": [
    {
      "titulo": "Cómo insertar una tabla en Word",
      "contenido": "Para insertar una tabla: Pestaña Insertar > grupo Tablas > Tabla. Puedes arrastrar para seleccionar el tamaño o usar 'Insertar tabla' para especificar filas y columnas. Atajo: no hay atajo directo; usa Alt+N,T.",
      "subtema": "Tablas"
    }
  ]
}
```

### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tema_nombre` | string | Nombre del tema (ej: "Word 365") |
| `tema_numero` | number | Número del tema en el temario (17-28) |
| `bloque` | "ofimatica" \| "informatica" \| "admin_electronica" | Categoría técnica |
| `fuente_url` | string | URL de la fuente principal |
| `secciones[].titulo` | string | Título del chunk — debe ser autosuficiente como query de búsqueda |
| `secciones[].contenido` | string | Texto del chunk (máx ~2000 tokens). Preserva rutas de menú completas |
| `secciones[].subtema` | string | Agrupación dentro del tema (ej: "Tablas", "Atajos", "Fórmulas") |

## Regla de chunking CRÍTICA

**El chunking es por objeto funcional, NO por párrafo.**

❌ Mal: "Para acceder al portapapeles, ir a"... (párrafo cortado)
✅ Bien: "Portapapeles de Word: Pestaña Inicio > grupo Portapapeles. Comandos: Pegar (Ctrl+V), Copiar (Ctrl+C), Cortar (Ctrl+X), Pegado especial (Ctrl+Alt+V). El portapapeles de Office guarda hasta 24 elementos."

La razón: las preguntas de examen son tipo "¿En qué pestaña se encuentra X?" o "¿Cuál es el atajo para Y?". Si el chunk está cortado, el RAG no puede responder correctamente.

Ver [CHUNKING_STRATEGY.md](./CHUNKING_STRATEGY.md) para análisis detallado.

## Cómo generar el contenido (scraping + ingesta)

```bash
# Scraping de Microsoft Support (semi-automático)
pnpm scrape:ofimatica word      # Tema 24 — Word 365
pnpm scrape:ofimatica excel     # Tema 25 — Excel 365
pnpm scrape:ofimatica access    # Tema 26 — Access 365
pnpm scrape:ofimatica outlook   # Tema 27 — Outlook 365
pnpm scrape:ofimatica windows   # Tema 22-23 — Windows 11 + Copilot

# Ingestar todo en Supabase
pnpm ingest:ofimatica
```

## Temas y fuentes

| Tema | Título | Fuente | Bloque BD |
|------|--------|--------|-----------|
| 17 | Atención al público | INAP/normativa | admin_electronica |
| 18 | Servicios de información administrativa | INAP/normativa | admin_electronica |
| 19 | Documento, registro y archivo | INAP/normativa | admin_electronica |
| 20 | Administración electrónica | Ley 11/2007 + normativa | admin_electronica |
| 21 | Informática básica | Contenido educativo | informatica |
| 22 | Windows 11 y Copilot | Microsoft Support | ofimatica |
| 23 | Explorador de Windows | Microsoft Support | ofimatica |
| 24 | Word 365 | Microsoft Support/Learn | ofimatica |
| 25 | Excel 365 | Microsoft Support/Learn | ofimatica |
| 26 | Access 365 | Microsoft Support/Learn | ofimatica |
| 27 | Outlook 365 | Microsoft Support/Learn | ofimatica |
| 28 | Red Internet | Contenido educativo | informatica |
