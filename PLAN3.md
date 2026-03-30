# Plan3: Expansión OpoRuta — Hacienda (AEAT) + Instituciones Penitenciarias

> Referencia: PLAN2.md (patrón idéntico: migration → legislación → free bank → exámenes → landing → activación)
>
> **Lecciones aplicadas de 7 oposiciones anteriores:**
> - UUID format: `X0000000-0000-0000-0000-000000000001` (f=hacienda, g=penitenciarias)
> - UPSERT pattern (ON CONFLICT) en migration para idempotencia
> - scoring_config.ejercicios[].ratio_penalizacion para -1/4 vs -1/3
> - features JSON: 4 flags exactos (psicotecnicos, cazatrampas, supuesto_practico, ofimatica)
> - maxPuntuable se calcula dinámicamente desde scoring_config — no hardcodear
> - Supuesto desarrollo = 2 créditos IA (1 generar + 1 corregir)
> - tag:legislacion con --dry-run ANTES de ejecutar
> - generate:free-bank requiere --user-id de admin real (FK constraint)
> - Activar (activa=true) SOLO tras verificar free bank + legislación + Stripe

---

## Pricing

| Pack | Hacienda (C1) | Penitenciarias (C1) |
|------|---------------|---------------------|
| Individual | 49,99€ | 49,99€ |

---

## FASE 1 — Agentes de la Hacienda Pública (C1 — AEAT)

> **Urgencia ALTA**: examen primer ejercicio YA celebrado (21 marzo 2026), segundo ejercicio 18-26 abril 2026.
> Promoción interna: 23 mayo 2026. Próxima convocatoria OEP 2026 previsible ~diciembre 2026.
> **1.400 plazas** (1.000 libre + 400 interna) — BOE-A-2025-27056.

### 1.0 Datos del examen

| Campo | Valor |
|-------|-------|
| Cuerpo | Cuerpo General Administrativo AGE, especialidad Agentes Hacienda Pública |
| Subgrupo | C1 |
| Temas | 32 (7 org. estado + 5 dcho. admin. + 20 hacienda/tributario) |
| Ejercicio 1 | 80 preguntas test, 4 opciones, 90 min. Penalización -1/4. Mín: 5/10 |
| Ejercicio 2 | 10 supuestos prácticos × 3 preguntas desarrollo breve = 30 respuestas. 150 min. Mín: 15/30 |
| Nota final | Suma ejercicios (máx 40 pts). Desempate: 2º ejercicio |
| Conservación | Se conserva 1er ejercicio aprobado para la convocatoria siguiente |

### 1.1 Migration: oposición + temas
- [ ] Crear `supabase/migrations/20260401_070_hacienda.sql`
- [ ] INSERT oposiciones con UPSERT (ON CONFLICT (id) DO UPDATE):
  - id: `'f0000000-0000-0000-0000-000000000001'`
  - slug: `'hacienda-aeat'`, rama: `'hacienda'`, nivel: `'C1'`, activa: `false`
  - plazas: 1400, fecha_examen_aprox: `'2027-03-01'` (próxima convocatoria estimada)
  - features: `{"psicotecnicos": false, "cazatrampas": true, "supuesto_practico": true, "ofimatica": false}`
- [ ] scoring_config:
  ```json
  {
    "ejercicios": [
      {
        "nombre": "Test teórico",
        "preguntas": 80,
        "reserva": 0,
        "minutos": 90,
        "acierto": 0.125,
        "error": 0.03125,
        "max": 10,
        "min_aprobado": 5,
        "penaliza": true,
        "ratio_penalizacion": "1/4"
      },
      {
        "nombre": "Supuestos prácticos",
        "preguntas": 10,
        "reserva": 0,
        "minutos": 150,
        "acierto": 3.0,
        "error": 0,
        "max": 30,
        "min_aprobado": 15,
        "penaliza": false,
        "tipo": "tribunal"
      }
    ]
  }
  ```
- [ ] INSERT 32 temas (ver §1.1.1)

#### 1.1.1 Temario completo (32 temas, 3 bloques)

**Bloque I — Organización del Estado y Funcionamiento AGE (7 temas)**

