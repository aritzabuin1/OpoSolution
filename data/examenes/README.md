# Exámenes Oficiales — Auxiliar Administrativo del Estado

## Estructura de carpetas (convención de nombres)

```
data/examenes/
  2024/
    examen_modelo_a.pdf     ✅ Cuestionario modelo A — INAP 2024
    examen_modelo_b.pdf     ✅ Cuestionario modelo B — INAP 2024
    plantilla_a.pdf         ✅ Plantilla definitiva respuestas modelo A
    plantilla_b.pdf         ✅ Plantilla definitiva respuestas modelo B
    parsed_a.json           (generado por pnpm parse:examenes)
    parsed_b.json
  2022/
    examen.pdf              ✅ Cuestionario único — INAP 2022
    plantilla.pdf           ✅ Plantilla definitiva respuestas
    parsed.json
  2019/
    examen.pdf              ✅ Cuestionario ejercicio único 2019
    plantilla.pdf           ✅ Plantilla definitiva respuestas
    parsed.json
  2019_ext/                 (convocatoria extraordinaria 2019)
    examen.pdf              ✅ Cuestionario extraordinario 2019
    plantilla.pdf           ✅ Plantilla definitiva respuestas
    parsed_ext.json
  2018/
    examen_modelo_a.pdf     ✅ Cuestionario modelo A — INAP 2018
    examen_modelo_b.pdf     ✅ Cuestionario modelo B — INAP 2018
    plantilla_a.pdf         ✅ Plantilla definitiva respuestas modelo A
    plantilla_b.pdf         ✅ Plantilla definitiva respuestas modelo B
    parsed_a.json
    parsed_b.json
```

## Convención de nombres

| Tipo | Patrón | Descripción |
|------|--------|-------------|
| Cuestionario único | `examen.pdf` | Sin modelo (un solo cuestionario) |
| Cuestionario modelo A | `examen_modelo_a.pdf` | Modelo A del examen |
| Cuestionario modelo B | `examen_modelo_b.pdf` | Modelo B del examen |
| Plantilla única | `plantilla.pdf` | Respuestas definitivas únicas |
| Plantilla modelo A | `plantilla_a.pdf` | Respuestas modelo A |
| Plantilla modelo B | `plantilla_b.pdf` | Respuestas modelo B |

## Carpetas especiales

- `YYYY/` → turno `libre` (convocatoria libre ordinaria)
- `YYYY_ext/` → turno `extraordinaria` (ej: 2019 tuvo una convocatoria extraordinaria)
- El script detecta automáticamente el turno por el nombre de la carpeta

## Schema JSON de salida (parsed_*.json)

```json
{
  "convocatoria": "2024",
  "anno": 2024,
  "turno": "libre",
  "modelo": "A",
  "fuente_url": null,
  "total_preguntas": 100,
  "preguntas": [
    {
      "numero": 1,
      "enunciado": "Texto de la pregunta...",
      "opciones": ["opción 1", "opción 2", "opción 3", "opción 4"],
      "correcta": 0,
      "tema_numero": null
    }
  ]
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `convocatoria` | string | Año de la convocatoria |
| `anno` | number | Año numérico |
| `turno` | `"libre"` \| `"interna"` \| `"extraordinaria"` | Tipo de convocatoria |
| `modelo` | string \| null | Modelo del examen (A, B) o null si es único |
| `preguntas[].correcta` | 0\|1\|2\|3 | Índice de la respuesta correcta |
| `preguntas[].tema_numero` | number \| null | Tema del temario (null = sin mapear aún) |

## Cómo procesar los PDFs

```bash
# Parsear todos los exámenes disponibles
pnpm parse:examenes

# Parsear solo un año
pnpm parse:examenes 2024

# Parsear un año y modelo concreto
pnpm parse:examenes 2024 A

# Ingestar en Supabase (ejecutar parse primero)
pnpm ingest:examenes

# Ingestar solo un año
pnpm ingest:examenes 2024
```

## Estado de convocatorias

| Año | Tipo | Modelos | PDFs | JSON | Preguntas | Ingesta BD |
|-----|------|---------|------|------|-----------|-----------|
| 2024 | Libre | A + B | ✅ | ✅ `parsed_a.json` + `parsed_b.json` | 40+40 | ✅ (modelo B en BD — aplicar migration 021 para separar A/B) |
| 2022 | Libre | Único | ✅ | ✅ `parsed.json` | 60 | ✅ |
| 2019 | Libre | Único | ✅ | ✅ `parsed.json` | 60 | ✅ |
| 2019_ext | Extraordinaria | Único | ✅ | ✅ `parsed_ext.json` | 60 | ✅ |
| 2018 | Libre | A + B | ✅ | ❌ scanned images | — | ❌ (requiere OCR con `ANTHROPIC_API_KEY`) |

**Total en BD: 220 preguntas** (4 exámenes)

### Pendiente para completar §1.3

1. **[Aritz]** Aplicar migration 021 en Supabase Dashboard → SQL Editor:
   - Archivo: `optek/supabase/migrations/20260302_021_examenes_modelo.sql`
   - Luego re-ejecutar: `pnpm ingest:examenes 2024` para separar modelo A y B
2. **[ANTHROPIC_API_KEY]** Una vez configurada, ejecutar `pnpm parse:examenes 2018` para parsear los PDFs escaneados de 2018 A+B (170 preguntas adicionales)

> Requiere: `SUPABASE_SERVICE_ROLE_KEY` (para ingesta) y opcionalmente `ANTHROPIC_API_KEY` (fallback para PDFs escaneados).
