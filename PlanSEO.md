# PlanSEO — OpoRuta (v2)

**Fecha:** 2026-04-19
**Owner:** Aritz + Claude Code
**Horizonte:** 90 días
**Versión:** 2.0 (tras auditoría crítica de v1)

> **Fundamento documental:** auditoría pSEO 2026-04-19 + research SEO/GEO abril 2026 + `oporuta-seo-geo-plan.md` + Search Console 6-mar → 19-abr.

---

## 0. Premisas que este plan asume (y que no se re-discuten sin datos)

**P1.** Google en 2026 no indexa páginas sin *information gain*. Replicar BOE + CTA = cero gain. Camino a "todas indexadas" = transformar las páginas, no forzar indexación.

**P2.** `llms.txt` NO lo consume ningún LLM (confirmado Anthropic + OpenAI, fines 2025). GEO en 2026 = top-10 orgánico + Reddit/YouTube + FAQPage schema + datos propios citables.

**P3.** Tratamiento `noindex,follow` → Google lo degrada a `noindex,nofollow` con el tiempo (Mueller 2019, reconfirmado 2024). Usar `noindex` sin depender del `follow`.

**P4.** IndexNow solo Bing/Yandex/Naver. Google ignora IndexNow. Para Google: GSC Request Indexing manual (límite ~12/día) + esperar crawl orgánico.

**P5.** GSC API (gratis, delay 2-3 días) es la única fuente de rank tracking. Aceptamos el delay. No hay presupuesto para rank trackers externos.

**P6.** Capacidad humana = Aritz part-time. 42 piezas de contenido largo en 3 semanas es irreal en humano puro. Modelo híbrido obligatorio: IA generativa con prompt propietario (Radar del Tribunal) + review humano 100% en top 10 de cada oposición + spot check 20% en el resto.

**P7.** Core Web Vitals son bloqueador silencioso. LCP > 2.5s o INP > 200ms → Google deja de rastrear aunque el contenido sea bueno. Auditar ANTES de relanzar.

**P8.** Estrategia de adquisición SOLO orgánica: Google + Bing + LLMs. Prohibido proponer foros, Reddit, Telegram, Discord, comunidades, Twitter/X, LinkedIn orgánico o digital PR a medios. Toda la autoridad externa se construye vía contenido propio linkable + YouTube + Wikidata.

**P9.** Presupuesto herramientas externas = 0€. Solo se permiten APIs que ya están en el stack (Anthropic/OpenAI que OpoRuta paga para funcionar). Cero SaaS nuevos.

---

## 1. KPIs objetivo (realistas, trackeables semanalmente)

| Métrica | Baseline 19-abr | 30d (19-may) | 60d (19-jun) | 90d (19-jul) |
|---|---|---|---|---|
| Clics/día promedio | ~22 | 50 | 120 | 250 |
| Impresiones/día | ~1.300 | 3.000 | 6.000 | 10.000 |
| CTR medio | 2,4% | 3,0% | 3,5% | 3,8% |
| Posición media | 6,1 | 5,5 | 4,9 | 4,3 |
| Páginas indexadas | 124 | 600 | 1.200 | 2.000 |
| "Descubiertas no indexadas" | 9.688 | <3.000 | <1.000 | <200 |
| Registros/día | ~0,5 | 2 | 7 | 15 |
| Citas LLM (ritual manual 30q/semana) | no medido | baseline en F6.T2 | +50% vs baseline | +200% vs baseline |
| Oposiciones con ≥30 clics/mes | 4/12 | 6/12 | 8/12 | 11/12 |
| LCP médio (p75) | desconocido | <2,5s | <2,0s | <1,8s |
| INP médio (p75) | desconocido | <200ms | <150ms | <100ms |

Nota: registros crecen con latencia respecto al tráfico (funnel). Por eso 15/día a 90d, no 25.

---

## 2. Estrategia en una frase

> **Podar quirúrgicamente, enriquecer las supervivientes con 4 capas de datos propietarios, distribuir contenido equilibradamente entre las 12 oposiciones, y construir autoridad externa (Reddit + PR).**

---

## 3. Fase 0 — Parar la sangría (HOY, 5-6h con buffer)

### F0.T1 — Diagnóstico cuantitativo
**Qué:** query SQL a `preguntas_oficiales`:
```sql
SELECT ley, articulo, COUNT(*) AS num_preguntas
FROM preguntas_oficiales
WHERE ley IS NOT NULL AND articulo IS NOT NULL
GROUP BY ley, articulo
ORDER BY num_preguntas DESC;
```
Export a `.tmp/article-exam-coverage.csv`.

**DoD:** CSV con `ley, articulo, num_preguntas`. Conteo de (ley, articulo) únicos.
**ETA:** 20min.

### F0.T2 — Diagnóstico de demanda orgánica
**Qué:** query GSC API últimos 28 días para detectar queries "artículo X [ley]" con ≥3 impresiones. Export CSV.

