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
| **Pack Personalidad Policial** | **49,99EUR** | **15 creditos IA** | **Pago unico** |
| **Pack Completo** (conocimientos + personalidad) | **119,99EUR** | 35 creditos IA | Pago unico |
| **Pack Doble GC+PN + Personalidad** | **159,99EUR** | 45 creditos IA | Pago unico |
| Recarga creditos IA | 9,99EUR | +10 creditos IA | **Recurrente** |

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

### 0.1 — Helper getNumOpciones
- **Archivo**: `optek/lib/utils/scoring.ts`
- **Tarea**: Anadir `export function getNumOpciones(scoringConfig): 3 | 4` que lee `scoring_config.num_opciones ?? 4`
- **Tests**: 2 tests (default 4, explicit 3)

### 0.2 — Tipo Pregunta flexible
- **Archivo**: `optek/types/ai.ts:17-18`
- **Tarea**: Cambiar `opciones: [string, string, string, string]` a `opciones: [string, string, string] | [string, string, string, string]`
- **Tarea**: Mantener `correcta: 0 | 1 | 2 | 3` (validacion en runtime/Zod)
- **Blast radius**: 17 archivos importan Pregunta. Solo 4 acceden `[3]` directo

### 0.3 — Tipo PsicotecnicoQuestion flexible
- **Archivo**: `optek/lib/psicotecnicos/types.ts:54,56`
- **Tarea**: Mismo cambio que 0.2

### 0.4 — Schema Zod factory
- **Archivo**: `optek/lib/ai/schemas.ts:30,34`
- **Tarea**: Crear `getPreguntaSchema(numOpciones: 3 | 4 = 4)`. Mantener `PreguntaSchema` como `getPreguntaSchema(4)` para backward compat
- **Tests**: 2 tests

### 0.5 — Prompts parametrizados
- **Archivo**: `optek/lib/ai/prompts.ts:123,128,135-164`
- **Tarea**: `getSystemGenerateTest(nombre, numOpciones?)` — si 3: "0, 1, 2", "A/B/C ~33%", ejemplo JSON 3 opciones

### 0.6 — generate-test.ts threading
- **Archivo**: `optek/lib/ai/generate-test.ts`
- **L315**: `Math.random() * 4` -> `* numOpciones`
- **L736**: `opciones.length !== 4` -> `< 3 || > 4`

### 0.7 — generate-test/route.ts fix
- **Archivo**: `optek/app/api/ai/generate-test/route.ts:622`
- **Tarea**: `{ a, b, c, d }` -> construir dinamicamente con `.reduce()`

### 0.8 — generate-simulacro/route.ts fix
- **Archivo**: `optek/app/api/ai/generate-simulacro/route.ts`
- **L320-325, 362, 478**: `.slice(0,4)` -> `.slice(0, numOpciones)`
- **L564**: `{ a:0, b:1, c:2, d:3 }` -> `Object.fromEntries`

### 0.9 — explain-errores fix
- **Archivos**: `app/api/ai/explain-errores/route.ts:210-212` + `stream/route.ts:159-161`
- **Tarea**: `A) B) C) D)` hardcoded -> `.map((o,i) => String.fromCharCode(65+i)+')')`

### 0.10 — QuestionView.tsx UI
- **Archivo**: `optek/components/tests/QuestionView.tsx:60,111`
- **Tarea**: `LETRAS = ['A','B','C','D']` -> `pregunta.opciones.map((_,i) => String.fromCharCode(65+i))`

### 0.11 — run-evals.ts fix
- **Archivo**: `optek/execution/run-evals.ts:173,237`
- **Tarea**: `.length === 4` -> `>= 3 && <= 4`

### 0.12 — Verificacion
- `pnpm test` — 0 regressions
- Test manual: test PN (3 opciones) vs cualquier otra (4 opciones)

---

## FASE 1 — Migration SQL ✅ COMPLETADA

