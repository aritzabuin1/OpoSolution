# /nueva-oposicion — Pipeline industrializado para añadir oposiciones a OpoRuta

Ejecuta el pipeline completo para añadir una nueva oposición a OpoRuta.
Cada paso se ejecuta en orden. No saltar pasos. Marcar progreso en PLAN correspondiente.

## Input necesario del usuario
Antes de empezar, necesito que me proporciones:
1. **Nombre oficial** del cuerpo/oposición
2. **Subgrupo** (C1, C2, A2, A1...)
3. **Rama** (age, justicia, correos, hacienda, penitenciarias, seguridad, o nueva)
4. **Estructura COMPLETA del examen**: TODAS las pruebas (no solo conocimientos), tiempos por prueba, penalizaciones, escalas, mínimos
5. **Temario**: lista completa de temas con legislación principal
6. **Referencia BOE** de la convocatoria
7. **Plazas** convocadas
8. **¿Es la primera oposición de esta rama o se añade a una rama existente?**

Si tienes un documento .md con esta información, indicámelo y lo leo.
**SIEMPRE verificar datos contra BOE antes de implementar.** No confiar en web search sin contrastar.

## Checklist previa — Determinar el perfil de la oposición

| Pregunta | Impacto en pipeline |
|----------|-------------------|
| ¿Tiene supuesto de DESARROLLO ESCRITO? | → `supuesto_practico: true` → necesita rúbrica IA (Paso 7) |
| ¿Tiene ejercicio de OFIMÁTICA? | → `ofimatica: true` → necesita seed-ofimatica-bank (Paso 4) |
| ¿Tiene PSICOTÉCNICOS? | → `psicotecnicos: true` → simulacro incluye sección psico automáticamente |
| ¿Tiene ORTOGRAFÍA/GRAMÁTICA? | → `ortografia: true` → simulacro incluye sección ortografía (GC) |
| ¿Tiene IDIOMA EXTRANJERO? | → `ingles: true` → simulacro incluye sección inglés (GC) |
| ¿Tiene PERSONALIDAD POLICIAL? | → `personalidad: true` → módulo personalidad disponible en sidebar |
| ¿Tiene ENTREVISTA? | → módulo entrevista IA en /personalidad-policial |
| ¿Tiene temas NO legislativos? | → necesita conocimiento_tecnico (Paso 4) |
| ¿Es la PRIMERA de su rama? | → crear nueva rama en Stripe, landing hub, footer, pricing tab |
| ¿Se añade a rama EXISTENTE? | → considerar combos (Doble, Triple) |
| ¿Tiene num_opciones DIFERENTE de 4? | → PN tiene 3 opciones. Afecta scoring_config, UI, prompts |
| ¿Penalización DIFERENTE entre ejercicios? | → cada ejercicio tiene su propio ratio_penalizacion |

## Pipeline (12 pasos)

### Paso 1 — Migration SQL + scoring_config COMPLETO
- Crear migration en `optek/supabase/migrations/YYYYMMDD_NNN_<nombre>.sql`
- INSERT oposicion con UPSERT:
  - UUID format: `X0000000-0000-0000-0000-000000000001` (X = siguiente letra hex)
  - Solo caracteres hex: 0-9, a-f
  - `activa = false` siempre
- INSERT temas con UPSERT
- features JSON (TODOS los flags que apliquen):
  ```json
  {
    "psicotecnicos": true/false,
    "cazatrampas": true,
    "supuesto_practico": false,
    "supuesto_test": false,
    "ofimatica": false,
    "ortografia": false,
    "ingles": false,
    "personalidad": false
  }
  ```
- **scoring_config CRÍTICO — TODAS las pruebas del examen real**:
  ```json
  {
    "num_opciones": 4,
    "minutos_total": 140,
    "ejercicios": [
      {
        "nombre": "Nombre oficial de la prueba",
        "tipo_ejercicio": "conocimientos|psicotecnicos|ortografia|gramatica|ingles|personalidad|entrevista|fisicas",
        "preguntas": 100,
        "reserva": 5,
        "minutos": 60,
        "acierto": 1.0,
        "error": 0.333,
        "max": 100,
        "min_aprobado": 50,
        "penaliza": true,
        "ratio_penalizacion": "1/3",
        "simulable": true,
        "descripcion": "Descripción para mostrar en UI",
        "apto_no_apto": false,
        "ruta_practica": "/personalidad-policial"
      }
    ],
    "puntuacion_max_oposicion": 150,
    "fase_concurso_max": 45
  }
  ```
  **REGLAS scoring_config:**
  - `tipo_ejercicio` es OBLIGATORIO — el simulacro lo usa para despachar al generador correcto
  - `simulable: true` para ejercicios que OpoRuta puede simular digitalmente
  - `simulable: false` para físicas, reconocimiento médico
  - `ruta_practica` para ejercicios que tienen su propio módulo (personalidad, entrevista)
  - Incluir TODAS las pruebas (incluso no simulables) — la UI las muestra con badge "Presencial"
  - `apto_no_apto: true` para ejercicios eliminatorios sin nota numérica (ortografía GC)
  - **El simulacro genera automáticamente TODAS las secciones con `simulable: true`**