**DoD:** `.tmp/gsc-article-queries.csv`. Artículos con demanda real identificados.
**ETA:** 30min.

### F0.T3 — Auditoría Core Web Vitals
**Qué:** PageSpeed Insights API sobre 10 URLs muestra: home, 3 blog, 2 oposiciones, 4 artículos de ley.
**DoD:** LCP/INP/CLS p75 registrados. Si algún p75 fuera de umbral Google → añadir tarea bloqueadora antes de F1.
**ETA:** 20min.

### F0.T4 — Decisión de política de indexación
Política `indexable = true` si:
- (A) artículo tiene ≥1 pregunta oficial cruzada (desde F0.T1), O
- (B) artículo aparece como query con ≥5 impresiones últimos 28d (desde F0.T2), O
- (C) artículo pertenece a grupo canónico "artículos core de la ley" (p.ej. Constitución arts. 1-10, 14, 23, 103, 128; LPAC arts. 4, 35, 99).

**DoD:** set final de URLs indexables calculado. Tamaño esperado: 800-1.500.
**ETA:** 20min.

### F0.T5 — Helper `isArticleIndexable(lawSlug, articuloNumero)`
**Qué:** nueva función en `lib/seo/indexability.ts` que consulta un JSON precomputado `data/seo/indexable-articles.json` con el set de F0.T4.
**DoD:** función testeada. Build de Vercel incluye regenerar el JSON.
**ETA:** 40min.

### F0.T6 — Aplicar `noindex` quirúrgico
**Qué:** en `app/(marketing)/ley/[ley-slug]/[articulo-slug]/page.tsx` `generateMetadata` → si `!isArticleIndexable(...)` devuelve `robots: { index: false, follow: false }`. Sin `follow` para evitar la degradación implícita de Google.

**DoD:** 10 URLs muestra (5 indexables, 5 no) verificadas con curl: meta robots correcta.
**ETA:** 20min.

### F0.T7 — Sitemap index correcto (Next.js 16)
**Qué:** dos opciones; elegir B por fragilidad de A con dos sitemap.ts en rutas distintas.

- **Opción A (intentada primero):** `app/sitemap.ts` con `generateSitemaps()` que devuelve `[{ id: 'main' }, { id: 'leyes' }]`. Eliminar `app/(marketing)/ley/sitemap.ts`.
- **Opción B (fallback seguro):** servir sitemap index estático desde `public/sitemap-index.xml` referenciando `/sitemap.xml` y `/ley/sitemap.xml`. Actualizar `robots.ts` para apuntar a `sitemap-index.xml`.

**DoD:** `curl https://oporuta.es/sitemap-index.xml` (o `/sitemap.xml` si opción A) devuelve `<sitemapindex>` con ambos. GSC acepta el submit sin errores.
**ETA:** 1h.

### F0.T8 — Filtrar `/ley/sitemap.xml` a indexables
**Qué:** usar `isArticleIndexable` en el sitemap generator. Solo emite URLs indexables.
**DoD:** conteo de `<url>` en `/ley/sitemap.xml` ≈ tamaño set F0.T4.
**ETA:** 15min.

### F0.T9 — Fix `generateMetadata` early-returns
**Qué:** reemplazar los 3 `return {}` por metadata mínima válida (`{ title: 'No encontrado | OpoRuta', robots: { index: false } }`). El `notFound()` va en el componente, NO en generateMetadata.
**DoD:** zero páginas sirviendo `<title>` vacío. Verificar con 5 URLs inválidas.
**ETA:** 20min.

### F0.T10 — Limpiar 404s del sitemap
**Qué:** bajar CSV "Páginas no encontradas (404)" de GSC, cruzar con `article-index.json`, eliminar slugs inexistentes.
**DoD:** 0 URLs 404 en sitemap.
**ETA:** 30min.

### F0.T11 — Limpiar internal links a `noindex`
**Qué:** scripts que buscan enlaces internos a páginas que quedarán noindex en blog posts, oposiciones hubs, componentes `RelatedArticles`. Remover o condicionar con `isArticleIndexable`.
**DoD:** `grep` en repo no encuentra enlaces a URLs no-indexables.
**ETA:** 40min.

### F0.T12 — Commit + deploy Vercel
**DoD:** deploy verde. Smoke test 12 URLs.
**ETA:** 20min.

### F0.T13 — Submit a Google/Bing
**Qué:**
- GSC: reenviar `sitemap-index.xml` (o `sitemap.xml` según opción).
- Bing Webmaster: idem.
- IndexNow: ping batch de las URLs supervivientes (Bing).
- GSC Request Indexing manual: top 12 URLs con más impresiones históricas (límite diario).
- Día siguiente: siguientes 12. Distribuir 48 URLs en 4 días.