### 1.1 — Migration `20260331_069_seguridad.sql`
- **Archivo**: `optek/supabase/migrations/20260331_069_seguridad.sql`
- **Patron**: Copiar `064_hacienda_penitenciarias.sql`
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

### 1.2 — Temas INSERT (124 total)
- Ertzaintza: 54 temas, 11 bloques
- Guardia Civil: 25 temas, 3 bloques (A/B/C)
- Policia Nacional: 45 temas, 3 bloques (I/II/III)

### 1.3 — Expand conocimiento_tecnico bloque CHECK
- Anadir `'seguridad'` (patron migration 066)

### 1.4 — PAUSA: Aritz aplica migration en Supabase Dashboard

---

## FASE 2 — Constantes y mapeos (10 archivos) ✅ COMPLETADA

### 2.1 — `lib/stripe/client.ts`
- 3 UUID constants + STRIPE_PRICES (7 tiers: 3 individuales + doble + personalidad + completo + doble_completo) + CORRECTIONS_GRANTED + TIER_TO_OPOSICION
- Nuevo: `PERSONALITY_CREDITS_GRANTED` (15 para pack personalidad, incluido en completos)

### 2.2 — `app/api/stripe/checkout/route.ts`
- z.enum += 7 nuevos tiers + `recarga_personalidad`

### 2.3 — `app/api/stripe/webhook/route.ts`
- TIER_TO_DB_TIPO: 7 nuevas entradas -> `'pack_oposicion'`
- Nuevo: grant `personality_credits` para packs que incluyen personalidad

### 2.4 — `app/(dashboard)/cuenta/page.tsx`
- OPOSICION_TIER_MAP, TIER_PRICES, TIER_CREDITS para los 7 tiers

### 2.5 — `lib/utils/oposicion-display.ts`
- rama `'seguridad'`: per-slug organismo (Dept. Seguridad GV / Guardia Civil / DGP)

### 2.6 — `lib/ai/retrieval.ts` (getTribunalLabel)
- 3 nuevos slugs

### 2.7 — `lib/ai/prompts.ts` (getRamaStyleHint)
- 3 bloques estilo: Ertzaintza (BOPV), GC (militar), PN (3 opciones, 1/2)

### 2.8 — `lib/utils/simulacro-ranking.ts` (CORTES_POR_OPOSICION)
- ertzaintza: `{}`, guardia-civil: `{2025: 50}`, policia-nacional: `{2024: 7.72, 2023: 7.17}`

### 2.9 — `lib/ai/reto-diario.ts` (RAMAS_CONFIG)
- `seguridad: ['CE', 'CP', 'LPAC', 'LRJSP', 'FCSE', 'SEG_CIUDADANA', 'PRL', 'LSV']`

### 2.10 — `execution/tag-legislacion-temas.ts`
- CODE_MAP += FCSE, SEG_CIUDADANA, SEG_PRIVADA, ESTATUTO_GERNIKA, LSV
- SEGURIDAD_RULES + ALL_RULES

### 2.11 — PAUSA: Aritz crea productos Stripe (8 productos) + env vars en Vercel

---

## FASE 3 — Legislacion

### 3.1 — Reutilizar ya ingestada
CE, CP, LPAC, LRJSP, LOPDGDD, LO 3/2007, LO 1/2004, PRL, TREBEP, LECrim, LO 4/2000

### 3.2 — Scraping BOE nueva
| Ley | BOE ID | Oposiciones |
|-----|--------|-------------|
| LO 2/1986 FCSE | BOE-A-1986-6123 | GC, PN |
| LO 4/2015 Seguridad Ciudadana | BOE-A-2015-3442 | Ertz, GC, PN |
| Ley 5/2014 Seguridad Privada | BOE-A-2014-3649 | GC, PN |
| RDL 6/2015 Ley Seguridad Vial | BOE-A-2015-11722 | Ertz, GC |
| LO 9/1983 Derecho Reunion | BOE-A-1983-19946 | Ertz |
| Ley 4/2015 Estatuto Victima | BOE-A-2015-4606 | PN |

