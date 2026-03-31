# PLAN: Rama "Seguridad" — Ertzaintza + Guardia Civil + Policia Nacional

## Naming

- **Slug interno / rama BD / rutas**: `seguridad`
- **Nombre display (usuario)**: **"Fuerzas y Cuerpos de Seguridad"**
- **NO usar "FCSE"** (Fuerzas y Cuerpos de Seguridad del Estado) — excluye a Ertzaintza (policia autonomica)
- Base legal: LO 2/1986 distingue FCSE (GC+PN) vs Policias Autonomicas (Ertzaintza, Mossos...). El termino paraguas que engloba a todas es **FCS** (sin "del Estado")

## Context

OpoRuta tiene 5 ramas y 9 oposiciones. Anadimos rama **"Seguridad"** con 3 oposiciones.
TAM combinado: ~70.000-80.000 aspirantes/ano. Legislacion compartida significativa (~60%).
**Diferenciador unico**: Modulo de Personalidad Policial con IA (nadie lo ofrece en Espana).

---

## Datos verificados (BOE/BOPV)

| | Ertzaintza | Guardia Civil | Policia Nacional |
|---|---|---|---|
| **Slug** | `ertzaintza` | `guardia-civil` | `policia-nacional` |
| **Nivel** | C1 | C2 | C1 |
| **Temas** | 54 (11 bloques) | 25 (3 bloques) | 45 (3 bloques) |
| **Preguntas** | ~40 (variable, decide tribunal) | 100 (+5 reserva) | 100 |
| **Opciones** | 4 | 4 | **3** (unico en toda la plataforma) |
| **Penalizacion** | 1/3 | 1/3 | **1/2** |
| **Escala** | 0-150 | 0-100 | 0-10 |
| **Min aprobado** | 75 | 50 | 3 |
| **Publicacion** | BOPV | BOE | BOE |
| **Ref oficial** | BOPV 226 24/11/2025 | BOE-A-2025-10521 | BOE-A-2025-16610 |

---

## Pricing completo

| Producto | Precio | Creditos IA | Tipo |
|----------|--------|-------------|------|
| Pack Ertzaintza (conocimientos) | 79,99EUR | 20 creditos IA | Pago unico |
| Pack Guardia Civil (conocimientos) | 79,99EUR | 20 creditos IA | Pago unico |
| Pack Policia Nacional (conocimientos) | 79,99EUR | 20 creditos IA | Pago unico |
| Pack Doble GC+PN (conocimientos) | 129,99EUR | 30 creditos IA | Pago unico |
| **Pack Personalidad Policial** (transversal 3 opos) | **49,99EUR** | **15 creditos IA** | **Pago unico** |
| **Pack Completo** (1 oposicion + personalidad) | **119,99EUR** | 35 creditos IA | Pago unico |
| Recarga creditos IA (universal) | 9,99EUR | +10 creditos IA | **Recurrente** |

**DECISION**: Pool de creditos IA UNIFICADO (`corrections_balance`). No hay recarga separada de personalidad. La recarga de 9,99EUR ya existente sirve para TODO: tutor IA, explicar errores, sesiones de personalidad, coaching, etc. Un solo producto de recarga = menos friccion para el usuario y menos productos que gestionar en Stripe.

**Ingresos recurrentes**: La recarga unica de 9,99EUR sirve para todas las funcionalidades. Un usuario que practica entrevistas simuladas intensivamente comprara recargas del pool universal. El modulo de personalidad es transversal — sirve para Ertzaintza, GC y PN.

---

## Bugs y correcciones vs plan original

| Bug encontrado | Impacto | Correccion |
|---|---|---|
| UUIDs `g0` no son hex valido | CRITICO | Usar `ab/ac/ad` (ya corregido) |
| GC tiene 4 opciones (no 3) | CRITICO | Verificado contra BOE-A-2025-10521: 4 opciones con A,B,C,D |
| Pack doble es COMBO FIJO, no user-selectable | ALTO | Crear `pack_doble_gc_pn` fijo (GC+PN es el combo natural) |
| Cambiar `Pregunta.opciones` de tuple a `string[]` rompe 17 archivos | ALTO | Usar union type `[s,s,s] \| [s,s,s,s]` en tipos, Zod factory en schemas |
| 4 archivos acceden `opciones[3]` directamente | ALTO | Refactorizar a acceso dinamico |
| `QuestionView.tsx` LETRAS hardcoded `['A','B','C','D']` | ALTO | Generar dinamicamente con `String.fromCharCode(65+i)` |
| `explain-errores` hardcodea `D) ${opciones[3]}` | ALTO | Construir labels con `.map()` |
| Simulacro sin examenes oficiales devuelve 404 | MEDIO | Buscar examenes online + fallback a free_question_bank |
| `reto-diario.ts` RAMAS_CONFIG no tiene 'seguridad' | MEDIO | Anadir entrada con leyes compartidas |
| `conocimiento_tecnico.bloque` CHECK no incluye 'seguridad' | MEDIO | Migration para expandir constraint |
| Personalidad policial descartada como "imposible" | CRITICO | Investigacion demuestra que es viable, nadie lo ofrece, alto valor comercial |

---

## UUIDs

```
ab000000-0000-0000-0000-000000000001  -> Ertzaintza
ac000000-0000-0000-0000-000000000001  -> Guardia Civil
ad000000-0000-0000-0000-000000000001  -> Policia Nacional
```

---

## FASE 0 — Soporte 3 opciones (cross-cutting, solo PN) ✅ COMPLETADA

Solo Policia Nacional usa 3 opciones. Todos los demas siguen con 4.
Estrategia: `num_opciones` en `scoring_config` BD. Default = 4. Solo PN = 3.

### 0.1 — Helper getNumOpciones ✅
### 0.2 — Tipo Pregunta flexible ✅
### 0.3 — Tipo PsicotecnicoQuestion flexible ✅
### 0.4 — Schema Zod factory ✅ (`getPreguntaSchema` + `getTestGeneradoRawSchema`)
### 0.5 — Prompts parametrizados ✅ (`getSystemGenerateTest(nombre, numOpciones)`)
### 0.6 — generate-test.ts threading ✅ (`fetchOposicionInfo` incluye `numOpciones`)
### 0.7 — generate-test/route.ts fix ✅ (`Object.fromEntries` + `String.fromCharCode`)
### 0.8 — generate-simulacro/route.ts fix ✅ (5 hardcodes reemplazados)
### 0.9 — explain-errores fix ✅ (ambos route.ts y stream/route.ts)
### 0.10 — QuestionView.tsx UI ✅ (`getLetter(i)` dinamico)
### 0.11 — run-evals.ts fix ✅ (`>= 3 && <= 4`)
### 0.12 — Verificacion ✅ (0 regresiones, TypeScript limpio)

---

## FASE 1 — Migration SQL ✅ COMPLETADA

### 1.1 — Migration oposiciones ✅
- **Archivo**: `optek/supabase/migrations/20260331_070_seguridad_oposiciones.sql`
- 3x INSERT INTO oposiciones (UPSERT), `activa = false`

**Ertzaintza scoring_config**:
```json
{ "num_opciones": 4, "ejercicios": [{
  "nombre": "Prueba conocimientos", "preguntas": 40, "preguntas_variable": true,
  "reserva": 0, "minutos": 50, "acierto": 3.75, "error": 1.25,
  "max": 150, "min_aprobado": 75, "penaliza": true, "ratio_penalizacion": "1/3"
}]}
```

