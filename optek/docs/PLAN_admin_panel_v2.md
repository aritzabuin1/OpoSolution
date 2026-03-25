# Plan: Admin Panel v2 — Observabilidad completa

**Fecha**: 2026-03-25
**Objetivo**: Control total del negocio y la infraestructura. Saber exactamente qué hace cada usuario, dónde se pierde, por qué compra o no, y cómo está el sistema.

---

## Estado actual

3 dashboards + alertas diarias:
- **Economics**: Fuel Tank, coste/test, AARRR, MRR
- **Analytics**: 16 métricas (conversión, DAU, engagement, churn, funnel, temas, scores, CTAs)
- **Infrastructure**: DB, MAU, Redis, Vercel, AI costs, semáforo
- **Alertas**: Email diario 07:00 UTC

---

## Problemas detectados

### A. Métricas desajustadas al free tier v2

El free tier v2 (1 test/tema gratis desde banco fijo, €0) cambia completamente cómo se miden las cosas:

| Métrica | Problema | Fix |
|---------|----------|-----|
| **Coste/test** | Mezcla tests free bank (€0) con IA premium | Separar por `prompt_version`: 'free-bank-1.0' = €0 |
| **Funnel onboarding** | "1er test, 2º test" ya no sirve — todos hacen tests | Nuevo funnel: registro → 1 tema → 3 temas → 5 temas → paywall hit → compra |
| **AARRR activation** | "Completó 1 test" = 100% con free bank, no indica nada | Activation = exploró 3+ temas diferentes |
| **AARRR retention** | racha >= 3 mide consistencia diaria, no retención real | Retención = volvió en semana 2+ tras registro |
| **Feature engagement** | 'tema' no distingue free vs premium | Desglosar: 'Tests free bank' vs 'Tests IA premium' |
| **Free tier metrics** | Usa `free_tests_used` (campo legacy v1) | Usar temas únicos completados (query real) |
| **Banco preguntas** | "Cache hit rate" mide solo premium bank, a 0% | Medir hit rate real: free bank served / total free requests |
| **Completion rate** | Free bank = instantáneo (100%), IA = puede fallar | Separar tasas |
| **Fuel Tank** | No desglosa €0 (free) vs €X (IA) | Mostrar: X tests gratis + Y tests IA = €Z |

### B. Lo que falta completamente

**Visión del usuario individual**
- No podemos ver la timeline de un usuario concreto
- Si alguien escribe "no me funciona", no tenemos contexto
- No sabemos qué vio antes de comprar (o de irse)

**Retención por cohortes**
- No sabemos si los usuarios de la semana 1 vuelven en la semana 2
- Sin cohortes no podemos saber si mejoras en el producto afectan retención

**Segmentación por oposición**
- Todas las métricas mezclan C2, C1 y A2
- Un churn alto puede ser solo de C1 (menos contenido) y no de C2

**Señales de conversión**
- No rastreamos qué hace el usuario JUSTO ANTES de comprar
- ¿Qué paywall vio? ¿Cuántos temas exploró? ¿Usó análisis IA?
- No sabemos cuál es el "momento aha" que activa la compra

**Usuarios en riesgo**
- No identificamos usuarios con alto engagement que NO han comprado
- Estos son los más rentables para un nudge personalizado
- No detectamos usuarios que eran activos y dejaron de venir (pre-churn)

**Salud del contenido**
- No sabemos qué temas tienen peor contenido (más errores reportados, peor score)
- No medimos cobertura del free bank por oposición
- No detectamos temas sin preguntas en el banco

**Email diario = ruido**
- Con free bank, los costes IA ya no son la métrica crítica diaria
- Necesitamos digest semanal con métricas de negocio, no solo costes

---

## Arquitectura de la solución

### Nuevas funciones

| Función | Propósito |
|---------|-----------|
| `getUserTimeline(userId)` | Timeline completa: registro, tests, análisis, compras, errores |
| `getUserSearch(query)` | Buscar por email, nombre o ID |
| `getRetentionCohorts(weeks)` | Tabla pivoteada: semana registro × semana actividad |
| `getPreConversionBehavior()` | Qué hicieron los users en las 48h antes de comprar |
| `getAtRiskUsers()` | Hot leads (5+ temas, sin compra) + pre-churn (activos → inactivos) |
| `getPremiumEngagement()` | Feature adoption rate, usage frequency, balance consumption per premium user |
| `getPremiumFeatureAdoption()` | % premium que usa cada feature (tests, simulacros, análisis, flashcards, radar, supuestos) |
| `getUnderutilizedFeatures()` | Premium users con features que NUNCA han tocado → oportunidad de nudge |
| `getProgressionMetrics()` | Evolución de nota media por usuario premium a lo largo del tiempo |
| `getContentHealth()` | Score medio por tema + reportes + cobertura banco |
| `getFreeBankPerformance()` | Hit rate, temas cubiertos por oposición, fallback IA rate |
| `buildWeeklyDigest()` | Agrega métricas semanales para email (free + premium + infra) |
| `getRecentActivity(limit)` | Feed últimos eventos (registros, tests, compras, errores) |

