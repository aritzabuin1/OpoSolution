# Plan2: Expansión OpoRuta — Correos + Justicia

## Pricing

| Pack | AGE | Justicia | Correos |
|------|-----|----------|---------|
| Individual C2/IV | 49.99€ | 49.99€ | 39.99€ |
| Individual C1 | 49.99€ | 49.99€ | — |
| Individual A2 | 69.99€ | 79.99€ | — |
| Doble (C1+C2) | 79.99€ | 79.99€ | — |
| Triple (C1+C2+A2) | 129.99€ | 139.99€ | — |

---

## FASE 0 — Arquitectura base

### 0.1 Migration: rama + scoring_config + campos nuevos en oposiciones
- [x] Crear `supabase/migrations/20260326_047_rama_scoring.sql`
- [x] ALTER TABLE oposiciones ADD COLUMN rama TEXT
- [x] ALTER TABLE oposiciones ADD COLUMN scoring_config JSONB
- [x] ALTER TABLE oposiciones ADD COLUMN nivel TEXT
- [x] ALTER TABLE oposiciones ADD COLUMN orden INT DEFAULT 0
- [x] ALTER TABLE oposiciones ADD COLUMN plazas INT
- [x] ALTER TABLE oposiciones ADD COLUMN fecha_examen_aprox DATE
- [x] Backfill C2 Auxiliar AGE: rama='age', nivel='C2', orden=1, scoring_config con penaliza=true, error_factor=0.333
- [x] Backfill C1 Admin AGE: rama='age', nivel='C1', orden=2, scoring_config
- [x] Backfill A2 Gestión AGE: rama='age', nivel='A2', orden=3, scoring_config

### 0.2 Registro dinámico — eliminar arrays hardcoded
- [x] `app/(auth)/register/page.tsx`: convertir OPOSICIONES[] a query `SELECT FROM oposiciones ORDER BY rama, orden`
- [x] Crear Client Component `RegisterForm.tsx` que recibe oposiciones como prop
- [x] Agrupar por rama con headers ("Administración del Estado", "Justicia", "Correos")
- [x] `activa=false` → badge "Próximamente", no seleccionable (disabled + opacity)
- [x] `activa=true` → seleccionable como ahora
- [x] `components/cuenta/ProfileForm.tsx`: eliminar OPOSICIONES[] hardcoded, recibir como prop
- [x] `app/(dashboard)/cuenta/page.tsx`: query oposiciones, pasar a ProfileForm
- [x] `lib/utils/oposicion-labels.ts`: eliminar mapa estático, query DB
- [x] `components/shared/PrimerTestSelector.tsx`: ya es dinámico, solo añadir badge "Próximamente" para inactivas

### 0.3 Motor de scoring configurable
- [x] Crear `lib/utils/scoring.ts` con función `calcularPuntuacion(aciertos, errores, config)`
- [x] Config soporta array de ejercicios (Auxilio=2, Tramitación=3, Correos=1)
- [x] Cada ejercicio: {nombre, preguntas, acierto, error, max, min_aprobado, penaliza}
- [x] `app/(dashboard)/tests/[id]/resultados/page.tsx`: fetch scoring_config de la oposición del test
- [x] Si penaliza=false → mostrar "Sin penalización — responde todas las preguntas" en vez de fórmula -1/3
- [x] Si penaliza=true → mostrar fórmula con valores reales del scoring_config
- [x] `lib/utils/simulacro-ranking.ts`: aceptar scoring_config param

### 0.4 Stripe rama-aware combos
- [x] `lib/stripe/client.ts`: crear mapa COMBO_PACKS con oposicion IDs por rama
- [x] Añadir tiers: pack_correos, pack_justicia_c2, pack_justicia_c1, pack_justicia_a2, pack_doble_justicia, pack_triple_justicia
- [x] Configurar CORRECTIONS_GRANTED y SUPUESTOS_GRANTED para cada tier
- [x] `app/api/stripe/checkout/route.ts`: añadir nuevos tiers al BodySchema
- [x] `app/api/stripe/webhook/route.ts`: refactorizar if/else combos a usar COMBO_PACKS mapa
- [ ] Crear 6 productos en Stripe Dashboard (Correos + 5 Justicia) ← MANUAL
- [x] Añadir 6 env vars STRIPE_PRICE_PACK_* en .env.example

---

## FASE 1 — Correos

