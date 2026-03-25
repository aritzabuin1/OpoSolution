# Plan2: Expansión OpoRuta — Correos + Justicia

## 🔴 REGLAS CRÍTICAS — LEER ANTES DE HACER NADA

1. **La app actual NO se toca** hasta que Correos y Justicia estén 100% activas.
   - La landing page, el pricing inline, la navegación → TODO queda intacto.
   - Solo se trabaja en código nuevo (migrations, sub-landings, contenido, scoring engine).
   - La página /precios existe pero NO se enlaza desde ningún sitio hasta el lanzamiento.
2. **Seguir las fases EN ORDEN**: FASE 0 → FASE 1 → FASE 2 → FASE S.
   - No saltar a FASE S (landing multi-rama) antes de tener el contenido listo.
3. **Cada tarea se marca [x] SOLO cuando el código está en el repo** (committed o en archivos locales verificados).
   - No marcar tareas como completadas si no se ha verificado que el código existe.
4. **Sub-landings SEO son independientes** — se pueden crear porque no afectan la app actual.
5. **Al empezar una sesión nueva**: leer este plan, verificar qué hay realmente en el código, y continuar desde donde se dejó.

---

## Pricing

| Pack | AGE | Justicia | Correos |
|------|-----|----------|---------|
| Individual C2/IV | 49.99€ | 49.99€ | 49.99€ |
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
- [x] `lib/utils/oposicion-labels.ts`: eliminar mapa estático, query DB (async + cache 5min)
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
- [x] `lib/stripe/client.ts`: TIER_TO_OPOSICION con arrays para combos (genérico)
- [x] Añadir tiers: pack_correos, pack_auxilio, pack_tramitacion, pack_gestion_j, pack_doble_justicia, pack_triple_justicia
- [x] Configurar CORRECTIONS_GRANTED y SUPUESTOS_GRANTED para cada tier
- [x] `app/api/stripe/checkout/route.ts`: BodySchema expandido con 6 nuevos tiers
- [x] `app/api/stripe/webhook/route.ts`: refactorizado — handler genérico de combos (N filas compras)
- [ ] Crear 6 productos en Stripe Dashboard (Correos + 5 Justicia) **← ARITZ manual**
- [ ] Añadir 6 env vars STRIPE_PRICE_PACK_* en Vercel **← ARITZ manual**

---

## FASE 1 — Correos

### 1.1 Migration: oposición + temas
- [x] Crear `supabase/migrations/20260326_048_correos.sql`
- [x] INSERT oposiciones: id=d0000000..., slug='correos', rama='correos', nivel='IV', activa=false
- [x] features: {"psicotecnicos": true, "cazatrampas": true, "supuesto_practico": false, "ofimatica": false}
- [x] scoring_config con sistema concurso-oposición (60pts exam + 40pts méritos)
- [ ] INSERT 12 temas (VERIFICADO — temario oficial 2023, confirmado 8+ fuentes):
  - T1: Marco normativo postal y naturaleza jurídica. Organismos reguladores.
  - T2: Experiencia de personas en Correos. Diversidad, Igualdad, PRL, RSC, ODS.
  - T3: Paquetería de Correos y Correos Express. E-commerce y Citypaq.
  - T4: Productos y servicios en Oficinas. Servicios Financieros. Soluciones Digitales. Filatelia.
  - T5: Nuevas líneas de negocio: Correos Logística. Correos Frío.
  - T6: Herramientas (IRIS, SGIE, PDA, SICER). Funciones y utilidad.
  - T7: Procesos operativos I: Admisión.
  - T8: Procesos operativos II: Tratamiento y Transporte.
  - T9: Procesos operativos III: Distribución y Entrega.
  - T10: El cliente: Atención al cliente y calidad. Protocolos de Ventas.
  - T11: Internacionalización y Aduanas.
  - T12: Normas de cumplimiento: Protección de datos, Blanqueo de Capitales, Ciberseguridad.

### 1.2 Contenido Correos
- [x] Scrapear legislación:
  - [x] Ley 43/2010 del servicio postal universal (88 entries, 68KB)
  - [x] RD 437/2024 Reglamento servicios postales (63 entries, 84KB)
  - [x] LOPDGDD — ya en BD de AGE
  - [x] LO 3/2007 Igualdad — ya en BD de AGE
  - [x] Ley 31/1995 PRL (79 entries, 144KB)
  - [x] Ley 10/2010 blanqueo capitales (94 entries, 236KB)
- [x] Mapeo tema↔legislación (data/mapeo_temas_legislacion_correos.json)
- [ ] Indexar legislación en tabla `legislacion` (ejecutar `pnpm ingest:legislacion`) **← necesita migrations aplicadas**
- [ ] Tagear artículos con tema_ids de Correos **← después de indexar**
- [ ] Generar free bank: `pnpm generate:free-bank --oposicion correos` **← necesita legislación indexada**
- [ ] Descargar exámenes 2023+2021 (13 PDFs) **← agente en curso**
- [ ] Parsear PDFs e insertar en preguntas_oficiales **← necesita PDFs descargados**