| # | Título |
|---|--------|
| 1 | La Constitución Española de 1978: estructura y contenido. Derechos y deberes fundamentales. La Corona. El Tribunal Constitucional |
| 2 | Las Cortes Generales. El Defensor del Pueblo. El Poder Judicial. Organización judicial |
| 3 | El Gobierno. La Administración Pública. Entes públicos |
| 4 | La organización territorial del Estado. Comunidades Autónomas. Entidades Locales. Instituciones de la UE |
| 5 | Funcionamiento electrónico del sector público. Transparencia. Protección de datos personales |
| 6 | Políticas de igualdad de género, no discriminación y contra la violencia de género. Discapacidad y dependencia |
| 7 | Régimen jurídico del personal al servicio de las AAPP. TREBEP. Seguridad Social |

**Bloque II — Derecho Administrativo General (5 temas)**

| # | Título |
|---|--------|
| 8 | Las fuentes del Derecho Administrativo. Jerarquía normativa |
| 9 | Los actos administrativos. Motivación, forma, eficacia. Nulidad y anulabilidad. Revisión de oficio |
| 10 | El procedimiento administrativo común. Capacidad de obrar, representación, derechos de los interesados |
| 11 | Fases del procedimiento administrativo: iniciación, ordenación, instrucción, finalización. Ejecución |
| 12 | Recursos administrativos: alzada, reposición, revisión extraordinaria. Jurisdicción contencioso-administrativa |

**Bloque III — Organización Hacienda Pública y Derecho Tributario (20 temas)**

| # | Título |
|---|--------|
| 13 | El sistema fiscal español. Principios impositivos en la Constitución. Impuestos estatales. HP Estatal, Autonómica y Local |
| 14 | La AEAT: creación, naturaleza, objetivos, funciones y organización |
| 15 | Derecho Tributario: concepto y contenido. Fuentes. Los tributos: concepto y clasificación. Obligación tributaria. Hecho imponible. Devengo. Base imponible y liquidable. Cuota y deuda tributaria |
| 16 | Obligaciones tributarias formales. Derechos y garantías de los obligados. Capacidad de obrar. Representación y domicilio fiscal. Prescripción |
| 17 | Información y asistencia a los obligados tributarios. Colaboración social. Confidencialidad. Procedimientos comunes |
| 18 | Las declaraciones tributarias. Autoliquidaciones. Comunicaciones de datos. Pagos a cuenta |
| 19 | Actuaciones y procedimientos de gestión tributaria: verificación de datos, comprobación de valores, comprobación limitada |
| 20 | Actuaciones y procedimiento de inspección tributaria: funciones, facultades, procedimiento, medidas cautelares |
| 21 | Extinción de la deuda tributaria (I): pago, aplazamiento, fraccionamiento |
| 22 | Extinción de la deuda tributaria (II): compensación, condonación, insolvencia. Procedimiento de apremio |
| 23 | Actuaciones y procedimiento de recaudación tributaria. Periodo ejecutivo. Apremio. Embargo. Garantías |
| 24 | El embargo de bienes. Facultades de recaudación. Diligencias de embargo. Responsables y sucesores |
| 25 | La potestad sancionadora en materia tributaria. Infracciones y sanciones. Procedimiento sancionador |
| 26 | Revisión en vía administrativa: recurso de reposición, reclamaciones económico-administrativas, TEA |
| 27 | IRPF (I): naturaleza, rendimientos, ganancias y pérdidas patrimoniales |
| 28 | IRPF (II): integración de rentas, base liquidable, cuota, tributación familiar |
| 29 | Impuesto sobre Sociedades: hecho imponible, base, deducciones, devoluciones |
| 30 | IVA (I): naturaleza, entregas de bienes, prestaciones de servicios, exenciones |
| 31 | IVA (II): sujetos pasivos, repercusión, devengo, deducciones, prorrata, devoluciones |
| 32 | La Aduana: deuda aduanera de importación/exportación. Regímenes aduaneros |

### 1.2 Legislación — Scraping e ingesta

> Bloques I y II: la mayoría ya está ingestionada para AGE (CE, LPAC, LRJSP, TREBEP, LOPDGDD, LO 3/2007, Ley 19/2013).
> Bloque III: legislación tributaria NUEVA — es el grueso del trabajo.

**Leyes YA ingestionadas (reutilizar con re-tagging):**
- [ ] Constitución Española 1978 (184 art.) — temas 1-4
- [ ] Ley 39/2015 LPAC — temas 10-12
- [ ] Ley 40/2015 LRJSP — temas 3, 5, 8
- [ ] RDLeg 5/2015 TREBEP — tema 7
- [ ] Ley 19/2013 Transparencia — tema 5
- [ ] LO 3/2018 LOPDGDD + RGPD — tema 5
- [ ] LO 3/2007 Igualdad — tema 6
- [ ] LO 1/2004 Violencia de género — tema 6
- [ ] Ley 4/2023 LGTBI — tema 6