### 1.1 Migration: oposición + temas
- [x] Crear `supabase/migrations/20260326_048_correos.sql`
- [x] INSERT oposiciones: id=d0000000..., slug='correos', rama='correos', nivel='IV', activa=false
- [x] features: {"psicotecnicos": true, "cazatrampas": true, "supuesto_practico": false, "ofimatica": false}
- [x] scoring_config: {"ejercicios": [{"nombre":"Test","preguntas":100,"minutos":110,"acierto":0.60,"error":0,"max":60,"penaliza":false}]}
- [x] INSERT 12 temas:
  - T1: Marco normativo postal. Naturaleza jurídica Correos. Organismos reguladores.
  - T2: Organización interna. Red de oficinas. Zonas y sectores.
  - T3: Productos y servicios postales. Tarifas.
  - T4: Servicios financieros y parapostales. Giros. Burofax.
  - T5: Soluciones logísticas. Paquetería express. E-commerce.
  - T6: Procesos de admisión.
  - T7: Procesos de clasificación, tratamiento y transporte.
  - T8: Procesos de distribución y entrega.
  - T9: Atención al cliente. Reclamaciones. Calidad.
  - T10: Igualdad, diversidad, inclusión. PRL.
  - T11: Certificado digital, firma electrónica, notificaciones electrónicas.
  - T12: Protección de datos. RGPD.

### 1.2 Contenido Correos
- [x] Scrape Ley 43/2010 del servicio postal universal (88 artículos) — BOE-A-2010-20139
- [x] Scrape RD 1829/1999 Reglamento servicios postales (88 artículos)
- [x] Scrape Ley 31/1995 PRL (79 artículos)
- [x] RGPD + LOPDGDD ya ingestionados para AGE → reutilizar con re-tagging
- [x] LO 3/2007 Igualdad ya ingestionada → reutilizar
- [x] Script tag:legislacion --rama correos creado
- [x] Ejecutar `pnpm ingest:legislacion` — 10.476 artículos upserted
- [x] Ejecutar `pnpm tag:legislacion --rama correos` — 2.679 artículos taggeados
- [ ] Scrape contenido operativo correos.es (productos, tarifas, organización) — EN PROGRESO
- [ ] Generar free bank: `pnpm generate:free-bank --oposicion correos`
- [ ] Buscar e ingestar examen oficial 2023 (web Correos post-convocatoria)

### 1.3 Landing SEO Correos
- [x] Crear `app/(marketing)/oposiciones/correos/page.tsx`
- [x] Metadata SEO: "Test Correos 2026 — Practica gratis con preguntas del examen"
- [x] Schema markup FAQPage
- [x] Datos: 4.055 plazas, 12 temas, examen mayo, sin penalización
- [x] CTA registro con `?oposicion=correos`
- [x] Actualizar `app/sitemap.ts` con nueva ruta

### 1.4 Activación Correos
- [ ] Verificar: free bank completo (12 temas × 10 preguntas)
- [ ] Verificar: legislación indexada
- [ ] Verificar: Stripe producto creado + env var
- [ ] `UPDATE oposiciones SET activa = true WHERE slug = 'correos'`
- [ ] Deploy y probar flujo completo

---

## FASE 2 — Justicia

### 2.1 Migration: 3 oposiciones + temas
- [x] Crear `supabase/migrations/20260326_049_justicia.sql`
- [x] INSERT Auxilio Judicial C2: 26 temas, rama='justicia', nivel='C2', activa=false
  - Temas exactos del Anexo VI.c del BOE-A-2025-27053
  - scoring_config con 2 ejercicios (test 60pts + práctico 40pts)
- [x] INSERT Tramitación Procesal C1: 37 temas, rama='justicia', nivel='C1', activa=false
  - Temas del Anexo VI.b (incluye Bloque III ofimática)
  - scoring_config con 3 ejercicios (test 60pts + práctico 20pts + ofimática 20pts)
  - features: ofimatica=true
- [x] INSERT Gestión Procesal A2: 68 temas, rama='justicia', nivel='A2', activa=false
  - Temas del Anexo VI.a
  - scoring_config con 3 ejercicios (test 60pts + práctico 15pts + desarrollo 25pts)
  - features: supuesto_practico=true

