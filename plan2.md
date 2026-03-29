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
- [x] Crear 6 productos en Stripe Dashboard (Correos + 5 Justicia) ← MANUAL — completado 2026-03-29
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
- [x] Contenido operativo Correos: 93 secciones ingestadas en conocimiento_tecnico (bloque='correos') + migration 056
- [x] Free bank COMPLETA: 12/12 temas × 10 preguntas = 120 preguntas
  - Fix: aliases LEY_POSTAL + RD_POSTAL + retrieval.ts detectConocimientoBloque()
- [x] Descargar exámenes oficiales 2023 (REP+ATC, modelos A+B, plantillas) — 16 PDFs desde blob Correos
- [x] Descargar exámenes oficiales 2021 (REP+ATC, modelos A+B) — 10 PDFs
- [x] Parsear e ingestar exámenes 2023 en BD — ~280 preguntas (REP 95q + ATC 93q + variantes) con `--oposicion correos`
- [x] Parsear exámenes 2021 — plantillas descargadas de blob Correos (veropo.com). REP 48q + ATC 24q parseadas

### 1.3 Landing SEO Correos
- [x] Crear `app/(marketing)/oposiciones/correos/page.tsx`
- [x] Metadata SEO: "Test Correos 2026 — Practica gratis con preguntas del examen"
- [x] Schema markup FAQPage
- [x] Datos: 4.055 plazas, 12 temas, examen mayo, sin penalización
- [x] CTA registro con `?oposicion=correos`
- [x] Actualizar `app/sitemap.ts` con nueva ruta

### 1.4 Activación Correos
- [x] Verificar: free bank completo (12/12 temas × 10 preguntas = 120 preguntas)
- [x] Verificar: legislación indexada (2.679 artículos + 93 secciones conocimiento_tecnico)
- [x] Verificar: exámenes oficiales 2023 ingestados (55 preguntas)
- [x] Verificar código: registro dinámico, scoring sin penalización, dashboard scoping, Stripe tiers
- [x] **MANUAL Aritz**: Crear producto Stripe + copiar price_id a `STRIPE_PRICE_PACK_CORREOS` en Vercel ✅
- [x] **MANUAL Aritz**: `UPDATE oposiciones SET activa = true WHERE slug = 'correos'` ✅
- [x] Deploy y probar flujo completo ✅ — Correos en producción 2026-03-28

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
- [x] Verificar temas ACTUALIZADOS por LO 1/2025: T8, T10, T16 OK (ya tagged [LO 1/2025]). T18 no afectado (LECrim no reformada)
- [x] Fix: tema_ids no resueltos para Gestión Procesal → Migration 055 inserta temas 17-68 (52 temas). Tagging LO_SPJ corregido

### 2.3 Contenido Justicia — Exámenes oficiales
- [x] Directorios creados: examenes_auxilio/, examenes_tramitacion/, examenes_gestion_procesal/
- [x] ingest-examenes.ts adaptado para slugs Justicia (auxilio-judicial, tramitacion-procesal, gestion-procesal)
- [x] Descargar cuadernillos + plantillas de MJU — Auxilio 22 PDFs (2008-2025), Tramitación 14 PDFs (2011-2025), Gestión 14 PDFs (2023-2025)
- [x] Parsear Auxilio 2024: `parsed_a.json` — 99 preguntas con plantilla (regex OK)
- [x] Ingestar Auxilio 2024 ej1: 99 preguntas + ej2 caso práctico: 36 preguntas = 135 total
- [x] Parsear + ingestar Auxilio 2025 ej1: 100 preguntas + ej2 caso práctico: 34 preguntas = 134 total
- [x] Parsear + ingestar Tramitación 2024 — 99 parseadas (GPT), 99 ingestadas
- [x] Parsear + ingestar Tramitación 2025 — 100 parseadas (GPT), 100 ingestadas
- [x] Parsear + ingestar Gestión 2023 — 83 parseadas (GPT), 83 ingestadas
- [x] Parsear + ingestar Gestión 2025 — 103 parseadas (GPT), 103 ingestadas
- [x] Fix: `MAX_PUNTUABLE` hardcodeado 60 → dinámico desde scoring_config (bug descartaba preguntas >60)
- [x] Gestión 2024 — cuestionario + plantilla descargados de MJU (sept 2024, OEP 2023). Parseando e ingistando
- [x] Insertar en examenes_oficiales + preguntas_oficiales

### 2.4 Contenido Justicia — Free bank
- [x] Ingestar Auxilio 2024: 59 preguntas oficiales
- [x] Free bank Auxilio: 25/26 temas (250 preguntas). Tema 14 "Régimen disciplinario" pendiente (no bloqueante)
- [x] Free bank Tramitación: 37/37 temas (370 preguntas, 0 errores)
- [x] Free bank Gestión: 67/68 temas (670 preguntas, 1 timeout T35)