**Leyes NUEVAS a scrapear:**
- [ ] **Ley 58/2003 LGT** (Ley General Tributaria) — ~250 artículos — BOE-A-2003-23186
  - CUBRE: temas 15-26 (obligaciones, gestión, inspección, recaudación, sanciones, revisión)
  - Es la ley MÁS importante de la oposición
- [ ] **Ley 35/2006 IRPF** — ~100 artículos relevantes — BOE-A-2006-20764
  - CUBRE: temas 27-28
- [ ] **Ley 27/2014 Impuesto sobre Sociedades** — ~130 artículos — BOE-A-2014-12328
  - CUBRE: tema 29
- [ ] **Ley 37/1992 IVA** — ~170 artículos — BOE-A-1992-28740
  - CUBRE: temas 30-31
- [ ] **Reglamento UE 952/2013 Código Aduanero de la Unión** — extracto relevante
  - CUBRE: tema 32
  - NOTA: no está en el BOE. Buscar en EUR-Lex. Ingestar secciones principales.
- [ ] (Opcional) **RD 939/2005 Reglamento General de Recaudación** — temas 21-24
- [ ] (Opcional) **RD 1065/2007 Reglamento Gestión e Inspección** — temas 17-20

**Ingesta:**
- [ ] Scrape cada ley nueva con `execution/scrape-boe.ts`
- [ ] Ejecutar `pnpm ingest:legislacion` para upsert artículos
- [ ] Crear script `execution/tag-legislacion-hacienda.ts` con reglas de tagging por tema
- [ ] Ejecutar `pnpm tag:legislacion --rama hacienda`
- [ ] Verificar cobertura: ≥1 artículo taggeado por cada uno de los 32 temas

### 1.3 Free bank (preguntas deterministas sin IA)
- [ ] Crear `execution/seed-hacienda-free-bank.ts` basado en patrón de Correos/Justicia
- [ ] Generar 10 preguntas × 32 temas = **320 preguntas**
- [ ] Insertar en `question_bank` con `oposicion_id` de Hacienda
- [ ] Verificar: cada tema tiene exactamente 10 preguntas, opciones correctas verificadas

### 1.4 Exámenes oficiales
- [ ] Investigar disponibilidad de exámenes AEAT anteriores (2024, 2023, 2022...)
  - Fuente: Sede AEAT → Empleo público → Convocatorias → Ejercicios anteriores
  - Fuente alternativa: webs de opositores (Adams, OpositaTest, CEF)
- [ ] Descargar cuadernillos + plantillas de respuestas
- [ ] Parsear con `parse-exam-pdf.ts` (adaptar `--oposicion hacienda-aeat`)
- [ ] Ingestar en `examenes_oficiales` + `preguntas_oficiales`
- [ ] Crear simulacros disponibles

### 1.5 Rúbrica supuesto práctico AEAT
- [ ] Investigar criterios de corrección del tribunal para Agentes Hacienda
  - Formato: 10 supuestos × 3 preguntas desarrollo breve = 30 respuestas
  - Máximo: 30 puntos, mínimo: 15
  - Tiempo: 150 minutos
  - Solo Bloque III (temas 13-32)
- [ ] Crear `getSystemCorregirSupuestoAEAT()` en `lib/ai/supuesto-practico.ts`
- [ ] Actualizar `getSystemCorregirSupuesto()` para despachar a AEAT cuando corresponda
- [ ] Adaptar `generate-supuesto` prompt para formato AEAT (10 supuestos × 3 preguntas)
  - NOTA: formato diferente al GACE (5 cuestiones) y MJU (5 preguntas)

### 1.6 Landing SEO
- [ ] Crear `app/(marketing)/oposiciones/hacienda/page.tsx`
- [ ] Metadata SEO: "Test Agentes Hacienda 2026 — Practica gratis con preguntas tipo examen | OpoRuta"
- [ ] Schema markup FAQPage con preguntas frecuentes específicas
- [ ] Datos: 1.400 plazas, 32 temas, 2 ejercicios, penalización -1/4
- [ ] CTA registro con `?oposicion=hacienda-aeat`
- [ ] openGraph.images con `/api/og?tipo=blog&tema=...`
- [ ] Actualizar `app/sitemap.ts`

