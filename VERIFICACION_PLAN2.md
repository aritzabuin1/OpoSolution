# Verificación Plan2 — Guía paso a paso de activación

> Activar cada oposición de forma **individual y ordenada**.
> NO activar la siguiente hasta que la anterior esté 100% verificada.
> Marcar [x] cada paso completado. Si falla, anotar error al lado.

---

## Orden de activación recomendado

1. **Correos** (más simple: 1 ejercicio, sin penalización, 12 temas)
2. **Auxilio Judicial** (2 ejercicios, penalización -1/4, 26 temas)
3. **Tramitación Procesal** (3 ejercicios, penalización -1/4, 37 temas — incluye ofimática)
4. **Gestión Procesal** (3 ejercicios, penalización -1/4, 68 temas — incluye desarrollo escrito)

---

## 0. PRE-REQUISITOS (una sola vez, antes de activar cualquier oposición)

### 0.1 Migrations aplicadas en Supabase Dashboard
Verificar en SQL Editor: `SELECT * FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 15`

- [ ] 047 — rama + scoring_config + campos nuevos en oposiciones
- [ ] 048 — Correos oposición + 12 temas
- [ ] 049 — Justicia 3 oposiciones + temas
- [ ] 050 — Waitlist
- [ ] 051 — Fix scoring_config C1 AGE
- [ ] 052 — Tablas supuesto_test
- [ ] 053 — Fix scoring_config Correos
- [ ] 054 — Feature flag supuesto_test
- [ ] 055 — Gestión Procesal temas 17-68
- [ ] 056 — Expand conocimiento_tecnico bloque

### 0.2 Verificar datos base
```sql
-- 7 oposiciones deben existir
SELECT slug, nombre, activa, rama, nivel, num_temas FROM oposiciones ORDER BY rama, orden;
-- Esperado: aux-admin-estado (activa), administrativo-estado (activa), gestion-estado (activa),
--           correos (inactiva), auxilio-judicial (inactiva), tramitacion-procesal (inactiva), gestion-procesal (inactiva)

-- Temas por oposición
SELECT o.slug, COUNT(t.id) as temas FROM oposiciones o JOIN temas t ON t.oposicion_id = o.id GROUP BY o.slug ORDER BY o.slug;
-- Esperado: aux-admin-estado=28, administrativo-estado=45, gestion-estado=58, correos=12, auxilio-judicial=26, tramitacion-procesal=37, gestion-procesal=68

-- Free bank completo
SELECT o.slug, COUNT(fb.id) as free_bank FROM oposiciones o LEFT JOIN free_question_bank fb ON fb.oposicion_id = o.id GROUP BY o.slug;
-- Esperado: cada oposición tiene ≥ num_temas entries (idealmente num_temas × 1)

-- Preguntas oficiales
SELECT o.slug, COUNT(po.id) as preguntas FROM oposiciones o JOIN examenes_oficiales eo ON eo.oposicion_id = o.id JOIN preguntas_oficiales po ON po.examen_id = eo.id GROUP BY o.slug;
-- Esperado: aux-admin-estado ~311, administrativo-estado ~280, gestion-estado ~218, correos ~350+, auxilio-judicial ~269, tramitacion-procesal ~199, gestion-procesal ~288
```

### 0.3 Build y tests
- [ ] `pnpm build` sin errores
- [ ] `pnpm test` — todos pasan (los 6 failures de retrieval.test.ts buildContext son pre-existentes, ignorar)
- [ ] TypeScript: `npx tsc --noEmit` sin errores

### 0.4 Env vars en Vercel
- [ ] `STRIPE_PRICE_PACK_CORREOS` configurada
- [ ] `STRIPE_PRICE_PACK_AUXILIO` configurada
- [ ] `STRIPE_PRICE_PACK_TRAMITACION` configurada
- [ ] `STRIPE_PRICE_PACK_GESTION_J` configurada
- [ ] Todas las demás env vars existentes siguen correctas

---

## 1. CORREOS — Activación y verificación

### 1.1 Stripe
- [ ] Crear producto "Pack Correos" en Stripe Dashboard (39,99€, pago único)
- [ ] Copiar `price_id` → Vercel env var `STRIPE_PRICE_PACK_CORREOS`
- [ ] Redesplegar en Vercel para que coja la nueva env var

### 1.2 Activar en BD
```sql
UPDATE oposiciones SET activa = true WHERE slug = 'correos';
```
- [ ] Ejecutado

