# Banco Progresivo — Tests y Supuestos

> Documento de referencia. Parte CRITICA de OpoRuta.
> De esto depende que el gasto en IA tienda a 0€ conforme crecen los usuarios.

---

## Principio fundamental

**El primer usuario que genera contenido con IA lo paga. Todos los siguientes lo reciben gratis.**

La IA solo se usa cuando no hay contenido disponible en el banco. Cada generación alimenta el banco para futuros usuarios. Conforme crece la base de usuarios, el % de contenido servido desde banco sube y el coste IA baja.

---

## 1. BANCO PROGRESIVO DE TESTS POR TEMA

### Tablas

| Tabla | Qué almacena | Quién la usa |
|---|---|---|
| `free_question_bank` | 10 preguntas fijas por tema. Todos los free users ven las mismas. | Free users |
| `question_bank` | Preguntas individuales generadas por IA. Crecen con cada generación. | Premium users |
| `user_questions_seen` | Qué preguntas del banco ha visto cada usuario. PK: (user_id, question_id) | Tracking |

### Flujo FREE

```
Free user pide test del Tema 5:
  → Siempre recibe las mismas 10 preguntas de free_question_bank
  → Puede repetirlas las veces que quiera
  → Si el free bank no tiene ese tema → genera con IA (y guarda para futuros free users)
```

Es siempre el mismo test. Sin variación. El free bank se pobla una sola vez por tema.

### Flujo PREMIUM

```
Premium user pide test del Tema 5 (10 preguntas, dificultad media):

PASO 1 — Consultar banco
  → Contar TOTAL de preguntas en question_bank para (Tema 5, media)
  → Obtener las que ESE usuario NO ha visto (NOT IN user_questions_seen)
  → Calcular: unseenRatio = sin_ver / total

PASO 2 — Decidir: banco o IA
  → SI tiene suficientes sin ver (≥10) Y ha visto menos del 90% del banco:
      ✅ Servir del banco (€0 IA)
      → Mezclar aleatoriamente → tomar 10 → servir
      → Marcar como vistas en user_questions_seen

  → SI no tiene suficientes O ha visto ≥90% del banco:
      🤖 Generar con IA (~$0.005)
      → Cada pregunta generada se compara contra el banco (dedup 3 niveles)
      → Solo las UNICAS se guardan en question_bank
      → Las duplicadas se descartan (no entran al banco)
      → El test se sirve al usuario

PASO 3 — El banco crece
  → Las preguntas nuevas quedan disponibles para TODOS los premium
  → El siguiente premium que pida Tema 5 tiene más preguntas en el banco
  → Menos probabilidad de necesitar IA → coste tiende a €0
```

### El threshold del 90%

El 90% es la clave del flywheel. Sin él, un usuario que ha visto todo seguiría recibiendo las mismas preguntas del banco (repetidas). Con el threshold:

- Mientras ha visto **< 90%** → recibe preguntas del banco que no ha visto (€0)
- Cuando ha visto **≥ 90%** → se genera con IA → el banco crece → otros usuarios se benefician

### Ejemplo con números reales

```
Día 1: banco tiene 50 preguntas para Tema 5 (seed)

User 1 pide test de 10 → tiene 50 sin ver → sirve del banco (€0)
User 1 pide otro test → tiene 40 sin ver → sirve del banco (€0)
User 1 pide otro (5° test) → tiene 0 sin ver → unseenRatio = 0/50 = 0%
  → Genera con IA → 10 preguntas nuevas → dedup → 8 únicas entran al banco
  → Banco = 58

User 2 llega → tiene 58 sin ver → sirve del banco (€0)
User 2 repite 5 veces → tiene 8 sin ver → unseenRatio = 8/58 = 14% > 10%
  → Aún sirve del banco
User 2 repite otra vez → tiene 0 sin ver → 0/58 = 0% → genera con IA
  → 7 únicas entran → banco = 65

User 50 llega → tiene 65 sin ver → todos sus tests salen del banco → €0
```

### Elección de 10, 20 o 30 preguntas

El premium puede elegir tests de 10, 20 o 30 preguntas. Esto afecta a la decisión:

| Banco | Pide | Sin ver | Ratio | Resultado |
|---|---|---|---|---|
| 50 preguntas | 10 | 40 | 80% | Sirve del banco |
| 50 preguntas | 30 | 40 | 80% | Sirve del banco |
| 50 preguntas | 30 | 20 | 40% | **No hay suficientes** (20 < 30) → genera con IA |
| 100 preguntas | 10 | 8 | 8% | **≥90% visto** → genera con IA |

Se necesitan AMBAS condiciones: suficientes para llenar el test Y no haber visto ≥90%.

### Deduplicación (3 niveles, €0 IA)

Al guardar preguntas generadas en el banco, cada una pasa por 3 filtros:

1. **Hash exacto** — SHA-256 del enunciado normalizado. Detecta copias idénticas.
2. **Fingerprint legal** — `tema + ley + artículo + respuesta correcta`. Detecta misma pregunta con redacción distinta sobre el mismo artículo.
3. **Jaccard word-trigrams** — Similitud por trigramas de palabras (threshold 0.6). Detecta reformulaciones que los otros 2 niveles no cazaron.

Solo se guarda en el banco si pasa los 3 filtros (no es duplicada de ninguna existente).

### Archivos clave

| Archivo | Qué hace |
|---|---|
| `app/api/ai/generate-test/route.ts` | Endpoint principal. Línea ~449: sirve del banco. Línea ~550: guarda en banco con dedup. |
| `lib/utils/question-dedup.ts` | 3 niveles de deduplicación (computeHash, buildLegalKey, jaccardSimilarity) |
| `supabase/migrations/20260324_045_question_banks.sql` | Crea las 3 tablas (free_question_bank, question_bank, user_questions_seen) |

---

## 2. BANCO PROGRESIVO DE SUPUESTOS TEST

### Tablas

| Tabla | Qué almacena | Quién la usa |
|---|---|---|
| `free_supuesto_bank` | 1 supuesto fijo por oposición (oficial INAP/MJU). UNIQUE(oposicion_id). | Free users |
| `supuesto_bank` | Supuestos completos (caso + 20 preguntas). Crecen con generación IA. | Premium users |
| `user_supuestos_seen` | Qué supuestos ha visto cada usuario. PK: (user_id, supuesto_id) | Tracking |

### Diferencia clave con tests

Un **test** son preguntas individuales que se mezclan. Un **supuesto** es una unidad atómica: caso narrativo + 20 preguntas vinculadas al caso. No se pueden mezclar preguntas de supuestos distintos.

Por eso el tracking es diferente:
- Tests: se trackean **preguntas individuales** (user_questions_seen)
- Supuestos: se trackean **supuestos completos** (user_supuestos_seen)

### Flujo FREE

```
Free user pide supuesto test:
  → Recibe siempre el mismo supuesto (oficial del examen real)
  → Puede repetirlo las veces que quiera
  → Si ya lo ha hecho una vez → paywall "Hazte premium"
```

### Flujo PREMIUM

```
Premium user pide supuesto test:

PASO 1 — ¿Hay supuestos sin ver en el banco?
  → Query: supuesto_bank WHERE oposicion_id = X
           AND id NOT IN (SELECT supuesto_id FROM user_supuestos_seen WHERE user_id = Y)
           ORDER BY created_at ASC (los más antiguos = mejor calidad = primero)

PASO 2A — SÍ hay sin ver:
  ✅ Servir del banco (€0 IA, instantáneo)
  → Marcar como visto en user_supuestos_seen
  → El usuario puede repetirlo después (mode='repeat', gratis)

PASO 2B — NO hay sin ver (ha visto todos):
  → ¿Tiene créditos IA?
    → NO: paywall "Necesitas 1 crédito IA. Recarga 10 por 9,99€"
    → SÍ: genera 1 supuesto con IA (~30 segundos, ~$0.35)
      → Valida con Zod (mínimo 60% de preguntas esperadas)
      → Si validación falla → error, NO cobra crédito, usuario reintenta
      → Si OK → guarda en supuesto_bank → marca como visto → cobra 1 crédito → sirve

PASO 3 — El banco crece
  → El supuesto generado queda disponible para TODOS los premium de esa oposición
  → El siguiente premium que llegue aquí lo verá como "sin ver" → €0
```

### La trampa del modelo de negocio

```
Banco inicial: 10 supuestos (oficiales + seed). Coste nuestro: ~$3.50.

User 1 (premium) → ve los 10 gratis (incluidos en pack)
  → quiere más → paga 1 crédito → generamos 1 con IA → banco = 11
  → paga otro crédito → generamos 1 → banco = 12
  → (gasta 5 créditos) → banco = 15

User 2 (premium) → ve los 10 primeros gratis
  → quiere más → paga 1 crédito → LE SERVIMOS el 11° del User 1 (€0 IA para nosotros)
  → paga otro → le servimos el 12° (€0)
  → Paga 5 créditos → ve hasta el 15° (€0 IA en todos)
  → quiere el 16° → NO hay → ahora sí generamos con IA → banco = 16

User 3 → misma historia, pero ahora tiene 16 para ver antes de que necesitemos generar

A cada usuario le parecen "nuevos" porque no los ha visto.
Nosotros solo pagamos IA cuando se agota el banco para TODOS.
Ingresos: N usuarios × créditos gastados. Coste: solo las generaciones reales.
```

### Modelo económico supuestos

