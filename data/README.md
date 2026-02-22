# data/legislacion — Legislación para OPTEK

## Propósito

Almacena la legislación consolidada del BOE necesaria para la preparación de oposiciones del **Cuerpo General Auxiliar de la Administración del Estado**.

Fuente: [BOE Código 435](https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=435) — "Normativa para ingreso en el Cuerpo General Auxiliar de la Administración del Estado" (actualizado 30/12/2025).

---

## Schema JSON

Cada archivo `data/legislacion/*.json` sigue este esquema:

```json
{
  "ley_nombre": "LPAC",
  "ley_codigo": "BOE-A-2015-10565",
  "ley_nombre_completo": "Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas",
  "fecha_scraping": "2026-02-22T10:00:00.000Z",
  "total_articulos": 133,
  "articulos": [
    {
      "numero": "1",
      "titulo_articulo": "Artículo 1. Objeto de la Ley.",
      "titulo_seccion": "TÍTULO PRELIMINAR — Disposiciones generales",
      "texto_integro": "1. La presente Ley tiene por objeto...\n\n2. Solo mediante ley..."
    }
  ]
}
```

### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `ley_nombre` | `string` | Abreviatura (e.g., `LPAC`, `CE`, `LRJSP`) |
| `ley_codigo` | `string` | ID BOE (e.g., `BOE-A-2015-10565`) |
| `ley_nombre_completo` | `string` | Nombre oficial completo |
| `fecha_scraping` | `string` | ISO 8601 timestamp del scraping |
| `total_articulos` | `number` | Número de artículos extraídos |
| `articulos[].numero` | `string` | Número del artículo (e.g., `"1"`, `"9 bis"`) |
| `articulos[].titulo_articulo` | `string` | Encabezado completo del artículo |
| `articulos[].titulo_seccion` | `string` | Ruta jerárquica: Título \| Capítulo \| Sección |
| `articulos[].texto_integro` | `string` | Texto completo del artículo (párrafos separados por `\n`) |

### Notas de formato

- **Encoding**: UTF-8
- **Artículos**: Incluye artículos numerados + disposiciones (adicionales, transitorias, finales, derogatorias)
- **texto_integro**: Texto limpio sin HTML. Párrafos separados por `\n`. Sin referencias de bloque `[Bloque X: ...]`.
- **titulo_seccion**: Vacío para artículos sin jerarquía de título/capítulo (preámbulo, disposiciones finales sin título).

---

## Leyes disponibles

| Archivo | Ley | BOE ID | Estado |
|---------|-----|--------|--------|
| `ley_39_2015_lpac.json` | Ley 39/2015 LPAC | BOE-A-2015-10565 | ✓ |
| `ley_40_2015_lrjsp.json` | Ley 40/2015 LRJSP | BOE-A-2015-10566 | ✓ |
| `constitucion_española_1978.json` | Constitución Española | BOE-A-1978-31229 | ✓ |

---

## Cómo regenerar

Desde `optek/`:
```bash
# Una ley concreta
pnpm scrape:boe LPAC

# Todas las leyes (respeta rate limit 1.2s entre requests)
pnpm scrape:boe
```

Script: `execution/boe-scraper.ts`