### 3.3 — Legislacion BOPV (Ertzaintza, manual)
- Estatuto Gernika (LO 3/1979 — esta en BOE: BOE-A-1979-30177)
- DL 1/2023 Igualdad CAV, DL 1/2020 Policia PV, Ley 15/2012 Seguridad Euskadi, D 168/1998, D 57/2015

### 3.4 — Ingesta + tagging
```bash
pnpm ingest:legislacion && pnpm tag:legislacion --rama seguridad --dry-run && pnpm tag:legislacion --rama seguridad
```

---

## FASE 4 — Examenes oficiales (busqueda online)

### 4.1 — Buscar examenes Guardia Civil
- Fuentes: web.guardiacivil.es, Geopol, Aspirantes.es, OpositaTest
- Convocatorias 2023, 2024, 2025 -> `data/examenes_guardia_civil/YYYY/`

### 4.2 — Buscar examenes Policia Nacional
- Fuentes: policia.es, ADAMS, El Rincon del Policia
- Convocatorias recientes -> `data/examenes_policia_nacional/YYYY/`

### 4.3 — Buscar examenes Ertzaintza
- Fuentes: euskadi.eus, Arkaute, Esparteroymaroto.com
- Promociones 34/35 -> `data/examenes_ertzaintza/YYYY/`

### 4.4 — Parsear e ingestar
```bash
pnpm parse:examenes --dir examenes_guardia_civil 2024
pnpm parse:examenes --dir examenes_policia_nacional 2024  # CUIDADO: 3 opciones, fix en FASE 0
pnpm parse:examenes --dir examenes_ertzaintza 2024
pnpm ingest:examenes --dir examenes_X --oposicion X  # para cada uno
pnpm build:radar
```

---

## FASE 5 — Contenido no legislativo (conocimiento_tecnico)

### 5.1 — Ertzaintza temas 32-36 (Historia, Geografia, Demografia, Economia, Cultura PV)
### 5.2 — Guardia Civil temas 16-25 (Proteccion civil, Topografia, Sociologia, TIC, Telecoms, Automovilismo, Armamento, Primeros auxilios, Seguridad vial, Medio ambiente)
### 5.3 — Policia Nacional temas 27-44 (DDHH, Globalizacion, Sociologia, Psicologia, Comunicacion, Inmigracion, Cooperacion policial, Ortografia, Terrorismo, Seguridad ciudadana, Deontologia, TIC, Ciberseguridad, Transmisiones, Automocion, Armamento, Primeros auxilios, Seguridad vial)

### 5.4 — Generacion e ingesta
- ~33 temas no legislativos, summaries ~2000 palabras/tema
- `conocimiento_tecnico` con bloque = `'seguridad'`
- Script: `execution/ingest-conocimiento-seguridad.ts`
- Coste: ~$3-5

---

## FASE 6 — Psicotecnicos nuevos (compartidos las 3)

### 6.1 — Modulo espacial (`lib/psicotecnicos/spatial.ts`)
- Subtipos: `rotacion_mental`, `espejo`, `coordenadas`, `secuencia_espacial`
- 100% determinista. 8-10 tests

### 6.2 — Modulo logica deductiva (`lib/psicotecnicos/logic.ts`)
- Subtipos: `silogismo`, `condicional`, `conjuntos`, `negacion`
- 100% determinista. 8-10 tests

### 6.3 — Modulo percepcion (`lib/psicotecnicos/perception.ts`)
- Subtipos: `conteo_simbolos`, `diferencias`, `patron_visual`
- 100% determinista. 6-8 tests

### 6.4 — Tipos y orquestador
- `types.ts`: nuevas categorias + subtipos
- `index.ts`: SEGURIDAD_DISTRIBUCION (espacial 20%, logica 10%, percepcion 15%, numerico 15%, series 15%, verbal 15%, organizacion 10%)

### 6.5 — GC Ortografia (POST-MVP)
- Modulo determinista futuro. Landing: "Proximamente"

### 6.6 — GC Ingles (POST-MVP)
- Banco curado futuro

