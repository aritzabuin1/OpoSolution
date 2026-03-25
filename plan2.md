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
- [ ] Crear `supabase/migrations/20260326_047_rama_scoring.sql`
- [ ] ALTER TABLE oposiciones ADD COLUMN rama TEXT
- [ ] ALTER TABLE oposiciones ADD COLUMN scoring_config JSONB
- [ ] ALTER TABLE oposiciones ADD COLUMN nivel TEXT
- [ ] ALTER TABLE oposiciones ADD COLUMN orden INT DEFAULT 0
- [ ] ALTER TABLE oposiciones ADD COLUMN plazas INT
- [ ] ALTER TABLE oposiciones ADD COLUMN fecha_examen_aprox DATE
- [ ] Backfill C2 Auxiliar AGE: rama='age', nivel='C2', orden=1, scoring_config con penaliza=true, error_factor=0.333
- [ ] Backfill C1 Admin AGE: rama='age', nivel='C1', orden=2, scoring_config
- [ ] Backfill A2 Gestión AGE: rama='age', nivel='A2', orden=3, scoring_config

### 0.2 Registro dinámico — eliminar arrays hardcoded
- [ ] `app/(auth)/register/page.tsx`: convertir OPOSICIONES[] a query `SELECT FROM oposiciones ORDER BY rama, orden`
- [ ] Crear Client Component `RegisterForm.tsx` que recibe oposiciones como prop
- [ ] Agrupar por rama con headers ("Administración del Estado", "Justicia", "Correos")
- [ ] `activa=false` → badge "Próximamente", no seleccionable (disabled + opacity)
- [ ] `activa=true` → seleccionable como ahora
- [ ] `components/cuenta/ProfileForm.tsx`: eliminar OPOSICIONES[] hardcoded, recibir como prop
- [ ] `app/(dashboard)/cuenta/page.tsx`: query oposiciones, pasar a ProfileForm
- [ ] `lib/utils/oposicion-labels.ts`: eliminar mapa estático, query DB
- [ ] `components/shared/PrimerTestSelector.tsx`: ya es dinámico, solo añadir badge "Próximamente" para inactivas

### 0.3 Motor de scoring configurable
- [ ] Crear `lib/utils/scoring.ts` con función `calcularPuntuacion(aciertos, errores, config)`
- [ ] Config soporta array de ejercicios (Auxilio=2, Tramitación=3, Correos=1)
- [ ] Cada ejercicio: {nombre, preguntas, acierto, error, max, min_aprobado, penaliza}
- [ ] `app/(dashboard)/tests/[id]/resultados/page.tsx`: fetch scoring_config de la oposición del test
- [ ] Si penaliza=false → mostrar "Sin penalización — responde todas las preguntas" en vez de fórmula -1/3
- [ ] Si penaliza=true → mostrar fórmula con valores reales del scoring_config
- [ ] `lib/utils/simulacro-ranking.ts`: aceptar scoring_config param

### 0.4 Stripe rama-aware combos
- [ ] `lib/stripe/client.ts`: crear mapa COMBO_PACKS con oposicion IDs por rama
- [ ] Añadir tiers: pack_correos, pack_justicia_c2, pack_justicia_c1, pack_justicia_a2, pack_doble_justicia, pack_triple_justicia
- [ ] Configurar CORRECTIONS_GRANTED y SUPUESTOS_GRANTED para cada tier
- [ ] `app/api/stripe/checkout/route.ts`: añadir nuevos tiers al BodySchema
- [ ] `app/api/stripe/webhook/route.ts`: refactorizar if/else combos a usar COMBO_PACKS mapa
- [ ] Crear 8 productos en Stripe Dashboard (Correos + 5 Justicia + doble + triple)
- [ ] Añadir 8 env vars STRIPE_PRICE_PACK_*

---

## FASE 1 — Correos

### 1.1 Migration: oposición + temas
- [ ] Crear `supabase/migrations/20260326_048_correos.sql`
- [ ] INSERT oposiciones: id=d0000000..., slug='correos', rama='correos', nivel='IV', activa=false
- [ ] features: {"psicotecnicos": true, "cazatrampas": true, "supuesto_practico": false, "ofimatica": false}
- [ ] scoring_config: {"ejercicios": [{"nombre":"Test","preguntas":100,"minutos":110,"acierto":0.60,"error":0,"max":60,"penaliza":false}]}
- [ ] INSERT 12 temas:
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
- [ ] Indexar legislación en tabla `legislacion`:
  - Ley 43/2010 del servicio postal universal
  - RD 1829/1999 Reglamento servicios postales
  - RGPD + LOPDGDD
  - Ley Orgánica 3/2007 Igualdad
  - Ley 31/1995 PRL
- [ ] Tagear cada artículo con tema_ids de Correos
- [ ] Generar free bank: `pnpm generate:free-bank --oposicion correos`
- [ ] Buscar e ingestar examen oficial 2023 (web Correos post-convocatoria)