### 1.7 Stripe
- [ ] Añadir en `lib/stripe/client.ts`:
  - `STRIPE_PRICES.pack_hacienda` → env var `STRIPE_PRICE_PACK_HACIENDA`
  - `CORRECTIONS_GRANTED.pack_hacienda = 25` (supuesto_practico=true → +5 extra como GACE/Gestión)
  - `TIER_TO_OPOSICION.pack_hacienda = 'f0000000-0000-0000-0000-000000000001'`
  - `TIER_TO_DB_TIPO.pack_hacienda = 'pack_oposicion'`
- [ ] Añadir `'pack_hacienda'` al z.enum del checkout `BodySchema`
- [ ] Crear producto Stripe "Pack Hacienda 49,99€" en Dashboard — **MANUAL Aritz**
- [ ] Añadir env var `STRIPE_PRICE_PACK_HACIENDA` en Vercel — **MANUAL Aritz**

### 1.8 Activación
- [ ] Verificar: free bank 32/32 temas completo
- [ ] Verificar: legislación indexada (artículos taggeados para los 32 temas)
- [ ] Verificar: registro dinámico muestra Hacienda
- [ ] Verificar: scoring con penalización -1/4 funciona
- [ ] Verificar: supuesto práctico genera formato AEAT (10 × 3)
- [ ] **MANUAL Aritz**: `UPDATE oposiciones SET activa = true WHERE slug = 'hacienda-aeat'`
- [ ] Deploy y smoke test: registro → test tema 15 (LGT) → simulacro → supuesto

### 1.9 Blog SEO Hacienda
- [ ] Post: "Test Agentes Hacienda Pública 2026 — preguntas tipo examen"
- [ ] Post: "Temario Agentes Hacienda 2026 — 32 temas completos"
- [ ] Post: "Notas de corte Agentes Hacienda — histórico y predicción"
- [ ] Post: "Cómo aprobar Agentes Hacienda — estrategia Bloque III"
- [ ] Calculadora nota: `/herramientas/calculadora-nota-hacienda`

---

## FASE 2 — Ayudantes de Instituciones Penitenciarias (C1)

> **Urgencia MEDIA**: OEP 2025 ya celebrada (enero 2026). Próxima convocatoria previsible ~octubre 2026, examen ~enero 2027.
> **900 plazas** (OEP 2025) — BOE-A-2025-20101.

### 2.0 Datos del examen

| Campo | Valor |
|-------|-------|
| Cuerpo | Cuerpo de Ayudantes de Instituciones Penitenciarias |
| Subgrupo | C1 |
| Temas | 50 (17 org. estado + 10 penal + 20 penitenciario + 3 conducta humana) |
| Ejercicio 1 - Parte 1 | 120 preguntas test, 4 opciones, 105 min. Penalización -1/3. Mín: 10/20 |
| Ejercicio 1 - Parte 2 | 8 supuestos × 5 preguntas test = 40 preguntas. Penalización -1/3. Mín: 10/20 |
| Ejercicio 2 | Aptitud médica (Apto/No apto) — NO requiere implementación |
| Nota final | Parte 1 + Parte 2 = máx 40 puntos |
| Plazas típicas | 750-900/año |

### 2.1 Migration: oposición + temas
- [ ] Crear `supabase/migrations/20260401_071_penitenciarias.sql`
- [ ] INSERT oposiciones con UPSERT (ON CONFLICT (id) DO UPDATE):
  - id: `'g0000000-0000-0000-0000-000000000001'`
  - slug: `'penitenciarias'`, rama: `'penitenciarias'`, nivel: `'C1'`, activa: `false`
  - plazas: 900, fecha_examen_aprox: `'2027-01-15'`
  - features: `{"psicotecnicos": false, "cazatrampas": true, "supuesto_practico": false, "ofimatica": false}`
  - NOTA: los supuestos de penitenciarias son tipo TEST (40 preguntas), no desarrollo escrito. Se implementan como simulacro con 2 partes (patrón Auxilio Judicial), NO como supuesto_practico.
- [ ] scoring_config:
  ```json
  {
    "ejercicios": [
      {
        "nombre": "Cuestionario",
        "preguntas": 120,
        "reserva": 0,
        "minutos": 105,
        "acierto": 0.1667,
        "error": 0.0556,
        "max": 20,
        "min_aprobado": 10,
        "penaliza": true,
        "ratio_penalizacion": "1/3"
      },
      {
        "nombre": "Supuestos prácticos",
        "preguntas": 40,
        "reserva": 0,
        "minutos": 60,
        "acierto": 0.50,
        "error": 0.1667,
        "max": 20,
        "min_aprobado": 10,
        "penaliza": true,
        "ratio_penalizacion": "1/3"
      }
    ]
  }
  ```