**DoD:** logs/screenshots en `.tmp/seo-submissions-YYYYMMDD.md`.
**ETA:** 25min hoy + 10min/día siguientes 3 días.

### F0.T14 — Smoke test completo + checklist final
**DoD:** 15 URLs verificadas (200 status, meta OK, schema válido, Core Web Vitals OK).
**ETA:** 25min.

**Total Fase 0: ~6h hoy + 30min días siguientes.**

---

## 4. Fase 1 — Information gain en supervivientes (semana 1, 14-16h)

Las ~800-1.500 URLs supervivientes necesitan 4 capas propietarias que BOE no tiene.

### F1.T1 — Esquema `article-exam-map.json`
**Qué:** diseñar JSON `{ lawSlug: { articuloSlug: [{ preguntaId, examenOficialId, year, enunciadoSnippet, difícil: boolean, oposicion: string }] } }`. Documentar en `directives/article_exam_map.md`.
**ETA:** 30min.

### F1.T2 — Script `build-article-exam-map.ts`
**Qué:** genera el JSON desde `preguntas_oficiales` + `examenes_oficiales`. Añadir al comando `pnpm build:seo-index`. Incorporar a pipeline Vercel build.
**DoD:** JSON generado, tamaño razonable (<5MB), tests pasan.
**ETA:** 1h 30min.

### F1.T3 — Componente `ArticleExamQuestions.tsx`
**Qué:** lista preguntas oficiales donde cayó el artículo. Link a `/examenes-oficiales/[slug]#pregunta-N`. Badges: año + oposición. Si no hay preguntas → componente oculto.
**DoD:** renderiza bien en 10 URLs muestra. Visualmente claro.
**ETA:** 1h 30min.

### F1.T4 — Componente `ArticleFrequencyBadge.tsx`
**Qué:** "Aparece en X de las últimas Y convocatorias". Semáforo color. Solo si Y ≥ 3.
**DoD:** renderiza en cabecera del artículo.
**ETA:** 45min.

### F1.T5 — TL;DR IA (cached) — migration 055
**Qué:**
- Migration: tabla `article_summaries (law_slug, articulo_slug, summary_json, model, created_at)`.
- Script: `scripts/generate-article-summaries.ts` que para cada URL indexable invoca Claude Haiku 4.5 con prompt que recibe texto artículo + contexto oposiciones + preguntas oficiales.
- Prompt genera: `{ tldr: string[3-5], trucos: string[1-2], trampaTipica: string | null }`.
- Cache permanente.
- Coste estimado: 800 arts × (~2.000 input + ~400 output tokens) = $1.60 input + $1.28 output ≈ **$2.88 total**.

**DoD:** 800 TL;DR generados, cached, visibles en UI.
**ETA:** 2h.

### F1.T6 — FAQ schema + sección visible (con anti-template)
**Qué:** 3 FAQs por artículo. Estructura:
- FAQ 1 (estándar): "¿Qué establece el artículo [X] de la [ley]?" — respuesta usa TL;DR primer bullet.
- FAQ 2 (semi-específica): "¿En qué oposiciones se examina el artículo [X]?" — respuesta usa `ley-oposicion-map`.
- FAQ 3 (única, data-driven): según el artículo, una de:
  - "¿Cuántas veces ha caído el artículo [X] en INAP?" (si hay preguntas oficiales)
  - "¿Cómo preguntan el artículo [X] en el examen?" (si hay snippet de pregunta)
  - "¿Qué truco mnemotécnico hay para el artículo [X]?" (si el TL;DR tiene truco)

Riesgo: Google penaliza FAQs idénticas entre URLs (templatización). La FAQ 3 varía por artículo → rompe el patrón. Validar con 20 URLs: variabilidad real ≥70%.

**DoD:** schema FAQPage validado (Rich Results Test) en 20 URLs. Auditoría de similitud <70%.
**ETA:** 2h.

### F1.T7 — Test IA por artículo
**Qué:** botón "Practica con un test solo de este artículo" → `/api/ai/generate-test?articulo=X&ley=Y&n=N` donde N ∈ [3,5] según preguntas disponibles.
- Si hay ≥5 preguntas oficiales → 5 preguntas oficiales exactas.
- Si hay 3-4 → completar con IA tomando el artículo como contexto.
- Si hay <3 → solo IA (6 preguntas generadas).

**DoD:** endpoint acepta `articulo`, test generado es coherente. 0 errores en 20 muestras.
**ETA:** 1h 30min.

### F1.T8 — "Actualizado el [fecha]" + `dateModified` + `datePublished`
**Qué:** mostrar `Actualizado: DD mes AAAA`. Schema `Article` con ambas fechas.
**DoD:** visible en header del artículo + schema validado.
**ETA:** 30min.

### F1.T9 — Breadcrumb schema
**Qué:** `BreadcrumbList` JSON-LD en ley / artículo. Inicio → Leyes → [Ley] → [Artículo].
**DoD:** validador Google OK.
**ETA:** 30min.