---

## FASE 7 — Free question bank

### 7.1 — Ertzaintza: 54 temas x 10 = 540q (~$3)
### 7.2 — Guardia Civil: 25 temas x 10 = 250q (~$1.50)
### 7.3 — Policia Nacional: 45 temas x 10 = 450q (~$2.50) — CRITICO: 3 opciones
### 7.4 — Verificar: `SELECT oposicion_id, COUNT(*) FROM free_question_bank GROUP BY oposicion_id` -> 1240 total

---

## FASE 8 — Landing pages + SEO

### 8.1 — Hub rama: `oposiciones/seguridad/page.tsx` (3 cards + seccion Personalidad Policial)
### 8.2 — Sub-landing Ertzaintza: `oposiciones/seguridad/ertzaintza/page.tsx`
### 8.3 — Sub-landing GC: `oposiciones/seguridad/guardia-civil/page.tsx`
### 8.4 — Sub-landing PN: `oposiciones/seguridad/policia-nacional/page.tsx`
### 8.5 — Landing personalidad: `oposiciones/seguridad/personalidad-policial/page.tsx`
- Destacar: "Primera plataforma en Espana con preparacion IA de personalidad policial"
- Explicar: perfil, SJT, entrevista, consistencia
- CTA: Pack Personalidad 49,99EUR / Pack Completo 119,99EUR
### 8.6 — Main landing: card Seguridad + badge plazas + FAQ
### 8.7 — Precios: tab Seguridad con 8 plans (incluye personalidad)
### 8.8 — Sitemap: 5 rutas nuevas (hub + 3 sub + personalidad)
### 8.9 — Footer: link Seguridad
### 8.10 — llms.txt: seccion Seguridad + personalidad

---

## FASE 9 — Blog SEO

### 9.1 — "Test Ertzaintza 2026: practica online gratis con IA"
### 9.2 — "Oposiciones Guardia Civil 2026: temario, plazas y examen"
### 9.3 — "Examen Policia Nacional: 3 opciones, penalizacion 1/2 y estrategia"
### 9.4 — "Psicotecnicos oposiciones policia 2026: tipos y practica"
### 9.5 — "Sueldo Guardia Civil y Policia Nacional 2026"
### 9.6 — "OpoRuta vs OpositaTest para oposiciones policia"
### 9.7 — "Test de personalidad policial: como preparar la prueba psicotecnica" (DIFERENCIADOR)
- Explicar Big Five, perfil ideal, lie scales, SJT
- CTA directo al modulo de personalidad

---

## FASE 10 — Activacion (conocimientos)

### 10.1 — Checklist
- [ ] Migration 069 aplicada
- [ ] 8 productos Stripe + env vars
- [ ] Legislacion ingestada + taggeada
- [ ] Free bank 1240 preguntas
- [ ] Examenes oficiales ingestados
- [ ] Landings publicadas
- [ ] Blog 7 posts
- [ ] `pnpm test` + `pnpm build` OK

### 10.2 — PAUSA: `UPDATE oposiciones SET activa = true WHERE rama = 'seguridad'`
### 10.3 — Smoke test: registro -> test -> simulacro -> checkout (3 oposiciones)

---

## FASE 11 — Modulo Personalidad Policial (INNOVACION)

**Contexto**: Ninguna plataforma en Espana ofrece preparacion IA para tests de personalidad policial. Las academias cobran 80-200EUR por 4-8 sesiones presenciales. Oportunidad de mercado unica.

**Marco etico**: "Autoconocimiento policial" — analogia fitness: no ensenamos a hacer trampas, ayudamos a PONERSE EN FORMA. Disclaimer: "herramienta de practica, no sustituye evaluacion profesional". Items originales IPIP (dominio publico), no copias de MMPI-2/16PF/NEO-PI-R.