### 2.2 Contenido Justicia — Legislación
- [x] Constitución Española — ya ingestionada (184 art.)
- [x] LO 6/1985 LOPJ consolidada (718 art.) — SCRAPEADO
- [x] LO 1/2025 Servicio Público de Justicia (289 art.) — SCRAPEADO
- [x] Ley 1/2000 LEC (1.078 art.) — SCRAPEADO
- [x] LECrim 1882 (1.074 art.) — SCRAPEADO
- [x] TREBEP — ya ingestionado
- [x] LO 3/2007, LO 1/2004, Ley 4/2023 LGTBI — ya ingestionados
- [x] Ley 15/2022 igualdad de trato (81 art.) — SCRAPEADO
- [x] PRL Ley 31/1995 (79 art.) — SCRAPEADO
- [x] Script tag:legislacion --rama justicia creado con reglas de tagging
- [x] Ejecutar `pnpm ingest:legislacion` — 10.476 artículos upserted (compartido con Correos)
- [x] Ejecutar `pnpm tag:legislacion --rama justicia` — 20.941 artículos taggeados
- [ ] Verificar temas ACTUALIZADOS por LO 1/2025: T8, T10, T16, T18
- [ ] Fix: tema_ids no resueltos para Gestión Procesal (temas 17-22, 60, 66, 67) — verificar numeración en migración 049

### 2.3 Contenido Justicia — Exámenes oficiales
- [x] Directorios creados: examenes_auxilio/, examenes_tramitacion/, examenes_gestion_procesal/
- [x] ingest-examenes.ts adaptado para slugs Justicia (auxilio-judicial, tramitacion-procesal, gestion-procesal)
- [ ] Descargar cuadernillos + plantillas de MJU — EN PROGRESO (agente buscando)
- [ ] Parsear PDFs con execution/ingest-examenes.ts
- [ ] Insertar en examenes_oficiales + preguntas_oficiales

### 2.4 Contenido Justicia — Free bank
- [ ] Generar para Auxilio: `pnpm generate:free-bank --oposicion auxilio-judicial`
- [ ] Generar para Tramitación: `pnpm generate:free-bank --oposicion tramitacion-procesal`
- [ ] Generar para Gestión: `pnpm generate:free-bank --oposicion gestion-procesal`

### 2.5 Rúbrica supuesto práctico A2
- [ ] Investigar criterios corrección tribunal para Gestión Procesal
- [ ] Adaptar corrección IA (ya implementada para AGE A2) con rúbrica Justicia
- [ ] El ejercicio es desarrollo escrito (5 preguntas, 45 min, temas 17-39 y 43-67)

### 2.6 SEO Justicia
- [x] Hub: `app/(marketing)/oposiciones/justicia/page.tsx`
- [x] Sub: `app/(marketing)/oposiciones/justicia/auxilio-judicial/page.tsx`
- [x] Sub: `app/(marketing)/oposiciones/justicia/tramitacion-procesal/page.tsx`
- [x] Sub: `app/(marketing)/oposiciones/justicia/gestion-procesal/page.tsx`
- [x] Calculadora nota Justicia (por ejercicio, con penalización) — `/herramientas/calculadora-nota-justicia`
- [x] Calculadora nota Correos — `/herramientas/calculadora-nota-correos`
- [ ] Blog: empezar con 5 artículos SEO del plan de estrategia
- [x] Actualizar sitemap.ts

### 2.7 Activación progresiva Justicia
- [ ] Fase 2a: Activar Auxilio C2 (26 temas, ~24k inscritos)
- [ ] Fase 2b: Activar Tramitación C1 (37 temas, ~30k inscritos)
- [ ] Fase 2c: Activar Gestión A2 (68 temas, necesita corrección IA desarrollo)

---

## FASE 2.5 — Supuesto Práctico C1 (formato test)

> **Contexto**: Desde OEP 2023-2024 (BOE-A-2024-14098), la Parte 2 del examen C1 Administrativo del Estado
> es un supuesto práctico en formato TEST (20 preguntas tipo test sobre un caso narrativo). NO es desarrollo
> escrito como en A2. Ningún competidor ofrece práctica de esto. Es un diferenciador brutal.

### Fuentes oficiales

| Fuente | Referencia | Contenido |
|--------|-----------|-----------|
| BOE-A-2024-14098 | Convocatoria OEP 2023-2024 | Define estructura: ejercicio único, 2 partes, 100 min |
| BOE-A-2025-26262 | Convocatoria OEP 2025 | Confirma mismo formato test para supuesto |
| INAP Sede — ADVO-L 2024 Modelo A | `data/examenes_c1/2024/examen_a.pdf` (pág. 8-14) | Supuestos I y II completos con preguntas + respuestas |
| INAP Sede — ADVO-L 2024 Modelo B | `data/examenes_c1/2024/examen_b.pdf` | Idem modelo B |
| INAP Sede — Plantillas definitivas | `data/examenes_c1/2024/plantilla_a.pdf`, `plantilla_b.pdf` | Respuestas correctas |

### Estructura real del examen (verificada contra PDF 2024)

**Ejercicio único, 2 partes eliminatorias, 100 minutos total:**

