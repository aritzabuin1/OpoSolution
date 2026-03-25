# Research: Auxilio Judicial 2026 — Datos verificados

> Fuentes: BOE-A-2025-27053, administraciondejusticia.com, formacion.ninja, opositatest.com, cejusticia.es
> Fecha: 2026-03-25

## Datos generales (CONFIRMADOS)

- Plazas turno libre: **425** (43 discapacidad)
- Convocatoria: Orden PJC/1549/2025, BOE 30/12/2025
- Fecha examen: Septiembre-Octubre 2026
- Titulacion: ESO o equivalente

## Examen — 2 ejercicios mismo dia

### Ejercicio 1 — Test teorico
| Aspecto | Valor |
|---------|-------|
| Preguntas | 100 + 4 reserva = 104 |
| Duracion | 100 minutos |
| Max puntos | 60 |
| Acierto | **+0.60** |
| Error | **-0.15 (1/4 del acierto)** |
| Min aprobar | 30 pts |

### Ejercicio 2 — Supuesto practico (test sobre casos)
| Aspecto | Valor |
|---------|-------|
| Preguntas | 40 + 2 reserva = 42 |
| Duracion | 60 minutos |
| Max puntos | 40 |
| Acierto | **+1.00** |
| Error | **-0.25 (1/4 del acierto)** |
| Min aprobar | 20 pts |

**CRITICO: La penalizacion es 1/4 del acierto, NO 1/3 como en AGE.**

## Temario — 26 temas (2 bloques)

### Bloque I — Organizacion (1-15) — VERIFICADO CORRECTO

Los 15 temas del spec coinciden con las fuentes. Discrepancias menores en titulos de T12-T14 (agrupacion diferente segun fuentes, pero contenido identico).

Temas afectados por LO 1/2025:
- T8: Tribunales de Instancia (confirmado)
- T10: Modernizacion Oficina Judicial (confirmado)

### Bloque II — Derecho Procesal (16-26) — DISCREPANCIA en T18-T21

**Nuestro spec (oposiciones-justicia-2026-oporuta.md):**
- T18 = Penal + Habeas Corpus + Contencioso + Laboral (todo junto)
- T19 = Actos procesales + plazos
- T20 = Recursos
- T21 = Expediente digital

**Fuentes academicas (formacion.ninja, opositatest, ADJ):**
- T18 = Procedimientos penales (LECrim solamente)
- T19 = Contencioso-administrativo (separado)
- T20 = Proceso laboral (separado)
- T21 = Actos procesales

**ACCION NECESARIA:** Descargar BOE PDF real (35pp) para verificar el Anexo VI.c exacto.
URL: https://www.boe.es/boe/dias/2025/12/30/pdfs/BOE-A-2025-27053.pdf

T22-T26 coinciden entre spec y fuentes.

## scoring_config para migration 049

```json
{
  "ejercicios": [
    {
      "nombre": "Test teorico",
      "preguntas": 100,
      "reserva": 4,
      "minutos": 100,
      "acierto": 0.60,
      "error": 0.15,
      "max": 60,
      "min_aprobado": 30,
      "penaliza": true,
      "ratio_penalizacion": "1/4"
    },
    {
      "nombre": "Supuesto practico",
      "preguntas": 40,
      "reserva": 2,
      "minutos": 60,
      "acierto": 1.00,
      "error": 0.25,
      "max": 40,
      "min_aprobado": 20,
      "penaliza": true,
      "ratio_penalizacion": "1/4"
    }
  ]
}
```