**Guardia Civil scoring_config**:
```json
{ "num_opciones": 4, "ejercicios": [{
  "nombre": "Conocimientos", "preguntas": 100, "reserva": 5, "minutos": 60,
  "acierto": 1.0, "error": 0.333, "max": 100, "min_aprobado": 50,
  "penaliza": true, "ratio_penalizacion": "1/3"
}]}
```

**Policia Nacional scoring_config**:
```json
{ "num_opciones": 3, "ejercicios": [{
  "nombre": "Cuestionario", "preguntas": 100, "reserva": 0, "minutos": 50,
  "acierto": 0.1, "error": 0.05, "max": 10, "min_aprobado": 3,
  "penaliza": true, "ratio_penalizacion": "1/2"
}]}
```

### 1.2 — Temas INSERT (124 total) ✅
- Ertzaintza: 54 temas, 11 bloques (temas 45-52 aproximados, pendiente BOPV PDF oficial)
- Guardia Civil: 25 temas, 3 bloques (A/B/C)
- Policia Nacional: 45 temas, 3 bloques (I/II/III)

### 1.3 — Expand conocimiento_tecnico bloque CHECK ✅
- `20260331_069_seguridad_bloque_check.sql`

### 1.4 — PAUSA: Aritz aplica migration en Supabase Dashboard ✅

---

## FASE 2 — Constantes y mapeos (10 archivos) ✅ COMPLETADA

### 2.1 — `lib/stripe/client.ts` ✅
- 3 UUID constants + 6 tiers (sin pack_doble_gc_pn_personalidad) + pool unificado corrections_balance

### 2.2 — `app/api/stripe/checkout/route.ts` ✅
### 2.3 — `app/api/stripe/webhook/route.ts` ✅
### 2.4 — `app/(dashboard)/cuenta/page.tsx` ✅
### 2.5 — `lib/utils/oposicion-display.ts` ✅
### 2.6 — `lib/ai/retrieval.ts` ✅
### 2.7 — `lib/ai/prompts.ts` ✅
### 2.8 — `lib/utils/simulacro-ranking.ts` ✅
### 2.9 — `lib/ai/reto-diario.ts` ✅
### 2.10 — `execution/tag-legislacion-temas.ts` ✅
- CODE_MAP += FCSE, SEG_CIUDADANA, SEG_PRIVADA, ESTATUTO_GERNIKA, LSV
- SEGURIDAD_RULES + ALL_RULES

### 2.11 — MOVIDO A FASE FINAL (ver FASE 12)

---

## FASE 3 — Legislacion ✅ COMPLETADA (ingesta + tag ejecutados 2026-03-31)

### 3.1 — Reutilizar ya ingestada ✅
CE, LPAC, LRJSP, LOPDGDD, LO 3/2007, LO 1/2004, PRL, TREBEP, LECrim

### 3.2 — Scraping BOE nueva ✅ (9 leyes, 1.348 articulos)
| Ley | BOE ID | Articulos | Oposiciones |
|-----|--------|-----------|-------------|
| LO 2/1986 FCSE | BOE-A-1986-6859 | 72 | GC, PN, Ertz |
| LO 4/2015 Seguridad Ciudadana | BOE-A-2015-3442 | 68 | Ertz, GC, PN |
| Ley 5/2014 Seguridad Privada | BOE-A-2014-3649 | 85 | GC, PN |
| RDL 6/2015 Ley Seguridad Vial | BOE-A-2015-11722 | 147 | Ertz, GC |
| LO 9/1983 Derecho Reunion | BOE-A-1983-19946 | 11 | Ertz |
| Ley 4/2015 Estatuto Victima | BOE-A-2015-4606 | 45 | PN |
| LO 3/1979 Estatuto Gernika | BOE-A-1979-30177 | 57 | Ertz |
| LO 10/1995 Codigo Penal | BOE-A-1995-25444 | 746 | GC, PN |
| LO 4/2000 Extranjeria | BOE-A-2000-544 | 117 | PN |

**Script**: `execution/scrape-leyes-seguridad.sh`

### 3.3 — Legislacion BOPV (Ertzaintza) ✅ COMPLETADA (5 leyes, 370 arts)
| Ley | Fuente | Articulos |
|-----|--------|-----------|
| DL 1/2023 Igualdad CAV | BOE-A-2023-9168 | 94 |
| DL 1/2020 Policía PV | BOE-A-2020-9740 | 172 |
| Ley 15/2012 Seg Euskadi | BOE-A-2012-9665 | 74 |
| D 168/1998 Videocámaras | BOPV (manual) | 22 |
| D 57/2015 Coordinación | BOPV (manual) | 8 |

SEGURIDAD_RULES expandidas: Ertzaintza ahora cubre 54 temas (Bloques I-XI)

### 3.4 — Ingesta + embeddings + tag ✅ (2026-03-31)
- `pnpm ingest:legislacion` → 11.396 artículos procesados
- `pnpm generate:embeddings` → todos ya tenían embedding
- `tag-legislacion-temas.ts --rama seguridad` → 3.935 artículos taggeados para 3 oposiciones

---

## FASE 4 — Examenes oficiales ✅ INVESTIGACION COMPLETADA (descarga manual pendiente)

### 4.1 — Guardia Civil ✅ fuentes documentadas
- **2024**: metodogc.com, serguardiacivil.es
- **2023**: divisayhonor.es, aspirantes.es, gesinpol.academy
- **Coleccion**: mad.es/blog/examenes-guardia-civil-pdf/
- **Oficial**: web.guardiacivil.es
- Directorios: `data/examenes_guardia_civil/2023/`, `data/examenes_guardia_civil/2024/`

### 4.2 — Policia Nacional ✅ fuentes documentadas
- **2025 (P41)**: jurispol.com, academiacentropolicianacional.es
- **2024 (P40)**: oposicionespolicianacional.com, academiacentropol.com
- **Coleccion 2021-2024**: elrincondelpolicia.es, academiaufpsevilla.com
- Directorios: `data/examenes_policia_nacional/2024/`, `data/examenes_policia_nacional/2025/`

### 4.3 — Ertzaintza ⚠️ dificil conseguir
- Examenes oficiales NO se publican sistematicamente online
- P35 (feb 2026): no encontrado PDF publico
- Alternativa MVP: fallback a free_question_bank
- Directorio: `data/examenes_ertzaintza/`

### 4.4 — PAUSA: Aritz descarga PDFs + parsea e ingesta ⏸️
```bash
# Guardia Civil
pnpm parse:examenes --dir examenes_guardia_civil 2023
pnpm parse:examenes --dir examenes_guardia_civil 2024
pnpm ingest:examenes --dir examenes_guardia_civil --oposicion guardia-civil

# Policia Nacional (CUIDADO: 3 opciones)
pnpm parse:examenes --dir examenes_policia_nacional 2024
pnpm parse:examenes --dir examenes_policia_nacional 2025
pnpm ingest:examenes --dir examenes_policia_nacional --oposicion policia-nacional

# Ertzaintza (si se consiguen)
pnpm parse:examenes --dir examenes_ertzaintza 2026
pnpm ingest:examenes --dir examenes_ertzaintza --oposicion ertzaintza
```

---

## FASE 5 — Contenido no legislativo (conocimiento_tecnico) ✅ COMPLETADA (2026-03-31)

### 5.1 — Ertzaintza temas 32-36 (Historia, Geografia, Demografia, Economia, Cultura PV)
### 5.2 — Guardia Civil temas 16-25 (Proteccion civil, Topografia, Sociologia, TIC, Telecoms, Automovilismo, Armamento, Primeros auxilios, Seguridad vial, Medio ambiente)
### 5.3 — Policia Nacional temas 27-44 (DDHH, Globalizacion, Sociologia, Psicologia, Comunicacion, Inmigracion, Cooperacion policial, Ortografia, Terrorismo, Seguridad ciudadana, Deontologia, TIC, Ciberseguridad, Transmisiones, Automocion, Armamento, Primeros auxilios, Seguridad vial)

