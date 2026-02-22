# ADR-0010 — Modelo de Pricing: Fuel Tank (pago único, sin suscripción)

**Estado**: Aceptado
**Fecha**: 2026-02-22
**Decisores**: Aritz, Claude Sonnet 4.6

---

## Contexto

OPTEK necesita un modelo de monetización sostenible para un mercado español donde:

- La **fatiga de suscripciones** es elevada (Netflix, Spotify, Amazon, apps de idiomas…). Los usuarios rechazan activamente nuevas suscripciones mensuales.
- El **público objetivo** son opositores con presupuesto limitado y horizonte temporal definido (preparar una convocatoria concreta, no "para siempre").
- La **economía unitaria** de la IA varía significativamente según la tarea: correcciones (Sonnet, ~0,035 €/corrección) son 7× más caras que tests MCQ (Haiku, ~0,005 €/test).
- Un modelo de suscripción pura exige **MRR estable** difícil de alcanzar en early-stage con un mercado de nicho.

### Opciones consideradas

| Opción | Pros | Contras |
|--------|------|---------|
| **A. Suscripción mensual** | MRR predecible, retención natural | Fatiga de suscripción en España, churn alto, difícil justificar valor continuo |
| **B. Freemium + pago único (Fuel Tank)** | Baja barrera de entrada, no hay "suscripción que cancelar", alineado con psicología de compra española | Requiere buen diseño de paywall; no garantiza recurrencia |
| **C. Pago por uso puro** | Máxima flexibilidad | Impredecible para el usuario, difícil de presupuestar, fricción en cada acción |
| **D. Modelo híbrido** | Flexibilidad total | Complejidad operativa, difícil de comunicar |

---

## Decisión

**Opción B: Freemium + Fuel Tank (pago único, sin suscripción).**

### Planes

| Plan | Precio | Tipo | Correcciones | Tests |
|------|--------|------|-------------|-------|
| **Gratis** | 0 € | — | 2 (total) | 5 (total) |
| **Por tema** | 4,99 € | One-time | +5 | Ilimitados (1 tema) |
| **Pack Oposición** | 34,99 € | One-time | +20 | Ilimitados (todo el temario) |
| **Recarga** | 8,99 € | One-time | +15 | — |

### Límite silencioso de seguridad

- Tests: **20/día por usuario** (vía Upstash rate limiter). No se comunica explícitamente.
- Correcciones: escasas por diseño — son el recurso valioso que genera recurrencia (Recarga).

---

## Fundamento (Behavioral Science)

### 1. Endowment Effect
Las correcciones funcionan como "combustible" en un depósito. El usuario que ve `corrections_balance: 12` siente que posee algo, y cuando baja a 3 experimenta escasez activa → conversión a Recarga sin necesidad de suscripción.

### 2. Pain of Paying — Reducido
Un pago único de 34,99 € activa menos "dolor de pago" a lo largo del tiempo que 12 × 12,99 € anuales, aunque el total sea mayor. El usuario percibe el pack como inversión, no como coste recurrente.

### 3. Decoy Effect
El plan "Por tema" (4,99 €) actúa como decoy que hace el "Pack Oposición" (34,99 €) parecer mucho mejor valor (7 temas × 4,99 € = 34,93 €, más tests ilimitados de todo, más 4× correcciones).

### 4. Peak-End Rule
La experiencia "gratis" tiene un final natural (5 tests usados) en un momento de alta motivación (el usuario acaba de descubrir OPTEK). El paywall llega en el peak de engagement.

### 5. Loss Aversion
"¿Te quedas sin correcciones?" es más efectivo que "¿Quieres más correcciones?". El copy del paywall 402 usa lenguaje de reposición, no de venta.

---

## Economía unitaria

### Coste por usuario (escenario pesimista: 20 tests/día)

