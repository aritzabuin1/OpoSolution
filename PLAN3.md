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

> **1.000 plazas libre** (OEP 2025, BOE 30/12/2025). Histórico: 2024=851, 2023=700, 2022=550.
> Convocatoria anual, examen típicamente en marzo. Próxima previsible ~marzo 2027.
> Sueldo: ~22.000-24.000€ bruto/año inicial. Ratio ~10-12 opositores/plaza.

### 1.0 Datos del examen

| Campo | Valor |
|-------|-------|
| Cuerpo | Cuerpo General Administrativo AGE, especialidad Agentes Hacienda Pública |
| Subgrupo | C1 |
| Temas | 32 (7 org. estado + 5 dcho. admin. + 20 hacienda/tributario) |
| Ejercicio 1 | **80 preguntas test**, 4 opciones, **90 min**. Penalización **-1/4**. Escala 0-10, mín 5 |
| Ejercicio 2 | **10 supuestos prácticos tipo TEST** (solo Bloque III). Escala 0-10, mín 5 |
| Nota final | Suma ejercicios (máx 20 pts). Desempate: 2º ejercicio |
| Conservación | Se conserva 1er ejercicio aprobado para la convocatoria siguiente |

> **IMPORTANTE conv. 2025-2026**: El 2º ejercicio es **tipo test** (NO desarrollo escrito).
> Cambio respecto a anterior: de 100 a 80 preguntas, tiempo 1h40→1h30. Se eliminó formato desarrollo.
> Esto significa: `features.supuesto_practico = false`. Ambos ejercicios se implementan como simulacro multi-parte (patrón Auxilio Judicial).

### 1.1 Migration: oposición + temas
- [ ] Crear `supabase/migrations/20260401_070_hacienda.sql`
- [ ] INSERT oposiciones con UPSERT (ON CONFLICT (id) DO UPDATE):
  - id: `'f0000000-0000-0000-0000-000000000001'`
  - slug: `'hacienda-aeat'`, rama: `'hacienda'`, nivel: `'C1'`, activa: `false`
  - plazas: 1000, fecha_examen_aprox: `'2027-03-01'`
  - features: `{"psicotecnicos": false, "cazatrampas": true, "supuesto_practico": false, "ofimatica": false}`
  - **NOTA**: `supuesto_practico: false` porque el 2º ejercicio es tipo TEST, no desarrollo escrito
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
- [ ] INSERT 32 temas (ver §1.1.1)

#### 1.1.1 Temario completo (32 temas, 3 bloques)

> Fuente: BOE nº 313, 30/12/2025 (conv. 2025-2026). Cambios vs anterior: eliminados antiguos temas 5 y 18 (IRNR), unificados temas 4+5 anterior en nuevo 4.

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

**Leyes YA ingestionadas (reutilizar con re-tagging):**
- [ ] Constitución Española 1978 — temas 1-5
- [ ] Ley 39/2015 LPAC — temas 9-10
- [ ] Ley 40/2015 LRJSP — temas 4, 8, 12
- [ ] LO 3/2018 LOPDGDD + RGPD — tema 6
- [ ] LO 3/2007 Igualdad — tema 7
- [ ] LO 1/2004 Violencia de género — tema 7
- [ ] Ley 9/2017 LCSP — tema 11

**Leyes NUEVAS a scrapear:**
- [ ] **Ley 58/2003 LGT** (Ley General Tributaria) — ~250 artículos — BOE-A-2003-23186
  - CUBRE: temas 13-25 (>50% del examen). La ley más importante.
- [ ] **Ley 35/2006 IRPF** — ~100 artículos relevantes — BOE-A-2006-20764
  - CUBRE: temas 26-27
- [ ] **Ley 27/2014 Impuesto sobre Sociedades** — ~130 artículos — BOE-A-2014-12328
  - CUBRE: tema 28