### 1.3 Landing SEO Correos
- [x] Crear `app/(marketing)/oposiciones/correos/page.tsx` (temario oficial verificado, scoring, FAQ)
- [x] Metadata SEO + Schema markup FAQPage + Course
- [x] CTA registro con `?oposicion=correos`
- [x] Actualizar `app/sitemap.ts` con nueva ruta
- [x] 8 blog posts SEO Correos (guías + long-tail)

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
  - Temas verificados del Anexo VI.c BOE-A-2025-27053 (ver data/research-auxilio-judicial-2026.md)
  - scoring_config: Ej1 (test 100q/100min, +0.60/-0.15 **ratio 1/4**, max 60, min 30) + Ej2 (práctico 42q/60min, +1.00/-0.25 **ratio 1/4**, max 40, min 20)
  - **PENALIZACIÓN JUSTICIA = 1/4 (no 1/3 como AGE)**
- [x] INSERT Tramitación Procesal C1: 37 temas, rama='justicia', nivel='C1', activa=false
  - Temas verificados del Anexo VI.b (ver data/research-tramitacion-gestion-2026.md)
  - scoring_config: Ej1 (test 104q/100min, +0.60/-0.15, 1/4) + Ej2 (práctico 12q/30min, +2.00/-0.50, 1/4) + Ej3 (ofimática 24q/40min, +1.00/-0.25, 1/4)
  - features: ofimatica=true
- [x] INSERT Gestión Procesal A2: 68 temas (16 org insertados, 52 procesal pendientes), rama='justicia', nivel='A2', activa=false
  - Temas verificados del Anexo VI.a (ver data/research-tramitacion-gestion-2026.md)
  - scoring_config: Ej1 (test 104q/100min, +0.60/-0.15, 1/4) + Ej2 (práctico 12q/30min, +1.50/-0.30, **ratio 1/5**) + Ej3 (desarrollo 5q/45min, tribunal-graded, max 25, min 12.5)
  - features: supuesto_practico=true
  - **NOTA: Ej2 de Gestión tiene ratio 1/5 (anomalía respecto a otros cuerpos que son 1/4)**

### 2.2 Contenido Justicia — Legislación
- [x] Scrape BOE consolidado:
  - [x] Constitución Española — ya en BD (184 arts)
  - [x] LO 6/1985 LOPJ parcial — ya en BD (728 arts, Libros I-III). **Scraping completo en curso**
  - [x] **LO 1/2025 Servicio Público Justicia** — scrapeada (86 entries, 891KB) ← CRÍTICA
  - [x] Ley 1/2000 LEC — scrapeada COMPLETA (905 arts, 1.3MB)
  - [x] LECrim 1882 — scrapeada COMPLETA (1067 arts, 852KB)
  - [x] TREBEP — ya en BD (136 arts)
  - [x] LO 3/2007, LO 1/2004, Ley 15/2022, Ley 4/2023 — ya en BD
  - [x] Ley 31/1995 PRL — scrapeada (79 entries, 144KB)
- [x] Mapeo tema↔legislación para Auxilio (data/mapeo_temas_legislacion_auxilio.json)
- [ ] Mapeo tema↔legislación para Tramitación y Gestión **← pendiente**
- [ ] Indexar legislación nueva en tabla `legislacion` **← necesita migrations aplicadas**
- [ ] Tagear artículos con tema_ids Justicia **← después de indexar**
- [ ] Verificar temas ACTUALIZADOS LO 1/2025: T8, T10, T16, T18
- **Leyes pendientes de scrapear**: LJCA (Ley 29/1998), LRJS (Ley 36/2011), Ley 20/2011 Registro Civil

### 2.3 Contenido Justicia — Exámenes oficiales
- [ ] Descargar cuadernillos + plantillas MJU **← agente en curso (~20 PDFs)**
  - Auxilio OEP 2024 (27/09/2025): Ej1 A/B + Ej2 A/B + plantillas
  - Tramitación OEP 2024: Ej1 A/B + Ej2 A/B + plantilla
  - Gestión OEP 2024: Ej1 A/B + Ej2 + plantillas
- [ ] Parsear PDFs con execution/parse-exam-pdf.ts
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
- [x] Hub: `app/(marketing)/oposiciones/justicia/page.tsx` (auditada, plazas correctas)
- [x] Sub: `app/(marketing)/oposiciones/justicia/auxilio-judicial/page.tsx` (26 temas BOE, scoring 1/4)
- [x] Sub: `app/(marketing)/oposiciones/justicia/tramitacion-procesal/page.tsx` (37 temas, 3 ej.)
- [x] Sub: `app/(marketing)/oposiciones/justicia/gestion-procesal/page.tsx` (68 temas, bloques correctos)
- [ ] Calculadora nota Justicia (por ejercicio, con penalización 1/4)
- [x] Blog: 15 posts Justicia (guías + long-tail + comparativas)
- [x] Actualizar sitemap.ts

