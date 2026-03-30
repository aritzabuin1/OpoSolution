# Plan3: Expansión OpoRuta — Hacienda (AEAT) + Instituciones Penitenciarias

> Referencia: PLAN2.md (patrón idéntico: migration → legislación → free bank → exámenes → landing → activación)
> Fuente datos: `oporuta-nuevas-oposiciones-hacienda-iipp.md` (verificado contra BOE)
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

> **1.000 plazas libre** (OEP 2025, BOE nº 314, 30/12/2025). Histórico: 2024=851, 2023=823, 2022=787.
> Convocatoria anual, examen típicamente en marzo. Próxima previsible ~marzo 2027.
> Sueldo: ~22.000-24.000€ bruto/año inicial. Ratio ~10-12 opositores/plaza.

### 1.0 Datos del examen

| Campo | Valor |
|-------|-------|
| Cuerpo | Cuerpo General Administrativo AGE, especialidad Agentes Hacienda Pública |
| Subgrupo | C1 |
| Temas | 32 (7 org. estado + 5 dcho. admin. + 20 hacienda/tributario) |
| Ejercicio 1 | **80 preguntas test**, 4 opciones, **90 min**. Penalización **-1/4**. Escala 0-10, mín 5 |
| Ejercicio 2 | **10 supuestos prácticos DESARROLLO ESCRITO** (solo Bloque III). Respuestas breves y razonadas. **2h30 min**. Escala 0-30, mín 15 |
| Nota final | Suma ejercicios (máx 40 pts). Desempate: 2º ejercicio |
| Conservación | Se conserva 1er ejercicio aprobado para la convocatoria siguiente |

> **VERIFICADO contra BOE-A-2025-27056**: El 2º ejercicio es **DESARROLLO ESCRITO** (respuestas breves y razonadas).
> `features.supuesto_practico = true`. Requiere rúbrica AEAT en `supuesto-practico.ts`.
> Migration 065 corrigió scoring_config: ej.2 = 0-30 pts, 150 min, tipo "tribunal".

### 1.1 Migration: oposición + temas ✅ (migration 064 aplicada 2026-03-30)
- [x] Crear `supabase/migrations/20260330_064_hacienda_penitenciarias.sql`
- [x] INSERT oposiciones con UPSERT (ON CONFLICT (id) DO UPDATE):
  - id: `'f0000000-0000-0000-0000-000000000001'`
  - slug: `'hacienda-aeat'`, rama: `'hacienda'`, nivel: `'C1'`, activa: `false`
  - plazas: 1000, fecha_examen_aprox: `'2027-03-01'`
  - features: `{"psicotecnicos": false, "cazatrampas": true, "supuesto_practico": true, "ofimatica": false}`
  - **NOTA**: `supuesto_practico: true` — ej.2 es DESARROLLO ESCRITO (corregido en migration 065)