### 1.3 Verificar registro
- [ ] Ir a `/register` → Correos aparece como opción seleccionable (no "Próximamente")
- [ ] Agrupar por rama: "Correos" aparece en su propia sección
- [ ] Registrar usuario de prueba con oposición = Correos
- [ ] Email de confirmación llega correctamente

### 1.4 Verificar dashboard
- [ ] Dashboard carga sin errores
- [ ] Muestra 12 temas de Correos (no temas de AGE)
- [ ] IPR card visible con 0 datos (nuevo usuario)
- [ ] Sidebar muestra solo features de Correos (no supuesto práctico, no radar si no hay datos)

### 1.5 Verificar generación de tests
- [ ] Clic en Tema 1 ("Marco normativo postal") → genera test
- [ ] Test tiene 10 preguntas (free user)
- [ ] Las preguntas son sobre Correos (no sobre AGE/Constitución)
- [ ] Estilo: enunciados cortos (~17 palabras), opciones ~10 palabras
- [ ] NO hay citas de artículos inexistentes (verificación funciona con Ley 43/2010 y RD 1829/1999)
- [ ] Completar test → resultados muestran **"Sin penalización — responde todas las preguntas"**
- [ ] Puntuación sobre 100 (no sobre 10, no sobre 60)

### 1.6 Verificar free bank
- [ ] Segundo clic en Tema 1 → 402 "Ya has completado el test gratuito"
- [ ] PaywallGate muestra Pack Correos 39,99€
- [ ] Clic en otro tema (ej: Tema 3 "Productos y servicios") → genera test distinto
- [ ] Las preguntas son del tema correcto (no repetidas del Tema 1)

### 1.7 Verificar simulacros
- [ ] Ir a `/simulacros` → ve exámenes oficiales Correos 2023
- [ ] Clic en simulacro → genera con preguntas oficiales reales
- [ ] Timer proporcional (100q=110min, 20q=22min)
- [ ] Completar → resultados SIN penalización
- [ ] Free: máximo 3 simulacros (20 preguntas cada uno)

### 1.8 Verificar scoring Correos
- [ ] Resultados NO muestran fórmula -1/3 (Correos no penaliza)
- [ ] Muestra "Sin penalización — responde todas las preguntas"
- [ ] Nota calculada correctamente: aciertos × 0.60

### 1.9 Verificar Stripe checkout
- [ ] Clic en "Comprar Pack Correos" → redirect a Stripe
- [ ] Completar compra (usar tarjeta test 4242...)
- [ ] Webhook procesa correctamente → `compras` tabla tiene nueva entry
- [ ] Tras compra: tests ilimitados (20/día), simulacros ilimitados, 20 análisis

### 1.10 Verificar landing y SEO
- [ ] `/oposiciones/correos` → carga correctamente, datos actualizados
- [ ] Hero de landing principal menciona Correos
- [ ] `/precios` → tab Correos muestra Pack 39,99€
- [ ] Sitemap incluye `/oposiciones/correos`

### 1.11 Verificar aislamiento
- [ ] Usuario Correos NO ve temas de AGE ni Justicia
- [ ] Tests generados son de legislación postal (no Constitución, no LPAC)
- [ ] Simulacros solo muestran exámenes de Correos (no INAP)

---

## 2. AUXILIO JUDICIAL — Activación y verificación

### 2.1 Stripe
- [ ] Crear producto "Pack Auxilio Judicial" en Stripe Dashboard (49,99€)
- [ ] Copiar `price_id` → Vercel env var `STRIPE_PRICE_PACK_AUXILIO`
- [ ] Redesplegar

### 2.2 Activar en BD
```sql
UPDATE oposiciones SET activa = true WHERE slug = 'auxilio-judicial';
```
- [ ] Ejecutado

### 2.3 Verificar registro
- [ ] `/register` → "Auxilio Judicial" aparece en sección "Justicia"
- [ ] Badge "Próximamente" ya NO aparece en Auxilio
- [ ] Registrar usuario de prueba

### 2.4 Verificar dashboard
- [ ] 26 temas de Auxilio (Constitución hasta Protección de datos)
- [ ] Card "Estructura del examen" visible: 2 ejercicios (Test 100q + Caso práctico 40q)