### 2.7 Activación progresiva Justicia
- [ ] Fase 2a: Activar Auxilio C2 (26 temas, ~24k inscritos)
- [ ] Fase 2b: Activar Tramitación C1 (37 temas, ~30k inscritos)
- [ ] Fase 2c: Activar Gestión A2 (68 temas, necesita corrección IA desarrollo)

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
- [ ] `app/(marketing)/page.tsx`: rediseñar hero para multi-rama
- [ ] Hero: "Prepara tu oposición con IA" (genérico, no solo AGE)
- [ ] Sección "¿Qué oposición preparas?" con cards por rama:
  - Card AGE: "Administración del Estado" · C2+C1+A2 · X plazas · activa → CTA "Empieza gratis"
  - Card Justicia: "Justicia" · Auxilio+Tramitación · X plazas · Próximamente/activa
  - Card Correos: "Correos" · 4.055 plazas · Próximamente/activa
- [ ] Cards inactivas: opacity-60, badge "Próximamente · Examen [fecha]"
- [ ] Botón "Avísame cuando esté disponible" en cards inactivas (captura email)
- [ ] Mantener secciones genéricas: features, social proof, FAQ global, testimonios
- [ ] Mover pricing detallado a /precios (no saturar landing)

### S.3 Pricing page dedicada (/precios)
- [ ] Crear `app/(marketing)/precios/page.tsx`
- [ ] Tabs por rama: [Administración] [Justicia] [Correos]
- [ ] Al seleccionar tab, muestra SOLO los packs de esa rama:
  - AGE: Individual C2 49.99€, Individual C1 49.99€, A2 69.99€, Doble 79.99€, Triple 129.99€
  - Justicia: Individual Auxilio 49.99€, Tramitación 49.99€, Gestión 79.99€, Doble 79.99€, Triple 139.99€
  - Correos: Pack Correos 39.99€ (único)
- [ ] Tabla comparativa free vs premium (genérica, aplica a todas)
- [ ] FAQ pricing: "¿Puedo cambiar de oposición?", "¿Es pago único?", "¿Qué incluye?"
- [ ] Schema markup Product + Offer
- [ ] Ramas inactivas: tab visible pero pricing dice "Próximamente"

### S.4 Sub-landings por rama (SEO critical)
- [ ] `app/(marketing)/oposiciones/administracion/page.tsx` — ya parcialmente existe, refactorizar
- [x] `app/(marketing)/oposiciones/correos/page.tsx` — NUEVA
- [x] `app/(marketing)/oposiciones/justicia/page.tsx` — NUEVA (hub)
- [x] `app/(marketing)/oposiciones/justicia/auxilio-judicial/page.tsx` — NUEVA
- [x] `app/(marketing)/oposiciones/justicia/tramitacion-procesal/page.tsx` — NUEVA
- [x] `app/(marketing)/oposiciones/justicia/gestion-procesal/page.tsx` — NUEVA

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

### S.6 Blog SEO — Calendario de publicación
- [x] Semana 1-2 (quick wins):
  - "Cambios temario Justicia 2026: LO 1/2025 explicada"
  - "Auxilio Judicial vs Tramitación Procesal: ¿cuál elegir?"
  - "Examen Correos 2026: guía completa (temario, scoring, plazas)"
- [x] Semana 3-4 (pilares):
  - "Guía completa Auxilio Judicial 2026" (3000+ palabras, pilar)
  - "Guía completa Tramitación Procesal 2026" (pilar)
  - "Test Correos online gratis: practica con preguntas reales"
  - "Temario Correos 2026: los 12 temas explicados"
  - "Gestión Procesal A2 2026: la oposición más completa de Justicia"
- [ ] Semana 5-8 (long-tail):
  - "Test auxilio judicial tema 1 constitución"
  - "Simulacro tramitación procesal online"
  - "Cuántos temas tiene auxilio judicial 2026"
  - "Mejor app test auxilio judicial" (vs OpositaTest, GoKoan)
  - "Temario auxilio judicial actualizado LO 1/2025"
- [ ] Cada artículo: metadata SEO, FAQPage schema, internal links a sub-landing y registro
- [ ] Actualizar `app/sitemap.ts` con todas las nuevas rutas

### S.7 Captura "Avísame" para próximamente
- [ ] Crear tabla `waitlist` (email, oposicion_slug, created_at)
- [ ] API route `POST /api/waitlist` (rate-limited, email validation)
- [ ] Al activar una oposición: enviar email masivo a waitlist de esa oposición
- [ ] GDPR: opt-in explícito, enlace baja

### S.8 Sitemap + robots + SEO técnico
- [x] Actualizar `app/sitemap.ts` con todas las nuevas rutas
- [x] Actualizar `app/robots.ts` para permitir indexación de /oposiciones/*
- [x] `public/llms.txt` y `public/llms-full.txt`: añadir info Correos + Justicia
- [ ] Open Graph images dinámicas por oposición

---

## Verificación final

### Funcional
- [ ] Landing: Ve ramas AGE (CTA) + Correos/Justicia (Próximamente con datos + "Avísame")
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
