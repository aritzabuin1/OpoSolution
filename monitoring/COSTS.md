# OPTEK — Tracking de Costes

> **Proyecto**: OPTEK
> **Budget Tier**: Client-Facing < $200/mes (Beta/Launch)
> **Alerta automática**: $10/día
> **Última actualización**: 2026-02-15

---

## Estimaciones Base (Consulta precios: 2026-02-15)

| Operación | Modelo | Tokens/Unidades | Coste Estimado |
|-----------|--------|-----------------|----------------|
| Generar test (10 preguntas) | Claude Sonnet | ~4k input + ~2k output | ~$0.04 (~0.037€) |
| Corregir desarrollo | Claude Sonnet | ~6k input + ~3k output | ~$0.08 (~0.074€) |
| Evaluar oral (Fase 2B) | Claude Sonnet | ~5k input + ~2.5k output | ~$0.06 (~0.055€) |
| Embedding (query) | text-embedding-3-small | ~100 tokens | ~$0.000002 |
| Embedding (ingesta chunk) | text-embedding-3-small | ~500 tokens | ~$0.00001 |
| Ingesta completa legislación | text-embedding-3-small | ~7.5M tokens | ~$0.15 |

---

## Proyección Mensual por Fase

### Beta (~50 usuarios)

| Concepto | Cálculo | Coste/mes |
|----------|---------|-----------|
| Claude API (tests) | 50 usuarios × 2 tests/día × 30 días × $0.04 | ~$120 |
| Claude API (correcciones) | 20 usuarios × 1/día × 30 × $0.08 | ~$48 |
| Embeddings (queries) | 100 queries/día × 30 × $0.000002 | ~$0.01 |
| Supabase Pro | Fijo | $25 |
| Vercel Pro | Fijo | $20 |
| Dominio | ~15€/año ÷ 12 | ~$1.30 |
| **Total estimado** | **+ 20% margen seguridad** | **~$257/mes (~130€ Claude + resto infra)** |

### Launch (~200 usuarios)

| Concepto | Cálculo | Coste/mes |
|----------|---------|-----------|
| Claude API (tests) | 200 × 2 × 30 × $0.04 | ~$480 |
| Claude API (correcciones) | 80 × 1 × 30 × $0.08 | ~$192 |
| Supabase Pro | Fijo | $25 |
| Vercel Pro | Fijo | $20 |
| Stripe fees | ~400 tx × (1.5% + 0.25€) avg | ~$75 |
| **Total estimado** | **+ 20% margen** | **~$950/mes** |

### Fase 2 (~1000 usuarios)

| Concepto | Cálculo | Coste/mes |
|----------|---------|-----------|
| Claude API (todos los flujos) | Proyección con oral+TTS+STT | ~$3,200 |
| Supabase Pro | Posible upgrade | $25-75 |
| Vercel Pro | Fijo | $20 |
| TTS/STT (ElevenLabs/OpenAI) | 500 usuarios oral × 5 min/día | ~$400 |
| Stripe fees | ~2000 tx | ~$350 |
| **Total estimado** | **+ 20% margen** | **~$4,800/mes** |

---

## Registro de Consumo Real

| Fecha | Tarea | Modelo | Tokens/Units | Coste Est. | Coste Real | Notas |
|-------|-------|--------|--------------|------------|------------|-------|
| — | — | — | — | — | — | Proyecto en fase de planificación |

---

## Total Acumulado

| Período | Estimado | Real | Desviación |
|---------|----------|------|------------|
| — | — | — | — |

---

## Alertas y Umbrales

- **$10/día**: Auto-alert → revisar si hay loop o abuso
- **$15/día**: Investigar causa antes de continuar
- **+30% sobre estimación mensual**: Revisión obligatoria de prompts y caching
- **Ingesta masiva >$10 estimados**: Pedir confirmación a Aritz antes de ejecutar