### F1.T10 — `Article` schema
**Qué:** JSON-LD `Article` con `author: Organization`, `publisher`, `datePublished`, `dateModified`, `mainEntityOfPage`.
**DoD:** validado en Rich Results Test.
**ETA:** 30min.

### F1.T11 — Core Web Vitals ajuste
**Qué:** si F0.T3 detectó problemas: lazy-load componentes pesados (FAQs al scroll), prefetch crítico, images `priority` solo en hero, font-display: swap.
**DoD:** LCP p75 <2,5s, INP p75 <200ms en lab y CrUX (si disponible).
**ETA:** 1-3h condicional.

### F1.T12 — Re-submit supervivientes
**Qué:** tras despliegue Fase 1, re-submit sitemaps + request indexing top 12 URLs/día durante 4 días.
**DoD:** logs completos.
**ETA:** 10min/día × 4 días.

**Total Fase 1: ~13-16h en semana 1.**

---

## 5. Fase 2 — Internal linking + Schema GEO (semana 2, 7-9h)

### F2.T1 — Widget "Leyes clave" en `/oposiciones/*`
**Qué:** cada hub muestra top 5-10 leyes más examinadas en esa oposición, cada una con 3-5 artículos más frecuentes. Datos desde `article-exam-map.json`.
**DoD:** widget renderiza en las 12 oposiciones. Internal linking auditado.
**ETA:** 2h.

### F2.T2 — Widget "Top 10 artículos preguntados" en `/examenes-oficiales/*`
**DoD:** visible en las 7 fichas.
**ETA:** 1h 30min.

### F2.T3 — Auto-linker controlado de leyes en blog
**Qué:** post-render regex detecta "art. X de la LPAC", "artículo Y Constitución", etc. Convierte a link SOLO si la URL destino es indexable. **Límite: 5 enlaces/post** para evitar over-optimization.
**DoD:** 31 blog posts revisados. 2-5 enlaces internos/post. 0 enlaces a URLs noindex.
**ETA:** 2h.

### F2.T4 — Home: "Artículos más caídos esta semana"
**Qué:** sección bajo hero. 5 artículos top. Refresh semanal vía cron.
**DoD:** visible. Cron activo.
**ETA:** 1h.

### F2.T5 — `Organization` + `WebSite` schema en layout
**Qué:** verificar/añadir `sameAs` (LinkedIn, X), logo URL absoluta, founder, contactPoint.
**DoD:** validador OK.
**ETA:** 30min.

### F2.T6 — `HowTo` schema en guías del blog
**Qué:** identificar 8-10 posts tipo "cómo preparar...". Añadir JSON-LD `HowTo` con steps reales.
**DoD:** validado en las 8-10.
**ETA:** 1h 30min.

**Total Fase 2: ~9h.**

---

## 6. Fase 3 — Quick wins CTR (semana 2, 4-5h)

### F3.T1 — Identificar top 15 CTR-bajas vía GSC API
**Qué:** query GSC: últimos 28d, filtra páginas con impresiones ≥500 y CTR <2%. Ordenar por impresiones. Primeras 15.
**DoD:** CSV en `.tmp/gsc-low-ctr-top15.csv`.
**ETA:** 20min.

### F3.T2 — Reescribir titles+metas
Patrón ganador: `[Cifra concreta] · [Año] · [Diferenciador] | OpoRuta`. Ejemplo confirmado: "Calendario OEP 2026 AGE: 1.700 plazas · examen 23 mayo | OpoRuta".

**DoD:** 15 titles/metas reescritos. Meta 155 chars máx, title 60 chars máx. Uso de números.
**ETA:** 2h 30min.

### F3.T3 — FAQPage + TL;DR en las 15
**Qué:** 3 FAQs al final + TL;DR de 3 bullets arriba.
**DoD:** schema validado + visible.
**ETA:** 1h 30min.

**Total Fase 3: ~4h.**

---

## 7. Fase 4 — Balance 12 oposiciones (semanas 3-5, modelo híbrido IA + human review)

### F4.P0 — Verificación de cobertura BOE (BLOQUEADOR)
**Qué:** antes de generar contenido, verificar que las leyes relevantes de Guardia Civil, Policía Nacional, Penitenciarías, Justicia A2, Ertzaintza están ingestadas:
- GC/PN: Ley Orgánica 2/1986 Fuerzas y Cuerpos, Código Penal, Ley Seguridad Ciudadana, Reglamento GC.
- Penitenciarías: LOGP 1/1979, Reglamento Penitenciario 190/1996, RD 840/2011. *(Las dos primeras están en legislación.)*
- Ertzaintza: Ley 4/1992 Policía País Vasco.

**DoD:** checklist leyes × oposiciones. Si faltantes → ingesta previa (`pnpm tag:legislacion` + `ingest-legislacion.ts`).
**ETA:** 1h revisión + N horas ingesta condicional.