- [ ] INSERT 50 temas (ver §2.1.1)

#### 2.1.1 Temario completo (50 temas, 4 bloques)

**Bloque I — Organización del Estado, Dcho. Admin., Gestión Personal y Financiera (17 temas)**

| # | Título |
|---|--------|
| 1 | La CE 1978: principios generales, estructura y contenido. Derechos y deberes fundamentales. La Corona |
| 2 | El Poder Judicial. La organización judicial. Actuaciones judiciales. CGPJ |
| 3 | El Gobierno: Consejo de Ministros, Presidente, Ministros, otros miembros |
| 4 | La Organización Territorial del Estado |
| 5 | La UE: Tratados originarios y modificativos. Instituciones Comunitarias |
| 6 | Estructura orgánica del Ministerio de Interior. La SGIP |
| 7 | El personal de Instituciones Penitenciarias: los diferentes cuerpos |
| 8 | Régimen jurídico del personal al servicio de las AAPP. TREBEP |
| 9 | El acceso al empleo público: principios rectores, requisitos, sistemas selectivos |
| 10 | Los contratos del Sector Público: conceptos, clases, procedimiento de adjudicación |
| 11 | Ley 45/2015 de Voluntariado. Concepto, derechos y deberes |
| 12 | Políticas Públicas. Políticas sociales de igualdad de género. Violencia de género |
| 13 | Gobierno abierto. Transparencia y acceso a la información pública |
| 14 | La actividad de las AAPP. Normas generales de actuación |
| 15 | Las fuentes del Derecho Administrativo. Principio de legalidad |
| 16 | El Régimen Jurídico de las AAPP. El Procedimiento Administrativo Común |
| 17 | El Presupuesto: concepto, principios presupuestarios, presupuesto del Estado |

**Bloque II — Derecho Penal (10 temas)**

| # | Título |
|---|--------|
| 18 | El Derecho Penal: concepto, contenido y fuentes. El poder punitivo del Estado |
| 19 | Delitos: concepto y clases. Grados de ejecución. Formas de resolución manifestada |
| 20 | De las personas criminalmente responsables. Las penas: concepto y fines |
| 21 | Formas de suspensión de la ejecución de penas privativas de libertad |
| 22 | Principales delitos (1): homicidio, lesiones, delitos contra el patrimonio |
| 23 | Principales delitos (2): torturas, delitos contra libertad e indemnidad sexuales |
| 24 | Delitos contra la Administración Pública. Prevaricación. Abandono de destino |
| 25 | Delitos contra la Administración de Justicia. Quebrantamiento de condena |
| 26 | La jurisdicción penal. El proceso penal: concepto, objeto y tipos |
| 27 | Procedimiento ordinario. Procedimiento abreviado. Teoría general de recursos |

**Bloque III — Derecho Penitenciario (20 temas)**

| # | Título |
|---|--------|
| 28 | Regulación supranacional en materia penitenciaria: Convenios, Tratados, Pactos, Recomendaciones |
| 29 | El Derecho Penitenciario: concepto, contenido y fuentes. Normativa penitenciaria vigente |
| 30 | La relación jurídico-penitenciaria: naturaleza y fundamento. Derechos de los internos |
| 31 | Prestaciones de la Administración Penitenciaria. Asistencia sanitaria. Higiene y alimentación |
| 32 | El Régimen Penitenciario (1): concepto, principios inspiradores. Normas generales de organización |
| 33 | El Régimen Penitenciario (2). La seguridad en los Establecimientos Penitenciarios |
| 34 | Clasificación de los distintos tipos de establecimientos y sus características |
| 35 | El régimen cerrado. El régimen abierto: objetivos, criterios de aplicación |
| 36 | El Tratamiento Penitenciario (1): concepto, fines y principios inspiradores |
| 37 | El Tratamiento Penitenciario (2): elementos y programas de tratamiento |
| 38 | La relación laboral en el medio penitenciario: características. Tipos de trabajo |
| 39 | Los permisos de salida: concepto y naturaleza. Clases, duración y requisitos |
| 40 | Libertad y excarcelación. Suspensión de ejecución y libertad condicional |
| 41 | Formas especiales de ejecución de la pena de prisión. Modos de internamiento |
| 42 | El régimen disciplinario: principios generales y ámbito de aplicación |
| 43 | El control de la actividad penitenciaria por el Juez de Vigilancia |
| 44 | El modelo organizativo penitenciario: estructura y régimen jurídico. Órganos colegiados |
| 45 | El régimen administrativo (1). Oficina de gestión penitenciaria. Expediente personal del interno |
| 46 | El régimen administrativo (2). Funcionamiento administrativo del servicio interior |
| 47 | El régimen económico de los Establecimientos Penitenciarios. Contabilidad general |

