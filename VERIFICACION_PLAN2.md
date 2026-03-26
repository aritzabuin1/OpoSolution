# Plan de Verificación — Plan2 OpoRuta

> Checklist EXHAUSTIVO para verificar todo lo implementado en Plan2.
> Ejecutar ANTES de activar cualquier oposición nueva.
> Marcar [x] cuando verificado. Si falla, anotar el error al lado.

---

## 0. PRE-REQUISITOS

### 0.1 Migrations aplicadas
- [ ] 047 — rama + scoring_config + campos nuevos en oposiciones
- [ ] 048 — Correos oposición + 12 temas
- [ ] 049 — Justicia 3 oposiciones + temas (Auxilio 26, Tramitación 37, Gestión 16)
- [ ] 050 — Waitlist tabla
- [ ] 051 — Fix scoring_config C1 AGE (2 ejercicios)
- [ ] 052 — Tablas supuesto_test (free_supuesto_bank, supuesto_bank, user_supuestos_seen)
- [ ] 053 — Fix scoring_config Correos
- [ ] 054 — Feature flag supuesto_test en C1 AGE + 3 Justicia
- [ ] 055 — Gestión Procesal temas 17-68 (52 temas procesales)
- [ ] 056 — Expand conocimiento_tecnico bloque constraint ('correos')
- [ ] Verificar: `SELECT COUNT(*) FROM temas WHERE oposicion_id IN (SELECT id FROM oposiciones WHERE rama='justicia' AND slug='gestion-procesal')` → 68

### 0.2 Build y tests
- [ ] `pnpm build` completa sin errores en Vercel
- [ ] `pnpm test` → 25 nuevos scoring tests pasan + resto sin regresión
- [ ] No hay errores TS en archivos nuevos/modificados

### 0.3 Datos en BD
- [ ] `SELECT slug, activa, rama, nivel FROM oposiciones ORDER BY rama, orden` → 7 oposiciones (3 AGE activas, 1 Correos inactiva, 3 Justicia inactivas)
- [ ] C1 AGE tiene `activa=true` (verificar — se reseteó durante esta sesión)

---

## 1. ARQUITECTURA BASE (FASE 0)

### 1.1 Scoring_config por oposición
- [ ] AGE C2: 1 ejercicio, 100q, 70min, penaliza -1/3
- [ ] AGE C1: 2 ejercicios (Cuestionario 70q + Supuesto 20q), minutos_total=100, penaliza -1/3
- [ ] AGE A2 GACE: 1 ejercicio, 100q, 90min, penaliza -1/3
- [ ] Correos: 1 ejercicio, 100q, 110min, **NO penaliza** (error=0)
- [ ] Auxilio Judicial: 2 ejercicios (Test 100q 75min + Supuesto 40q 60min), penaliza -1/4
- [ ] Tramitación Procesal: 3 ejercicios (Test 100q + Supuesto 10q + Ofimática 20q), penaliza -1/4
- [ ] Gestión Procesal: 3 ejercicios (Test 100q + Supuesto 10q + Desarrollo 25pts), penaliza -1/5

### 1.2 Registro dinámico
- [ ] `/register` → oposiciones agrupadas por rama (AGE / Justicia / Correos)
- [ ] Oposiciones `activa=false` → badge "Próximamente", NO seleccionables (disabled)
- [ ] Oposiciones `activa=true` → seleccionables con radio/select
- [ ] Registrarse con una oposición → profile.oposicion_id se guarda correctamente

### 1.3 Cuenta — cambiar oposición
- [ ] `/cuenta` → muestra TODAS las oposiciones activas (no solo AGE)
- [ ] Cambiar de oposición → sidebar se actualiza (features cambian)
- [ ] Cambiar de C2 AGE a C1 AGE → "Supuesto Test" aparece en sidebar
- [ ] Cambiar de C1 AGE a C2 AGE → "Supuesto Test" desaparece
- [ ] Los nombres son COMPLETOS ("Auxiliar Administrativo del Estado", no "C2")