### F4.P1 — Estrategia híbrida (regla clave)
Imposible humano puro en 3 semanas (42 piezas × 5h ≈ 210h).

- **Borrador IA:** prompt propietario "Radar del Tribunal" que recibe `(oposicion, tipo_pieza, datos_plazas, datos_sueldos, preguntas_historicas)` y genera un draft con estructura canónica (H1, TL;DR, FAQs, tabla, CTA).
- **Review humano 100%** en top 2 piezas por oposición (pillar + plazas).
- **Spot check 20%** en el resto. Regla: cualquier dato numérico verificado contra fuente oficial antes de publicar.
- **Disclosure:** footer "Contenido generado con asistencia de IA y revisado editorialmente".

### Piezas canónicas por oposición
1. Pillar `/oposiciones/[slug]`
2. Plazas / convocatoria del año
3. Sueldo + nómina desglosada
4. Temario completo + orden de estudio
5. Calendario / fechas de examen
6. Pruebas específicas (físicas en seguridad, supuestos en justicia)
7. Comparativa (vs academia dominante o vs oposición hermana)

### Sprints

**Sprint 1 (semana 3): Guardia Civil + Policía Nacional** (14 piezas) 🟡 11/14 COMPLETADAS 2026-04-19
- ✅ Temario GC (post 33), Temario PN (post 34)
- ✅ Plazas GC (37), Sueldo GC (38), Físicas GC (39), Calendario GC (40)
- ✅ Plazas PN (41), Sueldo PN (42), Físicas PN (43), Calendario PN (44)
- ✅ Comparativa GC vs PN (45) — cubre ambas
- ✅ Enrichment de /oposiciones/seguridad/guardia-civil y /oposiciones/seguridad/policia-nacional pillar pages con "Guías complementarias" (6 internal links c/u)
- **Sprint 1 COMPLETO: 14/14 piezas** 2026-04-19
**Sprint 2 (semana 4): Justicia A2 + Instituciones Penitenciarias** (14 piezas) 🟡 PARCIAL 2026-04-19
- ✅ Plazas IIPP (46), Sueldo IIPP (47)
- ✅ Plazas Gestión Procesal (48), Sueldo Gestión Procesal (49)
- ⏳ Pendiente: pruebas específicas Justicia A2, calendario IIPP detallado, pillars enrichment

**Sprint 3 (semana 5): Ertzaintza + refuerzo AGE A2 + Hacienda** (11 piezas) 🟡 PARCIAL 2026-04-19
- ✅ Plazas Ertzaintza (50), Sueldo Ertzaintza (51), Temario Ertzaintza (52)
- ✅ Plazas GACE (53), Sueldo GACE (54)
- ⏳ Pendiente: calendario/pruebas físicas Ertzaintza, calendario Hacienda/GACE

**Detalle Ertzaintza (ángulo único):**
- Pieza bilingüe (ES + EU) como diferenciador. Añadir `hreflang="es-ES"` y `hreflang="eu-ES"`.
- Base en Bilbao → contenido local ("academias Ertzaintza en Bilbao", "psicotécnico Ertzaintza última convocatoria").

**DoD Fase 4:**
- 39 piezas publicadas (14+14+11).
- Cada oposición huérfana con ≥7 piezas canónicas + ≥50 clics/mes al cierre del sprint.
- Internal linking: cada pieza enlaza a ≥3 otras de la misma oposición.
- Revisión editorial registrada.

**ETA total:** ~60h distribuidas (IA ~40%, review ~30%, hecho por humano ~30%).

---

## 8. Fase 5 — Amplificación GEO 100% orgánica (mes 2, continuo)

> **Regla (P8):** solo SEO orgánico y superficies que LLMs leen. Nada de foros, Telegram, Reddit, Discord, Twitter/X, LinkedIn orgánico ni pitching a medios.

### F5.T1 — YouTube → SEO (canal OpoRuta)
**Qué:** 8 vídeos cortos (3-6min) respondiendo top queries GSC:
1. "¿Cuántas plazas hay para auxiliar administrativo 2026?"
2. "¿Cómo se calcula la nota de corte del auxiliar administrativo del Estado?"
3. "¿Qué artículos caen más en INAP? (análisis 2018-2024)"
4. "OpoRuta vs OpositaTest: comparativa real"
5. "Temario del auxiliar administrativo: por dónde empezar"
6. "Calendario OEP 2026 AGE: fechas clave"
7. "Sueldo auxiliar vs administrativo del Estado"
8. "Qué prepara la Guardia Civil 2026: plazas, examen, pruebas"

Cada vídeo:
- Transcripción generada (Whisper de OpenAI, ya en stack).
- Transcripción embebida en blog post correspondiente (indexable).
- Descripción con link al post y CTA a OpoRuta.
- Thumbnails consistentes con branding oporuta.