### 5.4 — Generacion e ingesta
- ~33 temas no legislativos, summaries ~2000 palabras/tema
- `conocimiento_tecnico` con bloque = `'seguridad'`
- **Generador**: `execution/generate-conocimiento-seguridad.ts` (usa Claude API, ~$3-5)
- **Ingestor**: `execution/ingest-conocimiento-seguridad.ts` (sube a Supabase + embeddings)
- Coste: ~$3-5

### 5.5 — Generacion + ingesta ✅ (2026-03-31)
- `generate-conocimiento-seguridad.ts` → 33/33 JSONs generados (max_tokens bumped 4096→8192 para temas extensos)
- `ingest-conocimiento-seguridad.ts` → 196 secciones ingestadas con embeddings, 0 errores
- Nota: migration 069 (bloque CHECK) era prerequisito — sin ella el INSERT falla

---

## FASE 6 — Psicotecnicos nuevos (compartidos las 3) ✅ COMPLETADA

### 6.1 — Modulo espacial (`lib/psicotecnicos/spatial.ts`) ✅
- Subtipos: `rotacion_mental`, `espejo`, `coordenadas`, `secuencia_espacial`
- 100% determinista. 12 tests unitarios

### 6.2 — Modulo logica deductiva (`lib/psicotecnicos/logic.ts`) ✅
- Subtipos: `silogismo`, `condicional`, `conjuntos`, `negacion`
- 100% determinista. 14 tests unitarios (incluye verificacion logica por dificultad)

### 6.3 — Modulo percepcion (`lib/psicotecnicos/perception.ts`) ✅
- Subtipos: `conteo_simbolos`, `diferencias`, `patron_visual`
- 100% determinista. 9 tests unitarios (incluye verificacion conteo real)

### 6.4 — Tipos y orquestador ✅
- `types.ts`: 3 categorias + 11 subtipos nuevos
- `index.ts`: SEGURIDAD_DISTRIBUCION (espacial 20%, logica 10%, percepcion 15%, numerico 15%, series 15%, verbal 15%, organizacion 10%)
- `getDistribucionPsicotecnicos()` reconoce slugs ertzaintza/guardia-civil/policia-nacional
- 42 tests nuevos + 14 existentes = 56 tests OK, 0 regresiones, TypeScript limpio

### 6.5 — GC Ortografía ✅ COMPLETADA (determinista, $0)
Motor determinista de preguntas de ortografía para Guardia Civil.

- **Archivos**: `lib/ortografia/types.ts`, `lib/ortografia/bank.ts`, `lib/ortografia/index.ts`
- **Banco**: 210 items en 9 categorías (acentuación 33, b/v 25, h 24, g/j 25, ll/y 20, c/z/s 22, mayúsculas 22, puntuación 25, homófonos 25)
- **Distribución**: acentuación 20%, b/v 12%, h 12%, g/j 10%, ll/y 8%, c/z/s 8%, mayúsculas 10%, puntuación 10%, homófonos 10%
- **3 niveles dificultad**, 4 opciones por pregunta, explicación RAE
- **Tests**: 17 tests unitarios en `tests/unit/ortografia.test.ts`
- **Integración**: Ejercicio 1 de 3 en simulacro GC (25 preguntas)

### 6.6 — GC Inglés ✅ COMPLETADA (determinista, $0)
Motor determinista de preguntas de inglés A2-B1 para Guardia Civil.

- **Archivos**: `lib/ingles/types.ts`, `lib/ingles/bank.ts`, `lib/ingles/index.ts`
- **Banco**: 160 items en 9 categorías (grammar_tenses 25, grammar_prepositions 20, grammar_articles 15, grammar_comparatives 15, grammar_modals 15, grammar_conditionals 15, vocabulary_police 20, vocabulary_general 15, reading_comprehension 20)
- **Distribución**: tenses 15%, prepositions 10%, articles 8%, comparatives 7%, modals 10%, conditionals 10%, police vocab 15%, general vocab 10%, reading 15%
- **3 niveles dificultad**, 4 opciones, explicaciones en español
- **Vocabulario policial**: arrest, custody, forensics, warrant, surveillance, etc.
- **Tests**: 19 tests unitarios en `tests/unit/ingles.test.ts`
- **Integración**: Ejercicio 3 de 3 en simulacro GC (20 preguntas)

### 6.7 — Simulacro GC 3 ejercicios ✅ COMPLETADA
Estructura real del examen GC (140 min compartidos):
1. **Ortografía y gramática** (25 preguntas) — `tipo_ejercicio: 'ortografia'`
2. **Conocimientos** (100 preguntas + 5 reserva) — `tipo_ejercicio: 'conocimientos'`
3. **Lengua extranjera (Inglés)** (20 preguntas) — `tipo_ejercicio: 'ingles'`

- **Migration**: `20260401_075_gc_4_ejercicios.sql` — scoring_config con 3 ejercicios + features `ortografia: true, ingles: true`
- **Endpoint**: `generate-simulacro` acepta `incluirOrtografia` + `incluirIngles`, genera preguntas deterministas
- **UI**: SimulacroCard + SimulacroMixtoCard pasan `hasOrtografia/hasIngles` props, muestran estructura completa
- **Simulacros page**: detecta features `ortografia`/`ingles` y pasa props a cards

---

## FASE 7 — Free question bank

### 7.1 — Ertzaintza: 54 temas x 10 = 540q (~$3)
### 7.2 — Guardia Civil: 25 temas x 10 = 250q (~$1.50)
### 7.3 — Policia Nacional: 45 temas x 10 = 450q (~$2.50) — CRITICO: 3 opciones
### 7.4 — Verificar: `SELECT oposicion_id, COUNT(*) FROM free_question_bank GROUP BY oposicion_id` -> 1240 total

---

## FASE 8 — Landing pages + SEO ✅ COMPLETADA

### 8.1 — Hub rama: `oposiciones/seguridad/page.tsx` ✅ (3 cards + seccion Personalidad Policial)
### 8.2 — Sub-landing Ertzaintza: `oposiciones/seguridad/ertzaintza/page.tsx` ✅
### 8.3 — Sub-landing GC: `oposiciones/seguridad/guardia-civil/page.tsx` ✅
### 8.4 — Sub-landing PN: `oposiciones/seguridad/policia-nacional/page.tsx` ✅
### 8.5 — Landing personalidad: `oposiciones/seguridad/personalidad-policial/page.tsx` ✅
- "Primera plataforma en Espana con preparacion IA de personalidad policial"
- Badge "Proximamente" + early access CTA
### 8.6 — Main landing: card Seguridad + badge plazas + FAQ ✅
- Hub card sky-600, row 2 ahora 3 columnas (Hacienda + Penitenciarias + Seguridad)
- Mini price card, simulacros badges, blog section, FAQ actualizado (12 opos, 6 ramas, 18.000+ plazas)
### 8.7 — Precios: tab Seguridad con 7 plans ✅ (Gratis + 3 individuales + Doble GC+PN + Personalidad + Completo)
### 8.8 — Sitemap: 5 rutas nuevas ✅ (hub + 3 sub + personalidad)
### 8.9 — Footer: link Seguridad ✅
### 8.10 — llms.txt: seccion Seguridad + personalidad ✅

---

## FASE 9 — Blog SEO ✅ COMPLETADA (7 posts)