- **PAUSA**: usuario aplica migration en Supabase Dashboard

### Paso 2 — Stripe
Archivos a modificar:
- `lib/stripe/client.ts`: UUID, STRIPE_PRICES, CORRECTIONS_GRANTED, TIER_TO_OPOSICION
- `app/api/stripe/checkout/route.ts`: añadir tier al z.enum
- `app/api/stripe/webhook/route.ts`: añadir a TIER_TO_DB_TIPO
- **PAUSA**: usuario crea productos Stripe + env vars en Vercel

### Paso 3 — Legislación
1. Identificar leyes YA ingestionadas reutilizables
2. Scrapear nuevas: `npx tsx execution/scrape-boe-ley-v2.ts <BOE-ID> <output.json> <CODIGO> <nombre_completo>`
3. Ingestar: `pnpm ingest:legislacion`
4. Tagging: añadir CODE_MAP + RULES en `tag-legislacion-temas.ts`
5. **CRÍTICO — Citation aliases**: añadir TODAS las leyes nuevas a `lib/ai/citation-aliases.ts`:
   - CITATION_ALIASES: nombre completo, abreviatura, "ley X/YYYY", variantes
   - LEY_POR_NUMERO: "X/YYYY" → nombre simbólico
   - **Sin esto, 100% de las preguntas generadas se rechazan por "ley_no_reconocida"**
6. `pnpm tag:legislacion --rama X`

### Paso 4 — Contenido no legislativo
**VERIFICAR que TODOS los temas tengan material** (legislación O conocimiento_técnico):
```sql
-- Query para encontrar temas sin material
SELECT t.numero, t.titulo FROM temas t
WHERE t.oposicion_id = 'UUID'
AND NOT EXISTS (SELECT 1 FROM legislacion l WHERE t.id = ANY(l.tema_ids))
AND NOT EXISTS (SELECT 1 FROM conocimiento_tecnico ct WHERE ct.tema_id = t.id)
ORDER BY t.numero;
```
- Generar conocimiento_tecnico para temas sin legislación
- Columnas correctas: `tema_id` (singular UUID), `titulo_seccion`, `contenido`, `hash_sha256`, `bloque`, `embedding`
- **NO usar `tema_ids` (array) — la tabla tiene `tema_id` (FK singular)**
- Si hace falta expandir CHECK constraint: `ALTER TABLE conocimiento_tecnico DROP/ADD CONSTRAINT ...`

### Paso 5 — Free bank
```bash
pnpm generate:free-bank --oposicion <slug> --user-id <admin-uuid>
```

### Paso 6 — Exámenes oficiales
- Descargar PDFs de fuentes públicas (scraping URLs)
- `pnpm parse:examenes --dir examenes_<dir> [año] [modelo]`
- `pnpm ingest:examenes --dir examenes_<dir> --oposicion <slug>`
- `pnpm tsx execution/build-radar-tribunal.ts` (DESPUÉS de ingestar)
- **Si no hay exámenes disponibles**: el simulacro usa free_question_bank como fallback automático

### Paso 7 — Seed "Estudiar" (resúmenes pre-generados)
- Añadir agrupaciones de leyes nuevas en `lib/estudiar/agrupaciones.ts`
- Actualizar `execution/seed-estudiar.ts` con bloques para la nueva oposición
- Ejecutar: `pnpm tsx --env-file=.env.local execution/seed-estudiar.ts`
- **El resolver usa `conocimiento_tecnico.tema_id` (singular), NO `tema_ids` (array)**
- **Endpoint usa `callAIMini` (no callAI) para evitar timeout de Vercel 60s**
- Supabase default limit = 1000 rows. Usar paginación con `.range()` para leyes grandes

### Paso 8 — Rúbrica supuesto IA (condicional: solo si supuesto_practico=true)
- Añadir dispatch en `lib/ai/supuesto-practico.ts`
- Crear prompt con rúbrica oficial del tribunal

### Paso 9 — Landing + SEO + Integración web
- Landing pages por oposición
- Sitemap, llms.txt, footer, precios tab
- **Precios page acepta `?rama=X`** — los CTAs desde la app deben pasar la rama correcta

### Paso 10 — Blog SEO (4-6 posts mínimo)
- Posts transaccionales + informativos + comparativos
- Todos con FAQs para rich snippets

### Paso 11 — Psicotécnicos específicos (si aplica)
- Si la oposición tiene distribución diferente a AGE:
  - Añadir distribución en `lib/psicotecnicos/index.ts` → `getDistribucionPsicotecnicos(slug)`
  - Actualizar `CATEGORIAS_*` en `app/(dashboard)/psicotecnicos/page.tsx` para mostrar tipos correctos en UI
- El simulacro ya usa `getDistribucionPsicotecnicos(opoSlug)` automáticamente

