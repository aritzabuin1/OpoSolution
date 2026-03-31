# Examenes Oficiales — Ertzaintza (Agente, Escala Basica)

## Formato
- ~40 preguntas (variable, decide tribunal)
- 4 opciones (A, B, C, D)
- Penalizacion: 1/3
- Tiempo: ~50 minutos

## Situacion (marzo 2026)

**Los examenes oficiales de Ertzaintza NO se publican online.**

A diferencia de GC y PN que publican cuestionarios y plantillas tras cada
convocatoria, el Gobierno Vasco / Academia de Arkaut NO publica los examenes
una vez realizados. Esto es un hecho conocido en la comunidad de opositores.

### Lo que NO existe online:
- PDFs de cuestionarios de promociones 33, 34, 35
- Plantillas de respuestas oficiales
- Examenes historicos accesibles

### Lo que SI existe:
- Temario oficial (BOPV): https://www.euskadi.eus/bopv2/datos/2024/02/2400927a.pdf
- Tests de practica de academias (NO son examenes oficiales):
  - Espartero y Maroto: https://esparteroymaroto.com/oposiciones-ertzaintza/
  - MAD (libro 1000+ preguntas): https://mad.es/oposiciones/172323_agente-escala-basica-policia-vasca-ertzaintza-y-policia-local.html
  - Ediciones Rodio (libro test): ISBN 9788418331497
  - OpositaTest: https://www.opositatest.com/oposiciones/cuerpos-de-policia-del-pais-vasco-ertzaintza-y-policia-local
  - Flou (test gratis online): https://oposicionesflou.com/test/ertzaintza/

## Estrategia para OpoRuta

Sin examenes oficiales, la plataforma usara:
1. **free_question_bank** (10 preguntas/tema generadas por IA) como base de simulacros
2. Mensaje en UI: "Simulacro generado por IA (los examenes oficiales de Ertzaintza
   no se publican). Basado en el temario oficial BOPV."
3. Los tests generados con IA (`generate-test`) siguen siendo funcionales
4. Si en el futuro se consiguen examenes, se pueden añadir sin cambios en el codigo

## Si consigues examenes (contacto directo con opositores/academias)
1. Guardar como `YYYY/examen.pdf` y `YYYY/plantilla.pdf`
2. Ejecutar: `pnpm parse:examenes --dir examenes_ertzaintza YYYY`
3. Ingestar: `pnpm ingest:examenes --dir examenes_ertzaintza --oposicion ertzaintza`