- [ ] **Ley 37/1992 IVA** — ~170 artículos — BOE-A-1992-28740
  - CUBRE: temas 29-30
- [ ] **Ley 38/1992 Impuestos Especiales** — ~70 artículos — BOE-A-1992-28741
  - CUBRE: tema 31
- [ ] **Reglamento UE 952/2013 Código Aduanero** — extracto relevante (EUR-Lex, no BOE)
  - CUBRE: tema 32
- [ ] **RD 939/2005 Reglamento General de Recaudación** — temas 20-21
- [ ] **RD 1065/2007 Reglamento Gestión e Inspección** — temas 17-18, 22-23
- [ ] **RD 1619/2012 Reglamento de facturación** — tema 17

**Ingesta:**
- [ ] Scrape cada ley nueva con `execution/scrape-boe.ts`
- [ ] Ejecutar `pnpm ingest:legislacion` para upsert artículos
- [ ] Añadir reglas de tagging en `execution/tag-legislacion-temas.ts` para rama `hacienda`
- [ ] Ejecutar `pnpm tag:legislacion --rama hacienda --dry-run` → verificar 0 errores
- [ ] Ejecutar `pnpm tag:legislacion --rama hacienda`
- [ ] Verificar cobertura: ≥1 artículo taggeado por cada uno de los 32 temas

### 1.3 Free bank (preguntas deterministas sin IA)
- [ ] Ejecutar `pnpm generate:free-bank --oposicion hacienda-aeat --user-id <admin-uuid>`
- [ ] 10 preguntas × 32 temas = **320 preguntas**
- [ ] Verificar: 32/32 temas cubiertos, opciones correctas verificadas
- [ ] Coste estimado: ~€0.50 (one-time OpenAI)

### 1.4 Exámenes oficiales
- [ ] Investigar disponibilidad exámenes AEAT anteriores
  - Fuente: Sede AEAT → Empleo público → Convocatorias → Ejercicios anteriores
  - Fuente alternativa: Adams, OpositaTest, CEF
- [ ] Descargar cuadernillos + plantillas de respuestas
- [ ] Parsear con `pnpm parse:examenes --oposicion hacienda-aeat [año]`
- [ ] Ingestar en `examenes_oficiales` + `preguntas_oficiales`
- [ ] El ejercicio 2 (supuestos test) se ingesta como preguntas normales con flag `ejercicio=2`

### 1.5 Simulacro 2 partes (test + supuestos test)
- [ ] Ambos ejercicios son tipo test → patrón idéntico a Auxilio Judicial
- [ ] `generate-simulacro` ya soporta 2 ejercicios tipo test
- [ ] Timer: parte 1 = 90 min, parte 2 = 60 min (estimar, no especificado en conv.)
- [ ] Verificar que supuestos solo sacan preguntas de Bloque III (temas 13-32)
- [ ] **NO se necesita rúbrica supuesto AEAT** (todo es tipo test, no desarrollo)

### 1.6 Landing SEO
- [ ] Crear `app/(marketing)/oposiciones/hacienda/page.tsx`
- [ ] Metadata SEO con keywords: "oposiciones agente hacienda 2026", "temario agente hacienda", "test agente hacienda", "sueldo agente hacienda"
- [ ] Schema markup FAQPage
- [ ] Datos: 1.000 plazas, 32 temas, 2 ejercicios test, penalización -1/4
- [ ] CTA registro con `?oposicion=hacienda-aeat`
- [ ] openGraph.images con `/api/og?tipo=blog&tema=...`
- [ ] Actualizar `app/sitemap.ts`
- [ ] Competidores principales: OpositaTest (~25-40€/mes), Adams (~150-200€/mes), MAD, Supera Oposiciones
- [ ] USP diferencial: preguntas verificadas contra BOE (LGT, IRPF, IVA)