### Paso 12 — Activación + Smoke test
1. `UPDATE oposiciones SET activa = true WHERE slug = '...'`
2. Smoke test completo (admin + free user):
   - Tests por tema
   - **Simulacro COMPLETO** (todas las secciones del examen, timer sumando minutos)
   - /estudiar (bloques pre-generados + generar nuevos)
   - Psicotécnicos (distribución correcta)
   - Personalidad (si aplica)
   - CTAs paywall → /precios?rama=X (tab correcto)
3. Submitir URLs en Google Search Console

## Gotchas conocidas (aprendidas de 12 oposiciones — LEER ANTES DE EMPEZAR)

### SIMULACROS — EL PUNTO MÁS CRÍTICO (SIEMPRE FALLA)
1. **El simulacro debe ser el EXAMEN REAL COMPLETO** — no solo conocimientos. Incluye psicotécnicos, ortografía, inglés, todo lo que sea simulable digitalmente.
2. **`tipo_ejercicio` es OBLIGATORIO** en scoring_config — sin esto el endpoint no sabe qué generador usar y no genera nada.
3. **Fallback para oposiciones legacy**: si no hay `tipo_ejercicio`, el endpoint auto-detecta por nombre ("test/cuestionario" → conocimientos). Pero las nuevas DEBEN tener tipo_ejercicio.
4. **Timer**: suma automática de `minutos` de cada sección. Si un ejercicio no tiene `minutos`, no contribuye al timer.
5. **`esSimulacro = test.tipo === 'simulacro'`** — NO requiere `examen_oficial_id`. Los simulacros desde banco también son simulacros válidos.
6. **`preguntasExamenCompleto`** debe buscar el ejercicio de `conocimientos`, NO el primero del array. GC tiene ortografía como primer ejercicio (5 preguntas).
7. **Fallback bank**: si 0 exámenes oficiales → usa `free_question_bank`. Funciona automáticamente.
8. **`examen?.id ?? null`**: el examen es null en bank fallback. Todo acceso a `examen.id`/`examen.anio` debe ser null-safe.

### Citation aliases — SIEMPRE NECESARIO
9. **Añadir TODAS las leyes nuevas a `citation-aliases.ts`** — CITATION_ALIASES + LEY_POR_NUMERO. Sin esto, TODAS las preguntas generadas se rechazan por "ley_no_reconocida".
10. **Incluir variantes**: "DL 1/2023", "Decreto Legislativo 1/2023", "ley de igualdad del pais vasco", etc.

### Datos y BD
11. **UUID solo hex**: 0-9, a-f. La 'g' no es válida.
12. **Ejercicio 2 TEST vs DESARROLLO**: SIEMPRE verificar contra BOE.
13. **`conocimiento_tecnico.tema_id`** es UUID singular, NO array `tema_ids`.
14. **`conocimiento_tecnico.titulo_seccion`**, NO `titulo`.
15. **Supabase 1000-row limit**: paginar con `.range()` para leyes grandes.
16. **`callAIMini`** para generar resúmenes en /estudiar (callAI = Sonnet timeout 55s en Vercel).

### Psicotécnicos
17. **Distribución por oposición**: seguridad tiene espacial/lógica/percepción, AGE tiene numérico/verbal/series. Actualizar `getDistribucionPsicotecnicos()` Y la UI en psicotecnicos/page.tsx.
18. **`generatePsicotecnicos(count, dificultad, distribucion)`** — el tercer arg es la distribución específica. El simulacro lo pasa automáticamente.

### CTAs y conversión
19. **TODOS los paywall deben tener CTA directo** a `/precios?rama=X` — modal centrado, no toast pequeño.
20. **La page /precios acepta `?rama=seguridad`** — siempre pasar la rama del usuario.
21. **Personalidad**: evaluación Big Five gratis (gancho), SJT/entrevista/coaching premium con CTA claro.

### Personalidad (si aplica)
22. **Entrevista usa Sonnet** (`useHeavyModel: true`), 2 créditos, timer 30 min.
23. **Coaching usa Sonnet**, maxTokens 12000, prompt conciso (~2500 palabras), 1 crédito.
24. **Admin skips credit check**: `is_admin` bypass en SJT, interview, coaching endpoints.
25. **`corrections_balance`** = 0 para admin en BD. La page pasa `isAdmin ? 999 : balance`.

### Archivos hardcodeados (TODOS necesitan actualización)
26. **cuenta/page.tsx**: `OPOSICION_TIER_MAP`, `TIER_PRICES`, `TIER_CREDITS`
27. **retrieval.ts**: `getTribunalLabel()`
28. **prompts.ts**: `getRamaStyleHint()`
29. **oposicion-display.ts**: `getOposicionDisplay()`
30. **simulacro-ranking.ts**: `CORTES_POR_OPOSICION`
31. **citation-aliases.ts**: CITATION_ALIASES + LEY_POR_NUMERO
32. **psicotecnicos/page.tsx**: CATEGORIAS_* por rama
33. **lib/psicotecnicos/index.ts**: distribución por slug

### Stripe y pricing
34. **49,99€ packs = 20 créditos IA**. 25 en packs >49,99€ con supuesto_practico.
35. **Pack Personalidad**: transversal, pool unificado corrections_balance.
36. **Entrevista**: 2 créditos (Sonnet). Coaching/SJT: 1 crédito.