```
Tests:       20 tests/día × 0,005 €/test × 30 días = 3,00 €/mes (Haiku)
Correcciones: 5/mes × 0,035 €/corrección             = 0,18 €/mes (Sonnet)
Total coste: ~3,18 €/mes usuario activo pesimista
```

### Revenue por compra

```
Pack (34,99 €) — Stripe fee (~3%): neto ~33,94 €
Payback: ~10 meses de uso pesimista continuo
Usuario típico: 2-5 tests/día, 1-2 correcciones/semana → coste real ~0,50 €/mes
Pack en usuario típico: payback en ~2 meses
```

### Recarga recurrente

Si un usuario compra Pack + 2 Recargas al año: LTV = 34,99 + 2 × 8,99 = **52,97 €** sin suscripción.

---

## Implementación técnica

### Base de datos (`profiles`)
```sql
corrections_balance INTEGER DEFAULT 0 NOT NULL
free_corrector_used INTEGER DEFAULT 0 NOT NULL  -- máx 2
free_test_used      INTEGER DEFAULT 0 NOT NULL  -- máx 5
```

### RPCs atómicas (previenen race conditions — DDIA Consistency)
- `grant_corrections(p_user_id, p_amount)` — al comprar (webhook Stripe)
- `use_correction(p_user_id) → BOOLEAN` — descuenta del balance de pago
- `use_free_correction(p_user_id) → BOOLEAN` — descuenta de la cuota gratuita
- `use_free_test(p_user_id) → BOOLEAN` — descuenta de la cuota gratuita

### Modelos IA (separación por coste)
- **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`) → tests MCQ → ~0,005 €/test
- **Claude Sonnet 4.6** (`claude-sonnet-4-6`) → correcciones → ~0,035 €/corrección

### Paywall (HTTP 402)
```json
{
  "error": "Has agotado tus correcciones disponibles.",
  "code": "PAYWALL_CORRECTIONS",
  "upsell": [
    { "id": "recarga", "name": "Recarga", "price": "8,99€", "description": "+15 correcciones IA" },
    { "id": "pack", "name": "Pack Oposición", "price": "34,99€", "description": "..." }
  ]
}
```

### Variables de entorno requeridas
```
STRIPE_PRICE_TEMA=price_xxx      # 4,99€ one-time
STRIPE_PRICE_PACK=price_xxx      # 34,99€ one-time
STRIPE_PRICE_RECARGA=price_xxx   # 8,99€ one-time
```

---

## Consecuencias

**Positivas:**
- Sin churn mensual — el usuario no "cancela", simplemente no recompra.
- Paywall natural en el momento de mayor engagement.
- Economía viable incluso con heavy users gracias a Haiku para tests.
- Modelo simple de comunicar: "Paga una vez, úsalo para siempre."

**Negativas / Riesgos:**
- Sin MRR garantizado — ingresos por pulsos de compra, no recurrentes.
- Requiere volumen de nuevos usuarios para compensar la ausencia de suscripciones.
- Si el límite silencioso de 20 tests/día es insuficiente, se ajusta sin cambio de modelo.

**Mitigación:**
- Recarga (8,99 €) crea recurrencia natural sin el nombre de "suscripción".
- Monitorizar `api_usage_log` para detectar patrones de uso extremo → ajustar límites.
- Si LTV < coste en 6 meses → revisar precio del Pack o introducir límite de tests para usuarios Gratis.

---

## Referencias

- `directives/OPTEK_security.md` §6 — verificación firma Stripe
- `optek/supabase/migrations/20260222_006_pricing_credits.sql` — RPCs atómicas
- `optek/lib/stripe/client.ts` — STRIPE_PRICES, CORRECTIONS_GRANTED
- `optek/lib/ai/claude.ts` — callClaude (Sonnet) + callClaudeHaiku (Haiku)
- `optek/app/api/ai/generate-test/route.ts` — paywall tests
- `optek/app/api/ai/correct-desarrollo/route.ts` — paywall correcciones
- `optek/app/api/stripe/webhook/route.ts` — grant_corrections tras compra
