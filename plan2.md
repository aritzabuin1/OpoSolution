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
- [x] Descargar exámenes oficiales 2023 (REP+ATC, modelos A+B, plantillas) — 16 PDFs desde blob Correos
- [x] Descargar exámenes oficiales 2021 (REP+ATC, modelos A+B) — 10 PDFs
- [ ] Parsear e ingestar exámenes 2023 en BD
- [ ] Generar free bank: `pnpm generate:free-bank --oposicion correos`

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
- [x] Descargar cuadernillos + plantillas de MJU — Auxilio 22 PDFs (2008-2025), Tramitación 14 PDFs (2011-2025), Gestión 14 PDFs (2023-2025)
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

## FASE 2.5 — Supuesto Práctico formato TEST (módulo genérico, 4 oposiciones)

> **Contexto**: Varias oposiciones tienen un ejercicio de "supuesto práctico" en formato TEST: caso narrativo
> + preguntas tipo test vinculadas al caso. NO es desarrollo escrito. Es el mismo patrón en 4 oposiciones
> (AGE C1, Auxilio C2, Tramitación C1, Gestión Procesal A2). Ningún competidor ofrece práctica de esto.
>
> El módulo se construye **genérico y parametrizable**, implementando primero para AGE C1 y reutilizando
> para Justicia cuando se activen esas oposiciones.

### Fuentes oficiales

| Fuente | Referencia | Contenido |
|--------|-----------|-----------|
| BOE-A-2024-14098 | Convocatoria OEP 2023-2024 | Define estructura: ejercicio único, 2 partes, 100 min |
| BOE-A-2025-26262 | Convocatoria OEP 2025 | Confirma mismo formato test para supuesto |
| INAP Sede — ADVO-L 2024 Modelo A | `data/examenes_c1/2024/examen_a.pdf` (pág. 8-14) | Supuestos I y II completos con preguntas + respuestas |
| INAP Sede — ADVO-L 2024 Modelo B | `data/examenes_c1/2024/examen_b.pdf` | Idem modelo B |
| INAP Sede — Plantillas definitivas | `data/examenes_c1/2024/plantilla_a.pdf`, `plantilla_b.pdf` | Respuestas correctas |

### Formato del supuesto test en las 4 oposiciones (verificado contra BOE + exámenes reales)

Fuentes: BOE-A-2024-14098 (AGE C1), BOE-A-2025-27053 Anexos III-V (Justicia), examen INAP 2024, examen MJU sept 2025.

| | AGE C1 | Auxilio Judicial C2 | Tramitación C1 | Gestión Procesal A2 |
|---|---|---|---|---|
| **Nº de casos** | 2 (elige 1) | **2 (responde ambos)** | 1 | 1 |
| **Preguntas** | 20 (+5 reserva) | **40 (+2 reserva)** = 20+20 | 10 (+2 reserva) | 10 (+2 reserva) |
| **Temática** | Administrativo: LPAC, EBEP, presupuestos, contratación, oficinas | Procesal: LEC, LECrim, ejecuciones, comunicaciones, jurisdicción voluntaria | Procesal: temas 1-31 | Procesal: todo el programa |
| **Penalización** | -1/3 | -1/4 | -1/4 | -1/5 |
| **Timer** | Compartido (100 min total con Parte 1) | Separado: 60 min | Separado: 30 min | Separado: 30 min |
| **Max pts** | 50 (min 25) | 40 (min 20) | 20 (min 10) | 15 (min 7.5) |
| **Ejercicio** | Parte 2 del ejercicio único | Ejercicio 2 (separado) | Ejercicio 2 (separado) | Ejercicio 2 (separado) |

**Diferencias clave:**
- **Auxilio** es el único donde **respondes los 2 casos** (no eliges). Son 20 preguntas por caso.
- En **AGE C1** eliges 1 de 2 supuestos propuestos (solo respondes 20 preguntas del elegido).
- En **Justicia** el supuesto es un ejercicio con timer independiente. En **AGE** comparte los 100 min con la Parte 1.
- La temática es completamente distinta: AGE = derecho administrativo, Justicia = derecho procesal.
- Los enunciados de los casos de Justicia son "muy largos" (análisis examen sept 2025 por Opositatest).

**Lo que comparten (y justifica el módulo genérico):**
1. Formato: caso narrativo largo + preguntas test vinculadas al caso
2. Banco progresivo: misma lógica (unidad atómica = supuesto completo)
3. UI: mostrar caso + preguntas con corrección y penalización
4. Almacenamiento: `tests_generados` + `supuesto_caso` JSONB