**Bloque IV — Conducta Humana (3 temas)**

| # | Título |
|---|--------|
| 48 | Elementos de la conducta humana. Estímulos y respuestas. Técnicas de evaluación |
| 49 | Organización social de la prisión. Código del recluso, jerga y lenguaje. Subculturas carcelarias |
| 50 | El comportamiento social. Asertividad. Habilidades sociales. La conducta adictiva en prisión |

### 2.2 Legislación — Scraping e ingesta

> Bloque I: mayoría ya ingestionada para AGE.
> Bloques II-III: legislación penal y penitenciaria NUEVA — es el grueso.
> Bloque IV: no tiene legislación (psicología/sociología) — solo necesita conocimiento_tecnico.

**Leyes YA ingestionadas (reutilizar con re-tagging):**
- [ ] Constitución Española 1978 — temas 1-5
- [ ] Ley 39/2015 LPAC — temas 14-16
- [ ] Ley 40/2015 LRJSP — temas 3, 15
- [ ] RDLeg 5/2015 TREBEP — temas 8-9
- [ ] Ley 19/2013 Transparencia — tema 13
- [ ] LO 3/2007 Igualdad — tema 12
- [ ] LO 1/2004 Violencia de género — tema 12
- [ ] Ley 4/2023 LGTBI — tema 12
- [ ] Ley 9/2017 Contratos del Sector Público — tema 10 (parcial, ya ingestionada para AGE A2)
- [ ] LECrim 1882 — temas 26-27 (ya ingestionada para Justicia)

**Leyes NUEVAS a scrapear:**
- [ ] **LO 10/1995 Código Penal** — ~600 artículos (solo Libro I + títulos relevantes del Libro II) — BOE-A-1995-25444
  - CUBRE: temas 18-25 (parte general + delitos específicos)
  - NOTA: ley muy extensa. Scrapear selectivamente: Título Preliminar, Libro I completo, y del Libro II: títulos I (homicidio), III (lesiones), XIII (patrimonio), VII (torturas), VIII (libertad sexual), XIX (Admón. Pública), XX (Admón. Justicia)
- [ ] **LO 1/1979 Ley Orgánica General Penitenciaria (LOGP)** — 80 artículos — BOE-A-1979-23708
  - CUBRE: temas 28-47 (toda la legislación penitenciaria base)
- [ ] **RD 190/1996 Reglamento Penitenciario** — 325 artículos — BOE-A-1996-3307
  - CUBRE: temas 28-47 (desarrollo reglamentario de la LOGP)
- [ ] **RD 840/2011** Medidas alternativas y libertad condicional — ~30 artículos — BOE-A-2011-10598
  - CUBRE: temas 40-41
- [ ] **Ley 45/2015 Voluntariado** — ~30 artículos — BOE-A-2015-11072
  - CUBRE: tema 11
- [ ] **RD 207/2024** Estructura orgánica Ministerio del Interior — extracto SGIP
  - CUBRE: tema 6
- [ ] (Opcional) **Ley 50/1997 Ley del Gobierno** — tema 3
- [ ] (Opcional) **RD 782/2001** Relación laboral especial penados — tema 38

**Contenido no legislativo (Bloque IV — Conducta Humana):**
- [ ] Crear contenido en `conocimiento_tecnico` para temas 48-50
  - Fuentes: manuales de psicología penitenciaria, documentos SGIP, temarios públicos
  - Temas: estímulos/respuestas, subculturas carcelarias, conducta adictiva, habilidades sociales
  - Similar a como se hizo con contenido operativo Correos

**Ingesta:**
- [ ] Scrape cada ley nueva con `execution/scrape-boe.ts`
- [ ] Ejecutar `pnpm ingest:legislacion` para upsert
- [ ] Crear script `execution/tag-legislacion-penitenciarias.ts`
- [ ] Ejecutar `pnpm tag:legislacion --rama penitenciarias`
- [ ] Ingestar contenido_tecnico Bloque IV (temas 48-50)
- [ ] Verificar cobertura: ≥1 artículo/sección por cada uno de los 50 temas

### 2.3 Free bank
- [ ] Crear `execution/seed-penitenciarias-free-bank.ts`
- [ ] Generar 10 preguntas × 50 temas = **500 preguntas**
- [ ] Insertar en `question_bank` con `oposicion_id` de Penitenciarias
- [ ] Verificar: 50/50 temas cubiertos