### 1.3 Landing SEO Correos
- [ ] Crear `app/(marketing)/oposiciones/correos/page.tsx`
- [ ] Metadata SEO: "Test Correos 2026 — Practica gratis con preguntas del examen"
- [ ] Schema markup FAQPage
- [ ] Datos: 4.055 plazas, 12 temas, examen mayo, sin penalización
- [ ] CTA registro con `?oposicion=correos`
- [ ] Actualizar `app/sitemap.ts` con nueva ruta

### 1.4 Activación Correos
- [ ] Verificar: free bank completo (12 temas × 10 preguntas)
- [ ] Verificar: legislación indexada
- [ ] Verificar: Stripe producto creado + env var
- [ ] `UPDATE oposiciones SET activa = true WHERE slug = 'correos'`
- [ ] Deploy y probar flujo completo

---

## FASE 2 — Justicia

### 2.1 Migration: 3 oposiciones + temas
- [ ] Crear `supabase/migrations/20260326_049_justicia.sql`
- [ ] INSERT Auxilio Judicial C2: 26 temas, rama='justicia', nivel='C2', activa=false
  - Temas exactos del Anexo VI.c del BOE-A-2025-27053
  - scoring_config con 2 ejercicios (test 60pts + práctico 40pts)
- [ ] INSERT Tramitación Procesal C1: 37 temas, rama='justicia', nivel='C1', activa=false
  - Temas del Anexo VI.b (incluye Bloque III ofimática)
  - scoring_config con 3 ejercicios (test 60pts + práctico 20pts + ofimática 20pts)
  - features: ofimatica=true
- [ ] INSERT Gestión Procesal A2: 68 temas, rama='justicia', nivel='A2', activa=false
  - Temas del Anexo VI.a
  - scoring_config con 3 ejercicios (test 60pts + práctico 15pts + desarrollo 25pts)
  - features: supuesto_practico=true

### 2.2 Contenido Justicia — Legislación
- [ ] Scrape BOE consolidado:
  - Constitución Española
  - LO 6/1985 LOPJ (consolidada con LO 1/2025)
  - LO 1/2025 del Servicio Público de Justicia (NUEVA)
  - Ley 1/2000 LEC
  - RD 14/09/1882 LECrim
  - RDL 5/2015 TREBEP
  - LO 3/2007 Igualdad, LO 1/2004 VG, Ley 15/2022, Ley 4/2023 LGTBI
- [ ] Indexar artículo por artículo en tabla `legislacion`
- [ ] Tagear con tema_ids correctos (Auxilio, Tramitación, Gestión)
- [ ] Verificar temas ACTUALIZADOS por LO 1/2025: T8, T10, T16, T18

### 2.3 Contenido Justicia — Exámenes oficiales
- [ ] Descargar cuadernillos + plantillas de MJU:
  - https://www.mjusticia.gob.es/es/ciudadania/empleo-publico/acceso-libre/Auxilio-Judicial-PJC14372024
  - Auxilio OEP 2024 (27/09/2025)
  - Auxilio OEP 2023 (28/09/2024)
  - Tramitación OEP 2024
  - Gestión OEP 2024
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
- [ ] Hub: `app/(marketing)/oposiciones/justicia/page.tsx`
- [ ] Sub: `app/(marketing)/oposiciones/justicia/auxilio-judicial/page.tsx`
- [ ] Sub: `app/(marketing)/oposiciones/justicia/tramitacion-procesal/page.tsx`
- [ ] Sub: `app/(marketing)/oposiciones/justicia/gestion-procesal/page.tsx`
- [ ] Calculadora nota Justicia (por ejercicio, con penalización)
- [ ] Blog: empezar con 5 artículos SEO del plan de estrategia
- [ ] Actualizar sitemap.ts

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
- [ ] `app/(marketing)/oposiciones/correos/page.tsx` — NUEVA
- [ ] `app/(marketing)/oposiciones/justicia/page.tsx` — NUEVA (hub)
- [ ] `app/(marketing)/oposiciones/justicia/auxilio-judicial/page.tsx` — NUEVA
- [ ] `app/(marketing)/oposiciones/justicia/tramitacion-procesal/page.tsx` — NUEVA
- [ ] `app/(marketing)/oposiciones/justicia/gestion-procesal/page.tsx` — NUEVA

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
- [ ] Semana 1-2 (quick wins):
  - "Cambios temario Justicia 2026: LO 1/2025 explicada"
  - "Auxilio Judicial vs Tramitación Procesal: ¿cuál elegir?"
  - "Examen Correos 2026: guía completa (temario, scoring, plazas)"
- [ ] Semana 3-4 (pilares):
  - "Guía completa Auxilio Judicial 2026" (3000+ palabras, pilar)
  - "Guía completa Tramitación Procesal 2026" (pilar)
  - "Test Correos online gratis: practica con preguntas reales"
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
- [ ] Actualizar `app/sitemap.ts` con todas las nuevas rutas
- [ ] Actualizar `app/robots.ts` para permitir indexación de /oposiciones/*
- [ ] `public/llms.txt` y `public/llms-full.txt`: añadir info Correos + Justicia
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
