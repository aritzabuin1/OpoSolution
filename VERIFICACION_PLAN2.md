# Plan de Verificación — Plan2 OpoRuta

> Checklist paso a paso para verificar todo lo implementado en Plan2.
> Ejecutar ANTES de activar cualquier oposición nueva.
> Marcar [x] cuando verificado.

---

## 1. FASE 0 — Arquitectura base

### 1.1 Migration 047: rama + scoring_config
- [ ] `SELECT rama, nivel, scoring_config, orden, plazas FROM oposiciones` → verificar que C2/C1/A2 AGE tienen rama='age'
- [ ] `scoring_config` de C2 tiene 1 ejercicio (100q, 70min, penaliza)
- [ ] `scoring_config` de C1 tiene 2 ejercicios (Cuestionario 70q + Supuesto 20q, 100min total) — fix migration 051
- [ ] `scoring_config` de Correos tiene 1 ejercicio (100q, 110min, NO penaliza)

### 1.2 Registro dinámico
- [ ] `/register` → muestra oposiciones agrupadas por rama (AGE / Justicia / Correos)
- [ ] Oposiciones con `activa=false` muestran badge "Próximamente" y no son seleccionables
- [ ] Oposiciones con `activa=true` (C2, C1, A2 AGE) se pueden seleccionar
- [ ] `/cuenta` → cambiar oposición funciona con selector dinámico

### 1.3 Scoring configurable
- [ ] Test normal AGE C2: resultado muestra penalización -1/3
- [ ] Simulacro oficial: puntuación con penalización usando `calcularEjercicio` (no math inline)
- [ ] Simulacro: muestra "Superas/No alcanzas el mínimo eliminatorio" cuando `min_aprobado` existe

### 1.4 Stripe rama-aware
- [ ] `COMBO_PACKS` mapa en `lib/stripe/client.ts` incluye Correos + Justicia tiers
- [ ] `.env.example` tiene las 6 env vars STRIPE_PRICE_PACK_*
- [ ] **MANUAL**: 6 productos creados en Stripe Dashboard

---

## 2. FASE 1 — Correos

### 2.1 Migration 048: oposición + temas
- [ ] `SELECT * FROM oposiciones WHERE slug='correos'` → existe, activa=false, rama='correos'
- [ ] `SELECT COUNT(*) FROM temas WHERE oposicion_id = (SELECT id FROM oposiciones WHERE slug='correos')` → 12 temas
- [ ] `features` incluye `psicotecnicos: true, cazatrampas: true, supuesto_practico: false`

### 2.2 Contenido Correos
- [ ] Legislación indexada: `SELECT COUNT(*) FROM legislacion WHERE oposicion_tags @> '["correos"]'` → ~2.679 artículos
- [ ] Exámenes parseados: `data/examenes_correos/2023/parsed_a.json` existe con ≥50 preguntas
- [ ] Exámenes ingestados: `SELECT COUNT(*) FROM preguntas_oficiales WHERE oposicion_id = '<correos-id>'` → >0
- [ ] Free bank: `SELECT COUNT(*) FROM free_question_bank WHERE oposicion_id = '<correos-id>'` → 12 registros (1 por tema)

### 2.3 Landing SEO Correos
- [ ] `/oposiciones/correos` → carga, muestra datos correctos (4.055 plazas, 12 temas)
- [ ] Schema FAQPage en source HTML
- [ ] CTA registro con `?oposicion=correos`
- [ ] Sitemap incluye `/oposiciones/correos`

### 2.4 Activación (cuando todo OK)
- [ ] `UPDATE oposiciones SET activa = true WHERE slug = 'correos'`
- [ ] `/register` → Correos seleccionable
- [ ] Registrarse con Correos → dashboard funciona
- [ ] Tests generan sin error (legislación disponible)
- [ ] Scoring dice "Sin penalización — responde todas"
- [ ] Checkout Stripe Pack Correos 39.99€ funciona

---

## 3. FASE 2 — Justicia

### 3.1 Migration 049: 3 oposiciones + temas
- [ ] Auxilio Judicial: 26 temas, rama='justicia', nivel='C2', activa=false
- [ ] Tramitación Procesal: 37 temas, rama='justicia', nivel='C1', activa=false
- [ ] Gestión Procesal: 68 temas, rama='justicia', nivel='A2', activa=false
- [ ] scoring_config correcto por oposición (verificar contra BOE-A-2025-27053)

### 3.2 Contenido Justicia
- [ ] Legislación taggeada: `SELECT COUNT(*) FROM legislacion WHERE oposicion_tags @> '["justicia"]'` → ~20.941
- [ ] LO 1/2025 ingestionada (289 art.)
- [ ] Exámenes descargados: Auxilio 22 PDFs, Tramitación 14, Gestión 14
- [ ] Exámenes parseados e ingestados (al menos para Auxilio)

### 3.3 SEO Justicia
- [ ] `/oposiciones/justicia` → hub page carga
- [ ] `/oposiciones/justicia/auxilio-judicial` → sub-landing carga
- [ ] `/oposiciones/justicia/tramitacion-procesal` → sub-landing carga
- [ ] `/oposiciones/justicia/gestion-procesal` → sub-landing carga
- [ ] `/herramientas/calculadora-nota-justicia` → funciona, calcula por ejercicio
- [ ] `/herramientas/calculadora-nota-correos` → funciona, sin penalización
- [ ] Sitemap incluye todas las rutas Justicia