### 9.1 — `test-ertzaintza-2026-practica-online-gratis-ia` ✅
### 9.2 — `oposiciones-guardia-civil-2026-temario-plazas-examen` ✅
### 9.3 — `examen-policia-nacional-3-opciones-penalizacion` ✅
### 9.4 — `psicotecnicos-oposiciones-policia-2026` ✅
### 9.5 — `sueldo-guardia-civil-policia-nacional-2026` ✅
### 9.6 — `oporuta-vs-opositatest-oposiciones-policia` ✅
### 9.7 — `test-personalidad-policial-prueba-psicotecnica` ✅ (DIFERENCIADOR)
- Big Five, perfil ideal, lie scales, SJT, entrevista IA
- CTA directo al modulo de personalidad

---

## FASE 10 — Activacion (conocimientos)

### 10.1 — Checklist
- [x] Migration 069-072 aplicadas (2026-03-31), 073+075 aplicadas (2026-04-01)
- [x] Migration 073 (fix tiempos scoring_config) — aplicada
- [x] Migration 075 (GC 3 ejercicios + ortografía/inglés features) — aplicada 2026-04-01
- [ ] 6 productos Stripe + env vars
- [x] Legislacion ingestada + taggeada (11.396 arts, 3.935 taggeados)
- [x] Conocimiento técnico generado + ingestado (33 temas, 196 secciones)
- [ ] Free bank 1240 preguntas (~$7)
- [ ] Examenes oficiales ingestados
- [x] Landings publicadas (requisitos corregidos 2026-03-31: estaturas eliminadas, edades, euskera B2, plazas GC 3.118)
- [x] Blog 7 posts
- [x] Ortografía GC (210 items) + Inglés GC (160 items) — FASE 6.5-6.7 completadas
- [x] `pnpm test` (792/792) + `tsc --noEmit` OK

### 10.2 — PAUSA: `UPDATE oposiciones SET activa = true WHERE rama = 'seguridad'`
### 10.3 — Smoke test: registro -> test -> simulacro -> checkout (3 oposiciones)

---

## FASE 11 — Modulo Personalidad Policial (INNOVACION)

**Contexto**: Ninguna plataforma en Espana ofrece preparacion IA para tests de personalidad policial. Las academias cobran 80-200EUR por 4-8 sesiones presenciales. Oportunidad de mercado unica.

**Marco etico**: "Autoconocimiento policial" — analogia fitness: no ensenamos a hacer trampas, ayudamos a PONERSE EN FORMA. Disclaimer: "herramienta de practica, no sustituye evaluacion profesional". Items originales IPIP (dominio publico), no copias de MMPI-2/16PF/NEO-PI-R.

### 11.1 — Migration BD (`071_personalidad_policial.sql`) ✅
- **Archivo**: `supabase/migrations/20260331_071_personalidad_policial.sql`
- Tabla `personalidad_sesiones` (id, user_id, tipo, oposicion_id, respuestas JSONB, scores JSONB, validity JSONB, completed, timestamps)
- Tabla `personalidad_consistencia` (id, user_id, dimension, sesion_id FK, t_score, created_at)
- RPC `use_personality_credit` (reutiliza corrections_balance — pool unificado)
- RLS policies + indexes

### 11.2 — Banco de items IPIP (one-time) ✅
- **Archivo**: `data/personalidad/ipip_items.json`
- 240 items Big Five (5 dimensiones x 6 facetas x 8 items, 120 reversed)
- 15 items validez (8 social desirability + 7 infrequency)
- 20 pares consistencia (10 same + 10 opposite, 4 por dimension)
- Fuente: International Personality Item Pool (dominio publico, ipip.ori.org)
- Traduccion al espanol
- Tipos: `optek/lib/personalidad/types.ts`

### 11.3 — Motor de scoring determinista ($0 por sesion) ✅
- **Archivo**: `optek/lib/personalidad/scoring.ts`
- reverseScore, scoreFacet, scoreDimension, computePoliceFit, computeBigFiveProfile
- NORMS (O/C/E/A/N), POLICE_PROFILE (ideal T-scores + tolerancias)
- **Tests**: 17 tests unitarios (`personalidad-scoring.test.ts`)

### 11.4 — Escalas de validez (determinista) ✅
- **Archivo**: `optek/lib/personalidad/validity.ts`
- scoreSocialDesirability (ratio 4+), scoreInfrequency (count <=2), scoreConsistency (VRIN pairs), scoreAcquiescence (ratio 4+)
- computeValidity: agrega escalas, flags en espanol, THRESHOLDS configurables
- **Tests**: 13 tests unitarios (`personalidad-validity.test.ts`)

### 11.5 — Testing Adaptativo CAT (determinista) ✅
- **Archivo**: `optek/lib/personalidad/adaptive.ts`
- GRM simplificado: sesion 1 = 80 items, seguimiento = 20 items
- selectNextItem: prioriza dimension con menos items, maximiza informacion
- processResponse: inmutable, theta = media de respuestas scored por dimension
- **Tests**: 20 tests unitarios (`personalidad-adaptive.test.ts`)

### 11.6 — Consistencia cross-sesion (determinista, KILLER FEATURE) ✅
- **Archivo**: `optek/lib/personalidad/consistency-tracker.ts`
- computeDimensionDeltas (flag |delta| > 10), pearsonCorrelation, computeProfileCorrelation
- detectTrend: stable/improving/volatile (3+ sesiones)
- computeOverallConsistency: 0-100 con penalizaciones
- analyzeConsistency: entry point, maneja 0/1/2+ sesiones
- **Tests**: 13 tests unitarios (`personalidad-consistency.test.ts`)

### 11.7 — SJT: Juicio Situacional (IA) ✅
- **Lib**: `lib/personalidad/sjt.ts` (prompts por cuerpo, Spearman footrule scoring)
- **Endpoint**: `POST /api/personalidad/sjt` (generate + score modes)
- Adaptado: Ertzaintza (vasco/bilingue), GC (rural/militar), PN (urbano)
- 1 credito por escenario, ~$0.02

### 11.8 — Entrevista simulada (IA streaming) ✅
- **Lib**: `lib/personalidad/interview.ts` (system prompt + feedback prompt)
- **Endpoint**: `POST /api/personalidad/interview/stream`
- Psicologo del tribunal con acceso al perfil Big Five
- 1 credito por sesion (follow-up gratis), ~$0.20/sesion

### 11.9 — Gap Analysis + Coaching (IA) ✅
- **Lib**: `lib/personalidad/coaching.ts` (evidence-based, POLICE_PROFILE)
- **Endpoint**: `POST /api/personalidad/coaching/stream`
- Informe personalizado + plan semanal, 1 credito, ~$0.03

### 11.10 — UI: Pagina /personalidad-policial ✅
- **Page**: `app/(dashboard)/personalidad-policial/page.tsx` (server component)
- **Hub**: `PersonalidadHub.tsx` — 5 tabs (Assessment, Perfil, SJT, Entrevista, Coaching)
- **Assessment**: `PersonalidadAssessment.tsx` — cuestionario CAT adaptativo con Likert 1-5
- **Perfil**: `PerfilRadar.tsx` — dimension cards con T-score bars + ideal markers + fit labels
- **SJT**: `SJTCard.tsx` — tap-to-rank escenarios policiales
- **Entrevista/Coaching**: cards placeholder con CTA
- **Endpoint assessment**: `POST /api/personalidad/assessment` (init + respond, CAT engine)
- **Sidebar**: Shield icon + "Personalidad" (PRO badge, featureKey: personalidad)
- **Navbar**: idem

### 11.11 — Verificacion modulo personalidad ⏸️
- 63 tests unitarios pasan (scoring, validity, CAT, consistency)
- TypeScript compila limpio (0 errores)
- Smoke test pendiente: requiere migration aplicada + .env.local