### 1.4 Stripe rama-aware
- [ ] `COMBO_PACKS` en `lib/stripe/client.ts` incluye tiers Correos + Justicia
- [ ] `.env.example` tiene STRIPE_PRICE_PACK_CORREOS, PACK_JUSTICIA_C2, etc.
- [ ] **MANUAL**: Crear 6 productos en Stripe Dashboard

---

## 2. CORREOS (FASE 1)

### 2.1 Datos
- [ ] 12 temas en BD: `SELECT numero, titulo FROM temas WHERE oposicion_id='d0000000...' ORDER BY numero`
- [ ] Legislación: `SELECT COUNT(*) FROM legislacion WHERE oposicion_tags @> '["correos"]'` → ~2.679
- [ ] Conocimiento técnico: `SELECT COUNT(*) FROM conocimiento_tecnico WHERE bloque='correos'` → ~93 secciones
- [ ] Exámenes: `SELECT COUNT(*) FROM preguntas_oficiales WHERE oposicion_id='d0000000...'` → ≥55
- [ ] Free bank: `SELECT COUNT(*) FROM free_question_bank WHERE oposicion_id='d0000000...'` → 12 (1 por tema)

### 2.2 Citation aliases
- [ ] `LEY_POSTAL` → reconocido por verificador (`resolveLeyNombre('Ley Postal')` retorna 'LEY_POSTAL')
- [ ] `RD_POSTAL` → reconocido (`resolveLeyNombre('RD 1829/1999')` retorna 'RD_POSTAL')
- [ ] `Ley 43/2010` → reconocido por LEY_POR_NUMERO

### 2.3 Retrieval — conocimiento_tecnico para temas operativos
- [ ] Tema 3 (Paquetería): `detectConocimientoBloque()` retorna 'correos'
- [ ] Tema 4 (Productos oficinas): retorna 'correos'
- [ ] Tema 5 (Nuevas líneas): retorna 'correos'
- [ ] Tema 9 (Distribución): retorna 'correos'
- [ ] Temas legales (1, 10, 11, 12): retorna null → usa legislación normal

### 2.4 UX Correos (tras activar)
- [ ] Registro con Correos → dashboard carga
- [ ] Generar test tema 1 (legal) → preguntas con citas LEY_POSTAL verificadas
- [ ] Generar test tema 3 (operativo) → preguntas basadas en conocimiento_tecnico
- [ ] Resultados: "Sin penalización — responde todas las preguntas"
- [ ] Sidebar: Psicotécnicos visible (features.psicotecnicos=true)
- [ ] Sidebar: NO aparece "Supuesto Test" ni "Supuesto Escrito"
- [ ] Simulacros: examen 2023 disponible con ≥50 preguntas
- [ ] PaywallGate muestra Pack Correos 39.99€

### 2.5 Landing SEO
- [ ] `/oposiciones/correos` → carga, datos correctos (4.055 plazas, 12 temas, sin penalización)
- [ ] Schema FAQPage en source HTML
- [ ] CTA con `?oposicion=correos`
- [ ] Sitemap incluye ruta

---

## 3. JUSTICIA (FASE 2)

### 3.1 Datos — Auxilio Judicial
- [ ] 26 temas en BD con numeración 1-26
- [ ] Free bank: `SELECT COUNT(*) FROM free_question_bank WHERE oposicion_id='e0000000...'` → ≥25
- [ ] Examen 2024: `SELECT COUNT(*) FROM preguntas_oficiales WHERE oposicion_id='e0000000...'` → ≥59
- [ ] Legislación taggeada con temas correctos (LOPJ→T6-T10, LEC→T16-T17, LECrim→T18)
- [ ] LO 1/2025 taggeada a T8, T10, T16 (MASC)

