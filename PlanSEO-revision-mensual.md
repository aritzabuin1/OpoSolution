# PlanSEO — Revisión mensual (F6.T6)

> Bloque recurrente de 90 minutos el **primer lunes de cada mes, 10:00**.
> Objetivo: ajustar KPIs vs objetivo y decidir qué se mueve de pendiente a ejecución el mes siguiente.

---

## Cuándo

- **Primer lunes de cada mes**, 10:00–11:30 (tras ritual F6.T2 a las 09:00).
- Pasar a Google Calendar como evento recurrente.

## Quién

Aritz + Claude (sesión `/admin/seo`).

## Inputs (recogidos antes de la reunión)

1. **`/admin/seo`** — KPIs 28d (clics, impresiones, CTR, pos media) y top queries/páginas.
2. **Reporte semanal WoW** — botón "Regenerar" en `/admin/seo` → snapshot.
3. **Citas LLM 30d** — rate global + breakdown por plataforma (ya en `/admin/seo`).
4. **`PlanSEO.md` §13** — registro de ejecución (qué se cerró el mes).

## Agenda (90 min)

| Bloque | Min | Contenido |
|---|---|---|
| 1. KPIs vs objetivo | 15 | Contrastar KPIs actuales vs hitos en PlanSEO §1 (mes 1/2/3). Marcar verde/ámbar/rojo |
| 2. Ritual LLM — resultados | 10 | Tasa de citas. Plataformas donde no aparecemos. Queries donde ya citan pero mal. |
| 3. Queries que suben/bajan | 15 | Top 10 subidas y top 10 caídas. Decidir acciones (contenido nuevo, mejora on-page, nada). |
| 4. Páginas con bajo rendimiento | 15 | Re-ejecutar `pnpm seo:low-ctr`. ¿Nuevas páginas en top 15? Priorizar reescritura. |
| 5. Algorithm updates del mes | 5 | Revisar `seo_algo_events` en Supabase. ¿Algún update crítico? Impacto observado en KPIs. |
| 6. Ajuste del plan | 25 | Mover tareas de "pendiente" a sprint del mes siguiente. Bloquear/desbloquear según recursos. |
| 7. Actualizar §13 del PlanSEO | 5 | Marcar ✅/⏳/⏸️ real según estado actual. Sumar commits/PRs del mes. |

## Outputs

- Sección "Revisión mes N" al final de `PlanSEO.md` con:
  - KPIs de entrada (tabla 4 columnas: clics, impresiones, CTR, pos)
  - Top 3 wins del mes
  - Top 3 fails del mes
  - 3 acciones concretas para el mes siguiente
- Registro de ejecución §13 actualizado
- Calendario siguiente revisión confirmado

## Criterios de éxito (por mes)

Extraídos de `PlanSEO.md` §14:

| Mes | Clics/día | URLs indexadas | Oposiciones con ≥30 clics/mes |
|---|---|---|---|
| 1 | 50 | 600 | 6/12 |
| 2 | 120 | 1.200 | 9/12 |
| 3 | 250 | 2.000 | 11/12 |

Si un mes cerramos en rojo (debajo del umbral), la revisión es 180 min no 90 — incluye root cause analysis.