---

## Orden de ejecucion y paralelismo

```
FASE 0 (3-opciones) --------+
FASE 1 (migration) ---------+-- paralelo           ✅ DONE
                             |
                       PAUSA: migration              ✅ DONE
                             |
FASE 2 (constantes) --------+
FASE 3 (legislacion) -------+-- paralelo            ✅ DONE
FASE 4 (examenes online) ---+
                             |
FASE 5 (conocimiento) ------+
FASE 6 (psicotecnicos) -----+-- paralelo            ✅ DONE
                             |
FASE 6.5 (ortografía GC) ---+
FASE 6.6 (inglés GC) -------+-- paralelo            ✅ DONE
FASE 6.7 (simulacro 3 ej) --+
                             |
FASE 7 (free bank) <--- depende de 3+5              ⏳ PENDIENTE (~$7)
                             |
FASE 8 (landings) ----------+
FASE 9 (blog) --------------+-- paralelo            ✅ DONE
                             |
FASE 10 (activacion) PAUSA                          ⏳ PENDIENTE
                             |
FASE 11 (personalidad) -----+                       ✅ DONE
                             |
FASE 12 (Stripe) — Aritz crea productos + env vars  ⏳ PENDIENTE
                             |
                       PAUSA: activar todo
```

---

## Coste estimado total

| Concepto | Coste | Tipo |
|----------|-------|------|
| Free bank (1240 preguntas) | ~$7-8 | One-time |
| Conocimiento tecnico (33 temas) | ~$3-5 | One-time |
| Banco items IPIP (traduccion/verificacion) | ~$5-10 | One-time |
| Legislacion scraping | $0 | Determinista |
| Psicotecnicos (3 modulos) | $0 | Determinista |
| Personalidad scoring | $0 | Determinista |
| **Total setup** | **~$15-23** | |
| | | |
| **Por usuario personalidad (heavy)** | **~$2-3** | Variable |
| **Margen personalidad (49,99EUR)** | **~94-96%** | |
| **Recarga personalidad (9,99EUR)** | **~97%** | Recurrente |

---

## Scope MVP (TODO incluido en lanzamiento)

**FASE 0-13 (todo incluido en lanzamiento):**
- Soporte 3 opciones (PN)
- 3 oposiciones activas con tests + simulacros + psicotécnicos
- **Ortografía GC** (módulo determinista, ~200 items) — FASE 6.5
- **Inglés GC** (módulo determinista, ~150 items) — FASE 6.6
- **Simulacro GC completo 140 min** (ortografía + gramática + conocimientos + inglés) — FASE 6.7
- Free bank 1240 preguntas
- Exámenes oficiales (los que se encuentren)
- Landings + pricing + blog 7 posts
- Módulo Personalidad Policial completo (Big Five + SJT + Entrevista IA + Coaching + CAT)
- **"Estudiar"** (resúmenes IA por ley, on-demand, coste $0 inicial, compartido entre oposiciones) — FASE 13

**FASE 12 — Stripe (Aritz manual, antes de activar):**
- [ ] Crear 6 productos Stripe:
  1. Pack Ertzaintza — 79,99€ → `STRIPE_PRICE_PACK_ERTZAINTZA`
  2. Pack Guardia Civil — 79,99€ → `STRIPE_PRICE_PACK_GUARDIA_CIVIL`
  3. Pack Policía Nacional — 79,99€ → `STRIPE_PRICE_PACK_POLICIA_NACIONAL`
  4. Pack Doble GC+PN — 129,99€ → `STRIPE_PRICE_PACK_DOBLE_GC_PN`
  5. Pack Personalidad Policial — 49,99€ → `STRIPE_PRICE_PACK_PERSONALIDAD`
  6. Pack Completo Seguridad — 119,99€ → `STRIPE_PRICE_PACK_COMPLETO_SEGURIDAD`
- [ ] Añadir env vars en Vercel con los price IDs
- [ ] Verificar checkout flow para cada producto

**Post-lanzamiento:**
- BOPV watcher
- Más exámenes oficiales

---

## Progreso global (actualizado 2026-04-01)

| FASE | Estado | Notas |
|------|--------|-------|
| 0 — Soporte 3 opciones | ✅ COMPLETADA | 12 sub-tareas, 0 regresiones |
| 1 — Migration SQL | ✅ COMPLETADA | 3 oposiciones + 124 temas insertados |
| 2 — Constantes y mapeos | ✅ COMPLETADA | 10 archivos actualizados |
| 3 — Legislacion | ✅ COMPLETADA | 11.396 arts ingesta + 3.935 taggeados para seguridad |
| 4 — Examenes oficiales | ✅ INVESTIGACION OK | URLs documentadas. **Pendiente**: Aritz descarga PDFs + parsea |
| 5 — Conocimiento tecnico | ✅ COMPLETADA | 33 temas generados (Claude) + 196 secciones ingestadas con embeddings |
| 6 — Psicotecnicos nuevos | ✅ COMPLETADA | 3 modulos (spatial/logic/perception), 11 subtipos, 42 tests |
| 6.5 — Ortografía GC | ✅ COMPLETADA | 210 items, 9 categorías, 17 tests |
| 6.6 — Inglés GC | ✅ COMPLETADA | 160 items, 9 categorías A2-B1, 19 tests |
| 6.7 — Simulacro GC 3 ejercicios | ✅ COMPLETADA | Migration 075 + endpoint + UI. 792/792 tests |
| 7 — Free question bank | ⏳ PENDIENTE | Script listo. FASE 3+5 ya ingestadas. Requiere ~$7 + ADMIN_USER_ID |
| 8 — Landing pages + SEO | ✅ COMPLETADA | 5 landings + main card + precios tab + sitemap + footer + llms.txt. Requisitos corregidos (estaturas, edades, euskera, plazas) |
| 9 — Blog SEO | ✅ COMPLETADA | 7 posts. Blog GC corregido (estatura eliminada) |
| 10 — Activacion | ⏳ PENDIENTE | Migrations 073+075 ✅ aplicadas. Falta: Stripe + free bank + activar |
| 11 — Personalidad Policial | ✅ COMPLETADA | Migration 071 aplicada + 5 libs + 4 endpoints + UI + 63 tests |
| 12 — Stripe | ⏳ PENDIENTE | Aritz crea 6 productos + env vars |
| 13 — "Estudiar" | ⏳ PENDIENTE | Resúmenes IA on-demand por ley, premium, compartido cross-oposición, coste $0 inicial |

---

## GUIA DEPLOY ESTA NOCHE (con .env.local)

### Paso 0 — Pull y verificar
```bash
cd /workspaces/OpoSolution/optek
git pull
pnpm install
pnpm test        # 63 personalidad + rest OK
npx tsc --noEmit # 0 errores
```

### Paso 1 — Aplicar migrations en Supabase Dashboard
1. Ir a Supabase Dashboard → SQL Editor
2. Copiar y ejecutar EN ORDEN:
   - `supabase/migrations/20260331_069_seguridad_bloque_check.sql`
   - `supabase/migrations/20260331_070_seguridad_oposiciones.sql`
   - `supabase/migrations/20260331_071_personalidad_policial.sql`
3. Verificar: `SELECT COUNT(*) FROM oposiciones WHERE rama = 'seguridad'` → 3

### Paso 2 — Crear productos Stripe (6)
En Stripe Dashboard → Products:
1. Pack Ertzaintza — 79,99€ one-time → copiar price_id
2. Pack Guardia Civil — 79,99€ one-time
3. Pack Policía Nacional — 79,99€ one-time
4. Pack Doble GC+PN — 129,99€ one-time
5. Pack Personalidad Policial — 49,99€ one-time
6. Pack Completo Seguridad — 119,99€ one-time