### 3.2 Datos — Tramitación Procesal
- [ ] 37 temas en BD (Bloque I: 1-15, Bloque II: 16-31, Bloque III: 32-37 ofimática)
- [ ] Free bank: `SELECT COUNT(*) FROM free_question_bank WHERE oposicion_id='e1000000...'` → ≥37
- [ ] Features: `ofimatica=true, supuesto_test=true`

### 3.3 Datos — Gestión Procesal
- [ ] 68 temas en BD (1-16 org + 17-68 procesales) — migration 055
- [ ] Free bank: `SELECT COUNT(*) FROM free_question_bank WHERE oposicion_id='e2000000...'` → ≥60
- [ ] Features: `supuesto_test=true, supuesto_practico=true`

### 3.4 Tagging LO 1/2025 — corregido
- [ ] Auxilio: LO_SPJ → temas [8, 10, 16]
- [ ] Tramitación: LO_SPJ → temas [8, 10, 16]
- [ ] Gestión: LO_SPJ → temas [8, 11, 36]
- [ ] LOPJ Auxilio: NO incluye T4/T5 (eran incorrectos)

### 3.5 UX Justicia (tras activar cada una)
- [ ] Registro con Auxilio → dashboard carga, 26 temas visibles
- [ ] Generar test Auxilio → preguntas con citas LOPJ/LEC verificadas
- [ ] Resultados Auxilio: penalización -1/4 (no -1/3)
- [ ] Sidebar Auxilio: "Supuesto Test" visible, "Psicotécnicos" NO visible
- [ ] Registro con Tramitación → 37 temas, sidebar muestra "Supuesto Test"
- [ ] Registro con Gestión → 68 temas, sidebar muestra "Supuesto Test" + "Supuesto Escrito"

### 3.6 SEO Justicia
- [ ] `/oposiciones/justicia` → hub page carga
- [ ] `/oposiciones/justicia/auxilio-judicial` → sub-landing con datos correctos
- [ ] `/oposiciones/justicia/tramitacion-procesal` → sub-landing
- [ ] `/oposiciones/justicia/gestion-procesal` → sub-landing
- [ ] `/herramientas/calculadora-nota-justicia` → calcula por ejercicio (2 ej. Auxilio, 3 ej. Tramitación)
- [ ] `/herramientas/calculadora-nota-correos` → sin penalización
- [ ] Sitemap incluye todas las rutas

### 3.7 Activación progresiva
- [ ] Activar Auxilio: `SET activa=true` → registro OK, tests OK, scoring -1/4
- [ ] Activar Tramitación: tests OK, scoring 3 ejercicios (test+supuesto+ofimática)
- [ ] Activar Gestión: tests OK, scoring 3 ejercicios, supuesto escrito funciona

---

## 4. SUPUESTO PRÁCTICO TEST (FASE 2.5)

### 4.1 Multi-exercise scoring (GAP-3)
- [ ] `calcularPuntuacion([ej1, ej2], config)` → procesa ambos ejercicios
- [ ] `aprobado=false` si CUALQUIER ejercicio no pasa min_aprobado
- [ ] `describePenalizacion` multi-ejercicio: "Test teórico: +0.60 · -1/4 | Supuesto: +2.00 · -1/4"
- [ ] `describePenalizacion(config, 1)` → solo ejercicio 1
- [ ] 25 unit tests pasan: `npx vitest run tests/unit/scoring.test.ts`

### 4.2 Tablas BD (migration 052)
- [ ] `SELECT COUNT(*) FROM free_supuesto_bank` → ≥1 (C1 AGE Supuesto I oficial)
- [ ] `SELECT COUNT(*) FROM supuesto_bank` → ≥2 (Supuesto I + II oficiales INAP 2024)
- [ ] `SELECT COUNT(*) FROM supuesto_bank WHERE es_oficial=true` → 2
- [ ] `tests_generados` acepta `tipo='supuesto_test'`
- [ ] `tests_generados.supuesto_caso` columna existe (JSONB, nullable)