### 11.1 — Migration BD (`070_personalidad_policial.sql`)
- Tabla `personalidad_sesiones`: id, user_id, tipo (perfil|sjt|entrevista|coaching), respuestas JSONB, scores JSONB, created_at
- Tabla `personalidad_consistencia`: user_id, dimension, sesion_1_score, sesion_n_score, delta, created_at
- Campo `personality_credits` en profiles (o reutilizar corrections_balance con tipo separado)
- RPC `use_personality_credit` (similar a `use_correction`)

### 11.2 — Banco de items IPIP (one-time)
- **Archivo**: `data/personalidad/ipip_items.json`
- 240 items Big Five (5 dimensiones x 6 facetas x 8 items)
- 15 items validez (social desirability + infrequency)
- 20 pares consistencia (VRIN-like)
- Fuente: International Personality Item Pool (dominio publico, ipip.ori.org)
- Traduccion al espanol verificada
- Cada item: `{ id, texto, dimension, faceta, reversed, validez_type? }`

### 11.3 — Motor de scoring determinista ($0 por sesion)
- **Archivo**: `optek/lib/personalidad/scoring.ts`
- **Tarea**: Implementar scoring Big Five completo:
  1. Reverse-score items negativos: `6 - raw_score`
  2. Media por faceta (8 items -> 1 score)
  3. Media por dimension (6 facetas -> 1 score)
  4. T-score normativo (mean=50, SD=10) — normas propias de la plataforma
  5. Comparacion vs perfil policial ideal (baremo publico)
- **Tests**: 10+ tests unitarios (scoring correcto, reverse items, edge cases)

### 11.4 — Escalas de validez (determinista)
- **Archivo**: `optek/lib/personalidad/validity.ts`
- Social Desirability: items de "virtud imposible" — si >60% "True" = flag
- Infrequency: items que el 90%+ responde igual — respuesta contraria = flag
- Consistencia (VRIN-like): 20 pares semanticos — respuestas contradictorias = flag
- Acquiescence: ratio de "De acuerdo" vs "En desacuerdo" — sesgo > 70% = flag
- Output: `{ socialDesirability: number, infrequency: number, consistency: number, acquiescence: number, valid: boolean }`

### 11.5 — Testing Adaptativo CAT (determinista)
- **Archivo**: `optek/lib/personalidad/adaptive.ts`
- Graded Response Model simplificado:
  - Sesion 1: 80 items (broad screening, ~15 items/dimension)
  - Sesiones siguientes: 20 items (precision targeting)
  - Seleccion por maxima informacion en la zona theta estimada
- Reduce tiempo de 30 min a ~8-10 min en sesiones de seguimiento
- **Tests**: 4-5 tests

### 11.6 — Consistencia cross-sesion (determinista, KILLER FEATURE)
- **Archivo**: `optek/lib/personalidad/consistency-tracker.ts`
- Almacenar scores por dimension en cada sesion
- Calcular:
  - Delta por dimension (cambio > 1 SD = flag)
  - Profile shape correlation (r < .70 entre sesiones = flag)
  - Tendencia temporal (mejora gradual = coaching real, salto repentino = faking)
- Dashboard: "Tu consistencia: 87%. Perfil estable."
- **Tests**: 5 tests

### 11.7 — SJT: Juicio Situacional (IA)
- **Archivo**: `optek/lib/personalidad/sjt.ts`
- **Endpoint**: `POST /api/personalidad/sjt`
- Generacion: Claude/GPT genera escenario policial + 4-5 opciones rankeadas
- Adaptado al cuerpo: Ertzaintza (contexto vasco, bilingue), GC (rural, militar), PN (urbano)
- Scoring: concordancia con ranking ideal (partial credit)
- Consume 1 credito de personalidad por escenario
- **Coste IA**: ~$0.02/escenario
- **Tests**: 3-4 tests

### 11.8 — Entrevista simulada (IA streaming, FEATURE PREMIUM)
- **Archivo**: `optek/lib/personalidad/interview.ts`
- **Endpoint**: `POST /api/personalidad/interview/stream`
- System prompt: psicologo del tribunal con acceso al perfil Big Five del usuario
- Comportamiento:
  - Preguntas abiertas sobre situaciones policiales
  - Sondea inconsistencias entre perfil test y respuestas verbales
  - Presiona en areas debiles (baja estabilidad emocional -> "cuente una situacion de estres...")
  - 10-15 intercambios por sesion