### 2.5 Verificar generación de tests
- [ ] Genera test → preguntas con estilo MJU (formales, ~27 palabras, citas LEC/LECrim/LOPJ)
- [ ] Verificación de citas funciona (artículos reales de legislación procesal)
- [ ] Completar → resultados CON penalización -1/4
- [ ] Fórmula visible: "Acierto +0,60 / Error -0,15"

### 2.6 Verificar simulacros
- [ ] Exámenes 2024 y 2025 disponibles
- [ ] Simulacro con preguntas oficiales del MJU (no INAP)
- [ ] Penalización -1/4 aplicada en resultados
- [ ] Timer proporcional al número de preguntas

### 2.7 Verificar supuesto test (caso práctico)
- [ ] Ir a `/supuesto-test` → disponible para Auxilio
- [ ] Genera caso práctico procesal (no administrativo)
- [ ] Split view: caso sticky + preguntas
- [ ] Completar → scoring sobre 40 pts, min aprobado 20
- [ ] Free: 1 supuesto gratis (oficial MJU 2024)

### 2.8 Verificar few-shot
- [ ] Las preguntas generadas se parecen al estilo MJU (no INAP)
- [ ] Header dice "EJEMPLOS REALES DEL MJU" (no "DEL INAP")

### 2.9 Verificar Stripe
- [ ] Checkout Pack Auxilio 49,99€ funciona
- [ ] Tras compra: acceso ilimitado solo a Auxilio (no a Tramitación/Gestión)

### 2.10 Verificar aislamiento
- [ ] Usuario Auxilio NO ve temas de Correos, AGE ni otras Justicia
- [ ] Simulacros solo de Auxilio
- [ ] Legislación es procesal (LEC, LECrim, LOPJ), no administrativa (LPAC, LRJSP)

---

## 3. TRAMITACIÓN PROCESAL — Activación y verificación

### 3.1 Stripe
- [ ] Crear producto "Pack Tramitación Procesal" (49,99€)
- [ ] Env var `STRIPE_PRICE_PACK_TRAMITACION`
- [ ] Redesplegar

### 3.2 Activar en BD
```sql
UPDATE oposiciones SET activa = true WHERE slug = 'tramitacion-procesal';
```
- [ ] Ejecutado

### 3.3 Verificar registro
- [ ] "Tramitación Procesal" seleccionable en sección Justicia

### 3.4 Verificar dashboard
- [ ] 37 temas (15 constitucional + 16 procesal + 6 ofimática)
- [ ] Card "Estructura del examen": 3 ejercicios (Test 100q + Práctico 10q + Ofimática 20q)

### 3.5 Verificar generación tests
- [ ] Temas procesales: preguntas formales, opciones largas (~15 palabras)
- [ ] Temas ofimática: preguntas sobre Word, Excel, Access
- [ ] Penalización -1/4 en resultados

### 3.6 Verificar simulacros
- [ ] Exámenes 2024 y 2025 de Tramitación
- [ ] Preguntas oficiales MJU correctas

### 3.7 Verificar scoring multi-ejercicio
- [ ] Si hay datos de caso práctico: scoring por ejercicio separado
- [ ] Min aprobado por ejercicio verificable

### 3.8 Verificar Stripe + aislamiento
- [ ] Pack Tramitación 49,99€ funciona
- [ ] Solo acceso a Tramitación (no Auxilio ni Gestión)

---

## 4. GESTIÓN PROCESAL — Activación y verificación

### 4.1 Stripe
- [ ] Crear producto "Pack Gestión Procesal" (79,99€)
- [ ] Env var `STRIPE_PRICE_PACK_GESTION_J`
- [ ] Redesplegar

### 4.2 Activar en BD
```sql
UPDATE oposiciones SET activa = true WHERE slug = 'gestion-procesal';
```
- [ ] Ejecutado

### 4.3 Verificar registro
- [ ] "Gestión Procesal" seleccionable en sección Justicia

### 4.4 Verificar dashboard
- [ ] 68 temas (organización + procesal civil + registros + penal + contencioso + mercantil)
- [ ] Card "Estructura del examen": 3 ejercicios (Test + Caso práctico + Desarrollo)

### 4.5 Verificar generación tests
- [ ] Preguntas procesales: citas LEC, LECrim, LOPJ, LO 1/2025
- [ ] Penalización -1/4

### 4.6 Verificar simulacros
- [ ] Exámenes 2023, 2024, 2025 de Gestión Procesal
- [ ] ~288 preguntas oficiales disponibles