| Parte | Preguntas | Bloques | Puntuación | Mínimo |
|-------|-----------|---------|------------|--------|
| 1ª — Cuestionario | 70 (+5 reserva) | I-V (40 legal) + VI (30 ofimática) | 0-50 | 25 |
| 2ª — Supuesto práctico | 20 (+5 reserva) | II, III, IV, V | 0-50 | 25 |

**Formato del supuesto** (extraído del examen real 2024):
- Narrativa continua (~1 página): un funcionario GACE (A2) en un organismo con diversas situaciones laborales
- NO es "5 expedientes con 4 preguntas cada uno" — es una historia coherente que toca múltiples áreas
- Las 20 preguntas fluyen por aspectos del caso: provisión de puestos, contratación, presupuestos, personal, procedimiento administrativo
- El opositor elige 1 de 2 supuestos propuestos
- Penalización -1/3 (valor por pregunta: 2,50 pts → error penaliza 0,83 pts)

**Ejemplo real — Supuesto I, Convocatoria 2024:**
> "Dña. Estela Sánchez Ruiz, funcionaria del Cuerpo de Gestión de la Administración Civil del Estado,
> viene ocupando un puesto en comisión de servicios..."
> → 20 preguntas sobre: provisión puestos, interinos EBEP, incapacidad permanente SS, subvenciones,
> recurso de alzada, reorganización ministerial, Registro Central de Personal, etc.

### Bugs existentes a corregir (detectados durante análisis)

#### BUG-SP1: Calculadora C1 — bloques incorrectos
- **Archivo**: `CalculadoraNotaC1.tsx:307`
- **Actual**: "Caso práctico (bloques II y V)"
- **Correcto**: "Caso práctico (bloques II, III, IV y V)"
- **Impacto**: Información incorrecta al usuario

#### BUG-SP2: Simulacro — filtro hardcoded `numero <= 60`
- **Archivo**: `generate-simulacro/route.ts:188` y `:259`
- **Problema**: Filtra preguntas con número > 60. C2 tiene 60 preguntas, pero C1 tiene 70 en Parte 1. Al ingestar C1, las preguntas 61-70 serían excluidas.
- **Fix**: Hacer el filtro dinámico según la oposición (consultar `scoring_config.ejercicios[0].preguntas`)

#### BUG-SP3: Timer hardcoded para C2
- **Archivo**: `tests/[id]/page.tsx:84-85`
- **Actual**: `FULL_EXAM_QUESTIONS = 100`, `FULL_EXAM_SECONDS = 90 * 60`
- **Problema**: C1 tiene 90 preguntas puntuables en 100 minutos (no 100 en 90)
- **Fix**: Obtener valores de `scoring_config` de la oposición del test

#### BUG-SP4: Datos C1 2024 incompletos
- **Problema**: `parsed_a.json` y `parsed_b.json` solo tienen 70 preguntas (Parte 1). La Parte 2 (supuestos) NO está parseada aunque sí está en los PDFs (páginas 8-14).

### Modelo de negocio: banco progresivo (mismo patrón que tests)

**Unidad atómica = supuesto completo** (caso + 20 preguntas). No se pueden mezclar preguntas de supuestos distintos.

| Tier | Qué ve | Coste IA | Fuente |
|------|--------|----------|--------|
| **Free** | Siempre el mismo supuesto: el oficial INAP 2024 | $0 | `free_supuesto_bank` |
| **Premium (banco lleno)** | Supuesto no visto del banco | $0 | `supuesto_bank` |
| **Premium (banco vacío)** | Supuesto generado por IA → se guarda en banco | ~$0.35 | IA + save to bank |

**Curva de reducción de coste:**

| Usuarios premium | Supuestos en banco | % servido sin IA | Coste medio/sesión |
|---|---|---|---|
| 0 (seed) | 5 pre-generados + 2 oficiales | 100% | $0 |
| 1-10 | 7-15 | ~80% | ~$0.07 |
| 10-50 | 15-25 | ~95% | ~$0.02 |
| 50+ | 25-30 (tope) | ~99% | ~$0.00 |

**Tope del banco: ~30 supuestos.** Con 4 bloques × ~7 temas/bloque, las combinaciones temáticas son finitas. Un opositor que ha hecho 30 supuestos distintos ya domina el formato. A partir de 30, recicla supuestos no vistos por ese usuario.

**Seed inicial**: Pre-generar 5 supuestos con IA ($1.75) + parsear 2 oficiales 2024 = 7 supuestos día 1.

### Modelo de datos