| Premium users acumulados | Supuestos en banco | % servido sin IA | Coste IA por "venta" de 1 crédito |
|---|---|---|---|
| 1-5 | 10-15 | ~70% | ~$0.10 |
| 5-20 | 15-25 | ~90% | ~$0.03 |
| 20-50 | 25-30 | ~97% | ~$0.01 |
| 50+ | 30+ (tope práctico) | ~99% | ~$0.003 |

Precio del crédito: ~1€ (recarga 9,99€ / 10 créditos). Margen: >95% a partir de 20 users.

### Que el usuario pueda repetir supuestos

El usuario puede repetir cualquier supuesto que ya haya visto, sin coste, las veces que quiera. Esto es importante para practicar.

El endpoint acepta `mode: 'repeat'` con el `supuestoId` del supuesto a repetir. No gasta crédito, no marca como "nuevo visto" — simplemente crea un nuevo `tests_generados` con el mismo caso y preguntas.

### UI: información al usuario

La página `/supuesto-test` muestra al usuario:

```
┌─────────────────────────────────────────┐
│     Supuestos completados: 8 de 10      │  ← ha visto 8, quedan 2 sin ver
│     2 sin hacer                         │
│                                         │
│     [▶ Siguiente supuesto]              │  ← sirve del banco (gratis)
│                                         │
│     12 supuestos practicados            │  ← total incluyendo repeticiones
└─────────────────────────────────────────┘
```

Cuando ha visto todos:

```
┌─────────────────────────────────────────┐
│     Supuestos completados: 10 de 10     │
│                                         │
│     [⚡ Nuevo supuesto — 1 crédito IA]  │  ← genera o sirve del banco
│                                         │
│     7 créditos disponibles              │
│     La generación tarda ~30 segundos    │
│                                         │
│     Sin créditos? Recarga 10 por 9,99€  │
└─────────────────────────────────────────┘
```

### Archivos clave

| Archivo | Qué hace |
|---|---|
| `app/api/ai/generate-supuesto-test/route.ts` | Endpoint principal. Sirve unseen → paywall → genera con IA. Acepta mode='new'/'repeat'. |
| `lib/ai/supuesto-test.ts` | Config por oposición (preguntas, timer, penalización). Prompts de generación. Schema Zod. |
| `components/supuesto-test/SupuestoTestLauncher.tsx` | UI: botón, stats, loading, paywall. |
| `supabase/migrations/20260326_052_supuesto_test_tables.sql` | Crea las 3 tablas + RLS. |

---

## 3. RESUMEN COMPARATIVO

| | Tests por tema | Supuestos test |
|---|---|---|
| **Unidad** | Pregunta individual | Supuesto completo (caso + 20 preguntas) |
| **Banco** | `question_bank` | `supuesto_bank` |
| **Tracking** | `user_questions_seen` (por pregunta) | `user_supuestos_seen` (por supuesto) |
| **Free** | Siempre las mismas 10 preguntas | Siempre el mismo supuesto |
| **Premium gratis** | Sirve del banco mientras quede >10% sin ver | Sirve mientras queden sin ver |
| **Genera con IA cuando** | Ha visto ≥90% del banco O no hay suficientes | Ha visto todos (0 sin ver) + tiene crédito |
| **Coste generación** | Incluido (no gasta crédito) | 1 crédito IA por supuesto nuevo |
| **Dedup** | 3 niveles (hash + legal + Jaccard) | Por implementar (título + escenario similarity) |
| **Puede repetir** | Sí (genera test con preguntas del banco) | Sí (mode='repeat' sin coste) |
| **El banco crece con** | Cada generación IA de cualquier premium | Cada crédito gastado que requiere generación real |

---

## 4. POR QUE ESTO FUNCIONA

1. **El contenido se genera UNA VEZ y se sirve INFINITAS veces.** Cada pregunta/supuesto generado con IA se guarda permanentemente en el banco.

2. **El coste se distribuye entre usuarios.** El primer usuario que necesita contenido nuevo lo "paga" (con créditos o con nuestra inversión seed). Todos los siguientes lo reciben gratis.

3. **El banco solo crece, nunca decrece.** No hay expiración. La legislación cambia poco. Una pregunta sobre el artículo 14 CE es válida hoy y dentro de 5 años.

4. **La deduplicación garantiza calidad.** No se meten preguntas repetidas. Cada nueva pregunta en el banco es genuinamente diferente.

5. **El modelo escala inversamente.** Más usuarios = más contenido generado = menos % que necesita IA = menor coste por usuario = mayor margen.

```
Usuarios:    10  →  50  → 200  → 1.000
Hit rate:    30% → 70%  → 90%  → 98%
Coste/user:  alto → medio → bajo → ~€0
Margen:      50% → 80%  → 95%  → 99%
```