YouTube es cita #1 de Perplexity y aparece en AI Overviews. Es el canal externo más rentable sin depender de terceros.

**DoD:** 8 vídeos publicados al cierre del mes 2. Transcripciones en blog.
**ETA:** 3h/vídeo (grabación + edición + transcripción + embed). Total ~24h.

### F5.T2 — Data journalism publicado en oporuta.es (linkable) ✅ COMPLETADO 2026-04-19
Contenido con datos propios que otros citan naturalmente. No pitch a medios (P8), solo publicar y dejar que orgánicamente se enlace.

1. **"Análisis INAP 2018-2024: qué artículos caen más"** — página tipo dashboard con tablas ordenables, gráficos, descarga CSV. Datos propietarios de `preguntas_oficiales`.
2. **"Mapa de destinos auxiliar administrativo por CC.AA."** — página interactiva con mapa, salario medio, plazas históricas. Datos: BOE ofertas + sueldos publicados.
3. **"Evolución plazas AGE 2018-2026"** — timeline con tendencia por cuerpo, gráficos embebibles.

Ruta: `/datos/analisis-inap`, `/datos/mapa-destinos`, `/datos/plazas-age-historico`. Añadir al sitemap con priority 0.9. Schema `Dataset` JSON-LD.

Estas 3 páginas son GEO-citables por LLMs (datos específicos, tablas, fechas) y pueden atraer backlinks orgánicos de blogs/académicos.

**DoD:** 3 páginas publicadas. Schema `Dataset` validado. Al menos 1 cita en LLM al cierre del mes 2 (trackear en F6.T2).
**ETA:** 4-5h/pieza. Total ~14h.

### F5.T3 — Wikidata entry + Organization sameAs
**Qué:** crear entrada Wikidata "OpoRuta" (Q-ID) con propiedades: instance of (software), website, country, inception. Enlace sameAs desde `Organization` schema del layout. Mejora knowledge graph para LLMs.
**DoD:** Q-ID asignado y enlazado.
**ETA:** 1h.

### F5.T4 — Actualizar `llms.txt` y `/api/info`
Aunque los LLMs no consumen `llms.txt` en producción hoy, el coste de mantenerlo actualizado es bajo y es hedge por si adoptan. Más importante: `/api/info` (endpoint ya existente según memoria) que algunos scrapers de LLM sí leen.

**Qué:**
- `llms.txt`: refrescar estructura estándar, incluir URLs a los 3 data journalism de F5.T2, linkear top 20 blog posts + 12 oposiciones.
- `/api/info`: devolver JSON estructurado con oposiciones, precios, features, datos clave (plazas, fechas, nota de corte) y hash `ETag` para caching.

**DoD:** ambos endpoints devuelven datos frescos. Tests pasan.
**ETA:** 1h 30min.

### F5.T5 — Expansión blog (10 nuevos posts GEO-friendly) ✅ 11/10 COMPLETADOS 2026-04-19 (objetivo superado)
Priorizar queries GSC con ≥100 impresiones y posición 11-25 (próximas a top-10). Estructura canónica:
- H1 optimizado
- TL;DR 3-5 bullets arriba
- Tabla comparativa central
- FAQ con 5+ preguntas
- Fecha de actualización visible
- Internal links a ≥3 páginas propias

**DoD:** 10 posts publicados. Cada uno pasa checklist GEO: TL;DR, tabla, FAQ, schema, fecha, ≥3 internal links.
**ETA:** 2h/post con IA + review. Total ~20h.

### F5.T6 — Google Discover optimization
**Qué:** Discover prioriza imágenes grandes (1200×1200+), contenido fresco, EEAT. Para los 10 posts nuevos + 15 posts con más impresiones:
- Imagen principal ≥1200×1200.
- Schema `Article` con `image` de alta resolución.
- `author` visible con bio + foto.
- `datePublished` + `dateModified` visibles.

**DoD:** 25 posts optimizados. Discover eligibility verificada en GSC.
**ETA:** 4h.

**Total Fase 5: ~65h distribuidas en el mes 2.**

---

## 9. Fase 6 — Observabilidad SEO/GEO (continuo, setup en semana 2)

### F6.T1 — Fix GA4
Según `oporuta-seo-geo-plan.md` sección 3. Verificar env vars Vercel, canal "AI Search", Explorations.
**DoD:** Realtime recibe datos. Canal AI Search configurado correctamente.
**ETA:** 1h.

### F6.T2 — Ritual manual semanal de citas LLM (cero coste)
**Qué:** cada lunes 9:00 Aritz + Claude Code ejecutan 30 queries fijas:
- 10 branded: "OpoRuta", "OpoRuta vs OpositaTest", "qué es OpoRuta", "OpoRuta precio", "opiniones OpoRuta", etc.
- 20 non-branded distribuidas por las 12 oposiciones: "mejor app para preparar auxiliar administrativo 2026", "plataforma IA oposiciones Guardia Civil", "cómo preparar auxilio judicial 2026", etc.