### 2.4 Exámenes oficiales
- [ ] Investigar disponibilidad exámenes IIPP anteriores
  - Fuente: Ministerio Interior → Empleo público → IIPP → Ejercicios anteriores
  - Fuente alternativa: funcionarioprisiones.com, Adams, OpositaTest
- [ ] Descargar cuadernillos + plantillas (2025, 2024, 2023...)
- [ ] Parsear con `parse-exam-pdf.ts --oposicion penitenciarias`
- [ ] Ingestar en `examenes_oficiales` + `preguntas_oficiales`
- [ ] Los supuestos (parte 2) son tipo test → ingestar como preguntas normales con flag `ejercicio=2`

### 2.5 Simulacro 2 partes (cuestionario + supuestos test)
- [ ] `generate-simulacro` ya soporta 2 ejercicios (patrón Auxilio Judicial)
- [ ] Verificar que scoring_config con 2 ejercicios tipo test funciona
- [ ] Timer: parte 1 = 105 min, parte 2 = 60 min
- [ ] Si no funciona: adaptar SimulacroMixtoCard para mostrar "Cuestionario" + "Supuestos prácticos"

### 2.6 Landing SEO
- [ ] Crear `app/(marketing)/oposiciones/penitenciarias/page.tsx`
- [ ] Metadata SEO: "Test Instituciones Penitenciarias 2026 — Practica gratis | OpoRuta"
- [ ] Schema markup FAQPage
- [ ] Datos: 900 plazas, 50 temas, 160 preguntas, penalización -1/3
- [ ] CTA registro con `?oposicion=penitenciarias`
- [ ] openGraph.images
- [ ] Actualizar `app/sitemap.ts`

### 2.7 Stripe
- [ ] Añadir en `lib/stripe/client.ts`:
  - `STRIPE_PRICES.pack_penitenciarias` → env var `STRIPE_PRICE_PACK_PENITENCIARIAS`
  - `CORRECTIONS_GRANTED.pack_penitenciarias = 20` (sin supuesto_practico → estándar)
  - `TIER_TO_OPOSICION.pack_penitenciarias = 'g0000000-0000-0000-0000-000000000001'`
  - `TIER_TO_DB_TIPO.pack_penitenciarias = 'pack_oposicion'`
- [ ] Añadir `'pack_penitenciarias'` al z.enum del checkout `BodySchema`
- [ ] Crear producto Stripe "Pack Penitenciarias 49,99€" — **MANUAL Aritz**
- [ ] Añadir env var `STRIPE_PRICE_PACK_PENITENCIARIAS` — **MANUAL Aritz**

### 2.8 Activación
- [ ] Verificar: free bank 50/50 temas
- [ ] Verificar: legislación indexada
- [ ] Verificar: simulacro 2 partes funciona
- [ ] **MANUAL Aritz**: `UPDATE oposiciones SET activa = true WHERE slug = 'penitenciarias'`
- [ ] Deploy y smoke test

### 2.9 Blog SEO Penitenciarias
- [ ] Post: "Test Instituciones Penitenciarias 2026 — preguntas tipo examen"
- [ ] Post: "Temario Ayudantes Penitenciarias 2026 — 50 temas completos"
- [ ] Post: "Notas de corte Penitenciarias — histórico"
- [ ] Post: "Cómo aprobar Penitenciarias — estrategia por bloques"

---

## FASE 3 — Transversales (tras activar ambas)

### 3.1 Landing principal
- [ ] Añadir cards Hacienda y Penitenciarias en sección "¿Qué oposición preparas?"
- [ ] Actualizar sección exámenes oficiales con nuevas ramas
- [ ] Actualizar FAQ global

### 3.2 SEO transversal
- [ ] Actualizar `llms.txt` y `/api/info` con nuevas oposiciones
- [ ] Internal linking entre blogs de distintas ramas
- [ ] Posts comparativos: "Mejores apps oposiciones Hacienda 2026"

### 3.3 Registro dinámico
- [ ] Verificar que ambas aparecen correctamente en `/register` agrupadas por rama
- [ ] Verificar orden: AGE → Justicia → Correos → Hacienda → Penitenciarias

---

## Checklist de activación (usar para CADA oposición)

> Copiar y rellenar antes de poner `activa=true`. Aprendido de Correos + Justicia.