### 4.3 Feature flag (migration 054)
- [ ] C1 AGE: `features->>'supuesto_test' = 'true'`
- [ ] C2 AGE: NO tiene supuesto_test en features
- [ ] A2 GACE: NO tiene supuesto_test (tiene supuesto_practico para desarrollo)
- [ ] Auxilio Judicial: `features->>'supuesto_test' = 'true'`
- [ ] Tramitación: `features->>'supuesto_test' = 'true'`
- [ ] Gestión: `features->>'supuesto_test' = 'true'`

### 4.4 Sidebar visibilidad
- [ ] Usuario C1 AGE → ve "Supuesto Test" en sidebar
- [ ] Usuario C2 AGE → NO ve "Supuesto Test"
- [ ] Usuario A2 GACE → NO ve "Supuesto Test" (ve "Supuesto Escrito" si tiene supuesto_practico)
- [ ] Mobile navbar: misma visibilidad que sidebar

### 4.5 Página /supuesto-test
- [ ] Carga correctamente para usuario C1 AGE
- [ ] Muestra stats: 20 preguntas, 50 pts máximo, 25 mínimo
- [ ] Timer: muestra "—" (compartido con parte 1, no separado)
- [ ] Penalización: muestra "-1/3"
- [ ] Free user: botón "Practicar supuesto gratuito"
- [ ] Premium user: botón "Nuevo supuesto práctico" + contador practicados
- [ ] Oposición sin supuesto → mensaje "Tu oposición no incluye supuesto"

### 4.6 Endpoint generate-supuesto-test
- [ ] **Free user, primera vez**: sirve supuesto oficial INAP 2024 de free_supuesto_bank
- [ ] **Free user, segunda vez**: 402 con code PAYWALL_SUPUESTO_TEST
- [ ] **Premium user**: sirve unseen de supuesto_bank
- [ ] **Premium, todos vistos**: genera con IA → guarda en supuesto_bank → sirve
- [ ] **IA falla**: fallback sirve cualquier supuesto del banco (aunque repetido)
- [ ] **Rate limit**: 429 tras 5 supuestos/día
- [ ] **Oposición sin supuesto**: 400
- [ ] **No autenticado**: 401
- [ ] Test guardado con `tipo='supuesto_test'`, `supuesto_caso` JSON, `prompt_version`

### 4.7 SupuestoTestRunner (tests/[id]/page.tsx)
- [ ] Cabecera indigo "Supuesto Práctico" + badge "Caso + preguntas test"
- [ ] **Desktop (≥1024px)**: split view — caso sticky izquierda, preguntas derecha
- [ ] **Mobile (<1024px)**: caso colapsable (click header para toggle)
- [ ] **Mobile colapsado**: FAB "Ver caso" aparece abajo-derecha
- [ ] Click FAB → expande caso + scroll al top
- [ ] Caso muestra título + bloques cubiertos + escenario completo
- [ ] Las preguntas se responden normalmente (TestRunner estándar)
- [ ] Timer: si scoring_config tiene minutos para ejercicio supuesto, muestra countdown
- [ ] Finalizar → redirige a resultados

### 4.8 Resultados supuesto test
- [ ] Cabecera indigo "Supuesto Práctico" + badge "Formato test"
- [ ] Puntuación %: porcentaje estándar (como cualquier test)
- [ ] Panel indigo: "Puntuación del supuesto — Supuesto práctico"
- [ ] Nota sobre max ejercicio: ej. "38.50 puntos sobre 50"
- [ ] min_aprobado: "✓ Superas el mínimo eliminatorio (25)" verde
- [ ] min_aprobado fail: "✗ No alcanzas el mínimo (25). Necesitas X puntos más." rojo
- [ ] Penalización del ejercicio específico (no del test genérico)
- [ ] Preguntas incorrectas listadas normalmente
- [ ] Análisis IA (ExplicarErroresPanel) funciona
- [ ] Share button funciona con tipo 'supuesto'
- [ ] OG metadata: tipo='supuesto' para imagen dinámica

