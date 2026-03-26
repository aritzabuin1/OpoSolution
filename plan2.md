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
