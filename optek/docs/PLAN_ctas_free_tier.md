# Plan: CTAs de compra en features bloqueadas + supuesto práctico gratis

**Fecha**: 2026-03-25
**Objetivo**: Maximizar conversión free → paid poniendo CTAs directos en cada punto donde el usuario free encuentra un muro.

---

## 1. Supuesto práctico gratis para A2

**Qué**: Dar 1 supuesto práctico gratuito a usuarios A2 free (actualmente 0).
**Por qué**: Sin probarlo, el usuario no percibe el valor. 1 gratis demuestra que la corrección IA funciona → urgencia de comprar más.

### Cambios:
- `lib/freemium.ts` — añadir `FREE_SUPUESTOS = 1`
- `app/(dashboard)/supuesto-practico/page.tsx` — check: si `supuestos_used < FREE_SUPUESTOS` → permitir generar
- `app/api/ai/corregir-supuesto/stream/route.ts` — misma lógica: permitir 1 gratis, luego paywall
- `profiles` — añadir columna `free_supuestos_used` (migration) o reusar `supuestos_balance` con valor inicial 1 para free A2

### Decisión de diseño:
- **Opción A**: `supuestos_balance = 1` para free A2 (simple, reusar campo existente)
- **Opción B**: Campo separado `free_supuestos_used` (más limpio, no mezcla free con paid)
- **Recomendación**: Opción A — más simple. Al comprar pack A2, `supuestos_balance` se suma (+5). El free ya lo consumió.

---

## 2. CTAs de compra en TODAS las features bloqueadas

**Qué**: Cada vez que un free user ve una feature que no puede usar, debe haber un botón de compra visible e inmediato.
**Por qué**: Actualmente hay textos tipo "Compra el pack para acceder" sin botón. El usuario tiene que navegar a /cuenta para comprar. Fricción = pérdida de conversión.

### Puntos de la app que necesitan CTA:

| Ubicación | Estado actual | Fix necesario |
|-----------|--------------|---------------|
| `/supuesto-practico` (free A2) | Texto sin botón | Añadir `<BuyButton>` |
| `/simulacros` (free, tras 1er simulacro) | Banner info sin CTA | Añadir `<BuyButton>` |
| `/corrector` (free, tras 2 correcciones) | Texto informativo | Añadir `<BuyButton>` |
| `/tests` paywall modal | Ya tiene CTA | OK |
| `/tests/[id]/resultados` PostTestTrigger | Ya tiene CTA | OK |
| `/radar` (free) | Texto "función Premium" | Añadir `<BuyButton>` |
| `/psicotecnicos` (free, tras 3) | Paywall sin botón directo | Añadir `<BuyButton>` |
| Dashboard — análisis nudge | Ya tiene CTA | OK |
| Sidebar items bloqueados | Sin indicación | Añadir badge "PRO" + click → paywall |

### Componente reutilizable:
Crear `<PaywallCTA />` que recibe:
- `feature`: string descriptivo ("tests ilimitados", "supuestos prácticos", etc.)
- `tier`: 'pack' | 'pack_c1' | 'pack_a2' (auto-detecta según oposición del usuario)

Internamente renderiza:
```
┌─────────────────────────────────────┐
│ 🔒 [feature] es Premium             │
│ [descripción corta del valor]        │
│                                      │
│ [████ Desbloquear — 49,99€ ████]    │
│ Pago único · Sin suscripción         │
└─────────────────────────────────────┘
```

### Hook `useOposicionTier`:
Para que el CTA sepa qué pack mostrar (49,99€ vs 69,99€):
```ts
function useOposicionTier(): { tier: 'pack' | 'pack_c1' | 'pack_a2'; price: string }
```
Lee `oposicion_id` del perfil y mapea al tier correcto.

---

## 3. Fases de ejecución

### Fase 1 — PaywallCTA component + hook (base)
1. Crear `useOposicionTier` hook
2. Crear `<PaywallCTA />` component
3. Tests unitarios

### Fase 2 — Insertar CTAs en features bloqueadas
4. `/supuesto-practico` — CTA cuando balance = 0
5. `/simulacros` — CTA tras 1er simulacro free
6. `/corrector` — CTA tras 2 correcciones free
7. `/radar` — CTA para free users
8. `/psicotecnicos` — CTA tras 3 psicotécnicos free

### Fase 3 — Supuesto práctico gratis A2
9. Migration: `supuestos_balance = 1` para usuarios A2 free (o al registrarse A2)
10. Lógica en supuesto-practico page + API route
11. Paywall tras consumir el gratuito

### Fase 4 — Sidebar PRO badges
12. Badge "PRO" en items del sidebar que requieren premium
13. Click en item bloqueado → paywall modal

---

## 4. Estimación

- Fase 1: ~30 min (componente + hook)
- Fase 2: ~45 min (insertar en 5 páginas)
- Fase 3: ~30 min (migration + lógica)
- Fase 4: ~20 min (sidebar badges)

**Total: ~2h de implementación**

---

## 5. No hacer (fuera de scope)

- Cambiar precios
- Añadir nuevos tiers de pago
- Cambiar el flow de checkout/Stripe
- Email marketing automation (separar en otro plan)