### 4.7 Verificar corrección desarrollo escrito (tercer ejercicio)
- [ ] Ir a `/supuesto-practico` → genera caso de desarrollo (5 preguntas, 45 min)
- [ ] Rúbrica MJU aplicada: conocimiento (3pts) + claridad (1pt) + expresión (0.5pts) + presentación (0.5pts)
- [ ] Total sobre 25 pts, min aprobado 12.5
- [ ] Feedback cita normativa procesal (no administrativa)

### 4.8 Verificar Stripe + aislamiento
- [ ] Pack Gestión 79,99€ funciona
- [ ] Solo acceso a Gestión Procesal

---

## 5. PACKS COMBO JUSTICIA — Verificación

### 5.1 Pack Doble Justicia (79,99€)
- [ ] Crear producto en Stripe
- [ ] Compra da acceso a Auxilio + Tramitación simultáneamente
- [ ] Dashboard cambia según qué oposición seleccione el usuario en su perfil
- [ ] Temas y simulacros correctos según selección

### 5.2 Pack Triple Justicia (139,99€)
- [ ] Crear producto en Stripe
- [ ] Compra da acceso a Auxilio + Tramitación + Gestión
- [ ] Las 3 oposiciones funcionan al cambiar de perfil

---

## 6. VERIFICACIÓN TRANSVERSAL (después de activar todas)

### 6.1 Landing principal
- [ ] Hero dice "AGE · Correos · Justicia — 10.000+ plazas en 7 oposiciones"
- [ ] Sección "Elige tu oposición" muestra las 3 ramas activas
- [ ] Cards de Correos y Justicia ya NO dicen "Próximamente"
- [ ] WaitlistForm ya no aparece (o se auto-oculta cuando activa)

### 6.2 Pricing page
- [ ] `/precios` → tabs AGE, Justicia, Correos todos funcionales
- [ ] Precios correctos por pack
- [ ] Ramas activas: CTA "Comprar" funcional
- [ ] Comparativa free vs premium correcta

### 6.3 Registro dinámico
- [ ] 7 oposiciones visibles, agrupadas por rama
- [ ] Todas seleccionables (ninguna "Próximamente")

### 6.4 Admin panel
- [ ] `/admin` muestra métricas de las 7 oposiciones
- [ ] Desglose por oposición en analytics
- [ ] Costes API desglosados por rama

### 6.5 SEO
- [ ] Todas las sub-landings indexables: `/oposiciones/correos`, `/oposiciones/justicia/*`
- [ ] Sitemap actualizado con todas las rutas
- [ ] `llms.txt` menciona las 7 oposiciones con datos de exámenes
- [ ] Blog posts de Correos (8) y Justicia (15) accesibles

### 6.6 Radar del Tribunal
- [ ] Funciona para cada oposición (datos de frecuencias_temas disponibles para 7 opos)
- [ ] C2 AGE: radar histórico INAP 2018-2024
- [ ] Justicia: radar MJU con datos 2023-2025
- [ ] Correos: radar con datos 2023

### 6.7 Reto diario
- [ ] Funciona para usuarios de todas las oposiciones
- [ ] Preguntas generadas son del tema correcto (no cross-contamination)

### 6.8 Flashcards
- [ ] Se generan correctamente para temas de Justicia/Correos
- [ ] Legislación referenciada es la correcta por rama

---

## 7. ROLLBACK — Si algo falla

Para desactivar una oposición sin perder datos:
```sql
-- Desactivar (los usuarios existentes siguen pero no se registran nuevos)
UPDATE oposiciones SET activa = false WHERE slug = '<slug>';
```

Para resetear un usuario de prueba:
```sql
-- Borrar tests del usuario (cascada limpia)
DELETE FROM tests_generados WHERE user_id = '<user-id>';
-- Resetear free counters
UPDATE profiles SET free_tests_used = 0, free_simulacro_used = 0, free_psico_used = 0, free_corrector_used = 0 WHERE id = '<user-id>';
```

---

## Checklist resumen

| Oposición | Stripe | BD activa | Registro | Tests | Simulacros | Scoring | Supuesto | Aislamiento |
|-----------|--------|-----------|----------|-------|------------|---------|----------|-------------|
| Correos | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | N/A | [ ] |
| Auxilio | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Tramitación | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Gestión | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Combos Justicia | [ ] | N/A | N/A | N/A | N/A | N/A | N/A | [ ] |
| Transversal | N/A | N/A | [ ] | N/A | N/A | N/A | N/A | [ ] |