Añadir en `.env.local` y en Vercel:
```
STRIPE_PRICE_PACK_ERTZAINTZA=price_xxx
STRIPE_PRICE_PACK_GUARDIA_CIVIL=price_xxx
STRIPE_PRICE_PACK_POLICIA_NACIONAL=price_xxx
STRIPE_PRICE_PACK_DOBLE_GC_PN=price_xxx
STRIPE_PRICE_PACK_PERSONALIDAD=price_xxx
STRIPE_PRICE_PACK_COMPLETO_SEGURIDAD=price_xxx
```

### Paso 3 — Ingesta legislacion (~5 min)
```bash
pnpm ingest:legislacion
pnpm generate:embeddings
pnpm tag:legislacion --rama seguridad --dry-run
pnpm tag:legislacion --rama seguridad
```

### Paso 4 — Generar conocimiento tecnico (~$3-5, ~10 min)
```bash
pnpm tsx execution/generate-conocimiento-seguridad.ts
pnpm tsx execution/ingest-conocimiento-seguridad.ts
```

### Paso 5 — Free question bank (~$7, ~15 min)
```bash
pnpm tsx execution/generate-free-bank.ts --oposicion ertzaintza --user-id TU_UUID
pnpm tsx execution/generate-free-bank.ts --oposicion guardia-civil --user-id TU_UUID
pnpm tsx execution/generate-free-bank.ts --oposicion policia-nacional --user-id TU_UUID
```
Verificar: `SELECT oposicion_id, COUNT(*) FROM free_question_bank GROUP BY oposicion_id`

### Paso 6 — Activar oposiciones
```sql
UPDATE oposiciones SET activa = true WHERE rama = 'seguridad';
-- Añadir feature personalidad para las 3 oposiciones de seguridad:
UPDATE oposiciones SET features = features || '{"personalidad": true}'::jsonb WHERE rama = 'seguridad';
```

### Paso 7 — Build y deploy
```bash
pnpm build       # verificar que compila
git push         # Vercel auto-deploy
```

### Paso 8 — Smoke test
- [ ] Registro nuevo usuario → seleccionar Ertzaintza
- [ ] Test gratuito → completar → ver resultado
- [ ] Simulacro (si hay examenes)
- [ ] Checkout Ertzaintza → verificar Stripe
- [ ] /personalidad-policial → completar assessment → ver perfil
- [ ] SJT → generar escenario → rankear → ver score
- [ ] Repetir para GC y PN

### Tiempo estimado: ~45-60 min (la mayor parte es esperar generacion IA)

---

## FASE 13 — "Estudiar" (feature premium transversal, coste inicial ~$0.10)

**Origen**: Feedback de usuaria real: "No veo explicaciones de cada ley. Unos apuntes sobre la ley 39/2015 para ya luego hacer los tests sobre lo aprendido."

**Principio UX**: El usuario piensa en TEMAS, no en leyes. Quiere estudiar "Tema 2" antes de hacer el test del "Tema 2". Pero internamente almacenamos por ley para reutilizar entre oposiciones.

**Principio económico**: Coste inicial ~$0.10 (2 bloques pre-generados para free users). El resto lo generan los propios usuarios premium on-demand. Una vez generado un bloque, se cachea en BD para TODOS los premium de TODAS las oposiciones que compartan esa ley.

---

### Arquitectura: presentar por tema, almacenar por ley

**Lo que ve el usuario** (presentación por tema):
```
/estudiar → Tema 2: Derechos Fundamentales
  ├── CE arts. 14-29 (Derechos Fundamentales)     ✅ Disponible
  ├── CEDH arts. 1-18 (Convenio Europeo)           🔒 Generar resumen
  └── [Hacer test del Tema 2]
```

**Lo que guarda la BD** (almacenamiento por ley):
```
resumen_legislacion:
  ley='CE', rango='14-29', contenido='...' → se muestra en Ertzaintza T2, GC T1, PN T1, C2 T1...
```

**Cómo conecta**: La tabla `legislacion` ya tiene `tema_ids[]` (array de UUIDs de temas, poblado por `tag-legislacion-temas.ts`). Al abrir "Estudiar Tema X":
1. Consultar `legislacion WHERE tema_ids @> ARRAY[tema_uuid]` → obtener las leyes del tema
2. Agrupar artículos por ley + bloque lógico (usando `lib/estudiar/agrupaciones.ts`)
3. Para cada bloque: buscar si existe resumen en `resumen_legislacion` → si sí, mostrar; si no, botón "Generar"

**¿Es complejo?** No. Es un SELECT + un GROUP BY en la misma query. La tabla `legislacion` ya tiene los datos, las agrupaciones son un mapa estático. No hay JOINs complejos.

---

### Tabla nueva: `resumen_legislacion`

```sql
CREATE TABLE resumen_legislacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ley_nombre TEXT NOT NULL,           -- 'CE', 'LPAC', 'CP' (mismo que legislacion.ley_nombre)
  rango TEXT NOT NULL,                -- '14-29', '53-67', '1-10'
  titulo TEXT NOT NULL,               -- 'Derechos Fundamentales (CE arts. 14-29)'
  contenido TEXT NOT NULL,            -- ~2000 palabras, markdown
  generated_by UUID REFERENCES auth.users(id),
  prompt_version TEXT NOT NULL DEFAULT '1.0.0',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ley_nombre, rango)
);

CREATE INDEX idx_resumen_ley ON resumen_legislacion(ley_nombre);

-- RLS: cualquier autenticado puede leer (el gating es en la app, no en RLS)
-- INSERT solo via service client (el endpoint del servidor inserta)
ALTER TABLE resumen_legislacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_authenticated" ON resumen_legislacion FOR SELECT TO authenticated USING (true);
```

---

### 13.1 — Migration BD
- **Archivo**: `supabase/migrations/20260401_074_estudiar.sql`
- Tabla `resumen_legislacion` como arriba
- Index en `ley_nombre` para lookup rápido
- RLS: SELECT para authenticated, INSERT/UPDATE solo service role

### 13.2 — Agrupaciones estáticas (`lib/estudiar/agrupaciones.ts`)

Mapa estático que define cómo agrupar artículos de cada ley en bloques lógicos de estudio.
Se deriva de los títulos/capítulos de la propia ley (ya disponible en `legislacion.titulo_capitulo`).