---

## 5. FEATURES EXISTENTES CON NUEVAS OPOSICIONES

### 5.1 Tests por tema
- [ ] Correos: generar test cualquier tema → funciona (legal usa legislación, operativo usa conocimiento_tecnico)
- [ ] Auxilio: generar test → preguntas con citas LOPJ/LEC/LECrim
- [ ] Dificultad: fácil/media/difícil funciona para nuevas oposiciones
- [ ] Solo se muestran temas de la oposición del usuario (no mezcla AGE con Justicia)

### 5.2 Simulacros
- [ ] Correos: simulacro 2023 disponible (≥50 preguntas oficiales)
- [ ] Auxilio: simulacro 2024 disponible (≥59 preguntas oficiales)
- [ ] Timer proporcional: Correos 110min/100q, Auxilio 75min/100q
- [ ] Filtro `numero <= N` dinámico por scoring_config (no hardcoded 60)

### 5.3 Flashcards
- [ ] Se generan tras completar test en nuevas oposiciones
- [ ] Repaso espaciado funciona

### 5.4 Caza-Trampas
- [ ] Funciona para nuevas oposiciones (genera con legislación disponible)

### 5.5 Reto Diario
- [ ] Funciona (genera para la oposición del usuario)

### 5.6 Radar del Tribunal
- [ ] Solo muestra datos si hay exámenes oficiales ingestados para esa oposición
- [ ] Correos: muestra si hay preguntas oficiales
- [ ] Auxilio: muestra si hay preguntas oficiales

### 5.7 Dashboard
- [ ] IPR calcula correctamente para nuevas oposiciones
- [ ] Mapa de debilidades muestra temas de la oposición correcta
- [ ] Daily brief funciona

### 5.8 Repaso de errores
- [ ] Genera repaso con preguntas falladas de la oposición del usuario (no mezcla)

### 5.9 Freemium gating
- [ ] Free Correos: 5 tests (solo temas free), 3 simulacros (20q), 3 cazatrampas/día
- [ ] Free Justicia: mismos límites
- [ ] Premium Correos: ilimitado
- [ ] PaywallGate muestra pack correcto por oposición

---

## 6. LANDING + SEO (FASE S)

### 6.1 Landing principal
- [ ] Metadata: menciona AGE + Correos + Justicia
- [ ] Keywords SEO: incluyen correos, justicia, auxilio, tramitación
- [ ] Sección "¿Qué oposición preparas?": cards AGE (activas) + Correos/Justicia (próximamente)
- [ ] Cards inactivas: opacity, badge "Próximamente", WaitlistForm
- [ ] Blog sections: posts por rama (AGE + Correos + Justicia)
- [ ] FAQ menciona próximas oposiciones

### 6.2 Pricing /precios
- [ ] Tabs por rama: [Administración] [Justicia] [Correos]
- [ ] AGE: packs individuales + doble + triple
- [ ] Justicia: packs individuales + doble + triple (con "Próximamente" si inactivas)
- [ ] Correos: pack único 39.99€
- [ ] Tabla comparativa free vs premium
- [ ] FAQ pricing

### 6.3 Waitlist
- [ ] POST /api/waitlist → guarda email + oposicion_slug en BD
- [ ] Email confirmación Resend enviado al suscribirse
- [ ] Admin /admin/nurture → muestra waitlist entries con conteo
- [ ] GDPR: checkbox visible, enlace baja

### 6.4 Sub-landings
- [ ] `/oposiciones/correos` → datos correctos, FAQPage schema, CTA
- [ ] `/oposiciones/justicia` → hub con links a 3 sub-landings
- [ ] `/oposiciones/justicia/auxilio-judicial` → 26 temas, 425 plazas, scoring 2 ej.
- [ ] `/oposiciones/justicia/tramitacion-procesal` → 37 temas, 1.155 plazas, scoring 3 ej.
- [ ] `/oposiciones/justicia/gestion-procesal` → 68 temas, 725 plazas, scoring 3 ej.