#### Tabla `free_supuesto_bank` (free tier — 1 supuesto fijo)
```sql
CREATE TABLE free_supuesto_bank (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oposicion_id  uuid NOT NULL REFERENCES oposiciones(id),
  caso          jsonb NOT NULL,     -- {titulo, escenario, bloques_cubiertos}
  preguntas     jsonb NOT NULL,     -- Pregunta[] (20 preguntas, mismo schema)
  es_oficial    boolean DEFAULT false, -- true = parseado del INAP
  fuente        text,               -- 'INAP-2024-ADVO-L-ModeloA-SupuestoI'
  created_at    timestamptz DEFAULT now(),
  UNIQUE (oposicion_id)             -- Solo 1 por oposición (free = todos ven el mismo)
);
```

#### Tabla `supuesto_bank` (premium tier — banco progresivo)
```sql
CREATE TABLE supuesto_bank (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oposicion_id   uuid NOT NULL REFERENCES oposiciones(id),
  caso           jsonb NOT NULL,     -- {titulo, escenario, bloques_cubiertos}
  preguntas      jsonb NOT NULL,     -- Pregunta[] (20 preguntas)
  es_oficial     boolean DEFAULT false,
  fuente         text,               -- 'ai-supuesto-c1-1.0' | 'INAP-2024-...'
  -- Métricas
  times_served   int DEFAULT 0,
  avg_score      numeric(4,1),       -- Media de puntuación de usuarios
  error_reports  int DEFAULT 0,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX idx_sbank_opo ON supuesto_bank (oposicion_id);
```

#### Tabla `user_supuestos_seen` (tracking)
```sql
CREATE TABLE user_supuestos_seen (
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supuesto_id  uuid NOT NULL REFERENCES supuesto_bank(id) ON DELETE CASCADE,
  score        numeric(4,1),  -- Puntuación obtenida (0-50)
  seen_at      timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, supuesto_id)
);
```

#### Cambio en `tests_generados`
```sql
-- Añadir 'supuesto_c1' al check constraint de tipo
ALTER TABLE tests_generados DROP CONSTRAINT tests_generados_tipo_check;
ALTER TABLE tests_generados ADD CONSTRAINT tests_generados_tipo_check
  CHECK (tipo IN ('tema', 'simulacro', 'repaso_errores', 'psicotecnico', 'supuesto_c1'));

-- Añadir columna para caso del supuesto (NULL para otros tipos de test)
ALTER TABLE tests_generados ADD COLUMN supuesto_caso jsonb;
-- Contiene: {titulo, escenario, bloques_cubiertos} — solo cuando tipo='supuesto_c1'
```

#### Feature flag: sin flag nuevo
Lógica basada en `nivel` (ya existe en migration 047):
- `nivel = 'A2'` + `supuesto_practico = true` → supuesto desarrollo (existente)
- `nivel = 'C1'` → supuesto test (nuevo, este feature)
- `nivel = 'C2'` → sin supuesto

### Fases de ejecución

#### Fase 2.5a — Datos oficiales + bugs (sin IA, sin coste)
- [ ] **BUG-SP1**: Fix calculadora bloques II→V (`CalculadoraNotaC1.tsx:307`)
- [ ] **BUG-SP2**: Fix filtro `numero <= 60` dinámico por oposición (`generate-simulacro/route.ts`)
- [ ] **BUG-SP3**: Fix timer dinámico por oposición (`tests/[id]/page.tsx`)
- [ ] **BUG-SP4**: Parsear Parte 2 de PDFs 2024 (supuestos I y II, modelos A y B)
  - Extraer caso narrativo + 20 preguntas + 5 reserva + respuestas correctas
  - Crear `data/examenes_c1/2024/supuesto_1a.json`, `supuesto_2a.json` (modelo A)
  - Validar contra plantilla definitiva INAP
- [ ] Migration: crear tablas `free_supuesto_bank`, `supuesto_bank`, `user_supuestos_seen`
- [ ] Migration: añadir `supuesto_c1` al check constraint + columna `supuesto_caso`
- [ ] Ingestar supuesto oficial 2024 (Supuesto I) en `free_supuesto_bank` → free users ven este

#### Fase 2.5b — Backend generación IA
- [ ] Crear `lib/ai/supuesto-practico-test.ts`:
  - System prompt basado en formato real 2024 (few-shot con supuesto oficial)
  - Input: contexto legal bloques II-V (via retrieval existente)
  - Output: `{titulo, escenario, preguntas: Pregunta[20]}`
  - Cada pregunta lleva campo `bloque: 'II'|'III'|'IV'|'V'` para desglose
  - Validación post-generación: rechazar si no hay ≥1 pregunta por bloque