```typescript
export interface BloqueEstudio {
  ley: string              // 'CE', 'LPAC', 'CP'
  rango: string            // '14-29'
  titulo: string           // 'Derechos Fundamentales'
  articulosAprox: number   // ~16 (para estimar coste/tiempo)
}

// Mapa: ley → bloques
export const AGRUPACIONES: Record<string, BloqueEstudio[]> = {
  CE: [
    { ley: 'CE', rango: 'Preliminar-9', titulo: 'Título Preliminar y valores superiores', articulosAprox: 9 },
    { ley: 'CE', rango: '10-13', titulo: 'Derechos y Libertades — Principios generales', articulosAprox: 4 },
    { ley: 'CE', rango: '14-29', titulo: 'Derechos Fundamentales y Libertades Públicas', articulosAprox: 16 },
    { ley: 'CE', rango: '30-38', titulo: 'Derechos y deberes de los ciudadanos', articulosAprox: 9 },
    { ley: 'CE', rango: '39-52', titulo: 'Principios rectores de la política social', articulosAprox: 14 },
    { ley: 'CE', rango: '53-55', titulo: 'Garantías de las libertades y derechos', articulosAprox: 3 },
    { ley: 'CE', rango: '56-65', titulo: 'La Corona', articulosAprox: 10 },
    { ley: 'CE', rango: '66-96', titulo: 'Las Cortes Generales y el Gobierno', articulosAprox: 31 },
    { ley: 'CE', rango: '97-107', titulo: 'Gobierno y Administración', articulosAprox: 11 },
    { ley: 'CE', rango: '117-127', titulo: 'Poder Judicial', articulosAprox: 11 },
    { ley: 'CE', rango: '137-158', titulo: 'Organización Territorial del Estado', articulosAprox: 22 },
    { ley: 'CE', rango: '159-165', titulo: 'Tribunal Constitucional', articulosAprox: 7 },
    { ley: 'CE', rango: '166-169', titulo: 'Reforma Constitucional', articulosAprox: 4 },
  ],
  LPAC: [
    { ley: 'LPAC', rango: '1-12', titulo: 'Disposiciones generales y derechos', articulosAprox: 12 },
    { ley: 'LPAC', rango: '13-28', titulo: 'Actividad de las Administraciones (capacidad, abstención, acceso)', articulosAprox: 16 },
    { ley: 'LPAC', rango: '29-33', titulo: 'Obligación de resolver y silencio', articulosAprox: 5 },
    { ley: 'LPAC', rango: '34-52', titulo: 'Acto administrativo (requisitos, eficacia, nulidad)', articulosAprox: 19 },
    { ley: 'LPAC', rango: '53-67', titulo: 'Procedimiento administrativo común', articulosAprox: 15 },
    { ley: 'LPAC', rango: '68-95', titulo: 'Iniciación, ordenación, instrucción, finalización', articulosAprox: 28 },
    { ley: 'LPAC', rango: '96-105', titulo: 'Ejecución forzosa y sancionador', articulosAprox: 10 },
    { ley: 'LPAC', rango: '106-126', titulo: 'Revisión de actos y recursos', articulosAprox: 21 },
  ],
  // ... resto de leyes: LRJSP, TREBEP, CP, FCSE, SEG_CIUDADANA, etc.
  // Se completa durante implementación consultando legislacion.titulo_capitulo
}
```

**Estimación total**: ~30-40 leyes × 5-10 bloques = ~200-300 bloques en toda la plataforma.
**Generación**: on-demand. Solo se genera un bloque cuando un premium lo pide por primera vez.

### 13.3 — Resolver bloques por tema (`lib/estudiar/resolver.ts`)

Función que dado un `temaId`, devuelve los bloques de estudio disponibles con su estado (generado o no).

```typescript
export interface BloqueConEstado {
  ley: string
  rango: string
  titulo: string
  tituloCompleto: string   // 'Constitución Española — Derechos Fundamentales (arts. 14-29)'
  generado: boolean
  contenido?: string       // solo si generado=true
  articulosCount: number   // artículos reales en BD para este bloque
}

export async function resolverBloquesPorTema(
  supabase: SupabaseClient,
  temaId: string
): Promise<BloqueConEstado[]>
```

**Lógica interna**:
1. `SELECT DISTINCT ley_nombre FROM legislacion WHERE tema_ids @> ARRAY[temaId]` → leyes del tema
2. Para cada ley, buscar en `AGRUPACIONES[ley]` los bloques que intersectan con los artículos taggeados
3. `SELECT ley_nombre, rango, contenido FROM resumen_legislacion WHERE ley_nombre IN (...)` → qué ya está generado
4. Merge y retornar array ordenado por ley + rango

### 13.4 — Prompt de generación (`lib/estudiar/prompts.ts`)

```typescript
export const SYSTEM_ESTUDIAR = `Eres un profesor de oposiciones experto en legislación española.
Tu tarea es crear un RESUMEN DIDÁCTICO de los artículos proporcionados.

ESTRUCTURA OBLIGATORIA del resumen (~2000 palabras):
1. **Contexto**: Para qué sirve esta sección de la ley (2-3 frases)
2. **Conceptos clave**: Lista con definiciones claras
3. **Esquema visual**: Estructura jerárquica del contenido (usar indentación markdown)
4. **Artículos más preguntados**: Los 3-5 artículos que más caen en examen, con su contenido resumido
5. **Trampas frecuentes**: Errores típicos en preguntas tipo test sobre estos artículos
6. **Reglas mnemotécnicas**: Trucos para recordar plazos, cifras, excepciones
7. **Conexiones**: Relación con otros artículos/leyes del temario

REGLAS:
- Usa lenguaje claro y directo, no académico
- Resalta plazos y cifras en **negrita**
- Cada concepto debe poder convertirse en una pregunta tipo test
- NO copies el texto literal de los artículos — resume y explica
- Incluye ejemplos prácticos cuando ayuden a entender`

export function buildEstudiarPrompt(
  leyNombre: string,
  rango: string,
  titulo: string,
  articulos: { numero: string; texto_integro: string; titulo_capitulo: string }[]
): string {
  return `Resume los siguientes artículos de ${leyNombre} (${titulo}, arts. ${rango}):

${articulos.map(a => `--- Artículo ${a.numero} [${a.titulo_capitulo}] ---\n${a.texto_integro}`).join('\n\n')}

Genera el resumen didáctico siguiendo la estructura indicada.`
}
```

### 13.5 — Endpoint generación on-demand (`POST /api/estudiar/generate`)

- **Archivo**: `app/api/estudiar/generate/route.ts`
- **Input**: `{ ley: string, rango: string }` (validado con Zod)
- **Auth**: requiere usuario autenticado
- **Gating**: requiere premium (`checkPaidAccess`) para generar nuevos. Free users solo ven los pre-generados.
- **Flujo**:
  1. Validar input con Zod schema
  2. Check si ya existe en `resumen_legislacion` → **si existe, retornar contenido cacheado** (sin auth premium)
  3. Check usuario es premium (`checkPaidAccess(serviceClient, userId, oposicionId)`)
  4. Si no premium → 402 con `code: 'PAYWALL_ESTUDIAR'`
  5. Fetch artículos: `SELECT * FROM legislacion WHERE ley_nombre = $ley AND articulo_numero::int BETWEEN $min AND $max`
  6. Si 0 artículos → 404
  7. Llamar `callAI(buildEstudiarPrompt(...), { systemPrompt: SYSTEM_ESTUDIAR, maxTokens: 4000 })`
  8. INSERT en `resumen_legislacion` via `createServiceClient()`
  9. Retornar `{ contenido, titulo, ley, rango, cached: false }`
- **Coste por generación**: ~$0.02-0.05 (input: artículos, output: ~2000 palabras)
- **NO consume crédito IA del usuario** — es contenido compartido, beneficia a toda la comunidad
- **Concurrencia**: `INSERT ... ON CONFLICT DO NOTHING` + retry SELECT si conflict (evita generar 2x)
- **Rate limit**: 5 generaciones/día por usuario (anti-abuse, no debería llegar nunca)

### 13.6 — Endpoint "Profundizar" (`POST /api/estudiar/profundizar/stream`)

- **Archivo**: `app/api/estudiar/profundizar/stream/route.ts`
- **Input**: `{ ley: string, articuloNumero: string, pregunta: string }` (Zod)
- **Auth**: premium + 1 crédito IA disponible
- **Flujo**:
  1. Validar input
  2. Check premium
  3. Consumir 1 crédito (`use_correction` RPC para pagados, `use_free_correction` para free con créditos restantes)
  4. Fetch artículo: `SELECT * FROM legislacion WHERE ley_nombre = $ley AND articulo_numero = $num LIMIT 1`
  5. Fetch contexto amplio: artículos adyacentes (±3) para dar contexto
  6. `callAIStream(SYSTEM_PROFUNDIZAR, buildProfundizarPrompt(articulo, pregunta, contexto))`
  7. Retornar streaming SSE