**Lo que se parametriza por oposición:**
```typescript
interface SupuestoTestConfig {
  numCasos: 1 | 2              // AGE/Tramit/Gestión = 1, Auxilio = 2
  preguntasPorCaso: number      // 20, 20, 10, 10
  eligeCaso: boolean            // AGE = true (elige 1 de 2), resto = false
  tematica: 'administrativo' | 'procesal'  // distinto prompt de generación
  bloques: string[]             // AGE: ['II','III','IV','V'], Justicia: temas procesales
  penalizacion: number          // 0.333, 0.25, 0.20
  timerMinutos: number | null   // null = compartido con parte 1, 60/30 = separado
  promptTemplate: string        // prompt distinto por rama
}
```

### Estructura real del examen AGE C1 (verificada contra PDF 2024)

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
-- Añadir 'supuesto_test' al check constraint (genérico, no específico de C1)
ALTER TABLE tests_generados DROP CONSTRAINT tests_generados_tipo_check;
ALTER TABLE tests_generados ADD CONSTRAINT tests_generados_tipo_check
  CHECK (tipo IN ('tema', 'simulacro', 'repaso_errores', 'psicotecnico', 'supuesto_test'));

-- Añadir columna para caso del supuesto (NULL para otros tipos de test)
ALTER TABLE tests_generados ADD COLUMN supuesto_caso jsonb;
-- Contiene: {titulo, escenario, bloques_cubiertos} — solo cuando tipo='supuesto_test'
-- El oposicion_id ya existente determina de qué oposición es el supuesto
```

#### Feature flag: sin flag nuevo
Lógica basada en `scoring_config.ejercicios`:
- Si la oposición tiene un ejercicio con nombre que contiene "supuesto" o "caso práctico" → mostrar módulo supuesto test
- Si `features.supuesto_practico = true` → mostrar módulo supuesto desarrollo (GACE A2, Gestión Procesal Ej.3)
- Ambos pueden coexistir (Gestión Procesal tiene Ej.2 caso test + Ej.3 desarrollo escrito)

### Fases de ejecución

#### Fase 2.5a — Datos oficiales + bugs (sin IA, sin coste)
- [x] **BUG-SP1**: Fix calculadora bloques II→V (`CalculadoraNotaC1.tsx` — 3 ocurrencias corregidas)
- [x] **BUG-SP2**: Fix filtro `numero <= 60` dinámico por oposición (`generate-simulacro/route.ts` — usa scoring_config.ejercicios[0].preguntas)
- [x] **BUG-SP3**: Fix timer dinámico por oposición (`tests/[id]/page.tsx` — fetch scoring_config, soporta minutos_total)
- [x] **BUG-SP4**: Parsear Parte 2 de PDFs 2024 (supuestos I y II, modelo A)
  - Extraído con Anthropic documents API (Vision) — script `execution/extract-supuestos-c1.ts`
  - `supuestos_a.json`: 2 supuestos, 40 preguntas, escenarios completos, respuestas mergeadas con plantilla
  - Validación OK: 0 missing correcta, 1 anulada (Supuesto II pregunta 3)
- [x] **BUG-SP5**: Fix scoring_config C1 AGE — migration 051 (2 ejercicios: Cuestionario 70q + Supuesto 20q, 100 min total)
- [x] Migration 052: crear tablas `free_supuesto_bank`, `supuesto_bank`, `user_supuestos_seen` + RLS
- [x] Migration 052: añadir `supuesto_test` al check constraint + columna `supuesto_caso`
- [x] Migration 053: Fix scoring_config Correos (reserva 0→10, min_aprobado por puesto)
- [x] **AUDITORÍA**: Migration 049 (Justicia ×3) verificada campo por campo contra BOE-A-2025-27053 — CERO discrepancias
- [x] **EXÁMENES DESCARGADOS**: Correos 26 PDFs (2021+2023), Auxilio 22 PDFs (2008-2025), Tramitación 14 PDFs (2011-2025), Gestión 14 PDFs (2023-2025)
- [ ] Ingestar supuesto oficial 2024 (Supuesto I) en `free_supuesto_bank` → free users ven este

#### Fase 2.5b — Backend generación IA (módulo genérico)
- [ ] Crear `lib/ai/supuesto-test.ts` (genérico, NO específico de C1):
  - Interface `SupuestoTestConfig` parametrizable (numCasos, preguntasPorCaso, etc.)
  - Prompt factory: `getSupuestoTestPrompt(config, contextoLegal)` con templates por rama:
    - `administrativo`: caso de funcionario en organismo AGE (LPAC, EBEP, presupuestos)
    - `procesal`: caso de diligencias judiciales (LEC, LECrim, ejecuciones)
  - Few-shot: incluir supuesto oficial como ejemplo (AGE 2024, Justicia sept 2025)
  - Output: `{titulo, escenario, preguntas: Pregunta[N]}`
  - Validación post-generación: rechazar si cobertura temática insuficiente
- [ ] Crear `/api/ai/generate-supuesto-test` (endpoint único para todas las oposiciones):
  - Detecta oposición del usuario → carga `SupuestoTestConfig` correspondiente
  - Free user: servir de `free_supuesto_bank` (check: ya lo ha hecho? → paywall)
  - Premium user: servir de `supuesto_bank` (unseen, filtrado por oposicion_id)
  - Si no hay unseen → generar con IA → guardar en banco (scoped por oposicion_id)
  - Guardar test en `tests_generados` con `tipo='supuesto_test'` + `supuesto_caso` JSON
  - `prompt_version: 'free-supuesto-1.0'` | `'supuesto-bank-1.0'` | `'ai-supuesto-test-1.0'`
  - Para Auxilio (2 casos): generar 2 casos en paralelo, concatenar preguntas
- [ ] Verificación legal: reutilizar batch verification existente
- [ ] Script seed: `execution/generate-supuesto-bank.ts --oposicion <slug>`
  - AGE C1: pre-generar 5 supuestos ($1.75)
  - Justicia: pre-generar cuando se activen (mismo script, distinto --oposicion)

#### Fase 2.5c — Frontend (genérico)
- [ ] Página `/supuesto-practico-test` (genérica, adapta contenido por oposición):
  - Explicación del formato + datos del examen real (distintos por oposición)
  - Botón "Practicar supuesto práctico"
  - Free: badge "1 supuesto gratis (examen oficial)"
  - Premium: badge "Supuestos ilimitados"
- [ ] Adaptar `tests/[id]/page.tsx` para `tipo === 'supuesto_test'`:
  - Cabecera dinámica: "Supuesto Práctico — [nombre oposición]"
  - **Desktop**: split view — caso a la izquierda (sticky), preguntas a la derecha
  - **Mobile**: drawer/sheet colapsable "Ver caso" con FAB, preguntas debajo
  - Para Auxilio (2 casos): separador visual entre Caso 1 y Caso 2
  - Timer: usar `scoring_config.ejercicios[N].minutos` (60/30 min) o referencia si compartido
- [ ] Adaptar `tests/[id]/resultados/page.tsx`:
  - Puntuación sobre max del ejercicio (50, 40, 20, 15 según oposición)
  - Desglose por área temática
  - AGE C1: "Con esta nota + tu Parte 1 → ¿habrías aprobado?"
  - Justicia: "Has superado / no has superado el mínimo eliminatorio"
- [ ] Sidebar: mostrar "Supuesto Práctico" si la oposición tiene ejercicio supuesto en scoring_config
- [ ] Freemium gating: PaywallGate con code `PAYWALL_SUPUESTO_TEST`

#### Fase 2.5d — Integración con simulacro completo (nice-to-have)
- [ ] AGE C1: "Examen completo: Parte 1 (70 preguntas) + Parte 2 (supuesto)"
  - Timer: 100 minutos total
  - Resultados: nota por parte + nota total + ¿supera corte 2024 (47,33)?
- [ ] Justicia: "Ejercicio 2 completo" como opción en simulacros
  - Timer independiente (60 min Auxilio, 30 min Tramitación/Gestión)

### Estimación de costes

| Concepto | Coste |
|----------|-------|
| Seed banco AGE C1 (5 supuestos × $0.35) | $1.75 (one-time) |
| Seed banco Justicia ×3 (5 supuestos × $0.35 × 3 opos) | $5.25 (one-time, al activar) |
| Parseo supuestos oficiales | $0 (manual/script) |
| Primeros 50 premium users por oposición (~5 gen IA) | ~$1.75/oposición |
| Coste ongoing (banco lleno, >50 users) | ~$0/mes |
| **Coste total AGE C1 hasta break-even** | **~$3.50** |
| **Coste total incluyendo Justicia ×3** | **~$14** |

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
- **NO** tabla nueva para cada pregunta — la unidad es el supuesto completo (caso + N preguntas)
- **NO** generamos 2 supuestos para elegir en AGE C1 — en práctica, 1 es suficiente (ahorra 50% coste)
- **NO** módulo separado por oposición — 1 endpoint genérico parametrizado por `SupuestoTestConfig`
- **NO** cronómetro obligatorio — solo referencia informativa (pero respetamos timer separado en Justicia)
- **NO** soporte exámenes pre-2024 AGE (formato desarrollo antiguo, no relevante)
- **NO** deduplicación a nivel pregunta — no tiene sentido separar preguntas de su caso
- **NO** implementamos Justicia hasta activar esas oposiciones — pero la arquitectura lo soporta día 1

---

## GAPS TRANSVERSALES — Detectados durante auditoría de FASE 2.5

> Auditoría completa de todas las oposiciones vs lo que la app implementa realmente.
> Datos verificados contra migrations 039, 047, 048, 049 y el código fuente.

### GAP-1: Supuesto práctico TEST — afecta a 4 oposiciones (no solo C1 AGE)

Resuelto por FASE 2.5 (módulo genérico). Ver tabla comparativa completa en esa sección.

**Diferencias clave verificadas contra BOE + exámenes reales:**
- **AGE C1**: 2 casos, elige 1, 20 preguntas. Temática administrativa. Timer compartido.
- **Auxilio C2**: **2 casos obligatorios** (NO elige), 20+20=40 preguntas. Temática procesal. Timer separado 60 min.
- **Tramitación C1**: 1 caso, 10 preguntas. Temática procesal. Timer separado 30 min.
- **Gestión Procesal A2**: 1 caso, 10 preguntas. Temática procesal. Timer separado 30 min.

La FASE 2.5 se construye como módulo genérico parametrizable con `SupuestoTestConfig`. Se implementa primero para AGE C1 y se reutiliza para Justicia.

### GAP-2: Ofimática como ejercicio separado — Tramitación C1

Tramitación Procesal tiene **3 ejercicios**, el tercero es ofimática:
- 20 preguntas sobre Word 365, 40 min, +1.00/-0.25, max=20, min_aprobado=10
- 6 temas de ofimática (32-37) YA insertados en BD (migration 049)
- `features.ofimatica = true` pero **no hay UI, ni generación, ni ejercicio separado**

**Alcance**: No es bloqueante para activación de Auxilio/Gestión (no tienen ofimática). Sí bloqueante para Tramitación.

### GAP-3: Multi-exercise scoring — `scoring.ts:123` solo calcula ejercicio 1

```typescript
// Multi-exercise: for now, calculate first exercise only
const ej = calcularEjercicio(aciertos, errores, enBlanco, sc.ejercicios[0])
```

**Oposiciones afectadas:**
- Auxilio C2 (2 ej.): solo puntúa Ej.1 (60pts), ignora Ej.2 (40pts)
- Tramitación C1 (3 ej.): solo puntúa Ej.1 (60pts), ignora Ej.2+3 (40pts)
- Gestión Procesal A2 (3 ej.): solo puntúa Ej.1 (60pts), ignora Ej.2+3 (40pts)
- GACE A2 (2 ej.): Ej.2 tiene su propio flujo en `/supuesto-practico`, funciona parcialmente

**No bloqueante ahora** (todas inactivas), pero **bloqueante antes de activar cualquier oposición de Justicia**.

**Fix**: `calcularPuntuacion()` ya acepta arrays en la interfaz (`EjercicioResult[]`). Solo falta que la UI envíe aciertos/errores por ejercicio y que el scorer los procese.

### GAP-4: Desarrollo escrito — solo GACE A2, falta Gestión Procesal A2

| | GACE A2 (AGE) | Gestión Procesal A2 (Justicia) |
|---|---|---|
| Cuerpo | Administración Civil del Estado | Administración de Justicia |
| Ejercicio | Ej.2: 5 cuestiones, 150 min | Ej.3: 5 cuestiones, 45 min |
| Bloques | IV (derecho admin), V (RRHH), VI (financiero) | Temas 17-39 y 43-67 (procesal) |
| Rúbrica | INAP (Conocimiento 30, Análisis 10, Sistemática 5, Expresión 5) | MJU — rúbrica distinta, por investigar |
| Implementación | ✅ `supuesto-practico.ts` + corrección IA | ❌ No implementado |
| Feature flag | `supuesto_practico: true` | `supuesto_practico: true` |

El sistema de corrección IA (`/api/ai/corregir-supuesto`) es reutilizable pero necesita:
- Prompt adaptado con rúbrica MJU en vez de INAP
- Temas procesales (derecho procesal civil, penal, laboral) en vez de AGE (contratación, presupuestos)

**No bloqueante para activación de Auxilio/Tramitación.** Bloqueante solo para Gestión Procesal A2.

### GAP-5: scoring_config de AGE C1 incorrecto

**Migration 047 dice:**
```json
{"ejercicios": [{"nombre": "Test teórico", "preguntas": 100, "minutos": 90, ...}]}
```

**Examen real (verificado contra PDF INAP 2024):**
- 90 preguntas puntuables (70 Parte 1 + 20 Parte 2), NO 100
- 100 minutos, NO 90
- Las 2 partes tienen valor por pregunta MUY distinto: 50/70=0.714 pts vs 50/20=2.50 pts
- Debería tener 2 ejercicios en scoring_config (como ya hace Auxilio/Tramitación)

**Fix**: Actualizar scoring_config de C1 a 2 ejercicios:
```json
{
  "ejercicios": [
    {"nombre": "Cuestionario", "preguntas": 70, "minutos": null, "acierto": 0.714, "error": 0.238, "max": 50, "min_aprobado": 25, "penaliza": true},
    {"nombre": "Supuesto práctico", "preguntas": 20, "minutos": null, "acierto": 2.50, "error": 0.833, "max": 50, "min_aprobado": 25, "penaliza": true}
  ],
  "minutos_total": 100
}
```
~~Bloqueante para FASE 2.5.~~ **RESUELTO** — Migration 051 aplicada.

### GAP-6: Correos — psicotécnicos embebidos vs módulo separado

`scoring_config` de Correos dice `preguntas_psicotecnicos: 10` (embebidos en el test de 100). Pero `features.psicotecnicos: true` muestra el módulo `/psicotecnicos` en la sidebar como si fueran un ejercicio aparte.

En realidad para Correos los psicotécnicos van **mezclados dentro del examen**, no como práctica separada. La UX actual (módulo aparte de 30 psicotécnicos calibrado para AGE C2) no es representativa del examen de Correos.

**Prioridad baja** — no bloquea la activación. Los usuarios de Correos pueden practicar psicotécnicos por separado aunque el examen los mezcle.

### Resumen por oposición: qué falta para activar

| Oposición | Test básico | Simulacros oficiales | Supuesto test | Ofimática | Desarrollo escrito | Multi-scoring | Estado |
|-----------|------------|---------------------|---------------|-----------|-------------------|---------------|--------|
| **AGE C2** | ✅ | ✅ | N/A | N/A | N/A | N/A (1 ej.) | **ACTIVA** |
| **AGE C1** | ✅ | sin datos | FASE 2.5 | N/A | N/A | FASE 2.5 (fix scoring_config) | inactiva |
| **GACE A2** | ✅ | sin datos | N/A | N/A | ✅ | parcial | inactiva |
| **Correos** | ✅ | sin datos | N/A | N/A | N/A | N/A (1 ej.) | **solo falta free bank + datos** |
| **Auxilio C2** | ✅ | sin datos | **FALTA** | N/A | N/A | **FALTA** | inactiva |
| **Tramitación C1** | ✅ | sin datos | **FALTA** | **FALTA** | N/A | **FALTA** | inactiva |
| **Gestión Proc. A2** | ✅ | sin datos | **FALTA** | N/A | **FALTA** (rúbrica MJU) | **FALTA** | inactiva |

### Orden de implementación recomendado

1. ~~**FASE 2.5a**: Fix bugs existentes + parsear supuesto oficial 2024~~ **COMPLETADO**
2. ~~**GAP-5**: Fix scoring_config C1 AGE (prerequisito de FASE 2.5)~~ **COMPLETADO** — Migration 051
3. **GAP-3**: Multi-exercise scoring genérico (prerequisito de Justicia) ← **SIGUIENTE**
4. **FASE 2.5b-c**: Supuesto práctico test genérico (C1 AGE primero, luego Justicia)
5. **GAP-2**: Ofimática ejercicio separado (solo si activamos Tramitación)
6. **GAP-4**: Desarrollo escrito Gestión Procesal (solo si activamos Gestión Procesal)

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