- [ ] Crear `/api/ai/generate-supuesto-test`:
  - Free user: servir de `free_supuesto_bank` (check: ya lo ha hecho? → paywall)
  - Premium user: servir de `supuesto_bank` (unseen). Si no hay unseen → generar con IA → guardar en banco
  - Guardar test en `tests_generados` con `tipo='supuesto_c1'` + `supuesto_caso` JSON
  - `prompt_version: 'free-supuesto-1.0'` | `'supuesto-bank-1.0'` | `'ai-supuesto-c1-1.0'`
- [ ] Verificación legal: reutilizar batch verification existente
- [ ] Script seed: `execution/generate-supuesto-bank.ts` — pre-generar 5 supuestos ($1.75)

#### Fase 2.5c — Frontend
- [ ] Página `/supuesto-practico-c1`:
  - Explicación del formato + datos del examen real
  - Botón "Practicar supuesto práctico"
  - Free: badge "1 supuesto gratis (examen oficial INAP 2024)"
  - Premium: badge "Supuestos ilimitados"
- [ ] Adaptar `tests/[id]/page.tsx` para `tipo === 'supuesto_c1'`:
  - Cabecera: "Supuesto Práctico C1" con badge "Parte 2 del examen"
  - **Desktop**: split view — caso a la izquierda (sticky), preguntas a la derecha
  - **Mobile**: drawer/sheet colapsable "Ver caso" con FAB, preguntas debajo
  - Timer referencia: "~30 min en el examen real" (informativo, no obligatorio)
- [ ] Adaptar `tests/[id]/resultados/page.tsx`:
  - Puntuación sobre 50 (no sobre 10 como tests normales)
  - Desglose por bloque (II, III, IV, V)
  - Indicador: "Con esta nota + tu Parte 1 → ¿habrías aprobado?"
- [ ] Sidebar: mostrar "Supuesto Práctico" para usuarios C1 (condicional por `nivel`)
- [ ] Freemium gating: PaywallGate con code `PAYWALL_SUPUESTO_C1`

#### Fase 2.5d — Integración con simulacro completo (nice-to-have)
- [ ] Opción en simulacros C1: "Examen completo: Parte 1 (70 preguntas) + Parte 2 (supuesto)"
  - Combina preguntas oficiales de Parte 1 + supuesto del banco
  - Timer: 100 minutos total
  - Resultados: nota por parte + nota total + ¿supera corte 2024 (47,33)?

### Estimación de costes

| Concepto | Coste |
|----------|-------|
| Seed banco (5 supuestos × $0.35) | $1.75 (one-time) |
| Parseo supuestos oficiales 2024 | $0 (manual/script) |
| Primeros 50 premium users (~5 generaciones IA) | ~$1.75 |
| Coste ongoing (banco lleno, >50 users) | ~$0/mes |
| **Coste total hasta break-even** | **~$3.50** |

### Requisitos del checklist

| # | Requisito | Cómo se aplica |
|---|-----------|---------------|
| 1 | Error Handling | Fallback si IA falla: servir del banco aunque sea repetido |
| 2 | Logging | Log generación, reuse del banco, errores verificación |
| 5 | Input Validation | Zod schema para request endpoint |
| 6 | Testing | Golden Dataset = supuesto oficial 2024 (comparar calidad IA vs real) |
| 8 | Prompt Injection | System prompt resistente |
| 11 | Rate Limiting | Reutilizar rate limit de generate-test |
| 20 | Prompt Versioning | Tracked en tests_generados.prompt_version |

### Lo que NO hacemos (decisiones conscientes)
- **NO** tabla nueva para cada pregunta — la unidad es el supuesto completo (caso + 20 preguntas)
- **NO** generamos 2 supuestos para elegir — en práctica, 1 es suficiente (ahorra 50% coste)
- **NO** cronómetro obligatorio — solo referencia informativa
- **NO** soporte exámenes pre-2024 (formato desarrollo antiguo, no relevante)
- **NO** flag nuevo en features — usamos `nivel='C1'` para la lógica condicional
- **NO** deduplicación a nivel pregunta — no tiene sentido separar preguntas de su caso

---

## FASE 3 — Futuras (solo estructura)

### 3.1 Hacienda C1 (AEAT)
- [ ] INSERT oposición + 32 temas con activa=false
- [ ] 80 preguntas test + 10 supuestos desarrollo
- [ ] Si da tiempo: popular y activar para mayo

### 3.2 Penitenciarias C1
- [ ] INSERT oposición + 50 temas con activa=false
- [ ] 120+40 preguntas test (160 total), examen ~2027