### Pre-requisitos (sin esto NO activar)
- [ ] Migration aplicada en Supabase remoto (oposición + temas)
- [ ] Legislación taggeada: `pnpm tag:legislacion --rama X --dry-run` → 0 errores
- [ ] Free bank completo: N/N temas × 10 preguntas cada uno
- [ ] Stripe producto creado + env var en Vercel
- [ ] `lib/stripe/client.ts` actualizado (STRIPE_PRICES, CORRECTIONS_GRANTED, TIER_TO_OPOSICION, z.enum)

### Smoke test (en local o preview)
- [ ] Registro con `?oposicion=slug` → aparece en ProfileForm
- [ ] Test tema X → genera preguntas → scoring correcto (penalización correcta)
- [ ] Simulacro → timer proporcional → desglose por ejercicio
- [ ] (Si supuesto_practico) Supuesto desarrollo → timer correcto → corrección IA funciona
- [ ] Stripe checkout → webhook → créditos asignados
- [ ] Dashboard muestra datos de la nueva oposición

### Post-activación
- [ ] `UPDATE oposiciones SET activa = true WHERE slug = '...'`
- [ ] Landing page muestra la nueva oposición
- [ ] Landing exámenes muestra badges (si hay exámenes ingestados)
- [ ] Blog posts publicados
- [ ] sitemap.ts actualizado
- [ ] llms.txt actualizado

### Gotchas conocidas (evitar repetir)
1. **maxPuntuable**: se calcula desde scoring_config, nunca hardcodear. Si MAX_PUNTUABLE < preguntas del examen → descarta preguntas válidas
2. **penalización -1/4 vs -1/3**: almacenar ratio_penalizacion en scoring_config, el frontend lee de ahí
3. **Temas compartidos entre oposiciones**: insertar por separado (cada oposicion_id tiene sus propios temas). El tagging crea tema_ids para todas las oposiciones que compartan la ley
4. **generate:free-bank requiere admin user_id**: FK constraint en tests_generados. Usar `--user-id` de Aritz admin
5. **Slug único global**: verificar que no colisiona con slugs existentes antes de crear migration
6. **Correos scoring_config**: tiene min_aprobado como objeto `{"reparto": 33, "atc": 36}` — NO usar este patrón para Hacienda/Penitenciarias (usar INT simple)

---

## Estimación de esfuerzo

| Tarea | Hacienda | Penitenciarias |
|-------|----------|----------------|
| Migration + temas | 30 min | 30 min |
| Scrape legislación nueva | 2-3h (4-5 leyes tributarias) | 2-3h (CP parcial + LOGP + RP) |
| Re-tagging legislación existente | 30 min | 30 min |
| Free bank (preguntas) | 1-2h | 2-3h (50 temas) |
| Exámenes oficiales | 1-2h (si disponibles) | 1-2h (si disponibles) |
| Rúbrica supuesto AEAT | 1h | N/A (supuestos son test) |
| Landing SEO | 30 min | 30 min |
| Stripe + webhook | 15 min | 15 min |
| Blog posts (4-5) | 1h | 1h |
| Testing + verificación | 1h | 1h |
| **TOTAL** | **~2 sesiones** | **~2-3 sesiones** |

---

## Fuentes oficiales

| Recurso | URL |
|---------|-----|
| BOE Hacienda convocatoria | https://www.boe.es/diario_boe/txt.php?id=BOE-A-2025-27056 |
| Sede AEAT | https://sede.agenciatributaria.gob.es/ |
| LGT consolidada | https://www.boe.es/buscar/act.php?id=BOE-A-2003-23186 |
| Ley IRPF consolidada | https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764 |
| Ley IVA consolidada | https://www.boe.es/buscar/act.php?id=BOE-A-1992-28740 |
| Ley IS consolidada | https://www.boe.es/buscar/act.php?id=BOE-A-2014-12328 |
| BOE Penitenciarias convocatoria | https://www.boe.es/boe/dias/2025/10/09/pdfs/BOE-A-2025-20101.pdf |
| LOGP consolidada | https://www.boe.es/buscar/act.php?id=BOE-A-1979-23708 |
| Reglamento Penitenciario | https://www.boe.es/buscar/act.php?id=BOE-A-1996-3307 |
| Código Penal consolidado | https://www.boe.es/buscar/act.php?id=BOE-A-1995-25444 |
| Ministerio Interior IIPP | https://www.interior.gob.es/opencms/gl/servicios-al-ciudadano/empleo-publico/oposiciones/cuerpos-de-instituciones-penitenciarias/ |
| FuncionarioPrisiones.com | https://funcionarioprisiones.com/temario/ |