### 1.7 Stripe
- [ ] Añadir en `lib/stripe/client.ts`:
  - `STRIPE_PRICES.pack_hacienda` → env var `STRIPE_PRICE_PACK_HACIENDA`
  - `CORRECTIONS_GRANTED.pack_hacienda = 20` (sin supuesto_practico → estándar)
  - `TIER_TO_OPOSICION.pack_hacienda = 'f0000000-0000-0000-0000-000000000001'`
  - `TIER_TO_DB_TIPO.pack_hacienda = 'pack_oposicion'`
- [ ] Añadir `'pack_hacienda'` al z.enum del checkout `BodySchema`
- [ ] Crear producto Stripe "Pack Hacienda 49,99€" en Dashboard — **MANUAL Aritz**
- [ ] Añadir env var `STRIPE_PRICE_PACK_HACIENDA` en Vercel — **MANUAL Aritz**

### 1.8 Activación
- [ ] Verificar: free bank 32/32 temas completo
- [ ] Verificar: legislación indexada (LGT + IRPF + IVA + IS + IIEE + reglamentos)
- [ ] Verificar: registro dinámico muestra Hacienda
- [ ] Verificar: scoring con penalización -1/4 funciona en ambos ejercicios
- [ ] Verificar: simulacro 2 partes tipo test funciona
- [ ] Stripe checkout → webhook → créditos asignados
- [ ] **MANUAL Aritz**: `UPDATE oposiciones SET activa = true WHERE slug = 'hacienda-aeat'`
- [ ] Deploy y smoke test: registro → test tema 15 (LGT) → simulacro

### 1.9 Blog SEO Hacienda
- [ ] Post: "Test Agentes Hacienda Pública 2026 — preguntas tipo examen"
- [ ] Post: "Temario Agentes Hacienda 2026 — 32 temas completos"
- [ ] Post: "Notas de corte Agentes Hacienda — histórico y predicción"
- [ ] Post: "Cómo aprobar Agentes Hacienda — estrategia Bloque III (LGT)"
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
| Ejercicio 1 | **150 preguntas test** + reserva, 4 opciones. Penalización **-1/3**. Escala 0-30, mín 15 |
| Ejercicio 2 | **10 supuestos × 5 preguntas test = 50 preguntas**. Penalización -1/3. Escala 0-20, mín 10 |
| Ejercicio 3 | Reconocimiento médico (Apto/No apto) — NO implementar en OpoRuta |
| Nota final | Ej1 + Ej2 = máx 50 pts. Desempate: 2º ejercicio |
| Post-aprobado | Período de prácticas: 12 meses (formación + centro penitenciario) |

### 2.1 Migration: oposición + temas
- [ ] Crear `supabase/migrations/20260401_071_penitenciarias.sql`
- [ ] INSERT oposiciones con UPSERT (ON CONFLICT (id) DO UPDATE):
  - id: `'g0000000-0000-0000-0000-000000000001'`
  - slug: `'penitenciarias'`, rama: `'penitenciarias'`, nivel: `'C1'`, activa: `false`
  - plazas: 900, fecha_examen_aprox: `'2027-01-15'`
  - features: `{"psicotecnicos": false, "cazatrampas": true, "supuesto_practico": false, "ofimatica": false}`
  - NOTA: supuestos son tipo TEST (50 preguntas), no desarrollo → `supuesto_practico: false`. Patrón Auxilio Judicial.
- [ ] scoring_config:
  ```json
  {
    "ejercicios": [
      {
        "nombre": "Cuestionario",
        "preguntas": 150,
        "reserva": 10,
        "minutos": 120,
        "acierto": 0.20,
        "error": 0.0667,
        "max": 30,
        "min_aprobado": 15,
        "penaliza": true,
        "ratio_penalizacion": "1/3"
      },
      {
        "nombre": "Supuestos prácticos",
        "preguntas": 50,
        "reserva": 0,
        "minutos": 75,
        "acierto": 0.40,
        "error": 0.1333,
        "max": 20,
        "min_aprobado": 10,
        "penaliza": true,
        "ratio_penalizacion": "1/3"
      }
    ]
  }
  ```
  - NOTA: duración no especificada en convocatoria → estimar 120+75 min (similar a proporcional)