---

## Fuentes oficiales

| Recurso | URL |
|---------|-----|
| BOE Justicia completo (PDF 35pp) | https://www.boe.es/boe/dias/2025/12/30/pdfs/BOE-A-2025-27053.pdf |
| BOE Justicia HTML | https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-27053 |
| Exámenes Auxilio MJU | https://www.mjusticia.gob.es/es/ciudadania/empleo-publico |
| LOPJ consolidada | https://www.boe.es/buscar/act.php?id=BOE-A-1985-12666 |
| LEC consolidada | https://www.boe.es/buscar/act.php?id=BOE-A-2000-323 |
| LECrim consolidada | https://www.boe.es/buscar/act.php?id=BOE-A-1882-6036 |
| Constitución | https://www.boe.es/buscar/act.php?id=BOE-A-1978-31229 |
| Temario Auxilio (vence.es) | https://www.vence.es/auxilio-judicial/temario |
| Temario Tramitación (vence.es) | https://www.vence.es/tramitacion-procesal/temario |
| Correos empleo | Web Correos Personas y Talento |
| Ley Postal 43/2010 | BOE legislación consolidada |

---

## FASE S — Landing global + Pricing page + SEO (transversal, ejecutar en paralelo)

### S.1 Arquitectura de páginas web (patrón hub+spoke)

Estructura:
```
/                              → Landing principal (hub de ramas)
/precios                       → Pricing page con tabs por rama
/oposiciones/administracion    → Landing rama AGE
/oposiciones/correos           → Landing rama Correos
/oposiciones/justicia          → Landing rama Justicia (hub)
/oposiciones/justicia/auxilio-judicial       → Sub-landing
/oposiciones/justicia/tramitacion-procesal   → Sub-landing
/oposiciones/justicia/gestion-procesal       → Sub-landing
/herramientas/calculadora-nota-justicia      → Tool SEO
/herramientas/calculadora-nota-correos       → Tool SEO
/blog/[slug]                   → Artículos SEO
```

### S.2 Landing principal — Rediseño (/)
- [x] `app/(marketing)/page.tsx`: sección "¿Qué oposición preparas?" con cards por rama
  - Card AGE: "Administración del Estado" · C2+C1+A2 · activa → CTA "Empieza gratis"
  - Card Correos: "Correos" · Próximamente · WaitlistForm
  - Card Justicia: "Justicia" · Próximamente · WaitlistForm
- [x] Cards inactivas: opacity-75, badge "Próximamente"
- [x] Formulario "Avísame" inline en cards inactivas (POST /api/waitlist)
- [x] Componente `WaitlistForm.tsx` creado
- [x] Secciones blog Correos + Justicia añadidas
- [x] FAQ actualizado para mencionar próximas oposiciones
- [x] Sección "Próximamente" duplicada eliminada (integrada en sección principal)
- [x] Mantener secciones genéricas: features, social proof, FAQ global, testimonios
- [ ] Mover pricing detallado a /precios (no saturar landing)
- [ ] Hero genérico multi-rama (pendiente — actual sigue siendo AGE-first)

### S.3 Pricing page dedicada (/precios)
- [x] Crear `app/(marketing)/precios/page.tsx`
- [x] Tabs por rama: [Administración] [Justicia] [Correos]
- [x] Al seleccionar tab, muestra SOLO los packs de esa rama:
  - AGE: Individual C2 49.99€, Individual C1 49.99€, A2 69.99€, Doble 79.99€, Triple 129.99€
  - Justicia: Individual Auxilio 49.99€, Tramitación 49.99€, Gestión 79.99€, Doble 79.99€, Triple 139.99€
  - Correos: Pack Correos 39.99€ (único)
- [x] Tabla comparativa free vs premium (genérica, aplica a todas)
- [x] FAQ pricing: "¿Puedo cambiar de oposición?", "¿Es pago único?", "¿Qué incluye?"
- [x] Schema markup Product + Offer
- [x] Ramas inactivas: tab visible pero pricing dice "Próximamente"

### S.4 Sub-landings por rama (SEO critical)
- [ ] `app/(marketing)/oposiciones/administracion/page.tsx` — crear cuando se activen Correos/Justicia y la landing `/` pase a ser hub multi-rama (mover contenido AGE actual aquí)
- [x] `app/(marketing)/oposiciones/correos/page.tsx` — NUEVA (Fase 1.3)
- [x] `app/(marketing)/oposiciones/justicia/page.tsx` — NUEVA (hub) (Fase 2.6)
- [x] `app/(marketing)/oposiciones/justicia/auxilio-judicial/page.tsx` — NUEVA (Fase 2.6)
- [x] `app/(marketing)/oposiciones/justicia/tramitacion-procesal/page.tsx` — NUEVA (Fase 2.6)
- [x] `app/(marketing)/oposiciones/justicia/gestion-procesal/page.tsx` — NUEVA (Fase 2.6)

