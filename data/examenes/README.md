# Exámenes Oficiales — Auxiliar Administrativo del Estado

## Estructura de carpetas

```
data/examenes/
  2024/
    examen_modelo_a.pdf     # Cuestionario modelo A (descargado manualmente de INAP)
    plantilla_a.pdf         # Plantilla definitiva de respuestas modelo A
    examen_modelo_b.pdf     # Cuestionario modelo B
    plantilla_b.pdf         # Plantilla definitiva de respuestas modelo B
    parsed_a.json           # Output de parse-exam-pdf.ts (generado automáticamente)
    parsed_b.json
  2022/
    examen.pdf
    plantilla.pdf
    parsed.json
  2020/
    examen.pdf
    plantilla.pdf
    parsed.json
  2019/
    examen_modelo_a.pdf
    examen_modelo_b.pdf
    plantilla_a.pdf
    plantilla_b.pdf
    parsed_a.json
    parsed_b.json
```

## Schema JSON de salida (parsed_*.json)

```json
{
  "convocatoria": "2024",
  "anno": 2024,
  "turno": "libre",
  "modelo": "A",
  "fuente_url": "https://sede.inap.gob.es/...",
  "total_preguntas": 100,
  "preguntas": [
    {
      "numero": 1,
      "enunciado": "Texto de la pregunta...",
      "opciones": ["A) opción 1", "B) opción 2", "C) opción 3", "D) opción 4"],
      "correcta": 0,
      "tema_numero": 1
    }
  ]
}
```

### Campos obligatorios
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `convocatoria` | string | Año de la convocatoria (ej: "2024") |
| `anno` | number | Año numérico |
| `turno` | "libre" \| "interna" | Tipo de acceso |
| `modelo` | string \| null | Modelo del examen (A, B, Único) |
| `fuente_url` | string \| null | URL del PDF en INAP/BOE |
| `total_preguntas` | number | Número total de preguntas |
| `preguntas[].numero` | number | Número de pregunta (1-based) |
| `preguntas[].enunciado` | string | Texto de la pregunta |
| `preguntas[].opciones` | string[4] | Exactamente 4 opciones |
| `preguntas[].correcta` | 0\|1\|2\|3 | Índice de la respuesta correcta |
| `preguntas[].tema_numero` | number \| null | Tema del temario que cubre (null si no aplica) |

## Cómo descargar los PDFs (manual — robots.txt de INAP restringe scraping)

1. Ir a: https://sede.inap.gob.es/es/procesos-selectivos
2. Seleccionar: "Cuerpo General Auxiliar de la Administración del Estado"
3. Para cada convocatoria:
   - Descargar "Cuestionario" (examen_modelo_*.pdf)
   - Descargar "Plantilla definitiva de respuestas" (plantilla_*.pdf)
4. Colocar en la carpeta correspondiente (data/examenes/[año]/)

## Cómo procesar (después de descargar PDFs)

```bash
# Parsear un examen específico
pnpm parse:examenes 2024 A

# Parsear todos los disponibles
pnpm parse:examenes

# Ingestar en Supabase (ejecutar parse primero)
pnpm ingest:examenes
```

## Convocatorias disponibles

| Año | Turno | Modelos | Estado PDFs |
|-----|-------|---------|-------------|
| 2024 | Libre | A + B | ⬜ Pendiente descarga |
| 2022 | Libre | Único | ⬜ Pendiente descarga |
| 2020 | Libre | Único | ⬜ Pendiente descarga |
| 2019 | Libre | A + B | ⬜ Pendiente descarga |