### 2.5 Rúbrica supuesto práctico A2
- [x] Investigar criterios corrección tribunal para Gestión Procesal — **ENCONTRADOS**:
  - 5 preguntas × 5 pts = 25 pts máximo, mínimo 12.5 (50%)
  - Criterios: nivel de conocimiento, claridad y orden de ideas, expresión escrita, presentación
  - 45 minutos, temas 17-39 y 43-67, espacio limitado por el tribunal
  - Fuente: [OpositaTest](https://blog.opositatest.com/gestion-procesal-tercer-ejercicio) + convocatoria BOE
- [x] Adaptar corrección IA con rúbrica MJU: `getSystemCorregirSupuesto(leg, slug)` despacha a INAP o MJU
  - `getSystemCorregirSupuestoMJU()`: rúbrica 4 criterios (conocimiento 3pts + claridad 1pt + expresión 0.5pts + presentación 0.5pts) × 5 preguntas = 25 pts, min 12.5
  - Endpoint `corregir-supuesto/stream` resuelve slug desde oposicion_id y lo pasa
- [x] Formato: desarrollo escrito (5 preguntas, 45 min, temas 17-39 y 43-67) — documentado en prompt MJU

### 2.6 SEO Justicia
- [x] Hub: `app/(marketing)/oposiciones/justicia/page.tsx`
- [x] Sub: `app/(marketing)/oposiciones/justicia/auxilio-judicial/page.tsx`
- [x] Sub: `app/(marketing)/oposiciones/justicia/tramitacion-procesal/page.tsx`
- [x] Sub: `app/(marketing)/oposiciones/justicia/gestion-procesal/page.tsx`
- [x] Calculadora nota Justicia (por ejercicio, con penalización) — `/herramientas/calculadora-nota-justicia`
- [x] Calculadora nota Correos — `/herramientas/calculadora-nota-correos`
- [x] Blog: 15 posts Justicia + 8 posts Correos publicados (posts.ts)
- [x] Actualizar sitemap.ts

### 2.7 Activación progresiva Justicia
> **ESTRATEGIA DE DEPLOY**: activar UNA oposición a la vez. Verificar flujo completo
> (registro → test → simulacro → supuesto test → Tutor IA → Stripe) ANTES de activar la siguiente.
> Usar `VERIFICACION_PLAN2.md` como checklist para cada oposición.
> Lección aprendida: AGE + Correos requirieron 2 días de testing manual. Justicia = misma pauta.

- [x] **Fase 2a: Auxilio Judicial** (26 temas, ~24k inscritos) — **ACTIVA** (2026-03-29)
  - [x] Stripe "Pack Auxilio" 49,99€ creado + env var configurada
  - [x] `activa = true` en BD
  - [x] 4 supuestos oficiales ingestados (2024 I+II, 2025 I+II) en supuesto_bank + 1 en free_supuesto_bank
  - [x] Migrations 061 (bloques) + 062 (reto diario rama) aplicadas
  - [x] 6 bugs corregidos: RadarMini filtro, supuesto 30min/20pts, timer simulacro, caza-trampas filtro, reto diario per-rama, bloque fallback <=15
  - [x] Hardcodes AGE eliminados: corrector, cuenta, update-profile, useOposicionTier
  - [x] ExamCountdown eliminado de landing (AGE-specific)
  - [x] Auto-update fecha_examen al cambiar oposición

- [ ] **Fase 2b: Tramitación Procesal C1** (37 temas, ~30k inscritos) — free bank 37/37 ✅, exámenes 2024+2025 113q ✅
  1. Crear producto Stripe "Pack Tramitación" 49,99€ + `STRIPE_PRICE_PACK_TRAMITACION` en Vercel
  2. `UPDATE oposiciones SET activa = true WHERE slug = 'tramitacion-procesal'`
  3. Deploy
  4. **Verificar con `VERIFICACION_PLAN2.md`**: mismo checklist
  5. Bloqueante: GAP-2 ofimática como ejercicio separado (nice-to-have, no bloquea test básico)

- [ ] **Fase 2c: Gestión Procesal A2** (68 temas) — free bank 67/68 ✅, exámenes 2023+2025 118q ✅
  1. Crear producto Stripe "Pack Gestión Procesal" 79,99€ + `STRIPE_PRICE_PACK_GESTION_J` en Vercel
  2. `UPDATE oposiciones SET activa = true WHERE slug = 'gestion-procesal'`
  3. Deploy
  4. **Verificar con `VERIFICACION_PLAN2.md`**: mismo checklist + supuesto desarrollo con rúbrica MJU
  5. Bloqueante: GAP-4 desarrollo escrito con rúbrica MJU (solo para Ej.3)

- [ ] **Fase 2d: Combos Justicia** (solo tras 2a+2b+2c verificadas)
  1. Crear producto Stripe "Pack Doble Justicia" 79,99€ + `STRIPE_PRICE_PACK_DOBLE_JUSTICIA`
  2. Crear producto Stripe "Pack Triple Justicia" 139,99€ + `STRIPE_PRICE_PACK_TRIPLE_JUSTICIA`
  3. Verificar: checkout combo → acceso a múltiples oposiciones → créditos IA sumados correctamente

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
| **Free** | Siempre el mismo supuesto: 1 oficial de años anteriores | $0 | `free_supuesto_bank` |
| **Premium (banco lleno)** | Supuesto no visto del banco | $0 | `supuesto_bank` |
| **Premium (banco vacío)** | Supuesto generado por IA → se guarda en banco | ~$0.35 | IA + save to bank |

**Regla de oro: €0 en IA hasta que el cliente paga.** El seed del banco premium se construye con supuestos oficiales de años anteriores (coste $0 — solo parseo). Solo se genera con IA cuando un premium agota el banco y paga 9,99€.

**Estrategia seed por oposición: oficiales primero, IA solo para el gap**

1. Inventariar cuántos supuestos oficiales con formato test hay en los PDFs descargados
2. Parsear TODOS los oficiales → `supuesto_bank` con `es_oficial=true` (coste $0)
3. Contar: si oficiales ≥ ~10 → seed completado, €0 gastados en IA
4. Si oficiales < ~10 → generar SOLO la diferencia con IA (nuestro coste seed)
5. La dedup §DEDUP aplica al ingestar oficiales y al generar seed

**Inventario estimado de supuestos oficiales parseables:**

| Oposición | PDFs descargados | Supuestos/examen | Oficiales estimados | Seed IA necesario |
|---|---|---|---|---|
| AGE C1 | 2024 (A+B) | 2 supuestos/modelo | ~4 | ~6 (coste ~$2.10) |
| Auxilio Judicial | 22 PDFs (2008-2025) | 2 por examen (ambos) | **potencialmente 20+** | **~0 si ≥10 parseables** |
| Tramitación | 14 PDFs (2011-2025) | 1 por examen | **potencialmente 10+** | **~0 si ≥10 parseables** |
| Gestión Procesal | 14 PDFs (2023-2025) | 1 por examen | ~3-5 | ~5-7 (coste ~$2.50) |

> **IMPORTANTE**: Los números son estimados. Hay que verificar PDF por PDF cuántos contienen supuesto test en formato parseable. Los exámenes antiguos (pre-2015) pueden tener formato distinto. El inventario real se hace en la fase de parseo.

**Curva de reducción de coste:**

| Usuarios premium | Supuestos en banco | % servido sin IA | Coste medio/sesión |
|---|---|---|---|
| 0 (seed) | oficiales parseados (variable) | 100% | $0 |
| 1-10 | seed + primeras generaciones | ~80% | ~$0.07 |
| 10-50 | 15-25 | ~95% | ~$0.02 |
| 50+ | 25-30 (tope) | ~99% | ~$0.00 |

**Tope del banco: ~30 supuestos.** Con 4 bloques × ~7 temas/bloque, las combinaciones temáticas son finitas. Un opositor que ha hecho 30 supuestos distintos ya domina el formato. A partir de 30, recicla supuestos no vistos por ese usuario.

**Seed inicial**: Parsear TODOS los oficiales ($0) + generar solo el gap hasta ~10 (variable por oposición, ver tabla arriba).

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
  -- Dedup (ver §DEDUP para algoritmo completo)
  titulo_norm    text NOT NULL,      -- lower(unaccent(titulo)) — calculado en TS
  escenario_norm text NOT NULL,      -- lower(unaccent(primeras 500 chars escenario)) — calculado en TS
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
- [x] Ingestar supuesto oficial 2024 (Supuesto I) en `free_supuesto_bank` → free users ven este
  - Script `execution/ingest-supuestos-bank.ts` + `pnpm ingest:supuestos` ✅ ejecutado (S.I 20q free + S.I 20q + S.II 19q bank)

#### Fase 2.5b — Backend generación IA (módulo genérico)
- [x] Crear `lib/ai/supuesto-test.ts` (genérico, NO específico de C1):
  - Interface `SupuestoTestConfig` parametrizable (numCasos, preguntasPorCaso, etc.)
  - Prompt factory: `getSystemPrompt(config)` + `buildUserPrompt(config, contextoLegal)` con templates por rama:
    - `administrativo`: caso de funcionario en organismo AGE (LPAC, EBEP, presupuestos)
    - `procesal`: caso de diligencias judiciales (LEC, LECrim, ejecuciones)
  - Few-shot: ejemplo oficial INAP 2024 (Supuesto I)
  - Output: `SupuestoGeneradoSchema` (Zod): `{titulo, escenario, bloques_cubiertos, preguntas[]}`
  - Validación post-generación: rechazar si < 50% preguntas esperadas
  - 4 configs: administrativo-estado, auxilio-judicial, tramitacion-procesal, gestion-procesal
- [x] Crear `/api/ai/generate-supuesto-test` (endpoint único para todas las oposiciones):
  - Detecta oposición del usuario → carga `SupuestoTestConfig` correspondiente
  - Free user: servir de `free_supuesto_bank` (check: ya lo ha hecho? → paywall 402)
  - Premium user: servir de `supuesto_bank` (unseen, filtrado por oposicion_id)
  - Si no hay unseen → generar con IA → guardar en banco (scoped por oposicion_id)
  - Guardar test en `tests_generados` con `tipo='supuesto_test'` + `supuesto_caso` JSON
  - `prompt_version: 'free-supuesto-1.0'` | `'supuesto-bank-1.0'` | `'ai-supuesto-test-1.0'`
  - Fallback: si IA falla, sirve cualquier supuesto del banco (aunque sea repetido)
  - Rate limit: 5/día
- [x] Verificación legal: N/A — supuestos no citan artículos individuales (caso narrativo + preguntas vinculadas). La verificación batch es para tests por tema con `cita.ley + cita.articulo`
- [x] Script seed: `execution/generate-supuesto-bank.ts` creado (opcional — banco se llena solo con uso premium)
  - 2 supuestos oficiales INAP 2024 ya en banco → primeros premium tienen contenido día 1
  - Ejecutar solo si se quiere pre-poblar: `pnpm seed:supuestos --oposicion <slug> --count 5`

#### Fase 2.5c — Frontend (genérico)
- [x] Página `/supuesto-test` (genérica, adapta contenido por oposición):
  - Explicación del formato + stats del examen (preguntas, tiempo, max, min aprobado)
  - SupuestoTestLauncher: CTA con loading state, paywall para free que ya lo hizo
  - Free: badge "1 supuesto gratis (examen oficial)"
  - Premium: contador de supuestos practicados
- [x] Adaptar `tests/[id]/page.tsx` para `tipo === 'supuesto_test'`:
  - Cabecera dinámica indigo "Supuesto Práctico" + badges
  - Fetch `supuesto_caso` de tests_generados
  - **Desktop**: split view (SupuestoTestRunner) — caso sticky izquierda, TestRunner derecha
  - **Mobile**: caso colapsable + FAB "Ver caso" cuando colapsado
  - Timer: busca ejercicio "supuesto/práctico" en scoring_config
- [x] Sidebar + Navbar: "Supuesto Test" con featureKey `supuesto_test`
- [x] Migration 054: `supuesto_test: true` en features de C1 AGE + 3 Justicia
- [x] Adaptar `tests/[id]/resultados/page.tsx`:
  - Cabecera indigo "Supuesto Práctico" + badge "Formato test"
  - Panel scoring: puntuación sobre max ejercicio (50/40/20/15), colores indigo
  - min_aprobado pass/fail con CheckCircle2/XCircle + texto "Superas/No alcanzas el mínimo eliminatorio"
  - describePenalizacion por ejercicio específico del supuesto
  - OG metadata: tipo 'supuesto' para compartir

#### Fase 2.5d — Integración con simulacro completo (nice-to-have)
- [x] "Estructura del examen" card genérico en simulacros: muestra todos los ejercicios de scoring_config con links a simulacro (ej1) + supuesto test + supuesto práctico según features
  - Timer: 100 minutos total
  - Resultados: nota por parte + nota total + ¿supera corte 2024 (47,33)?
- [x] Justicia: card genérico muestra los 2-3 ejercicios de cada oposición (Auxilio 2ej, Tramitación 3ej, Gestión 3ej)
  - Timer independiente (60 min Auxilio, 30 min Tramitación/Gestión)

### Estimación de costes

| Concepto | Coste |
|----------|-------|
| Parseo supuestos oficiales (TODOS los años disponibles) | **$0** (manual/script) |
| Seed IA AGE C1 (gap: ~10 - oficiales parseados) | ~$2.10 (one-time, solo el gap) |
| Seed IA Justicia ×3 (gap variable por oposición) | **$0 si oficiales ≥ ~10** — hasta ~$2.50/opo si gap grande |
| Primeros 50 premium users por oposición (~5 gen IA) | ~$1.75/oposición (pagado por el cliente) |
| Coste ongoing (banco lleno, >50 users) | ~$0/mes |
| **Coste máximo seed (peor caso: todas necesitan gap)** | **~$10** |
| **Coste mínimo seed (oficiales cubren ≥10)** | **~$2.10** (solo AGE C1) |

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

### ~~GAP-3: Multi-exercise scoring~~ — RESUELTO

**Fix implementado**: `calcularPuntuacion()` acepta overload `EjercicioData[]` para scoring multi-ejercicio completo. `_calcularMulti()` interno procesa todos los ejercicios, verifica `min_aprobado` por ejercicio, `aprobado` global requiere todos. `describePenalizacion()` soporta multi-ejercicio con separador `|` y filtro por índice. Results page usa `calcularEjercicio` del engine + muestra `min_aprobado` pass/fail. 25 tests unitarios.

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

| Oposición | Test | Simulacros | Supuesto test | Ofimática | Desarrollo | Multi-scoring | Estado |
|-----------|------|-----------|---------------|-----------|------------|---------------|--------|
| **AGE C2** | ✅ | ✅ 311q | N/A | N/A | N/A | N/A (1 ej.) | **ACTIVA** |
| **AGE C1** | ✅ | ✅ 280q | ✅ FASE 2.5 | N/A | N/A | ✅ | inactiva (Stripe) |
| **GACE A2** | ✅ | ✅ 218q | N/A | N/A | ✅ | parcial | inactiva (Stripe) |
| **Correos** | ✅ | ✅ ~280q | N/A | N/A | N/A | N/A (1 ej.) | **solo falta Stripe** |
| **Auxilio C2** | ✅ | ✅ ~269q | ✅ FASE 2.5 | N/A | N/A | ✅ | **solo falta Stripe** |
| **Tramitación C1** | ✅ | ✅ 199q | pendiente | **FALTA** | N/A | ✅ | inactiva (ofi+Stripe) |
| **Gestión Proc. A2** | ✅ | ✅ 186q | pendiente | N/A | **FALTA** (MJU) | ✅ | inactiva (dev+Stripe) |

### Orden de implementación recomendado

1. ~~**FASE 2.5a**: Fix bugs existentes + parsear supuesto oficial 2024~~ **COMPLETADO**
2. ~~**GAP-5**: Fix scoring_config C1 AGE (prerequisito de FASE 2.5)~~ **COMPLETADO** — Migration 051
3. ~~**GAP-3**: Multi-exercise scoring genérico (prerequisito de Justicia)~~ **COMPLETADO** — overload EjercicioData[], resultados page usa calcularEjercicio, 25 tests
4. ~~**FASE 2.5b-c**: Supuesto práctico test genérico~~ **COMPLETADO** — supuesto-test.ts + endpoint + page + SupuestoTestRunner + resultados + migration 054 + ingesta oficial
5. ~~**AUTO-FILL FREE BANK**: Si un free user genera test para un tema sin free bank, guardar también en `free_question_bank` (auto-popula T14 Auxilio y T35 Gestión con la primera generación IA)~~ **COMPLETADO** — upsert en generate-test route tras AI fallback
6. **GAP-2**: Ofimática ejercicio separado (solo si activamos Tramitación)
7. **GAP-4**: Desarrollo escrito Gestión Procesal (solo si activamos Gestión Procesal)
8. **FASE 2.7**: Flywheel supuestos test (créditos IA unificados) — implementar antes de activar Justicia
9. **FASE 2.8**: Banco progresivo premium para tests por tema — optimización coste IA
10. **DEDUP transversal**: Algoritmo de deduplicación compartido por 2.7 y 2.8 — ver §DEDUP

### PENDIENTE PRÓXIMA SESIÓN (2026-03-29)

#### A. Parsear e ingestar contenido oficial sin aprovechar (€0 IA, máxima prioridad)

| Fuente | Archivo | Tipo | Preguntas estimadas | Para qué sirve |
|---|---|---|---|---|
| Tramitación supuesto 2024 | `data/examenes_justicia/tramitacion/2024/ej2_practico_a.pdf` | Supuesto test | ~12 (10+2 reserva) | `supuesto_bank` Tramitación |
| Tramitación supuesto 2025 | `data/examenes_tramitacion/2025_ejercicio2_practicoA_scan.pdf` | Supuesto test (escaneado) | ~12 | `supuesto_bank` Tramitación |
| Tramitación exámenes antiguos | `2011_examen.pdf`, `2015_examen.pdf`, `2016_examen.pdf`, `2019_modeloA/B.pdf` | Simulacros | ~500 preguntas | `preguntas_oficiales` → simulacros |
| Gestión supuestos 2024 | Plantillas `practicoA/B.pdf` disponibles, falta cuadernillo | Supuesto test | ~10-12 | `supuesto_bank` Gestión |
| Correos exámenes 2021 REP | `cuestionario_rep_a/b.pdf` + `plantilla_rep.pdf` (plantilla ya leída: 110q A+B) | Simulacros | ~220 preguntas | `preguntas_oficiales` Correos |
| Correos exámenes 2021 ATC | `cuestionario_atc_a/b.pdf` + `plantilla_atc.pdf` | Simulacros | ~220 preguntas | `preguntas_oficiales` Correos |

**Estrategia**: los PDFs modernos (2024/2025) son texto → parsear directamente. Los antiguos (2011-2019) pueden ser escaneados → necesitan IA vision. Adjuntar PDFs en el chat para parsear.

**Plantillas ya leídas**:
- Tramitación 2024: 3 ejercicios completos (ej1: 1-104, ej2: 105-116, ej3: 117-140). Pregunta 120 ANULADA.
- Correos REP 2021: 110 preguntas modelo A + 110 modelo B. Preguntas 33/68 sin respuesta (anuladas).

#### B. Auditorías pendientes (lanzar en próxima sesión)

- [ ] `/securizar` — auditoría de seguridad + RGPD
- [ ] `/testear` — generar tests automatizados para gaps de cobertura
- [ ] `/auditar` — auditoría general de calidad enterprise

#### C. Escalabilidad P1 pendientes (de la auditoría /escalar)

- [ ] Dashboard: paralelizar 8 queries secuenciales con `Promise.all()` (~300ms mejora)
- [ ] generate-test: batch INSERT en question_bank (N+1 → 1 query)
- [ ] generate-test: batch UPDATE times_served (N+1 → 1 query)
- [ ] generate-supuesto-test: paralelizar `checkPaidAccess` + `checkIsAdmin`
- [ ] Input token cost guard en prompts de generación (MAX_INPUT_CHARS)
- [ ] Reto diario cron: procesar solo 1 rama por invocación (evitar timeout con 3 ramas)

#### D. LEC/LECrim ingestadas (2026-03-29)

- [x] `lec_1_2000_completa.json` (905 artículos) → ingestado en `legislacion` (2.888 rows)
- [x] `lecrim_1882_completa.json` (1.067 artículos) → ingestado en `legislacion` (3.130 rows)
- Impacto: verificación de citas procesales ahora funciona correctamente para Justicia

---

## FASE 2.7 — Flywheel Supuestos Test (créditos IA unificados)

> **Aplica a**: C1 AGE, Auxilio Judicial, Tramitación Procesal, Gestión Procesal (ej2)
> **NO aplica a**: C2 AGE (no tiene supuesto test), Correos (no tiene supuesto)
> **Usa créditos IA** (recarga 9,99€ = 10 créditos). NO es un tier Stripe separado.

### Concepto

**Regla: €0 en IA hasta que el cliente paga.** El banco arranca con supuestos oficiales
de años anteriores (parseo = $0). Solo se genera con IA cuando un premium agota el banco
y paga 9,99€. Los usuarios que pagan créditos IA financian contenido para los siguientes.

### Flujo detallado

```
Banco inicial: N supuestos oficiales parseados (variable por oposición, ver inventario arriba)
  → Si N < ~10: completar con seed IA hasta ~10 (nuestro único coste upfront)
  → Si N ≥ ~10: seed completado con €0 en IA

Usuario A (premium) → ve los 10 del banco en orden (€0 IA, incluidos en pack)
  → Los agota (ha visto los 10)
  → CTA: "Has completado los 10 supuestos. ¿Generar 10 nuevos? (10 créditos IA)"
  → Tiene créditos (o recarga 9,99€) → generamos 10 con IA → banco = 20

Usuario B (nuevo premium) → ve los 20 desde el día 1 (€0 IA)
  → Los ve EN ORDEN: primero los 10 originales, luego los 10 del Usuario A
  → Agota los 20 → CTA igual → paga → NO generamos (Usuario A ya generó 10)
  → Se le muestran las que NO ha visto → si quedan 0 sin ver → generamos 10 nuevos → banco = 30

Usuario C → ve 30 desde el día 1... coste IA = €0 para nosotros

REGLA CLAVE: solo generamos cuando el banco NO tiene supuestos sin ver para ESE usuario.
Si el banco tiene supuestos que el usuario no ha visto → se los sirve (€0).
Generar ≠ pagar. Pagar desbloquea el acceso, no siempre genera.
```

### Orden de servicio (UX)

Los supuestos se sirven por `created_at ASC`:
1. Primero los oficiales (mayor calidad, verificados)
2. Luego los seed pre-generados
3. Luego los generados por otros usuarios (más probados = más fiables)
4. Al final los recién generados

Esto garantiza que el usuario ve primero los de mayor calidad (más "rodados").

### Regla de generación

- Premium pide supuesto → busca en `supuesto_bank` sin ver (`NOT IN user_supuestos_seen`) ORDER BY `created_at ASC`
- Si hay ≥1 sin ver → servir del banco (€0 IA)
- Si hay 0 sin ver → paywall "Genera 10 nuevos (10 créditos IA)"
- Al pagar/tener créditos: generar con API chunked (Vercel Hobby 60s) → guardar en banco
- **NO** `batchVerifyCitations` (supuestos son caso narrativo + MCQ, no tienen citas individuales). Validación: coherencia JSON + ≥ preguntas mínimas

### Modelo económico

| Escenario | Ingresos | Coste API | Margen |
|---|---|---|---|
| Seed inicial (10 supuestos) | €0 | ~$3.50 (nuestro) | inversión |
| Primeros 10 users (ven banco) | €0 (incluido en pack) | €0 | 100% |
| User 11 (agota banco, recarga) | 9,99€ | ~$3.50 (10 nuevos) | ~65% |
| Users 12-20 (ven banco ampliado) | €0 | €0 | 100% |
| User 21 (agota 20, recarga) | 9,99€ | ~$3.50 | ~65% |
| Users 22-30+ | €0 | €0 | 100% |

### Implementación atómica

#### 2.7.1 — Paywall cuando agota banco ✅
- [x] En `generate-supuesto-test/route.ts`: cuando 0 unseen → NO reciclar, devolver 402
- [x] Devolver 402 con `code: 'PAYWALL_SUPUESTO_LOTE'` y `{ unseenCount: 0, bankTotal: N }`
- [x] Frontend: SupuestoTestLauncher detecta PAYWALL_SUPUESTO_LOTE y ofrece generar o recargar
- [x] Si user tiene < 10 créditos: toast con botón "Recargar créditos" → /precios

#### 2.7.2 — Generación lote: endpoint chunked (compatible Vercel Hobby 60s) ✅
- [x] Nuevo endpoint `POST /api/ai/generate-supuesto-test-batch`
- [x] Genera 2 por invocación (BATCH_SIZE=2, ~15-20s cada uno ≈ 30-40s safe for 60s)
- [x] Input: auto-detect oposicionId del perfil. Check unseen < TARGET_LOTE=10
- [x] Cada supuesto: genera con callAIJSON → valida Zod → inserta en `supuesto_bank`
- [x] Descuenta 1 crédito IA (corrections_balance) por supuesto generado
- [x] Response: `{ generated, pending, creditsUsed, duplicatesDiscarded, newBalance }`
- [x] Frontend: loop de llamadas en SupuestoTestLauncher hasta pending=0
- [x] Si falla: NO cobrar crédito de los fallidos

#### 2.7.3 — UX progreso + lote ✅
- [x] SupuestoTestLauncher: batchMode con progress bar "Generando supuesto X de 10"
- [x] Progress bar visual con porcentaje
- [x] Al completar: toast "X supuestos nuevos listos" + router.refresh()
- [x] creditsBalance prop pasado desde page server component

#### 2.7.4 — Validación post-generación ✅
- [x] Cada supuesto generado pasa por validación:
  - Schema Zod: `{ titulo, escenario, preguntas[] }` con ≥ N preguntas esperadas
  - Preguntas: 4 opciones, correcta válida (0-3), enunciado no vacío
  - **NO** `batchVerifyCitations` (supuestos no citan artículos individuales)
- [x] Si validación falla: descartar, NO cobrar crédito (batch endpoint skips on Zod fail)
- [x] Log calidad: log.warn en batch endpoint cuando preguntas < minAcceptable

### Lo que NO hacemos (decisiones conscientes)
- **NO** tier Stripe separado — usa créditos IA unificados (9,99€ = 10 créditos)
- **NO** `supuestos_test_balance` campo separado — tracking via `user_supuestos_seen`
- **NO** generación de 10 de golpe (timeout Vercel Hobby) — chunks de 2-3
- **NO** el usuario elige cuántos generar — siempre 10 (simplifica UX y pricing)
- **NO** `batchVerifyCitations` — supuestos no tienen citas individuales

---

## FASE 2.8 — Banco Progresivo Premium para Tests por Tema

> **Aplica a**: TODAS las oposiciones
> **Objetivo**: que el coste IA de tests por tema tienda a €0 conforme crecen los usuarios

### Concepto

Hoy: cada test premium genera con IA (€0.005/test). Con 1.000 tests/día = $5/día.
Meta: banco premium crece → 80%+ tests servidos desde banco → coste ~$1/día.

### Flujo

```
Premium pide Test Tema 5 (20 preguntas, dificultad media)

1. Query premium_question_bank WHERE tema_id=5 AND oposicion_id=X AND dificultad='media'
2. Filtrar preguntas cuyo hash NO está en user_questions_seen
3. Contar: disponibles_sin_ver / total_banco

Si ha visto < 80% del banco → sample 20 sin ver → shuffle → servir (€0 IA)
Si ha visto ≥ 80% → generar 20 con IA → guardar INDIVIDUALMENTE en banco → servir

El banco crece automáticamente con cada generación IA.
Admin genera test → también alimenta el banco (quick win).
User #200 de Tema 5: banco tiene 200+ preguntas → €0 IA.
```

### Implementación atómica

#### 2.8.1 — Quick win: admin/premium alimenta free_question_bank ✅
- [x] En `generate-test/route.ts`: eliminada condición `!hasPaidAccess` del auto-fill
- [x] Premium + admin generan test → preguntas se guardan en `free_question_bank` también
- [x] Coste: €0 extra (ya pagamos la IA). Beneficio: banco free crece con cada uso admin/premium

#### 2.8.2-2.8.4 — YA IMPLEMENTADO en migration 045 + generate-test route ✅
> **NOTA**: Al implementar descubrimos que migration 045 (`question_bank` + `user_questions_seen` + `free_question_bank`) y el generate-test route ya implementan el banco progresivo completo:
> - `question_bank` = banco premium con dedup 3 niveles (hash + legal_key + Jaccard trigrams) — ver `lib/utils/question-dedup.ts`
> - `user_questions_seen` = tracking por question_id
> - El route sirve desde banco antes de IA (línea ~449) y guarda tras generar (línea ~550)
> - La migration 060 (pg_trgm) es innecesaria — Jaccard word-trigrams en TypeScript ya cumple el mismo objetivo sin extensiones PostgreSQL
> - **No se creó tabla `premium_question_bank`** — `question_bank` ya es equivalente

#### 2.8.5 — Métricas de eficiencia
- [ ] Admin widget "Banco Progresivo" (post-launch, nice-to-have):
  - Total preguntas en banco (por oposición, por tema)
  - Hit rate: % tests servidos desde banco vs IA (últimos 7d / 30d)
  - Coste evitado estimado
- [ ] Alerta si hit rate < 50%

### Modelo económico

| Usuarios activos | Preguntas en banco | Hit rate | Coste IA/día |
|---|---|---|---|
| 10 | ~500 | ~30% | ~$3.50 |
| 50 | ~2.500 | ~70% | ~$1.50 |
| 200 | ~10.000 | ~90% | ~$0.50 |
| 500+ | ~25.000 | ~95%+ | ~$0.25 |

### Lo que NO hacemos
- **NO** expiración de preguntas (la legislación cambia poco, las preguntas son válidas años)
- **NO** tracking por JSON extraction (pesado) — tabla `user_questions_seen` con hash = JOIN rápido
- **NO** deduplicación solo por hash MD5 — insuficiente, ver §DEDUP para algoritmo completo (pg_trgm + dual similarity)

---

## §DEDUP — Algoritmo de Deduplicación (transversal a 2.7 y 2.8)

> **Aplica a**: `premium_question_bank` (tests por tema) y `supuesto_bank` (supuestos test)
> **Coste IA**: €0 — usa extensiones nativas de PostgreSQL (`pg_trgm` + `unaccent`)
> **Objetivo**: 0 preguntas ni supuestos repetidos en los bancos

### Problema

La IA genera preguntas/supuestos con redacción distinta sobre el mismo concepto. Un hash MD5 del texto exacto solo detecta copias idénticas carácter a carácter (~0% de los duplicados reales, la IA nunca genera el mismo texto dos veces).

### Principio: dos signals confirmándose mutuamente

Ningún signal individual es fiable para detectar duplicados sin IA:

| Signal solo | Fallo |
|---|---|
| Enunciado similar (pg_trgm) | "¿Cuántos **títulos** tiene la CE?" vs "¿Cuántos **artículos** tiene la CE?" → sim ~0.85 → **falso positivo** (son preguntas distintas) |
| Correcta similar | "El Rey" es respuesta de 10+ preguntas distintas sobre art. 62 → **falso positivo** |
| Misma cita legal | Un artículo puede generar múltiples preguntas válidas → **falso positivo** |

**Regla**: se necesita **enunciado similar + al menos una confirmación** (respuesta similar O misma cita). La condición AND elimina los falsos positivos de cada signal individual.

### Regla de detección para tests por tema (`premium_question_bank`)

```
is_duplicate =
  enunciado_hash = existing_hash                      -- Capa 1: texto idéntico (safety net)
  OR (
    similarity(enunciado_norm, new) > 0.5              -- Capa 2: pregunta similar
    AND (
      similarity(correcta_norm, new_correcta) > 0.5    --   + respuesta similar
      OR (cita_ley = new_ley AND cita_articulo = new_art  --   + O misma cita legal
          AND new_ley IS NOT NULL)
    )
  )
```

**Validación con ejemplos reales:**

| Q existente | Q nueva | enun_sim | corr_sim | cita | Resultado | Correcto? |
|---|---|:---:|:---:|:---:|:---:|:---:|
| "¿Quién nombra al Presidente?" (art.62, "El Rey") | "¿A quién corresponde nombrar al Presidente del Gobierno?" (art.62, "Al Rey") | 0.55 ✓ | 0.60 ✓ | match ✓ | **DUPLICADA** | ✅ |
| "¿Cuántos títulos tiene la CE?" ("11") | "¿Cuántos artículos tiene la CE?" ("169") | 0.85 ✓ | 0.15 ✗ | — ✗ | **NO duplicada** | ✅ |
| "¿Quién sanciona las leyes?" (art.62, "El Rey") | "¿Quién nombra al Presidente?" (art.62, "El Rey") | 0.35 ✗ | — | — | **NO duplicada** | ✅ |
| "¿Qué establece el art. 14 CE?" (art.14, "Igualdad ante la ley") | "Según el artículo 14 de la Constitución:" (art.14, "La igualdad ante la ley") | 0.40 ✗ | 0.75 ✓ | match ✓ | **NO duplicada** | ⚠️ miss |

> **Tasa estimada**: ~90% de duplicados reales detectados. El ~10% que escapa son reformulaciones radicales donde enunciado_sim < 0.5. Límite teórico sin embeddings/IA. Sobre 10.000 preguntas → ~100 cuasi-duplicados. Impacto UX: mínimo (shuffle aleatorio, sesiones distintas).

### Regla de detección para supuestos (`supuesto_bank`)

Los supuestos son textos largos (~500 palabras de escenario) y el banco es pequeño (~30 por oposición). No tienen "respuesta correcta" comparable → dedup por título + escenario.

```
is_duplicate =
  similarity(titulo_norm, new_titulo) > 0.6            -- título reformulado
  OR similarity(escenario_norm, new_escenario) > 0.5   -- escenario similar
```

Aquí el OR es seguro: con 500 caracteres de escenario normalizado, >50% de trigramas compartidos implica el mismo caso narrativo. Los falsos positivos son despreciables a esa longitud de texto. Con ~30 filas, sequential scan es óptimo (no necesita índice GiST).

### Prerrequisitos: extensiones PostgreSQL

```sql
-- Migration 060 (una sola vez, al inicio)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
```

Ambas extensiones están disponibles en Supabase por defecto. `pg_trgm` calcula similitud por trigramas (secuencias de 3 caracteres). `unaccent` normaliza acentos (á→a, é→e, etc.).

### Columnas de deduplicación

**En `premium_question_bank`** (ver §2.8.2 para migration completa):
```
enunciado_hash  text NOT NULL    -- MD5(enunciado) — Capa 1
enunciado_norm  text NOT NULL    -- lower(unaccent(enunciado)) — Capa 2 similitud
correcta_norm   text NOT NULL    -- lower(unaccent(texto_opcion_correcta)) — Capa 2 confirmación
cita_ley        text             -- nullable (Bloque II no tiene cita) — Capa 2 confirmación
cita_articulo   text             -- nullable — Capa 2 confirmación
```

**En `supuesto_bank`** (ver §2.7 para migration):
```
titulo_norm     text NOT NULL    -- lower(unaccent(titulo))
escenario_norm  text NOT NULL    -- lower(unaccent(primeras 500 chars del escenario))
```

Todas las columnas `*_norm` se calculan en TypeScript al insertar (no como GENERATED columns — más portable y evita problemas con JSONB extraction en generated cols).

### Índices

```sql
-- premium_question_bank: GiST para pg_trgm similarity queries
CREATE INDEX idx_pqb_trgm_enun ON premium_question_bank
  USING gist (enunciado_norm gist_trgm_ops);
CREATE INDEX idx_pqb_trgm_corr ON premium_question_bank
  USING gist (correcta_norm gist_trgm_ops);
-- B-tree para citation match
CREATE INDEX idx_pqb_cita ON premium_question_bank (oposicion_id, tema_id, cita_ley, cita_articulo)
  WHERE cita_ley IS NOT NULL;

-- supuesto_bank: sin índice GiST (~30 filas, seq scan más rápido)
```

### Query de deduplicación: tests por tema

```sql
-- RPC: check_question_duplicate(p_oposicion_id, p_tema_id, p_enunciado_hash,
--   p_enunciado_norm, p_correcta_norm, p_cita_ley, p_cita_articulo)
SELECT EXISTS (
  SELECT 1 FROM premium_question_bank
  WHERE oposicion_id = p_oposicion_id AND tema_id = p_tema_id
  AND (
    enunciado_hash = p_enunciado_hash
    OR (
      similarity(enunciado_norm, p_enunciado_norm) > 0.5
      AND (
        similarity(correcta_norm, p_correcta_norm) > 0.5
        OR (cita_ley = p_cita_ley AND cita_articulo = p_cita_articulo
            AND p_cita_ley IS NOT NULL)
      )
    )
  )
) AS is_duplicate;
```

### Query de deduplicación: supuestos

```sql
-- RPC: check_supuesto_duplicate(p_oposicion_id, p_titulo_norm, p_escenario_norm)
SELECT EXISTS (
  SELECT 1 FROM supuesto_bank
  WHERE oposicion_id = p_oposicion_id
  AND (
    similarity(titulo_norm, p_titulo_norm) > 0.6
    OR similarity(escenario_norm, p_escenario_norm) > 0.5
  )
) AS is_duplicate;
```

### TypeScript: `lib/utils/deduplicate.ts`

```typescript
import { createHash } from 'crypto';

/** Normaliza texto para comparación por trigramas: lowercase + sin acentos + sin puntuación */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // strip acentos
    .replace(/[^\w\s]/g, '')                            // strip puntuación
    .trim();
}

export function md5(text: string): string {
  return createHash('md5').update(text).digest('hex');
}

/** Extrae cita como strings normalizados para fingerprint */
export function extractCitation(cita?: { ley?: string; articulo?: string | number }): {
  ley: string | null;
  articulo: string | null;
} {
  if (!cita?.ley || !cita?.articulo) return { ley: null, articulo: null };
  return {
    ley: normalizeText(cita.ley),
    articulo: String(cita.articulo).trim(),
  };
}

/** Prepara datos de dedup para una pregunta de test */
export function prepareQuestionDedup(pregunta: {
  enunciado: string;
  opciones: { texto: string }[];
  correcta: number;
  cita?: { ley?: string; articulo?: string | number };
}) {
  const { ley, articulo } = extractCitation(pregunta.cita);
  return {
    enunciadoHash: md5(pregunta.enunciado),
    enunciadoNorm: normalizeText(pregunta.enunciado),
    correctaNorm: normalizeText(pregunta.opciones[pregunta.correcta].texto),
    citaLey: ley,
    citaArticulo: articulo,
  };
}

/** Prepara datos de dedup para un supuesto test */
export function prepareSupuestoDedup(caso: { titulo: string; escenario: string }) {
  return {
    tituloNorm: normalizeText(caso.titulo),
    escenarioNorm: normalizeText(caso.escenario.slice(0, 500)),
  };
}
```

### Flujo en generate-test (§2.8.3 actualizado)

```
IA genera N preguntas
  → Para cada pregunta:
      1. prepareQuestionDedup(pregunta) → {hash, norms, cita}
      2. RPC check_question_duplicate(oposicion, tema, hash, norms, cita)
      3. is_duplicate? → descartar
      4. No duplicada → INSERT en premium_question_bank + incluir en test
  → Si quedan < numPreguntas tras descartar:
      → Generar batch complementario (solo las que faltan)
      → Max 2 reintentos complementarios
      → Si 3 batches seguidos < 50% supervivencia:
        → Log WARNING "banco saturado tema X" → servir las que hay sin ver
```

### Flujo en generate-supuesto-test-batch (§2.7.2 actualizado)

```
IA genera 1 supuesto
  → prepareSupuestoDedup(caso) → {tituloNorm, escenarioNorm}
  → RPC check_supuesto_duplicate(oposicion, tituloNorm, escenarioNorm)
  → is_duplicate? → descartar, reintentar 1 vez (con seed distinto en prompt)
  → No duplicado → INSERT en supuesto_bank (con titulo_norm, escenario_norm)
  → Descontar 1 crédito
```

### Lo que NO hacemos (decisiones conscientes)

- **NO** embeddings ni IA para deduplicar — pg_trgm + unaccent es suficiente y €0
- **NO** deduplicación semántica perfecta — ~90% detección es el techo sin embeddings, aceptable
- **NO** GENERATED columns — calculamos en TypeScript para portabilidad y evitar problemas con JSONB extraction
- **NO** ordenar palabras (sort) para fingerprint — destruye significado ("Rey nombra Presidente" ≠ "Presidente nombra Rey")
- **NO** hash de la respuesta correcta como fingerprint — la IA reformula opciones, hashes distintos para mismo concepto
- **NO** índice GiST en supuesto_bank — ~30 filas, seq scan es más rápido

---

## FASE Q — Calidad IA: Usar exámenes oficiales para mejorar generación

> **Contexto**: ~1.743 preguntas oficiales reales de 7 oposiciones en BD. Esta fase las usa como
> few-shot examples, calibración de estilo y evaluación para que las preguntas IA sean
> indistinguibles de las oficiales.

### Inventario de preguntas oficiales en BD

| Oposición | Preguntas | Años | Fuente | tema_id mapeado |
|-----------|-----------|------|--------|-----------------|
| C2 AGE | 311 | 2018-2024 | INAP | 27% |
| C1 AGE | 280 | 2019-2024 | INAP | 56% |
| A2 GACE | 218 | 2018-2024 | INAP | 90% |
| Correos | ~280 | 2023 (REP+ATC) | Correos | 44% |
| Auxilio Judicial | ~269 | 2024-2025 (ej1+ej2) | MJU | 56% |
| Tramitación | 199 | 2024-2025 | MJU | 35% |
| Gestión Procesal | 186 | 2023-2025 | MJU | 54% |
| **Total** | **~1.743** | | | **45% (736/1620)** |

### Q.0 Mapear tema_id en preguntas_oficiales ✅ (parcial)

**Problema**: Preguntas ingestadas con `tema_id: null` → `retrieveExamples()` no devuelve nada.
**Solución**: `execution/map-preguntas-tema.ts` — keyword matching determinista (0€).

- [x] Script creado y ejecutado — 736/1.620 mapeadas (45%)
- [x] **Q.0.1**: Portar `TEMA_KEYWORDS` handcrafted de `build-radar-tribunal.ts` al mapper para C2 AGE
  - Import con guard `isDirectExecution` para evitar side-effects en build-radar `main()`
  - Threshold dinámico: handcrafted=1 match, auto-generated=2 matches
  - Resultado: C2 AGE 27%→42%+, total ~861/1620 (53%)
  - Remaining 759 questions sin match son casos genuinamente ambiguos — ceiling del keyword matching
- [x] **Q.0.2**: Cobertura verificada:
  - GACE A2: 90% | C1 AGE: 56% | Auxilio: 56% | Gestión Proc: 54% | Correos: 44% | C2 AGE: ~42% | Tramitación: 35%
  - `retrieveExamples()` fallback por oposición cubre el resto

**Dependencias**: Q.1 funciona parcialmente sin esto (fallback por oposición). Q.3 Path C necesita tema_id.
**Coste**: $0

### Q.1 Few-shot + prompts por rama ✅ (Q.1.1 + Q.1.2 completados)

**PROMPT_VERSION**: 2.2.0 → **2.3.0** (bumped)

#### Q.1.1 retrieveExamples multi-oposición ✅
- [x] Params: `oposicionId` (filtro BD) + `oposicionSlug` (label prompt)
- [x] Fallback: sin tema match → preguntas aleatorias de la misma oposición (`ORDER BY numero DESC` para variar)
- [x] Label dinámico: `getTribunalLabel()` → "INAP" / "MJU" / "CORREOS"
- [x] Bounds check: `letras[p.correcta] ?? '?'` para prevenir undefined
- [x] `generate-test.ts`: fetch `opoInfo` ANTES del Promise.all (slug disponible para retrieveExamples)

#### Q.1.2 System prompt parametrizado ✅
- [x] `getSystemGenerateTest(opoInfo.nombre)` reemplaza `SYSTEM_GENERATE_TEST` estático
- [x] `getRamaStyleHint(oposicionNombre)` — guías de estilo por rama:
  - **Correos**: directas, operativas, sin trampas, normativa postal (Ley 43/2010, RD 1829/1999)
  - **Justicia**: formales, extensas, "Conforme a...", frases completas, -1/4
  - **GACE A2**: técnico alto, supuestos, legislación avanzada, -1/3
  - **AGE C1/C2**: sin hint extra (default)
- [x] Matching verificado contra nombres reales en BD:
  - `'Correos — Personal Laboral Fijo (Grupo IV)'` → includes('correos') ✅
  - `'Auxilio Judicial (C2)'` → includes('auxilio') ✅
  - `'Tramitación Procesal y Administrativa (C1)'` → includes('tramitación') ✅
  - `'Gestión Procesal y Administrativa (A2)'` → includes('gestión procesal') ✅
  - `'Gestión de la Administración Civil del Estado'` → includes('gestión') && includes('estado') ✅
  - ⚠️ Matching es frágil (depende de nombres DB) — si se cambian nombres, revisar `getRamaStyleHint()`

#### Q.1.3 Few-shot para supuesto test ✅
- [x] `EJEMPLO_AUXILIO_MJU` añadido: procedimiento monitorio real del examen MJU Auxilio 2024 ej2
  - Escenario procesal (competencia, abogado/procurador, sede electrónica, plazos LEC)
  - 2 preguntas de ejemplo con opciones completas y respuesta verificada contra plantilla
- [x] Inyectado en `SYSTEM_PROCESAL` (como `EJEMPLO_AGE_C1` está en `SYSTEM_ADMINISTRATIVO`)
- [ ] Considerar reemplazar EJEMPLO_AGE_C1 abreviado por supuesto completo (nice-to-have)
- **Archivo**: `lib/ai/supuesto-test.ts`

### Q.2 Análisis de estilo + calibración por oposición (PENDIENTE)

#### Q.2.1 Script de análisis ✅
- [x] `execution/analyze-exam-style.ts` creado — `pnpm analyze:style`
- [x] 1.987 preguntas oficiales analizadas. Hallazgos clave:
  - C2 AGE: 26 words/enunciado, 7 words/opción, 7% negativas, balanced, 0% prefijos
  - Correos: **17 words** (shortest), 10 words/opción, 12% negativas, bias D (24%)
  - Tramitación: 22 words, **15 words/opción** (longest), **98% prefijadas**, 14% negativas, bias C
  - Gestión Procesal: 23 words, 15 words/opción, **100% prefijadas**, bias D (25%)
  - Auxilio: 27 words, 10 words/opción, **4% negativas** (fewest), 24% prefijadas, bias B
  - GACE A2: **29 words** (longest), 13 words/opción, 11% negativas, balanced
- [x] Output: `data/exam-style-analysis.json`

#### Q.2.2 Calibración cuantitativa ✅
- [x] `getRamaStyleHint()` reescrito con datos reales de Q.2.1
- [x] Cada rama ahora incluye: longitud media enunciado/opciones, % negativas, instrucciones sobre prefijos
- [x] Correos + Tramitación + Gestión Procesal: "NO añadas prefijo A/B (OpoRuta lo añade)"
- [x] PROMPT_VERSION bumped 2.3.0 → **2.4.0**
- **Archivo**: `lib/ai/prompts.ts`

**Prioridad**: P1 | **Coste**: $0 | **Estimación**: ~2h

### Q.3 Radar del Tribunal multi-oposición (PENDIENTE)

**Estado actual**: `build-radar-tribunal.ts` tiene 3 paths:
- Path A (citas explícitas): ✅ funciona multi-oposición (regex genérico)
- Path B (keywords de leyes): ✅ funciona multi-oposición (LEY_KEYWORDS genérico)
- Path C (clasificación por tema): ❌ `TEMA_KEYWORDS` hardcodeado a 28 temas C2 AGE

**🔴 BUG DETECTADO**: `temaNumeroToId` carga ALL temas sin filtrar por oposición → colisión de claves (tema 1 de C2 sobrescrito por tema 1 de Gestión). Corrompe `frecuencias_temas`.

#### Q.3.1 Fix build-radar-tribunal.ts ✅
- [x] **Fix temaNumeroToId collision**: key cambiada a `"oposicionId:numero"` — temas query incluye `oposicion_id, titulo`
- [x] `buildOpoKeywordMaps()`: genera keywords dinámicas por título de tema para cada oposición. C2 AGE mantiene `TEMA_KEYWORDS` handcrafted (más precisos)
- [x] `classifyByTemaForOposicion()`: clasifica usando keyword map de la oposición del examen, no la global
- [x] `generateKeywordsFromTitle()`: reutiliza approach de `map-preguntas-tema.ts` — stop words, law refs, abbreviations
- **Archivo**: `execution/build-radar-tribunal.ts`

#### Q.3.2 Ejecutar radar para todas las oposiciones ✅
- [x] `pnpm build:radar` ejecutado — 1.000 preguntas procesadas
- [x] Path A+B (artículos): 72 registros en 6 oposiciones (19% cobertura — normal, pocas citas explícitas)
- [x] Path C (temas): **260 registros** en 7 oposiciones (**83% cobertura** — antes solo C2 AGE)
- [x] RadarTribunal.tsx ya filtra por `oposicion_id` — no necesita cambios

**Prioridad**: P1 | **Coste**: $0 | **Estimación**: ~3h

### Q.4 Golden dataset + evaluación (PENDIENTE)

#### Q.4.1 Golden dataset por oposición ✅
- [x] `build-golden-dataset.ts` (`pnpm build:golden`) — selecciona 20 preguntas representativas por oposición
- [x] 7 datasets generados en `data/golden-dataset/[slug].json` (140 preguntas total)
- [x] Criterios: variedad longitud (buckets short/medium/long × positive/negative), años recientes, respuesta verificada
- [x] Cada entry: enunciado, opciones, correcta, fuente, enunciado_words, opcion_media_words, es_negativa

#### Q.4.2 Eval runner baseline ✅
- [x] `eval-question-quality.ts` (`pnpm eval:quality`) — analiza golden dataset, calcula baseline metrics
- [x] Métricas: enunciado μ±σ, opciones μ, % negativas, correcta distribution, entropy
- [x] Calidad: detecta datasets desbalanceados (entropy <0.7) o poco representativos
- [x] `_metrics.json` con resultados para tracking histórico
- [x] Modo `--generate` implementado y ejecutado: 7 oposiciones × 10 preguntas IA comparadas
  - Score medio: **72/100** — aceptable. Mayor gap: opciones IA demasiado cortas (sin RAG context)
  - Enunciados: 8-18% delta (bueno — calibración Q.2 funciona)
  - Opciones: 42-73% delta (IA genera 3-5 words vs oficiales 7-20 — en producción con RAG se alarga)
  - Negativas: IA sobrecompensa (20-30% vs 0-14% oficial)
  - Reporte: `data/golden-dataset/_eval_report.json`

**Prioridad**: P2 | **Coste**: ~$2/ejecución | **Estimación**: ~4h

### Dependencias y orden

```
Q.0 (tema mapping) ──→ Q.1 (few-shot, ya parcial sin Q.0) ──→ Q.2 (calibración) ──→ Q.4 (eval)
                   └──→ Q.3 (radar, necesita fix temaNumeroToId independiente de Q.0)
```

1. ~~Q.0~~ ✅ (parcial) → mejorar keywords (Q.0.1)
2. ~~Q.1.1 + Q.1.2~~ ✅ → Q.1.3 (supuesto few-shot)
3. **Q.3.1** ← fix bug temaNumeroToId + TEMA_KEYWORDS dinámicos (independiente)
4. **Q.2** ← análisis estilo + calibración cuantitativa
5. **Q.4** ← golden dataset (tras Q.1 + Q.2 estabilizados)

**Coste total**: ~$2 (solo Q.4) | **Impacto**: preguntas IA "genéricas" → "indistinguibles del tribunal"

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
- [x] Pricing page `/precios` creada con tabs por rama (AGE/Justicia/Correos) + comparativa free vs premium
- [x] Hero genérico multi-rama: badge "AGE · Correos · Justicia — 10.000+ plazas en 7 oposiciones"

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
- [x] Hero con datos oficiales (plazas, fecha examen, temario) — todas las sub-landings lo tienen
- [x] Estructura del examen (ejercicios, scoring, duración) — cards con detalles por ejercicio
- [x] Temario completo (lista de temas) — todos los temas oficiales listados
- [x] "¿Cómo te ayuda OpoRuta?" (features específicas + preguntas oficiales MJU)
- [x] CTA registro con `?oposicion=[slug]` — botones enlazados
- [x] FAQ específica (diferencia con otros cuerpos, requisitos, etc.) — FAQs visuales
- [x] Schema markup: FAQPage + Course (JsonLd en todas)

### S.5 Herramientas SEO (lead magnets)
- [x] `app/(marketing)/herramientas/calculadora-nota-justicia/page.tsx` — CREADA (sección 2.6)
- [x] `app/(marketing)/herramientas/calculadora-nota-correos/page.tsx` — CREADA (sección 2.6)
- [x] CTA registro: Justicia (CTA section añadida) + Correos (ya tenía link inline)
- [x] Schema markup: WebApplication ya presente en ambas calculadoras

### S.6 Blog SEO — 15 posts publicados (Correos + Justicia)
- [x] Correos (5 posts): test-correos, temario, plazas, penalización, requisitos
- [x] Justicia (10 posts): diferencia-auxilio-tramitación, temario-auxilio, test-auxilio, nota-corte, gestion-procesal, temario-tramitación, gestion-procesal-guía, LO-1/2025-cambios, sueldo-justicia, preparar-por-libre
- [x] Total: 70+ posts en content/blog/posts.ts (47 AGE + 8 Correos + 15 Justicia)
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
- [x] Open Graph images dinámicas — `/api/og` soporta test/simulacro/blog/logro/reto_diario con params

---

## Verificación final

> **Guía completa de verificación paso a paso**: ver `VERIFICACION_PLAN2.md`
> Activar cada oposición individualmente: Correos → Auxilio → Tramitación → Gestión

### Estado del desarrollo (código)
- [x] Todo el código implementado y testeado (221 items completados)
- [x] FASE Q completa: few-shot, calibración, radar multi-opo, golden dataset, eval 74/100
- [x] PROMPT_VERSION 2.5.0 con calibración cuantitativa de 1.987 preguntas oficiales
- [x] ~1.987 preguntas oficiales en BD (7 oposiciones, 2021-2025)
- [x] Rúbrica MJU implementada para corrección IA Gestión Procesal

### Engagement + Monetización (sesión 2026-03-28)
- [x] **Rebrand "Tutor IA"**: "Análisis detallado" → "Tutor IA" + "créditos IA" en 41+ archivos (landing, precios, dashboard, cuenta, emails, API, blog, llms.txt, legal, onboarding)
- [x] **Demo Tutor IA**: auto-preview blur + CTA en primer test con errores (no consume crédito, ~$0.03/user). Toast + auto-scroll para visibilidad
- [x] **Créditos IA unificados**: 1 recarga 9,99€ = 10 créditos. Eliminado recarga_sup 14,99€ y supuestos_balance separado. Supuesto desarrollo = 2 créditos
- [x] **Roadmap gratis premium**: no consume crédito si pagaste. Free = 1 crédito
- [x] **Roadmap personalizado por oposición**: getSystemRoadmap() dinámico — features, scoring, convocatorias, tribunal (INAP/MJU/Correos), herramientas condicionales, ejemplos por rama
- [x] **NextStepCard**: "Siguiente paso" inteligente en resultados (por fase: nuevo→reto, starting→tema débil, 3+→simulacro)
- [x] **Tema recomendado**: TemaCard destacado en /tests (tema débil o no explorado)
- [x] **Reto Diario CTA**: banner en resultados "¿Poco tiempo mañana? Haz el Reto Diario"
- [x] **Benchmark social**: "Tu nota: X% · Media opositores: Y%" en resultados
- [x] **Admin métricas Tutor IA**: widget con roadmaps generados, activación, créditos por tipo, usuarios sin estrenar
- [x] **Pack Triple Justicia**: añadido en /precios (139,99€, 45 créditos IA)
- [x] **Web Push Notifications**: service worker, migration 059, API subscribe/unsubscribe, PushNotificationToggle (card dashboard + toggle cuenta), integrado con cron reto-diario. Opt-in, 1 push/día max

### Completado: activación manual (Aritz)
- [x] Correos: producto Stripe + env var + activa=true ✅ (2026-03-28)
- [x] Migration 059 (push_subscriptions) aplicada en Supabase ✅ (2026-03-28)
- [x] VAPID keys configuradas en Vercel ✅ (2026-03-28)
- [x] Recarga créditos IA 9,99€: producto Stripe creado + env var actualizada ✅ (2026-03-28)

### Pendiente: activación manual (Aritz)
- [x] Crear productos Stripe Justicia (Auxilio, Tramitación, Gestión, Doble, Triple) — completado 2026-03-29
- [x] Configurar env vars `STRIPE_PRICE_PACK_AUXILIO/TRAMITACION/GESTION_J/DOBLE_JUSTICIA/TRIPLE_JUSTICIA` en Vercel — completado 2026-03-29
- [x] Activar Auxilio Judicial en BD — completado 2026-03-29
- [ ] Activar Tramitación Procesal en BD
- [ ] Activar Gestión Procesal en BD
- [ ] Seguir checklist de `VERIFICACION_PLAN2.md` paso a paso por cada oposición

### SEO (completado)
- [x] Sub-landings: Correos + Justicia hub + 3 sub-landings con hero/temario/FAQ/schema
- [x] Calculadoras Justicia + Correos con CTA registro + WebApplication schema
- [x] Blog: 70+ artículos (47 AGE + 8 Correos + 15 Justicia)
- [x] Sitemap + robots actualizados
- [x] llms.txt con 7 oposiciones + preguntas oficiales MJU
- [x] Hero multi-rama: "AGE · Correos · Justicia — 10.000+ plazas"
- [x] OG images dinámicas por tipo
- [ ] Verificar indexación en Google (post-deploy)