- [ ] INSERT 50 temas (ver §2.1.1)

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

**Leyes YA ingestionadas (reutilizar con re-tagging):**
- [ ] Constitución Española 1978 — temas 1-6
- [ ] Ley 39/2015 LPAC — temas 13-14
- [ ] Ley 40/2015 LRJSP — temas 4, 12, 15
- [ ] RDLeg 5/2015 TREBEP — temas 9-10
- [ ] Ley 19/2013 Transparencia — tema 15
- [ ] LO 3/2007 Igualdad — tema 17
- [ ] LO 1/2004 Violencia de género — tema 17
- [ ] Ley 4/2023 LGTBI — tema 17
- [ ] Ley 9/2017 LCSP — tema 16
- [ ] LECrim 1882 — tema 27 (ya ingestionada para Justicia)
- [ ] LO 3/2018 LOPDGDD — tema 46
- [ ] Ley 31/1995 PRL — tema 11 (ya ingestionada para Correos)

**Leyes NUEVAS a scrapear:**
- [ ] **LO 10/1995 Código Penal** — Libro I completo + títulos relevantes Libro II — BOE-A-1995-25444
  - CUBRE: temas 18-27 (~20% del examen)
  - NOTA: ley extensa. Scrapear selectivamente: Tít. Prelim, Libro I, Libro II títulos I (homicidio), III (lesiones), VI (libertad), VII (torturas), VIII (libertad sexual), X (honor), XIII (patrimonio), XVIII (falsedades), XIX (Admón. Pública), XX (Admón. Justicia)
- [ ] **LO 1/1979 LOGP** (Ley Orgánica General Penitenciaria) — 80 artículos — BOE-A-1979-23708
  - CUBRE: temas 28-47 (core del ~36% más preguntado)
- [ ] **RD 190/1996 Reglamento Penitenciario** — 325 artículos — BOE-A-1996-3307
  - CUBRE: temas 28-47 (complemento LOGP)
- [ ] **RD 840/2011** Medidas alternativas y libertad condicional — BOE-A-2011-10598
  - CUBRE: tema 42
- [ ] **Ley 45/2015 Voluntariado** — ~30 artículos — BOE-A-2015-11072
  - CUBRE: tema 17
- [ ] **Ley 39/2006 Dependencia** — BOE-A-2006-21990
  - CUBRE: tema 17
- [ ] **RD 207/2024** Estructura orgánica Ministerio Interior — extracto SGIP
  - CUBRE: tema 7
- [ ] **RD 122/2015** Estatuto EPPFETFE (entidad trabajo penitenciario)
  - CUBRE: temas 7, 37
- [ ] **LO 4/2000 LOEX** (Extranjería) — extracto relevante
  - CUBRE: tema 40
- [ ] **Ley 23/2014** Reconocimiento mutuo resoluciones penales UE
  - CUBRE: temas 28, 40
- [ ] **Ley 53/1984 Incompatibilidades** — tema 9
- [ ] **Ley 47/2003 LGP** (Ley General Presupuestaria) — tema 16
- [ ] **LO 2/2012 Estabilidad Presupuestaria** — tema 16
- [ ] (Opcional) **Ley 50/1997 Ley del Gobierno** — tema 4
- [ ] (Opcional) **RD 1201/1981** Organización centros penitenciarios — temas 8, 43

**Contenido no legislativo (Bloque IV — Conducta Humana):**
- [ ] Crear contenido en `conocimiento_tecnico` para temas 48-50 (bloque='penitenciarias')
  - Fuentes: manuales psicología penitenciaria, documentos SGIP, temarios públicos
  - Similar a como se hizo con contenido operativo Correos (93 secciones)
  - **Oportunidad de diferenciación**: ningún competidor genera bien este bloque con IA