- Post-sesion: feedback IA (puntos fuertes, areas de mejora, red flags detectados)
- Consume 1 credito por sesion
- **Coste IA**: ~$0.20/sesion
- **Tests**: 2-3 tests

### 11.9 — Gap Analysis + Coaching (IA)
- **Archivo**: `optek/lib/personalidad/coaching.ts`
- **Endpoint**: `POST /api/personalidad/coaching/stream`
- Input: perfil Big Five del usuario + historial de sesiones
- Output: informe personalizado
  - Tu perfil vs perfil policial ideal (grafico radar)
  - Areas de riesgo: "Neuroticism T=58 — el ideal es <50"
  - Recomendaciones evidence-based (CBT, mindfulness, role-playing)
  - NO dice "finge esto" — dice "desarrolla esto genuinamente"
- Consume 1 credito
- **Coste IA**: ~$0.03/informe
- **Tests**: 2 tests

### 11.10 — UI: Pagina /personalidad-policial
- **Archivo**: `optek/app/(dashboard)/personalidad-policial/page.tsx`
- Componentes:
  - `PersonalidadAssessment.tsx` — cuestionario interactivo (Likert 1-5)
  - `PerfilRadar.tsx` — grafico radar Big Five (tu perfil vs ideal)
  - `ConsistencyDashboard.tsx` — evolucion temporal + score consistencia
  - `SJTCard.tsx` — escenarios situacionales
  - `InterviewChat.tsx` — chat streaming con psicologo IA
  - `CoachingReport.tsx` — informe de coaching
- PaywallGate: requiere pack personalidad o pack completo
- Sidebar: icono Brain + "Personalidad" (con Lock si no tiene pack)

### 11.11 — Verificacion modulo personalidad
- Todos los tests unitarios pasan
- Smoke test: completar assessment -> ver perfil -> SJT -> entrevista -> coaching
- Verificar creditos se descuentan correctamente
- Verificar consistencia cross-sesion tras 2+ sesiones

---

## Orden de ejecucion y paralelismo

```
FASE 0 (3-opciones) --------+
FASE 1 (migration) ---------+-- paralelo
                             |
                       PAUSA: migration
                             |
FASE 2 (constantes) --------+
FASE 3 (legislacion) -------+-- paralelo
FASE 4 (examenes online) ---+
                             |
                       PAUSA: Stripe (8 productos)
                             |
FASE 5 (conocimiento) ------+
FASE 6 (psicotecnicos) -----+-- paralelo
                             |
FASE 7 (free bank) <--- depende de 3+5
                             |
FASE 8 (landings) ----------+
FASE 9 (blog) --------------+-- paralelo
                             |
FASE 10 (activacion conocimientos) PAUSA
                             |
FASE 11 (personalidad) -----+
  11.1-11.6 (determinista) --+-- paralelo
  11.7-11.9 (IA endpoints) --+
  11.10 (UI) ----------------+
  11.11 (verificacion) ------+
                             |
                       PAUSA: activar personalidad
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

## Scope MVP vs Post-lanzamiento

**MVP (FASE 0-10):**
- Soporte 3 opciones (PN)
- 3 oposiciones activas con tests + simulacros + psicotecnicos
- Free bank 1240 preguntas
- Examenes oficiales (los que se encuentren)
- Landings + pricing + blog 7 posts

**Fase 2 (FASE 11):**
- Modulo Personalidad Policial completo
- Perfil Big Five + SJT + Entrevista IA + Coaching
- Consistencia cross-sesion
- Testing adaptativo CAT

**Post-lanzamiento:**
- Ortografia GC (modulo determinista)
- Ingles GC (banco curado)
- BOPV watcher
- Mas examenes oficiales