### Nuevas páginas

| Ruta | Contenido |
|------|-----------|
| `/admin/users` | Búsqueda de usuarios + tabla con estado |
| `/admin/users/[id]` | Timeline individual + estado + balances + acciones |
| `/admin/retention` | Tabla de cohortes con heatmap |
| `/admin/content` | Salud del contenido por tema + cobertura banco |
| `/admin/activity` | Feed en tiempo real (auto-refresh 60s) |

### Cambios a páginas existentes

| Página | Cambio |
|--------|--------|
| `/admin` (home) | Quick stats en vivo + alertas activas + links |
| `/admin/analytics` | Selector oposición + funnel v2 + señales conversión |
| `/admin/economics` | Desglose free bank (€0) vs IA (€X) + banco de preguntas real |

### Email

| Actual | Nuevo |
|--------|-------|
| Diario 07:00 con costes + infra | **Semanal lunes 08:00** con digest completo |
| Todo junto en un email | Secciones claras: Usuarios, Revenue, Costes, Infra, Alertas |
| Alertas mezcladas | **Alertas CRÍTICAS siguen en tiempo real** (margen < 0, DB > 90%, error spike) |

---

## Fases de ejecución

### Fase 0 — Corregir métricas al free tier v2

1. `getCostPerUser` — filtrar por `prompt_version`, separar free (€0) vs IA
2. `getOnboardingFunnel` — nuevo: registro → 1 tema → 3 temas → 5 temas → paywall → compra
3. `getAARRR` — activation = 3+ temas, retention = volvió semana 2
4. `getFeatureEngagement` — desglosar 'Tests free bank' vs 'Tests IA'
5. `getFreeTierMetrics` — temas únicos completados (no `free_tests_used`)
6. `getFuelTank` — añadir desglose: N tests gratis + M tests IA = €X
7. `getQuestionBankMetrics` — hit rate real del free bank + cobertura por oposición
8. `getCompletionRate` — separar free vs premium

### Fase 1 — Email semanal

9. Cambiar cron de diario a semanal (lunes 08:00 UTC)
10. `buildWeeklyDigest()` con secciones:
    - **Usuarios**: nuevos por oposición, total, DAU medio
    - **Free tier**: temas explorados, tests free bank, paywall hits, score medio
    - **Premium**: features usadas, tests IA, análisis consumidos, recargas, nota media
    - **Revenue**: compras semana, revenue total, conversiones (quién + qué pack)
    - **Costes**: IA total, coste/test IA, margen
    - **Retención**: activos vs inactivos, pre-churn detectados
    - **Contenido**: temas con peor score, errores reportados
    - **Infra**: semáforo DB/MAU/Redis/Vercel
11. Template HTML limpio con semáforos por sección
12. Mantener alertas críticas en tiempo real (separar de digest)

### Fase 2 — User Explorer

13. `getUserSearch(query)` — buscar por email/nombre/id
14. `getUserTimeline(userId)` — query multi-tabla ordenada cronológicamente
15. `/admin/users` — tabla con: email, oposición, plan, temas explorados, última actividad, revenue
16. `/admin/users/[id]` — timeline visual + estado + balances + botón "enviar email"

### Fase 3 — Premium monitoring + señales de conversión

17. `getPremiumEngagement()` — por usuario premium: features usadas, tests/semana, balance consumido, nota media, temas cubiertos
18. `getPremiumFeatureAdoption()` — tabla: feature × % adoption (tests 100%, simulacros 60%, flashcards 20%...)
19. `getUnderutilizedFeatures()` — lista de premium users con features sin tocar → base para emails de activación
20. `getProgressionMetrics()` — ¿mejoran las notas con el tiempo? Si no → el producto no cumple
21. `getPreConversionBehavior()` — qué hicieron antes de comprar (temas, paywalls, análisis)
22. `getAtRiskUsers()` — dos listas:
    - **Hot leads**: free users con 5+ temas, sin compra (nudge comercial)
    - **Pre-churn premium**: premium activos hace 2 semanas, inactivos esta (re-engagement)
    - **Premium insatisfechos**: premium con nota estancada o que dejaron de usar
23. Panel en `/admin/analytics` con CTAs de acción

### Fase 4 — Segmentación por oposición

20. Selector C2/C1/A2/Todas en header de `/admin/analytics`
21. Todas las funciones de analytics aceptan `oposicionId?: string`
22. Dashboard automáticamente muestra desglose 3 columnas cuando "Todas"

### Fase 5 — Cohortes de retención

23. `getRetentionCohorts(weeks)` — query con pivot semanal
24. `/admin/retention` — tabla con heatmap de colores (verde = buena retención, rojo = mala)
25. Tooltip con número absoluto de usuarios por celda

### Fase 6 — Salud del contenido + activity feed

26. `getContentHealth()` — por tema: score medio, nº tests, reportes, cobertura banco free + premium
27. `/admin/content` — tabla ordenable por "peor salud" primero
28. Detectar temas sin preguntas en free bank (por oposición)
29. `getRecentActivity(20)` — feed últimos eventos
30. `/admin/activity` — auto-refresh 60s, filtro por tipo