Método:
- Claude Code usa su tool `WebSearch` para ejecutar queries y registrar si OpoRuta aparece en los resultados agregados (proxy razonable para "LLMs citándonos", ya que ChatGPT/Perplexity/Claude Web Search se basan en SERPs similares).
- Aritz pega los resultados de su lado en ChatGPT/Perplexity/Google (versiones gratuitas, incógnito) para cada query de forma rápida.
- Todo va a tabla Supabase `llm_citations (query, platform, cited: bool, position, source_url, checked_at)` — migration 056.

**DoD:** ritual operativo lunes 26-abr. Tabla poblada semanalmente. Primer reporte mensual al cierre del mes 1.
**ETA:** 3h setup (tabla + script asistente) + 30min/lunes.

### F6.T3 — Dashboard `/admin/seo`
**Qué:** 3 secciones leyendo de fuentes gratis:
- **GSC metrics** vía GSC API (clics/impresiones/CTR/pos. por página y query, últimas 4 semanas).
- **Citas LLM** leído de tabla `llm_citations` (F6.T2).
- **Errores de indexación** también vía GSC API (coverage report: indexed, discovered not indexed, 404, redirects).

Todo 100% gratis con APIs ya disponibles (GSC API sin coste con cuota generosa).

**DoD:** dashboard accesible en `/admin/seo`. Refresh diario vía cron existente.
**ETA:** 4h.

### F6.T4 — Monitor de Google algorithm updates (gratis)
**Qué:** cron diario que hace fetch a 2 RSS públicos:
- Search Engine Roundtable (seroundtable.com/feed.xml).
- Algoroo (via scrape si no hay RSS).

Si detecta palabras clave "core update", "spam update", "helpful content", "March 2026 update", etc. → crea notificación admin + email a Aritz.

**DoD:** cron operativo. Alerta verificada con un test manual.
**ETA:** 1h.

### F6.T5 — Eval SEO semanal automatizado (GSC API)
**Qué:** cron lunes 9:00 usa GSC API para comparar posiciones semana actual vs anterior. Reporte en markdown con:
- Queries que subieron/bajaron ≥3 posiciones.
- Páginas con caída de clics ≥30% semana-semana.
- Nuevas queries que entraron en top 20.

Reporte guardado en `/admin/seo` + email a Aritz.

**DoD:** primer reporte lunes 26-abr. Datos consistentes semanales.
**ETA:** 2h.

### F6.T6 — Revisión mensual del PlanSEO
**Qué:** primer lunes de mes, bloque de 90min. Revisar KPIs vs objetivos con datos del dashboard. Ajustar fases pendientes. Actualizar registro de ejecución.
**DoD:** agenda recurrente creada.

---

## 10. Contingencia — escenarios

### Escenario A: 14 días tras Fase 1, indexación <40% de supervivientes
**Gatillo:** GSC muestra <320 páginas indexadas de las 800-1.500 supervivientes al 3-may.

**Acción:**
1. Auditoría manual profunda de 20 URLs muestra vs top 3 SERP de su query. ¿Dónde falta información?
2. Añadir capa 5: jurisprudencia relevante (extraída de CENDOJ) para artículos con precedentes judiciales.
3. Consolidar: fusionar artículos contiguos de la misma sección en una sola URL rica. Canonical del artículo viejo → nuevo hub consolidado (301).

### Escenario B: Tras Fase 2, sin mejora de posición media
**Gatillo:** pos. media >5,8 al 19-may.

**Acción:**
1. Auditoría manual de SERP top 3 en las 20 queries con más impresiones. ¿Qué tienen ellos que no tenemos?
2. Si el gap es de profundidad de contenido → adelantar F5.T5 (expansión blog).
3. Si el gap es de YouTube/vídeos → adelantar F5.T1.
4. Backlink research gratis vía `site:dominio.com "oporuta"` en Google + `link:oporuta.es` + Google Search Console referring domains.

### Escenario C: Emergencia — Google sigue degradando autoridad
**Gatillo:** clics/día cae por debajo de 15 durante 7 días consecutivos.

**Acción:**
1. `noindex` inmediato de todas las `/ley/*`. Recuperar crawl budget 100%.
2. Autoauditoría sistemática contra Google Quality Rater Guidelines (docs públicos gratuitos) y Google Search Central "How to recover from a Helpful Content Update" (blog oficial).
3. Relanzar en oleadas de 100 URLs/semana solo si Google indexa ≥80% de cada oleada. Pausa si <80%.

### Escenario D: Algoritmo Google hostil a pSEO durante este periodo
**Gatillo:** anuncio oficial de core update + caída generalizada.

