# Examenes Oficiales — Ertzaintza (Agente, Escala Basica)

## Formato
- ~40 preguntas (variable, decide tribunal)
- 4 opciones (A, B, C, D)
- Penalizacion: 1/3
- Tiempo: ~50 minutos

## Situacion (marzo 2026)

Los examenes oficiales de Ertzaintza son MUCHO mas dificiles de conseguir
que los de GC/PN. No se publican sistematicamente online.

### Promocion 35 (7 febrero 2026)
- Convocatoria: BOPV 226, 24/11/2025
- Examen realizado en BEC Barakaldo
- NO encontrado PDF publico del cuestionario

### Promocion 34
- Buscar en foros/academias vascas
- Espartero y Maroto: https://esparteroymaroto.com/promocion-35/

### Fuentes potenciales
- Gobierno Vasco: https://www.euskadi.eus/ertzaintza
- Espartero y Maroto: https://esparteroymaroto.com/oposiciones-ertzaintza/
- MAD: https://mad.es/oposiciones/172323_agente-escala-basica-policia-vasca-ertzaintza-y-policia-local.html
- OpositaTest: https://www.opositatest.com/oposiciones/cuerpos-de-policia-del-pais-vasco-ertzaintza-y-policia-local

## Alternativa MVP
Si no se encuentran examenes oficiales, la plataforma usara el fallback
a `free_question_bank` para simulacros de Ertzaintza. El mensaje en UI
dira "Simulacro basado en preguntas generadas por IA (examenes oficiales
no disponibles)".

## Instrucciones (si se consiguen PDFs)
1. Guardar como `YYYY/examen.pdf` y `YYYY/plantilla.pdf`
2. Ejecutar: `pnpm parse:examenes --dir examenes_ertzaintza YYYY`
3. Ingestar: `pnpm ingest:examenes --oposicion ertzaintza`