---

## Métricas clave del nuevo modelo

### Premium Users (los que pagan — la métrica más importante)
| Métrica | Qué mide | Por qué importa |
|---------|----------|-----------------|
| **Features usadas / disponibles** | De las 8+ features premium, ¿cuántas usa cada user? | Feature con <20% uso → mejorar UX o eliminar |
| **Tests IA / semana** | Volumen de uso real del banco progresivo | Si bajan tests → pierden interés → riesgo de no recomendar |
| **Análisis IA usados / balance** | ¿Consumen los análisis que compraron? | Si no los usan → no perciben valor → no recargarán |
| **Supuestos usados / balance** (A2) | ¿Consumen los supuestos? | Mismo razonamiento |
| **Features NUNCA usadas** | ¿Hay premium que nunca tocaron flashcards, radar, simulacros...? | Oportunidad de nudge: "¿sabías que tienes acceso a X?" |
| **Progresión de nota** | ¿Su nota media mejora con el tiempo? | Si no mejora → el producto no cumple su promesa |
| **Temas cubiertos / total** | ¿Cuántos temas han practicado del temario? | Si solo practican 5/28 → no están preparándose bien |
| **Frecuencia de uso** | Días activos / semana | Premium que usa 1 día/semana vs 5 → segmentar |
| **Recarga rate** | % premium que compran recarga (análisis o supuestos) | Indica satisfacción y valor percibido |
| **NPS implícito** | ¿Recomiendan? (compartir resultados, referidos) | ShareButton clicks, referral tracking |
| **Tiempo de sesión** | Minutos por visita | Engagement depth — ¿entran, hacen test, y se van? ¿O exploran? |
| **Errores reportados** | Preguntas marcadas como incorrectas | Calidad del contenido percibida por quien paga |

### Free Tier v2
| Métrica | Qué mide | Cómo |
|---------|----------|------|
| **Temas explorados / usuario** | Engagement del free tier | COUNT DISTINCT tema_id WHERE completado AND prompt_version='free-bank-1.0' |
| **Tasa de exploración** | % de temas disponibles que prueba | temas explorados / total temas de su oposición |
| **Score medio free** | ¿Los free users aprueban o suspenden? | AVG puntuacion WHERE prompt_version='free-bank-1.0' |
| **Tiempo a primer test** | ¿Cuánto tarda en empezar tras registro? | created_at primer test - created_at perfil |
| **Free bank hit rate** | ¿El banco sirve o caen al fallback IA? | COUNT prompt_version='free-bank-1.0' / COUNT WHERE !hasPaidAccess |
| **Paywall impressions** | ¿Cuántas veces ven el paywall? | COUNT 402 responses en generate-test |
| **Paywall → compra** | Conversión del paywall | compras / paywall impressions |

### Conversión
| Métrica | Qué mide | Cómo |
|---------|----------|------|
| **Temas antes de comprar** | Cuántos temas exploran antes de pagar | Para cada comprador: COUNT DISTINCT tema_id WHERE created_at < compra.created_at |
| **Trigger de compra** | Qué feature los empuja a comprar | Última acción antes de la compra (test, análisis, paywall, simulacro) |
| **Días a conversión** | Tiempo registro → compra | compra.created_at - profiles.created_at |
| **Revenue por oposición** | Qué oposición genera más | SUM amount_paid GROUP BY oposicion_id |

### Retención
| Métrica | Qué mide | Cómo |
|---------|----------|------|
| **Retención semana 1** | % que vuelve en semana 2 | Users con test en semana 2 / users con test en semana 1 |
| **Retención semana 4** | % que sigue activo al mes | Users con test en semana 4 / users registrados hace 4+ semanas |
| **Pre-churn** | Users que van a dejar de venir | Activos hace 7-14 días, inactivos últimos 7 |

---

## Prioridades

| Fase | Impacto | Esfuerzo | Prioridad |
|------|---------|----------|-----------|
| 0. Corregir métricas free tier v2 | **Crítico** — datos actuales engañan | Medio | **P0** |
| 1. Email semanal | Alto — reduce ruido, info útil | Bajo | **P0** |
| 2. User Explorer | Alto — debug + soporte + entender users | Medio | **P0** |
| 3. Premium monitoring + conversión + at risk | **Alto** — entender quién paga y por qué | Medio | **P1** |
| 4. Segmentación oposición | Alto — decisiones por vertical | Medio | **P1** |
| 5. Cohortes retención | Alto — medir impacto de cambios | Medio | **P1** |
| 6. Salud contenido + activity | Medio — optimización continua | Bajo | **P2** |

---

## No hacer (fuera de scope)

- **Predictive ML** — prematuro con <100 usuarios, las métricas simples son suficientes
- **A/B testing** — sin tráfico suficiente para significancia estadística
- **Dashboard builder custom** — overkill, los dashboards fijos son suficientes
- **Slack integration** — email es suficiente por ahora
- **Export CSV/Excel** — JSON export ya existe, CSV se puede añadir después
- **Real-time websockets** — auto-refresh 60s es suficiente para el volumen actual