**Acción:**
1. Esperar 4-6 semanas sin hacer cambios drásticos (regla Mueller).
2. Seguir ejecutando Fases 2-5 (no tocan pSEO).
3. Evaluar post-update antes de nueva poda.

---

## 11. Presupuesto

Presupuesto herramientas externas: **0€**. Solo se usan APIs ya existentes en el stack (Anthropic/OpenAI que OpoRuta paga para funcionar como producto).

| Partida | Coste | Origen |
|---|---|---|
| Claude Haiku (TL;DR 800 arts, una vez) | ~$3 | Anthropic API (stack existente) |
| Ingesta BOE leyes faltantes | ~$5 | OpenAI Files API (stack existente) |
| Whisper transcripciones YouTube (8 vídeos) | ~$0,50 | OpenAI (stack existente) |
| GSC API (rank tracking) | 0€ | Free, cuota generosa |
| YouTube canal propio | 0€ | Gratis |
| Wikidata | 0€ | Gratis |
| Ritual manual citas LLM | 0€ | Claude Code WebSearch + queries manuales |
| RSS monitor algorithm updates | 0€ | Feeds públicos |
| **Total mes 1** | **~$8,50** (todo del stack existente) |
| **Total mes 2-3 recurrente** | **~$2/mes** (generación contenido) |

Aritz no paga por ninguna herramienta nueva. Todo se hace con tooling propio (Claude Code + Supabase + APIs del stack).

---

## 12. Decisiones tomadas (no re-discutir sin datos nuevos)

- ✅ Indexar solo artículos con ≥1 pregunta oficial cruzada, o con demanda GSC ≥5 impr/28d, o artículo core de ley priority high.
- ✅ `noindex` sin `follow` (P3).
- ✅ Sitemap index opción B (estático en /public) si opción A falla.
- ✅ Modelo híbrido IA + human review para Fase 4 (P6).
- ✅ Ertzaintza bilingüe ES+EU como ángulo diferenciador.
- ✅ Estrategia SOLO orgánica: Google + Bing + LLMs. Prohibido foros, Reddit, Telegram, Discord, Twitter/X, LinkedIn orgánico, pitching a medios (P8).
- ✅ Presupuesto herramientas externas = 0€. Solo APIs del stack existente (P9).
- ✅ Rank tracking vía GSC API (delay 2-3 días aceptado).
- ✅ Citas LLM trackeadas con ritual manual semanal (Claude Code WebSearch + queries manuales Aritz).
- ✅ Mantener `llms.txt` actualizado como hedge (coste bajo), sin sobre-invertir.

---

## 13. Registro de ejecución

| Fecha | Fase | Tarea | Status | Notas |
|---|---|---|---|---|
| 2026-04-19 | - | PlanSEO v2 creado | ✅ | Este documento |
| | F0.T1 | Diagnóstico cruzabilidad SQL | ⏳ | |
| | F0.T2 | Diagnóstico demanda GSC | ⏳ | |
| | F0.T3 | Auditoría Core Web Vitals | ⏳ | |
| | F0.T4 | Política indexación | ⏳ | |
| | F0.T5 | Helper `isArticleIndexable` | ⏳ | |
| | F0.T6 | Aplicar noindex quirúrgico | ⏳ | |
| | F0.T7 | Sitemap index (opción A→B) | ⏳ | |
| | F0.T8 | Filtrar sitemap /ley | ⏳ | |
| | F0.T9 | Fix `generateMetadata {}` | ⏳ | |
| | F0.T10 | Limpiar 404s sitemap | ⏳ | |
| | F0.T11 | Limpiar internal links a noindex | ⏳ | |
| | F0.T12 | Commit + deploy | ⏳ | |
| | F0.T13 | Submit GSC/Bing/IndexNow + Request Indexing top 12 | ⏳ | |
| | F0.T14 | Smoke test final | ⏳ | |

---

## 14. Siguiente paso (ahora mismo)

1. **F0.T1 + F0.T2 + F0.T3 en paralelo** (Aritz corre SQL + GSC query, Claude corre PageSpeed).
2. **F0.T4**: Aritz aprueba set indexable con datos reales.
3. **F0.T5 → F0.T14 secuencial** (~5h).
4. **Deploy + submits**.
5. **72h de monitorización pasiva**. GSC debería empezar a mostrar "Enviada y procesada".
6. **Arrancar Fase 1** lunes 21-abr.

**Criterio de éxito hoy:** al final del día GSC acepta nuevo sitemap index, 800-1.500 URLs marcadas "enviadas", resto `noindex`, 0 bugs de metadata, Core Web Vitals dentro de umbral.

**Criterio de éxito semana 1:** tras despliegue Fase 1, ≥300 URLs indexadas (curva creciente), pos. media no empeora.

**Criterio de éxito mes 1:** 50 clics/día, 6/12 oposiciones con ≥30 clics/mes, ≥600 URLs indexadas.