### 3.4 Activación Auxilio (primera)
- [ ] Free bank generado (26 temas × 10 preguntas)
- [ ] Stripe producto creado + env var
- [ ] `UPDATE oposiciones SET activa = true WHERE slug = 'auxilio-judicial'`
- [ ] Registro → seleccionable
- [ ] Tests generan correctamente
- [ ] Scoring muestra penalización -1/4

---

## 4. FASE 2.5 — Supuesto Práctico Test

### 4.1 GAP-3: Multi-exercise scoring
- [ ] `calcularPuntuacion([ej1, ej2], config)` → procesa ambos ejercicios
- [ ] `aprobado` requiere TODOS los ejercicios pasen min_aprobado
- [ ] `describePenalizacion` multi-ejercicio muestra separador `|`
- [ ] 25 tests unitarios pasan (`npx vitest run tests/unit/scoring.test.ts`)

### 4.2 Tablas supuesto (migration 052)
- [ ] `free_supuesto_bank` existe → `SELECT COUNT(*) FROM free_supuesto_bank` → ≥1 (C1 AGE)
- [ ] `supuesto_bank` existe → `SELECT COUNT(*) FROM supuesto_bank` → ≥2 (Supuesto I + II oficiales)
- [ ] `user_supuestos_seen` existe
- [ ] `tests_generados.tipo` acepta 'supuesto_test'
- [ ] `tests_generados.supuesto_caso` columna JSONB existe

### 4.3 Feature flag (migration 054)
- [ ] `SELECT features FROM oposiciones WHERE slug='administrativo-estado'` → `supuesto_test: true`
- [ ] Sidebar muestra "Supuesto Test" para C1 AGE
- [ ] Sidebar NO muestra "Supuesto Test" para C2 AGE (no tiene supuesto_test en features)

### 4.4 Endpoint generate-supuesto-test
- [ ] Free user → sirve supuesto oficial de free_supuesto_bank
- [ ] Free user que ya hizo 1 → 402 paywall
- [ ] Premium user → sirve unseen de supuesto_bank
- [ ] Rate limit: 5/día (429 después)
- [ ] Oposición sin supuesto test → 400

### 4.5 UI supuesto test
- [ ] `/supuesto-test` → carga, muestra stats (20 preguntas, 50 pts max, 25 min)
- [ ] Click "Practicar" → genera test → redirige a `/tests/[id]`
- [ ] Desktop: caso sticky izquierda, preguntas derecha
- [ ] Mobile: caso colapsable, FAB "Ver caso"
- [ ] Finalizar → resultados muestran panel indigo con nota sobre 50

### 4.6 Resultados supuesto
- [ ] Cabecera indigo "Supuesto Práctico"
- [ ] Puntuación sobre max ejercicio (ej: 38.50/50)
- [ ] min_aprobado: "Superas el mínimo eliminatorio (25)" o "No alcanzas..."
- [ ] Penalización mostrada correctamente

---

## 5. FASE S — Landing + SEO

### 5.1 Landing principal
- [ ] Sección "¿Qué oposición preparas?" con cards por rama
- [ ] Cards inactivas: opacity, badge "Próximamente", WaitlistForm
- [ ] Cards activas: CTA "Empieza gratis"
- [ ] Blog sections por rama

### 5.2 Pricing /precios
- [ ] Tabs por rama funcionan (AGE / Justicia / Correos)
- [ ] Ramas inactivas: "Próximamente"
- [ ] Tabla free vs premium correcta
- [ ] FAQ pricing

### 5.3 Waitlist
- [ ] POST /api/waitlist → guarda email + oposicion_slug
- [ ] Email confirmación enviado
- [ ] Admin /admin/nurture → muestra waitlist entries
- [ ] GDPR checkbox visible

### 5.4 Blog
- [ ] ≥5 posts Correos en `/blog`
- [ ] ≥10 posts Justicia en `/blog`
- [ ] Posts tienen FAQPage schema
- [ ] Internal links a sub-landings

### 5.5 Sitemap + SEO técnico
- [ ] `/sitemap.xml` incluye: /oposiciones/correos, /oposiciones/justicia/*, /precios, /herramientas/*
- [ ] `/robots.txt` permite /oposiciones/*
- [ ] `llms.txt` menciona Correos + Justicia

---

## 6. Verificación transversal

### 6.1 Build
- [ ] `pnpm build` completa sin errores
- [ ] `pnpm test` → solo errores pre-existentes (stripe-client, simulacro-ranking, admin-metrics)

### 6.2 Migrations
- [ ] Migrations 047-054 todas aplicadas en Supabase remoto
- [ ] No hay conflictos de constraints

### 6.3 Seguridad
- [ ] Rate limits en todos los endpoints nuevos
- [ ] Paywall gating funciona (free vs premium)
- [ ] No se exponen datos de otros usuarios (RLS)

### 6.4 Mobile
- [ ] `/supuesto-test` responsive
- [ ] SupuestoTestRunner: caso colapsable + FAB funciona
- [ ] Sidebar mobile: "Supuesto Test" visible para C1

---

## Orden de ejecución recomendado

1. **Verificar FASE 0** (arquitectura) — prerrequisito de todo
2. **Verificar FASE 2.5** (supuesto test) — ya implementado, solo testear
3. **Verificar FASE S** (landing, SEO) — ya implementado
4. **Activar Correos** (FASE 1) — cuando contenido esté listo
5. **Activar Auxilio** (FASE 2) — cuando contenido esté listo
6. **Activar Tramitación** — después de Auxilio
7. **Activar Gestión Procesal** — último (necesita más trabajo)