### 6.5 Herramientas SEO
- [ ] `/herramientas/calculadora-nota-justicia` → input por ejercicio, resultado por cuerpo
- [ ] `/herramientas/calculadora-nota-correos` → sin penalización, scoring 0.60/acierto

### 6.6 Blog
- [ ] ≥5 posts Correos publicados
- [ ] ≥10 posts Justicia publicados (incluyendo LO 1/2025)
- [ ] FAQPage schema en posts con FAQs
- [ ] Internal links a sub-landings correspondientes

### 6.7 SEO técnico
- [ ] `sitemap.xml` incluye: /oposiciones/correos, /oposiciones/justicia/*, /precios, /herramientas/*
- [ ] `robots.txt` permite /oposiciones/*
- [ ] `llms.txt` header multi-rama, menciona Correos + Justicia con datos

---

## 7. SEGURIDAD + ADMIN

### 7.1 RLS
- [ ] Usuario de Correos NO ve tests de usuarios AGE
- [ ] `free_supuesto_bank` → SELECT público (todos leen)
- [ ] `supuesto_bank` → SELECT solo authenticated
- [ ] `user_supuestos_seen` → usuario solo ve sus propios registros

### 7.2 Rate limits
- [ ] generate-supuesto-test: 5/día
- [ ] Reutiliza rate limits existentes en otros endpoints

### 7.3 Paywall
- [ ] Free user supuesto test: 1 gratis → 402 paywall
- [ ] Compra de Pack Correos NO da acceso a AGE (aislamiento por oposición)
- [ ] Admin user: acceso premium a todas las oposiciones

### 7.4 Admin panel
- [ ] Desglose por oposición en métricas (no solo AGE)
- [ ] Nuevas oposiciones aparecen en analytics cuando se activen

---

## 8. MOBILE

- [ ] `/supuesto-test` page responsive (stats cards en 2 columnas mobile)
- [ ] SupuestoTestRunner mobile: caso colapsable funciona
- [ ] FAB "Ver caso" aparece cuando caso colapsado
- [ ] Navbar mobile: "Supuesto Test" visible para C1
- [ ] Registro mobile: selector oposiciones con agrupación por rama legible
- [ ] Calculadoras Justicia/Correos responsive

---

## 9. ACTIVACIÓN — Orden recomendado

### Paso 1: Verificar FASE 0 (arquitectura)
Prerequisito de todo. Si algo falla aquí, no activar nada.

### Paso 2: Verificar supuesto test C1 AGE (FASE 2.5)
Ya en producción para usuarios C1. Verificar que funciona end-to-end.

### Paso 3: Activar Correos
1. Crear producto Stripe Pack Correos 39.99€
2. Añadir STRIPE_PRICE_PACK_CORREOS en Vercel env vars
3. `UPDATE oposiciones SET activa = true WHERE slug = 'correos'`
4. Verificar sección 2 completa
5. Notificar waitlist: `pnpm notify:waitlist correos`

### Paso 4: Activar Auxilio Judicial
1. Crear producto Stripe
2. `UPDATE oposiciones SET activa = true WHERE slug = 'auxilio-judicial'`
3. Verificar sección 3.1 + 3.5

### Paso 5: Activar Tramitación Procesal
Requiere GAP-2 (ofimática como ejercicio separado) si se quiere ejercicio 3.
Sin GAP-2: se puede activar solo con test teórico + supuesto test.

### Paso 6: Activar Gestión Procesal
Requiere GAP-4 (desarrollo escrito con rúbrica MJU) para ejercicio 3.
Sin GAP-4: se puede activar solo con test teórico + supuesto test.