- [x] scoring_config (corregido por migration 065 — ej.2: 0-30, 150min, tipo tribunal):
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
        "minutos": 60,
        "acierto": 1.0,
        "error": 0.25,
        "max": 10,
        "min_aprobado": 5,
        "penaliza": true,
        "ratio_penalizacion": "1/4"
      }
    ]
  }
  ```
- [x] INSERT 32 temas (ver §1.1.1)

#### 1.1.1 Temario completo (32 temas, 3 bloques)

> Fuente: BOE nº 314, 30/12/2025, resolución 22/12/2025 (conv. 2025-2026). Cambios vs anterior: eliminados antiguos temas 5 y 18 (IRNR), unificados temas 4+5 anterior en nuevo 4.

**Bloque I — Organización del Estado y Funcionamiento AGE (7 temas)**

| # | Título | Legislación principal |
|---|--------|-----------------------|
| 1 | La CE 1978: estructura y contenido. Derechos y deberes fundamentales. Su garantía y suspensión. La Corona. El Tribunal Constitucional | CE (Tít. Prelim, I, II, IX) |
| 2 | Las Cortes Generales: composición, atribuciones y funcionamiento. El Defensor del Pueblo | CE Tít. III, V; LO 3/1981 |
| 3 | El Gobierno: composición, nombramiento y cese. Las funciones del Gobierno | CE Tít. IV; Ley 50/1997 |
| 4 | La Administración Pública: principios constitucionales. La AGE: organización y funcionamiento. Órganos superiores y directivos. Administración periférica. Organización territorial del Estado. Las CCAA | CE Tít. VIII; Ley 40/2015 |
| 5 | La Unión Europea: instituciones. Libertades básicas. Principales políticas comunes | Tratados UE; TFUE |
| 6 | La LO 3/2018 de Protección de Datos Personales y garantía de derechos digitales | LOPDGDD; RGPD UE 2016/679 |
| 7 | Políticas de igualdad de género. LO 3/2007. Violencia de género: LO 1/2004 | LO 3/2007; LO 1/2004 |

**Bloque II — Derecho Administrativo General (5 temas)**

| # | Título | Legislación principal |
|---|--------|-----------------------|
| 8 | Las fuentes del Derecho Administrativo. Jerarquía. La Ley. Disposiciones del ejecutivo con fuerza de ley. El Reglamento | CE; Ley 39/2015; Ley 40/2015 |
| 9 | El acto administrativo: concepto, clases y elementos. Motivación y notificación. Eficacia y validez | Ley 39/2015 (LPAC) |
| 10 | El procedimiento administrativo común. Fases. Los recursos administrativos | Ley 39/2015 (LPAC) |
| 11 | Los contratos del sector público. Clases. Procedimiento de adjudicación | Ley 9/2017 (LCSP) |
| 12 | La responsabilidad patrimonial de la Administración Pública | Ley 40/2015 (LRJSP) |

**Bloque III — Organización Hacienda Pública y Derecho Tributario (20 temas)**

| # | Título | Legislación principal |
|---|--------|-----------------------|
| 13 | El sistema fiscal español. Principios impositivos en la CE | CE art. 31, 133, 134; LGT |
| 14 | La AEAT: creación, naturaleza, objetivos, funciones y organización | Ley 31/1990 art. 103; Estatuto AEAT |
| 15 | Derecho Tributario: concepto y contenido. Fuentes. Tributos: concepto y clases | LGT Títulos I-II |
| 16 | Derechos y garantías de los obligados tributarios | LGT Título III; Ley 1/1998 |
| 17 | Obligaciones formales: libros registros y facturas. Gestión censal. NIF | LGT; RD 1065/2007; RD 1619/2012 |
| 18 | Información y asistencia: consulta tributaria. Colaboración social. Tecnologías informáticas | LGT arts. 85-91 |
| 19 | Declaraciones tributarias: concepto y clases. Autoliquidaciones. Comunicaciones de datos. Retenciones. Pagos fraccionados | LGT arts. 119-122 |
| 20 | La deuda tributaria. Extinción. Aplazamientos y fraccionamientos | LGT Título II Cap. IV |
| 21 | Garantías de la deuda tributaria. Medidas cautelares. Recaudación en período voluntario y ejecutivo. Apremio | LGT; RGR (RD 939/2005) |
| 22 | La gestión tributaria: procedimientos de gestión. Comprobación de valores | LGT Título III Cap. III |
| 23 | Inspección de Tributos: funciones, facultades, actuaciones, procedimiento | LGT Título III Cap. IV |
| 24 | Potestad sancionadora. Infracciones y sanciones. Procedimiento sancionador | LGT Título IV |
| 25 | Revisión en vía administrativa. Recurso de reposición. Reclamaciones económico-administrativas | LGT Título V |
| 26 | IRPF (I): naturaleza, objeto, ámbito. Hecho imponible. Contribuyente. Base imponible | Ley 35/2006 |
| 27 | IRPF (II): base liquidable, cuota íntegra, deducciones, cuota diferencial, retenciones, obligación declarar | Ley 35/2006 |
| 28 | Impuesto sobre Sociedades: naturaleza, ámbito, hecho imponible, sujeto pasivo, base, tipo, cuota, deducciones | Ley 27/2014 |
| 29 | IVA (I): naturaleza, ámbito, hecho imponible, lugar realización, sujeto pasivo, base imponible | Ley 37/1992 |
| 30 | IVA (II): tipo impositivo, deducciones, devoluciones, regímenes especiales | Ley 37/1992 |
| 31 | Impuestos Especiales: concepto, naturaleza, principales figuras | Ley 38/1992 |
| 32 | Aduanas: normativa aduanera. Introducción y salida de mercancías. Regímenes aduaneros | Rgto UE 952/2013 |

### 1.2 Legislación — Scraping e ingesta

> **LGT es la ley más preguntada con diferencia**, seguida de LIRPF, LIVA, LPAC, CE.
> Bloques I-II: la mayoría ya está ingestionada para AGE.
> Bloque III: legislación tributaria NUEVA — grueso del trabajo.

**Leyes YA ingestionadas (reutilizadas con re-tagging) ✅:**
- [x] Constitución Española 1978 — temas 1-5 (1.005 artículos taggeados)
- [x] Ley 39/2015 LPAC — temas 8-10
- [x] Ley 40/2015 LRJSP — temas 4, 8, 12
- [x] LO 3/2018 LOPDGDD + RGPD — tema 6
- [x] LO 3/2007 Igualdad — tema 7
- [x] LO 1/2004 Violencia de género — tema 7
- [x] Ley 9/2017 LCSP — tema 11

**Leyes NUEVAS scrapeadas e ingestionadas ✅ (2026-03-30):**
- [x] **Ley 58/2003 LGT** — 335 artículos scrapeados — BOE-A-2003-23186
  - CUBRE: temas 13-25 (>50% del examen). La ley más importante.
- [x] **Ley 35/2006 IRPF** — 221 artículos — BOE-A-2006-20764
  - CUBRE: temas 26-27
- [x] **Ley 27/2014 Impuesto sobre Sociedades** — 212 artículos — BOE-A-2014-12328
  - CUBRE: tema 28
- [x] **Ley 37/1992 IVA** — 238 artículos — BOE-A-1992-28740
  - CUBRE: temas 29-30
- [x] **Ley 38/1992 Impuestos Especiales** — 137 artículos — BOE-A-1992-28741
  - CUBRE: tema 31
- [ ] **Reglamento UE 952/2013 Código Aduanero** — extracto relevante (EUR-Lex, no BOE)
  - CUBRE: tema 32 — pendiente (no prioritario para lanzamiento)
- [x] **RD 939/2005 Reglamento General de Recaudación** — 146 artículos — temas 20-21
- [x] **RD 1065/2007 Reglamento Gestión e Inspección** — 262 artículos — temas 17-18, 22-23
- [ ] **RD 1619/2012 Reglamento de facturación** — tema 17 — pendiente (no prioritario)

**Ingesta:**
- [x] Scrape 5 leyes tributarias core con `scrape-boe-ley-v2.ts`
- [x] Ejecutar `pnpm ingest:legislacion` — 2.292 artículos nuevos upserted
- [x] Reglas de tagging en `tag-legislacion-temas.ts` para rama `hacienda`
- [x] Ejecutar `pnpm tag:legislacion --rama hacienda` — 6.655+ artículos taggeados
- [ ] Verificar cobertura: ≥1 artículo taggeado por cada uno de los 32 temas

### 1.3 Free bank ✅ (2026-03-30)
- [x] Ejecutar `pnpm generate:free-bank --oposicion hacienda-aeat --user-id b55c400e-...`
- [x] 10 preguntas × 32 temas = **320 preguntas** — 32/32 temas completo
- [x] Verificado: todas las preguntas pasan por pipeline RAG + verificación citas legales

### 1.4 Exámenes oficiales
- [x] Investigar disponibilidad: **5 años disponibles** en sede AEAT (2020-2024) + 2019 vía GoKoan
  - OEP 2024: cuestionario A/B + plantilla definitiva + 2º ejercicio ✅
  - OEP 2023: cuestionario A/B + plantilla definitiva + 2º ejercicio ✅
  - OEP 2022: cuestionario A/B + extraordinario + supuesto práctico ✅
  - OEP 2021: cuestionario A/B + plantilla definitiva ✅
  - OEP 2020: cuestionario A/B + plantilla definitiva ✅
  - OEP 2025: solo plantilla provisional (cuestionario aún no publicado)
- [x] Descargar cuadernillos AEAT 2024 + 2023 (sede AEAT)
- [x] Parsear: 82 preguntas (2024) + 99 preguntas (2023)
- [x] Ingestar: 165 preguntas oficiales en `examenes_oficiales` + `preguntas_oficiales`
- [x] NOTA: ej.2 es desarrollo escrito → no se ingesta, se usa como referencia para rúbrica

### 1.5 Supuesto práctico AEAT ✅ (2026-03-30)
- [x] `getSystemCorregirSupuestoAEAT()` en `supuesto-practico.ts` — rúbrica 3 criterios: corrección jurídica (50%), adecuación (33%), expresión (17%). Total 0-30 pts
- [x] `SYSTEM_GENERATE_SUPUESTO_AEAT` — genera 10 supuestos Bloque III (LGT/IRPF/IVA/IS/IIEE)
- [x] Dispatch en `getSystemCorregirSupuesto()` para slug `hacienda-aeat`
- [x] `generate-supuesto` endpoint: detecta AEAT, maxTokens 12000, bloque 'III' aceptado en schema

### 1.6 Landing SEO ✅ (2026-03-30)
- [x] Crear `app/(marketing)/oposiciones/hacienda/page.tsx` — theme emerald
- [x] Metadata SEO con keywords: "oposiciones agente hacienda 2026", "temario agente hacienda", "test agente hacienda", "sueldo agente hacienda"
- [x] Schema markup FAQPage + Course JSON-LD
- [x] Datos: 1.000 plazas, 32 temas, 2 ejercicios test, penalización -1/4
- [x] CTA registro con `?oposicion=hacienda-aeat`
- [x] openGraph.images con `/api/og?tipo=blog&tema=...`
- [x] Actualizar `app/sitemap.ts`
- [x] Competidores principales: OpositaTest (~25-40€/mes), Adams (~150-200€/mes), MAD, Supera Oposiciones
- [x] USP diferencial: preguntas verificadas contra BOE (LGT, IRPF, IVA)

### 1.7 Stripe (código ✅, productos Stripe pendientes Aritz)
- [x] Añadir en `lib/stripe/client.ts`:
  - `STRIPE_PRICES.pack_hacienda` → env var `STRIPE_PRICE_PACK_HACIENDA`
  - `CORRECTIONS_GRANTED.pack_hacienda = 25` (con supuesto_practico → +5 extra)
  - `TIER_TO_OPOSICION.pack_hacienda = 'f0000000-0000-0000-0000-000000000001'`
  - `TIER_TO_DB_TIPO.pack_hacienda = 'pack_oposicion'`
- [x] Añadir `'pack_hacienda'` al z.enum del checkout `BodySchema`
- [x] Crear producto Stripe "Pack Hacienda 49,99€" — ✅ Aritz 2026-03-30
- [x] Añadir env var `STRIPE_PRICE_PACK_HACIENDA` en Vercel — ✅ Aritz 2026-03-30

### 1.8 Activación ✅ (2026-03-30)
- [x] Verificar: free bank 32/32 temas ✅
- [x] Verificar: legislación indexada (~10K artículos, 7 leyes tributarias)
- [x] Verificar: scoring_config 80q test + 10 desarrollo (0-30, tribunal) ✅
- [x] Stripe productos creados + env vars ✅
- [x] **MANUAL Aritz**: `UPDATE oposiciones SET activa = true` — ✅ 2026-03-30
- [ ] Smoke test E2E: registro → test tema 15 (LGT) → supuesto desarrollo → pago

### 1.9 Blog SEO Hacienda
- [x] Post: "Test Agentes Hacienda Pública 2026 — preguntas tipo examen"
- [x] Post: "Temario Agentes Hacienda 2026 — 32 temas completos"
- [x] Post: "Notas de corte Agentes Hacienda — histórico y predicción"
- [x] Post: "Cómo aprobar Agentes Hacienda — estrategia Bloque III (LGT)"
- [ ] Calculadora nota: `/herramientas/calculadora-nota-hacienda` (penalización -1/4, 2 ejercicios)

---

## FASE 2 — Ayudantes de Instituciones Penitenciarias (C1)

> **900 plazas** (OEP 2025, BOE 09/10/2025). Previstas 2026: 800. Histórico: 2024=800, 2023=756, 2022=900.
> Convocatoria anual, examen típicamente enero-febrero. Próxima previsible ~enero 2027.
> Sueldo: ~25.000-30.000€ bruto/año. ~13.000 presentados por conv., ratio real ~5-6 preparados/plaza.
> **Requisito especial**: no haber sido condenado por delito doloso >3 años; sin exclusiones médicas (Anexo III).

### 2.0 Datos del examen

| Campo | Valor |
|-------|-------|
| Cuerpo | Cuerpo de Ayudantes de Instituciones Penitenciarias |
| Subgrupo | C1 |
| Temas | 50 (17 org. estado/admin + 10 penal + 20 penitenciario + 3 conducta humana) |
| Ejercicio 1 | **120 preguntas test** + 3 reserva, 4 opciones, **1h45 min**. Penalización **-1/3**. Escala 0-20, mín 10 |
| Ejercicio 2 | **8 supuestos × 5 preguntas test = 40 preguntas**, **1h20 min**. Penalización -1/3. Escala 0-20, mín 10 |
| Ejercicio 3 | Reconocimiento médico (Apto/No apto) — NO implementar en OpoRuta |
| Nota final | Ej1 + Ej2 = máx 40 pts. Desempate: 2º ejercicio |
| Post-aprobado | Período de prácticas: 12 meses (formación + centro penitenciario) |

### 2.1 Migration: oposición + temas ✅ (migration 064 aplicada 2026-03-30)
- [x] Crear `supabase/migrations/20260330_064_hacienda_penitenciarias.sql` (compartida con Hacienda)
- [x] INSERT oposiciones con UPSERT (ON CONFLICT (id) DO UPDATE):
  - id: `'f1000000-0000-0000-0000-000000000001'`
  - slug: `'penitenciarias'`, rama: `'penitenciarias'`, nivel: `'C1'`, activa: `false`
  - plazas: 900, fecha_examen_aprox: `'2027-01-15'`
  - features: `{"psicotecnicos": false, "cazatrampas": true, "supuesto_practico": false, "ofimatica": false}`
  - NOTA: supuestos son tipo TEST (40 preguntas), no desarrollo → `supuesto_practico: false`. Patrón Auxilio Judicial.
- [x] scoring_config (corregido por migration 065 — 120+40 preguntas, 0-20+0-20):
- [x] INSERT 50 temas (ver §2.1.1)

#### 2.1.1 Temario completo (50 temas, 4 bloques)

> Fuente: BOE 09/10/2025 (conv. OEP 2025). Con legislación principal por tema.

**Bloque I — Organización del Estado, Dcho. Admin., Gestión Personal y Financiera (17 temas)**

| # | Título | Legislación principal |
|---|--------|-----------------------|
| 1 | La CE 1978: principios generales, estructura y contenido. Derechos y deberes fundamentales. La Corona | CE Tít. Prelim, I, II |
| 2 | Las Cortes Generales. La elaboración de las leyes. El Defensor del Pueblo | CE Tít. III; LO 3/1981 |
| 3 | El Poder Judicial. La organización judicial. El CGPJ. El Tribunal Constitucional. El Ministerio Fiscal | CE Tít. VI, IX; LOPJ |
| 4 | El Gobierno: Consejo de Ministros, Presidente, Ministros. Admón. Periférica: Delegados, Subdelegados | CE Tít. IV; Ley 50/1997; Ley 40/2015 |
| 5 | La Organización Territorial del Estado. CCAA. Competencias en materia penitenciaria | CE Tít. VIII |
| 6 | La UE: Tratados. Instituciones Comunitarias. Efectos sobre organización del Estado | TUE; TFUE |
| 7 | Estructura orgánica del Ministerio del Interior. La SGIP. EPPFETFE | RD 207/2024; RD 122/2015 |
| 8 | El personal de IIPP: cuerpos de funcionarios. Ayudantes: funciones. Personal laboral | Ley 36/1977; RD 1201/1981 |
| 9 | Régimen jurídico personal al servicio AAPP. TREBEP. Derechos/deberes. Incompatibilidades. Régimen disciplinario | TREBEP; Ley 53/1984 |
| 10 | Acceso al empleo público. Sistemas selectivos. Adquisición/pérdida condición funcionario. Situaciones administrativas | TREBEP Tít. IV-VII |
| 11 | Prevención de riesgos laborales: Ley 31/1995. Derechos/obligaciones. Servicios de prevención | Ley 31/1995 PRL |
| 12 | Las fuentes del Derecho Administrativo. Jerarquía. La Ley, el Reglamento | CE; Ley 39/2015 |
| 13 | El acto administrativo. Motivación y notificación. Eficacia y validez. Silencio administrativo. Revisión. Recursos | Ley 39/2015 (LPAC) |
| 14 | Los procedimientos administrativos: el procedimiento administrativo común. Fases | Ley 39/2015 (LPAC) |
| 15 | Gobierno abierto. Transparencia y acceso a información pública. Administración electrónica | Ley 19/2013; Ley 40/2015 |
| 16 | El presupuesto del Estado: concepto, principios, estructura. El gasto público. Contratación administrativa. Estabilidad presupuestaria | Ley 47/2003 LGP; Ley 9/2017 LCSP; LO 2/2012 |
| 17 | Políticas públicas. Igualdad de género: LO 3/2007. Violencia de género: LO 1/2004. Dependencia: Ley 39/2006. Voluntariado | LO 3/2007; LO 1/2004; Ley 39/2006; Ley 45/2015 |

**Bloque II — Derecho Penal (10 temas)**

| # | Título | Legislación principal |
|---|--------|-----------------------|
| 18 | El Derecho Penal: concepto, principios generales. Infracción penal. Personas criminalmente responsables | CP (LO 10/1995) Libro I |
| 19 | Las penas: clases y efectos. Reglas generales para la aplicación | CP Libro I Tít. III |
| 20 | Formas sustitutivas de ejecución de penas privativas de libertad | CP Libro I Tít. III |
| 21 | Suspensión de ejecución. Penas privativas de derechos. TBC. Medidas de seguridad. Extinción resp. criminal | CP Libro I |
| 22 | Principales delitos (1): homicidio, lesiones, violencia de género/doméstica, delitos contra patrimonio | CP Libro II |
| 23 | Delitos contra libertad: detención ilegal, secuestros, amenazas, coacciones. Tráfico de drogas | CP Libro II |
| 24 | Principales delitos (2): torturas, delitos contra integridad moral, libertad sexual, honor, falsedades | CP Libro II |
| 25 | Delitos cometidos por funcionarios. Atentados contra autoridad. Quebrantamiento de condena | CP Libro II |
| 26 | La responsabilidad civil derivada de delitos y faltas | CP Libro I Tít. V; CC |
| 27 | Derecho Procesal Penal: concepto. El proceso penal. Procedimientos. Medidas cautelares | LECrim |

**Bloque III — Derecho Penitenciario (20 temas)**

| # | Título | Legislación principal |
|---|--------|-----------------------|
| 28 | Regulación supranacional: Convenios, Tratados, Pactos. ONU, Consejo de Europa. Ley 23/2014 | Reglas Mínimas ONU; Ley 23/2014 |
| 29 | El Derecho Penitenciario: concepto, contenido, fuentes. Evolución histórica. Art. 25.2 CE | CE art. 25.2; LOGP; RP |
| 30 | Relación jurídico-penitenciaria. Derechos de los internos: clases, límites, protección | LOGP; RP; CE |
| 31 | Prestaciones: asistencia sanitaria, higiene, alimentación, asistencia religiosa, acción social | LOGP Tít. II; RP |
| 32 | Régimen Penitenciario (1): concepto, principios. Organización del centro. Ingreso. Relaciones con exterior. Conducciones y traslados | LOGP Tít. III; RP Tít. III |
| 33 | Régimen Penitenciario (2): seguridad en establecimientos. Seguridad exterior e interior. Medios coercitivos | LOGP; RP Tít. III Cap. VIII |
| 34 | Clasificación de establecimientos. Régimen ordinario. Régimen abierto. Régimen cerrado | LOGP Tít. III; RP |
| 35 | Formas especiales de ejecución: jóvenes, madres, extranjeros. CIS. Unidades dependientes | LOGP; RP |
| 36 | Tratamiento penitenciario (1): concepto, fines, principios. Clasificación en grados. Programas. Permisos de salida | LOGP Tít. IV; RP Tít. V |
| 37 | Tratamiento penitenciario (2): actividades educativas, culturales, deportivas. Formación, trabajo, empleo | LOGP; RP; EPPFETFE |
| 38 | Libertad condicional. Beneficios penitenciarios. Jueces de Vigilancia Penitenciaria | LOGP arts. 72-78; CP arts. 90-93 |
| 39 | Mujeres y personas trans en ámbito penitenciario. Igualdad y no discriminación. Programas específicos | LOGP; LO 3/2007; Instrucciones SGIP |
| 40 | Extranjeros en el sistema penitenciario. Marco normativo. Expulsión. Traslado | LO 4/2000 (LOEX); Ley 23/2014 |
| 41 | Internos con enfermedad mental. Drogodependientes. Programas de intervención | LOGP; RP; PNSD |
| 42 | Penas y medidas alternativas a prisión. TBC. Localización permanente. Suspensión y sustitución | CP; RD 840/2011 |
| 43 | Organización de centros penitenciarios: órganos colegiados y unipersonales | LOGP; RP Tít. IX; RD 1201/1981 |
| 44 | Procedimiento disciplinario penitenciario: faltas, sanciones, ejecución, cancelación | LOGP Tít. IV Cap. IV; RP Tít. X |
| 45 | Régimen económico de los establecimientos penitenciarios | RP Tít. XI; LGP |
| 46 | Protección de datos en IIPP. Registro y gestión de información penitenciaria | LOPDGDD; RGPD; SIP-SP |
| 47 | Prevención de suicidios en centros penitenciarios. Protocolos ante riesgo vital | Instrucciones SGIP; Protocolo PAS |

**Bloque IV — Conducta Humana (3 temas)**

| # | Título | Fuente |
|---|--------|--------|
| 48 | Elementos de la conducta humana: estímulos/respuestas, refuerzo/castigo. Técnicas de evaluación. Observación, auto-registro, auto-informes | Bibliografía psicología (NO legislación BOE) |
| 49 | Organización social de la prisión: control formal/informal. Código del recluso. Subculturas carcelarias. Hacinamiento. Prisionización | Bibliografía psicología penitenciaria |
| 50 | Comportamiento social. Asertividad. Habilidades sociales. Programas de entrenamiento HHSS. Conducta adictiva en prisión | Bibliografía psicología |

> **Distribución de preguntas en exámenes recientes:**
> Derecho Penitenciario ~36% | Org. Estado/Admin ~35% | Derecho Penal ~20% | Conducta Humana ~9%
> → Priorizar free bank del Bloque III (penitenciario), luego I, luego II, luego IV.

### 2.2 Legislación — Scraping e ingesta

> Bloque I: mayoría ya ingestionada para AGE.
> Bloques II-III: legislación penal y penitenciaria NUEVA.
> Bloque IV: NO es legislación BOE — son conceptos de psicología. Requiere `conocimiento_tecnico`.

**Leyes YA ingestionadas (reutilizadas con re-tagging) ✅:**
- [x] Constitución Española 1978 — temas 1-6
- [x] Ley 39/2015 LPAC — temas 12-14
- [x] Ley 40/2015 LRJSP — temas 4, 12, 15
- [x] RDLeg 5/2015 TREBEP — temas 9-10
- [x] Ley 19/2013 Transparencia — tema 15
- [x] LO 3/2007 Igualdad — tema 17
- [x] LO 1/2004 Violencia de género — tema 17
- [x] Ley 9/2017 LCSP — tema 16
- [x] LECrim 1882 — tema 27
- [x] Ley 31/1995 PRL — tema 11

**Leyes NUEVAS scrapeadas e ingestionadas ✅ (2026-03-30):**
- [x] **LO 10/1995 Código Penal** — 746 artículos (completo) — BOE-A-1995-25444
  - CUBRE: temas 18-27 (~20% del examen)
- [x] **LO 1/1979 LOGP** — 86 artículos — BOE-A-1979-23708
  - CUBRE: temas 28-47 (core del ~36% más preguntado)
  - NOTA: requirió fix en scraper v2 para soportar numeración ordinal ("Artículo primero")
- [x] **RD 190/1996 Reglamento Penitenciario** — 317 artículos — BOE-A-1996-3307
  - CUBRE: temas 28-47 (complemento LOGP)
- [x] **RD 840/2011** Medidas alternativas — 31 artículos — temas 40, 42
- [x] **Ley 45/2015 Voluntariado** — 36 artículos — tema 17
- [x] **Ley 39/2006 Dependencia** — 76 artículos — tema 17
- [x] **Ley 53/1984 Incompatibilidades** — ya ingestionada — tema 9
- [ ] **RD 207/2024** Estructura orgánica Ministerio Interior — tema 7 (pendiente, no bloqueante)
- [ ] **RD 122/2015** Estatuto EPPFETFE — temas 7, 37 (pendiente, no bloqueante)
- [ ] **LO 4/2000 LOEX** Extranjería — tema 40 (pendiente, no bloqueante)
- [ ] **Ley 23/2014** Reconocimiento mutuo UE — temas 28, 40 (pendiente, no bloqueante)

**Contenido no legislativo (Bloque IV — Conducta Humana) ✅:**
- [x] Crear contenido en `conocimiento_tecnico` para temas 48-50 — 18 secciones con embeddings
  - T48: estímulos/respuestas, condicionamiento, refuerzo, técnicas evaluación (6 secciones)
  - T49: control formal/informal, código recluso, subculturas, hacinamiento, prisionización (6 secciones)
  - T50: asertividad, HHSS, programas EHS, conducta adictiva, intervención drogodependientes (6 secciones)
- [x] Migration 066 aplicada: bloque CHECK expandido para 'penitenciarias'
- [x] `pnpm ingest:penitenciarias` — 18/18 secciones insertadas con embeddings OpenAI

**Ingesta:**
- [x] Scrape 6 leyes (CP + LOGP + RP + RD840 + Voluntariado + Dependencia)
- [x] Ejecutar `pnpm ingest:legislacion` — todos los artículos upserted
- [x] Reglas de tagging en `tag-legislacion-temas.ts` para rama `penitenciarias`
- [x] Ejecutar `pnpm tag:legislacion --rama penitenciarias` — 10.092 artículos taggeados
- [x] Ingestar contenido_tecnico Bloque IV (temas 48-50) — 18 secciones
- [ ] Verificar cobertura: ≥1 artículo/sección por cada uno de los 50 temas

### 2.3 Free bank ✅ (2026-03-30)
- [x] Ejecutar `pnpm generate:free-bank --oposicion penitenciarias --user-id b55c400e-...`
- [x] 10 preguntas × 50 temas = **500 preguntas** — 50/50 temas completo
- [x] Verificado: pipeline RAG + verificación citas legales

### 2.4 Exámenes oficiales
- [x] Investigar disponibilidad: **~8 años** disponibles (2016-2025) en ACAIP, GoKoan, LusalPrisiones
  - OEP 2025 (18/01/2026): test + supuestos + plantilla definitiva ✅ — ACAIP
  - OEP 2024 (02/02/2025): test + supuestos + plantilla ✅ — ACAIP
  - OEP 2023 (04/02/2024): test + supuestos + plantilla ✅ — ACAIP
  - OEP 2021-2022 (27/11/2022): test + supuestos ✅ — ACAIP
  - OEP 2020, 2019, 2018, 2017, 2016: disponibles vía GoKoan/OpositaTest
- [x] Descargar cuadernillos IIPP 2025 + 2024 (ACAIP)
- [x] Parsear: 40 preguntas (2025, Vision) + 5 preguntas (2024, Vision parcial — PDF escaneado)
- [x] Ingestar: 45 preguntas oficiales en `examenes_oficiales` + `preguntas_oficiales`

### 2.5 Simulacro 2 partes (cuestionario + supuestos test) — funciona vía scoring_config
- [x] Ambos ejercicios son tipo test → patrón Auxilio Judicial (ya soportado)
- [x] scoring_config define 2 ejercicios: 120q/105min + 40q/80min
- [x] maxPuntuable: 120 + 40 = 160

### 2.6 Landing SEO ✅ (2026-03-30)
- [x] Crear `app/(marketing)/oposiciones/penitenciarias/page.tsx` — theme rose
- [x] Metadata SEO con keywords: "oposiciones prisiones 2026", "temario funcionario prisiones", "test ayudante instituciones penitenciarias", "sueldo funcionario prisiones"
- [x] Schema markup FAQPage + Course JSON-LD
- [x] Datos: 900 plazas, 50 temas, 200 preguntas, penalización -1/3
- [x] CTA registro con `?oposicion=penitenciarias`
- [x] openGraph.images
- [x] Actualizar `app/sitemap.ts`
- [x] Competidores: OpositaTest (~25-40€/mes), Academia de Prisiones (~50-100€/mes), MasterD (~150-250€/mes)
- [x] USP diferencial: preguntas verificadas contra BOE (LOGP, RP, CP) + Conducta Humana curada

### 2.7 Stripe (código ✅, productos Stripe pendientes Aritz)
- [x] Añadir en `lib/stripe/client.ts`:
  - `STRIPE_PRICES.pack_penitenciarias` → env var `STRIPE_PRICE_PACK_PENITENCIARIAS`
  - `CORRECTIONS_GRANTED.pack_penitenciarias = 20` (sin supuesto_practico → estándar)
  - `TIER_TO_OPOSICION.pack_penitenciarias = 'f1000000-0000-0000-0000-000000000001'`
  - `TIER_TO_DB_TIPO.pack_penitenciarias = 'pack_oposicion'`
- [x] Añadir `'pack_penitenciarias'` al z.enum del checkout `BodySchema`
- [x] Crear producto Stripe "Pack Penitenciarias 49,99€" — ✅ Aritz 2026-03-30
- [x] Añadir env var `STRIPE_PRICE_PACK_PENITENCIARIAS` — ✅ Aritz 2026-03-30

### 2.8 Activación ✅ (2026-03-30)
- [x] Verificar: free bank 50/50 temas ✅
- [x] Verificar: legislación indexada ✅ (~10K artículos)
- [x] Verificar: scoring_config 120q + 40q, -1/3 ✅
- [x] Stripe productos creados ✅
- [x] **MANUAL Aritz**: `UPDATE oposiciones SET activa = true` — ✅ 2026-03-30
- [ ] Smoke test E2E: registro → test → simulacro → pago

### 2.9 Blog SEO Penitenciarias
- [x] Post: "Test Instituciones Penitenciarias 2026 — preguntas tipo examen"
- [x] Post: "Temario Ayudantes Penitenciarias 2026 — 50 temas completos"
- [x] Post: "Notas de corte Penitenciarias — histórico"
- [x] Post: "Cómo aprobar Penitenciarias — estrategia por bloques"

---

## FASE 3 — Transversales (tras activar ambas)

### 3.1 Landing principal
- [x] Añadir cards Hacienda y Penitenciarias en sección "¿Qué oposición preparas?"
- [x] Actualizar sección exámenes oficiales con nuevas ramas
- [x] Actualizar FAQ global — 2 nuevas preguntas Hacienda + IIPP

### 3.2 SEO transversal
- [x] Actualizar `llms.txt` con nuevas oposiciones
- [ ] Internal linking entre blogs de distintas ramas
- [ ] Posts comparativos: "OpoRuta vs OpositaTest para Hacienda/IIPP"

### 3.3 Registro dinámico
- [ ] Verificar que ambas aparecen en `/register` agrupadas por rama
- [ ] Verificar orden: AGE → Justicia → Correos → Hacienda → Penitenciarias

---

## Checklist de activación (usar para CADA oposición)

> Copiar y rellenar antes de poner `activa=true`. Aprendido de Correos + Justicia.

### Pre-requisitos (sin esto NO activar)
- [x] Migration aplicada en Supabase remoto (064 + 065 + 066)
- [x] Legislación taggeada: hacienda ~10.000 art., penitenciarias ~10.000 art.
- [x] Free bank completo: Hacienda 32/32, Penitenciarias 50/50
- [x] Stripe producto creado + env var en Vercel — ✅ Aritz
- [x] `lib/stripe/client.ts` actualizado

### Smoke test (en local o preview)
- [ ] Registro con `?oposicion=slug` → aparece en ProfileForm
- [ ] Test tema X → genera preguntas → scoring correcto (penalización correcta)
- [ ] Simulacro → timer proporcional → desglose por ejercicio
- [ ] Stripe checkout → webhook → créditos asignados
- [ ] Dashboard muestra datos de la nueva oposición

### Post-activación
- [x] `UPDATE oposiciones SET activa = true WHERE slug = '...'`
- [x] Landing page muestra la nueva oposición
- [x] Blog posts publicados — 108 total
- [x] sitemap.ts actualizado
- [x] llms.txt actualizado

### Gotchas conocidas (evitar repetir)
1. **maxPuntuable**: se calcula desde scoring_config, nunca hardcodear
2. **penalización -1/4 vs -1/3**: almacenar ratio_penalizacion en scoring_config
3. **Temas compartidos**: insertar por separado (cada oposicion_id tiene sus temas). Tagging crea tema_ids para todas
4. **generate:free-bank requiere admin user_id**: FK constraint en tests_generados
5. **Slug único global**: verificar antes de crear migration
6. **Bloque IV (Conducta Humana)**: NO funciona con pipeline BOE → usar conocimiento_tecnico
7. **Ambos ejercicios son TEST**: ni Hacienda ni Penitenciarias tienen desarrollo escrito → `supuesto_practico: false`

---

## Estimación de esfuerzo

| Tarea | Hacienda | Penitenciarias |
|-------|----------|----------------|
| Migration + temas | 30 min | 30 min |
| Scrape legislación nueva | 2-3h (LGT, IRPF, IVA, IS, IIEE, reglamentos) | 2-3h (CP parcial, LOGP, RP, LOEX) |
| Re-tagging legislación existente | 30 min | 30 min |
| Free bank (320 preguntas) | 1-2h | 2-3h (500 preguntas, 50 temas) |
| Exámenes oficiales | 1-2h (si disponibles) | 1-2h (si disponibles) |
| Conocimiento técnico Bloque IV | N/A | 1-2h (temas 48-50) |
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
| Ley IIEE consolidada | https://www.boe.es/buscar/act.php?id=BOE-A-1992-28741 |
| BOE Penitenciarias convocatoria | https://www.boe.es/boe/dias/2025/10/09/pdfs/BOE-A-2025-20101.pdf |
| LOGP consolidada | https://www.boe.es/buscar/act.php?id=BOE-A-1979-23708 |
| Reglamento Penitenciario | https://www.boe.es/buscar/act.php?id=BOE-A-1996-3307 |
| Código Penal consolidado | https://www.boe.es/buscar/act.php?id=BOE-A-1995-25444 |
| LOEX consolidada | https://www.boe.es/buscar/act.php?id=BOE-A-2000-544 |
| Ministerio Interior IIPP | https://www.interior.gob.es/opencms/gl/servicios-al-ciudadano/empleo-publico/oposiciones/cuerpos-de-instituciones-penitenciarias/ |
| FuncionarioPrisiones.com | https://funcionarioprisiones.com/temario/ |