**Ingesta:**
- [ ] Scrape cada ley nueva con `execution/scrape-boe.ts`
- [ ] Ejecutar `pnpm ingest:legislacion` para upsert
- [ ] Añadir reglas de tagging en `execution/tag-legislacion-temas.ts` para rama `penitenciarias`
- [ ] Ejecutar `pnpm tag:legislacion --rama penitenciarias --dry-run` → verificar 0 errores
- [ ] Ejecutar `pnpm tag:legislacion --rama penitenciarias`
- [ ] Ingestar contenido_tecnico Bloque IV
- [ ] Verificar cobertura: ≥1 artículo/sección por cada uno de los 50 temas

### 2.3 Free bank
- [ ] Ejecutar `pnpm generate:free-bank --oposicion penitenciarias --user-id <admin-uuid>`
- [ ] 10 preguntas × 50 temas = **500 preguntas**
- [ ] Priorizar por peso: Bloque III (36%) → Bloque I (35%) → Bloque II (20%) → Bloque IV (9%)
- [ ] Verificar: 50/50 temas cubiertos
- [ ] Coste estimado: ~€0.80 (one-time OpenAI)

### 2.4 Exámenes oficiales
- [ ] Investigar disponibilidad exámenes IIPP anteriores
  - Fuente: Ministerio Interior → Empleo público → IIPP
  - Fuente alternativa: funcionarioprisiones.com, Adams, OpositaTest
- [ ] Descargar cuadernillos + plantillas (2025, 2024, 2023...)
- [ ] Parsear con `pnpm parse:examenes --oposicion penitenciarias [año]`
- [ ] Ingestar en `examenes_oficiales` + `preguntas_oficiales`
- [ ] El ejercicio 2 (supuestos test) se ingesta como preguntas normales con flag `ejercicio=2`

### 2.5 Simulacro 2 partes (cuestionario + supuestos test)
- [ ] Ambos ejercicios son tipo test → patrón Auxilio Judicial
- [ ] `generate-simulacro` ya soporta 2 ejercicios tipo test
- [ ] Timer: parte 1 = ~120 min (150 preguntas), parte 2 = ~75 min (50 preguntas)
- [ ] maxPuntuable: 150 + 50 = 200

### 2.6 Landing SEO
- [ ] Crear `app/(marketing)/oposiciones/penitenciarias/page.tsx`
- [ ] Metadata SEO con keywords: "oposiciones prisiones 2026", "temario funcionario prisiones", "test ayudante instituciones penitenciarias", "sueldo funcionario prisiones"
- [ ] Schema markup FAQPage
- [ ] Datos: 900 plazas, 50 temas, 200 preguntas, penalización -1/3
- [ ] CTA registro con `?oposicion=penitenciarias`
- [ ] openGraph.images
- [ ] Actualizar `app/sitemap.ts`
- [ ] Competidores: OpositaTest (~25-40€/mes), Academia de Prisiones (~50-100€/mes), MasterD (~150-250€/mes)
- [ ] USP diferencial: preguntas verificadas contra BOE (LOGP, RP, CP) + Conducta Humana curada

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
- [ ] Verificar: simulacro 2 partes funciona (150q + 50q)
- [ ] Stripe checkout → webhook → créditos
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
- [ ] Posts comparativos: "OpoRuta vs OpositaTest para Hacienda/IIPP"

### 3.3 Registro dinámico
- [ ] Verificar que ambas aparecen en `/register` agrupadas por rama
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
- [ ] Stripe checkout → webhook → créditos asignados
- [ ] Dashboard muestra datos de la nueva oposición

### Post-activación
- [ ] `UPDATE oposiciones SET activa = true WHERE slug = '...'`
- [ ] Landing page muestra la nueva oposición
- [ ] Blog posts publicados
- [ ] sitemap.ts actualizado
- [ ] llms.txt actualizado

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