- **NO se cachea** — respuesta personalizada por pregunta del usuario
- **Coste**: ~$0.02/consulta, 1 crédito IA
- **Log**: `api_usage_log` con endpoint='estudiar/profundizar'

```typescript
export const SYSTEM_PROFUNDIZAR = `Eres un tutor de oposiciones. El alumno tiene una duda sobre un artículo concreto.

RESPONDE en este orden:
1. **Respuesta directa** a la pregunta (2-3 frases)
2. **Explicación detallada** con el texto legal relevante
3. **Ejemplo práctico** o caso real
4. **Pregunta tipo test** que podría caer sobre esto (con 4 opciones y respuesta correcta)
5. **Conexión** con otros artículos relacionados del temario

Sé claro, directo y orientado al examen.`
```

### 13.7 — UI: Página `/estudiar` (Server Component + Client islands)

**Archivos**:
- `app/(dashboard)/estudiar/page.tsx` — Server Component principal
- `components/estudiar/BloqueEstudio.tsx` — Client Component por bloque (expandible)
- `components/estudiar/ProfundizarDrawer.tsx` — Drawer con input + streaming
- `components/estudiar/GenerarResumenButton.tsx` — Botón con loading state

**Estructura de la página**:
```
/estudiar
├── Header: "Estudiar [Oposición]" + descripción
├── Barra progreso: "12 de 28 temas con material disponible"
├── Lista de temas (agrupados por bloque si aplica):
│   ├── Tema 1: Constitución Española
│   │   ├── [▸] CE arts. 1-9: Título Preliminar           ✅ Disponible
│   │   ├── [▸] CE arts. 14-29: Derechos Fundamentales    ✅ Disponible
│   │   └── [▸] CE arts. 53-55: Garantías                 🔄 Generar resumen
│   ├── Tema 2: Organización del Estado
│   │   └── ...
│   └── [Bloqueo premium para temas >2-3]
└── CTA: "Desbloquea todos los temas" (si free)
```

**Comportamiento del bloque expandido**:
- Click en bloque → expande/colapsa con animación
- Si `generado=true`: muestra contenido markdown con `prose` (Tailwind typography)
- Si `generado=false` y premium: botón "Generar resumen" → loading → aparece contenido
- Si `generado=false` y free: blur + CTA paywall
- Al final del contenido: botón "Hacer test de este tema" → link a `/tests?tema=UUID`
- En cada sección del resumen: icono lupa "Profundizar" → abre drawer lateral

**Sidebar/Navbar**: `BookOpen` icon + label "Estudiar" + badge `PRO`

### 13.8 — Free tier gating

- **Temas gratuitos**: Los mismos que ya tienen tests gratuitos (definidos por oposición)
  - AGE: temas con `numero IN (1, 11, 17)` (FREE_TEMA_NUMEROS en `lib/freemium.ts`)
  - Seguridad: primeros 2 temas de cada oposición
  - Otras ramas: 2-3 primeros temas
- **Bloques pre-generados** (coste ~$0.10, one-time):
  - `CE arts. 14-29` (Derechos Fundamentales) — el bloque más universal
  - `LPAC arts. 53-67` (Procedimiento administrativo) — otro clásico
  - Ambos se generan al hacer deploy, script `execution/seed-estudiar.ts`
- **Free users**: Ven todos los temas listados, pueden abrir los 2-3 gratuitos con contenido real.
  Resto: blurred con `PremiumFeaturePreview` + CTA.
- **Profundizar**: Siempre premium (consume 1 crédito IA). Free users ven el icono pero al click → paywall.

### 13.9 — Seed script (`execution/seed-estudiar.ts`)

Script one-time para pre-generar los 2 bloques gratuitos:
```bash
pnpm tsx execution/seed-estudiar.ts
# Genera: CE 14-29, LPAC 53-67
# Coste: ~$0.10
```

### 13.10 — Conocimiento técnico (temas sin legislación)

Algunos temas no tienen artículos en `legislacion` sino en `conocimiento_tecnico` (ej: Bloque II ofimática, temas de geografía vasca, psicología, etc.).

**Solución**: `resolverBloquesPorTema()` también consulta `conocimiento_tecnico`:
- Si tema tiene artículos en `legislacion` → bloques de ley
- Si tema tiene secciones en `conocimiento_tecnico` → mostrar directamente esas secciones (ya son resúmenes didácticos de ~2000 palabras cada una)
- Si tiene ambos → mostrar todo
- Si no tiene nada → badge "Material en preparación"

Esto es gratis porque `conocimiento_tecnico` ya está generado e ingestado.

### 13.11 — Tests unitarios

| Test | Qué verifica |
|------|-------------|
| `agrupaciones-completitud` | Todas las leyes en AGRUPACIONES tienen bloques válidos |
| `resolver-temas` | `resolverBloquesPorTema` retorna bloques correctos para temas con/sin legislación |
| `resolver-conocimiento` | Temas de Bloque II retornan secciones de `conocimiento_tecnico` |
| `generate-cached` | Si resumen existe, retorna cacheado sin llamar a IA |
| `generate-premium-only` | Free user recibe 402 al intentar generar |
| `generate-concurrent` | 2 requests simultáneos no generan duplicado (ON CONFLICT) |
| `profundizar-credito` | Consume 1 crédito y genera streaming |
| `profundizar-sin-credito` | Sin créditos → 402 |
| `free-temas` | Free user puede ver bloques de temas gratuitos |
| `free-bloqueado` | Free user ve paywall en temas no gratuitos |

### Flujo usuario completo

```
PREMIUM:
/estudiar → Lista temas de su oposición
→ Tema 3: LPAC → expande
→ "Procedimiento común (arts. 53-67)" [✅ ya generado por otro usuario]
→ Lee resumen: conceptos, esquema, artículos clave, trampas, mnemotécnicas
→ No entiende art. 58 (notificaciones) → click lupa "Profundizar"
→ Drawer: "¿Cuándo se considera notificación rechazada?" → streaming IA
→ Entiende → click "Hacer test del Tema 3" → /tests?tema=UUID
→ Falla 2 preguntas sobre notificaciones → vuelve a /estudiar/tema-3

FREE:
/estudiar → Ve lista completa de temas
→ Tema 1 (gratis) → puede leer resúmenes
→ Tema 4 (bloqueado) → preview borroso + "Desbloquea con Pack [Oposición]"
```

### Coste total

| Concepto | Coste | Frecuencia |
|----------|-------|-----------|
| Pre-seed 2 bloques free | ~$0.10 | One-time |
| Cada bloque nuevo (premium genera) | ~$0.02-0.05 | Una vez, luego $0 |
| Si se generan TODOS los ~250 bloques | ~$8-12 | Pagado por los usuarios premium |
| Profundizar | ~$0.02/consulta | Pagado con créditos IA del usuario |
| **Coste para Aritz al lanzar** | **~$0.10** | |

### Orden de ejecución

```
13.1  (migration) ─────────────+
13.2  (agrupaciones.ts) ───────+── paralelo
13.3  (resolver.ts) ───────────+
                                |
13.4  (prompts.ts) ────────────+
13.5  (endpoint generate) ─────+── paralelo
13.6  (endpoint profundizar) ──+
                                |
13.7  (UI /estudiar) ──────────+
13.8  (free tier gating) ──────+── paralelo
                                |
13.9  (seed 2 bloques free) ───+── PAUSA: Aritz ejecuta con .env.local
13.10 (conocimiento_tecnico) ──+── integrar en resolver
                                |
13.11 (tests) ─────────────────+
```