Cada sub-landing incluye:
- [ ] Hero con datos oficiales (plazas, fecha examen, temario)
- [ ] Estructura del examen (ejercicios, scoring, duración)
- [ ] Temario completo (lista de temas)
- [ ] "¿Cómo te ayuda OpoRuta?" (features específicas de esa oposición)
- [ ] CTA registro con `?oposicion=[slug]`
- [ ] FAQ específica (diferencia con otros cuerpos, requisitos, etc.)
- [ ] Schema markup: FAQPage + Course + Dataset (para citabilidad LLM)

### S.5 Herramientas SEO (lead magnets)
- [ ] `app/(marketing)/herramientas/calculadora-nota-justicia/page.tsx`
  - Input: aciertos/errores por ejercicio → output: nota, ¿aprobado?
  - Datos reales de scoring por cuerpo (Auxilio 2 ej., Tramitación 3 ej.)
- [ ] `app/(marketing)/herramientas/calculadora-nota-correos/page.tsx`
  - Scoring sin penalización. Incluir méritos (experiencia, idiomas).
- [ ] Cada calculadora tiene CTA registro
- [ ] Schema markup interactivo

### S.6 Blog SEO — 15 posts publicados (Correos + Justicia)
- [x] Correos (5 posts): test-correos, temario, plazas, penalización, requisitos
- [x] Justicia (10 posts): diferencia-auxilio-tramitación, temario-auxilio, test-auxilio, nota-corte, gestion-procesal, temario-tramitación, gestion-procesal-guía, LO-1/2025-cambios, sueldo-justicia, preparar-por-libre
- [x] Total: 70 posts en content/blog/posts.ts (55 AGE + 5 Correos + 10 Justicia)
- [x] Todos con: metadata SEO, FAQPage schema, internal links a sub-landings
- [x] Sitemap auto-actualizado (blogPosts dinámico)
- [x] Landing muestra 3 posts destacados por rama (12 total)

### S.7 Captura "Avísame" para próximamente
- [x] Crear tabla `waitlist` (email, oposicion_slug, created_at) — migration 050
- [x] API route `POST /api/waitlist` (rate-limited, email validation)
- [x] Email confirmación inmediato al apuntarse (`sendWaitlistConfirmation`)
- [x] Script `notify-waitlist.ts` para envío masivo al activar oposición (`sendWaitlistActivation`)
- [x] GDPR: opt-in explícito (frontend muestra checkbox), enlace baja
- [x] Panel admin: `/admin/nurture` — funnel nurture emails + waitlist entries

### S.8 Sitemap + robots + SEO técnico
- [x] Actualizar `app/sitemap.ts` con todas las nuevas rutas (Correos, Justicia hub+sub, precios)
- [x] Actualizar `app/robots.ts` para permitir indexación de /oposiciones/*
- [x] `public/llms.txt` y `public/llms-full.txt`: añadir info Correos + Justicia
- [ ] Open Graph images dinámicas por oposición

---

## Verificación final

### Funcional
- [x] Landing: Ve ramas AGE (CTA) + Correos/Justicia (Próximamente con datos + "Avísame")
- [ ] Pricing page: tabs por rama, pricing correcto, inactivas con "Próximamente"
- [ ] Registro: ramas agrupadas, activas seleccionables, inactivas con badge
- [ ] Activar Correos → seleccionable en registro + landing, 12 temas aparecen
- [ ] Free bank Correos: test instantáneo, sin espera IA
- [ ] Scoring Correos: "Sin penalización — responde todas"
- [ ] Pack Correos 39.99€: checkout Stripe funciona
- [ ] Activar Auxilio: 26 temas, scoring por ejercicio con penalización
- [ ] Pack doble Justicia 79.99€: da acceso a Auxilio + Tramitación
- [ ] A2 Gestión: supuesto práctico visible, corrección IA funciona
- [ ] Admin panel: muestra ramas Correos + Justicia en desglose

### SEO
- [ ] Sub-landings indexables con schema markup correcto
- [ ] Calculadoras funcionan y aparecen en Google
- [ ] Blog artículos publicados con internal links
- [ ] Sitemap incluye todas las nuevas rutas
- [ ] llms.txt actualizado para citabilidad IA
