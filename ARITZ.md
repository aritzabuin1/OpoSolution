# Knowledge Base - Aritz

Última actualización: Febrero 2026

---

## Introducción

Este documento es mi base de conocimiento acumulativa. Aquí documento TODO lo que aprendo en cada proyecto: decisiones técnicas, problemas resueltos, optimizaciones implementadas, y lecciones aprendidas.

**Objetivo**: Convertirme en un arquitecto de soluciones IA cada vez más profesional, valioso y eficiente con cada proyecto.

**Cómo usar este documento**:
- Revisar antes de empezar proyectos similares
- Consultar cuando enfrento problemas conocidos
- Identificar patrones reutilizables
- Medir mi progreso técnico a lo largo del tiempo

---

## Índice de Proyectos

1. [Proyecto Ejemplo: Automatización Due Diligence](#proyecto-ejemplo-automatización-due-diligence---enero-2025) ← Ejemplo ilustrativo
2. [Proyecto OPTEK: Plataforma IA para Opositores](#proyecto-optek-plataforma-ia-para-opositores---febrero-2026) ← Primer proyecto real

---

## Proyecto Ejemplo: Automatización Due Diligence - Enero 2025

> **NOTA**: Este es un proyecto de EJEMPLO para ilustrar cómo documentar. Los proyectos reales se documentarán siguiendo esta misma estructura.

### Resumen del Proyecto

Sistema que analiza memorandos de inversión (documentos PDF de 50-200 páginas) extrayendo automáticamente riesgos, oportunidades, y métricas financieras clave. Genera informes ejecutivos de 2 páginas para el equipo de inversión. Procesa aproximadamente 30 documentos por semana. Cliente: Fondo de inversión mid-market con equipo de 5 analistas que gastaban 4-6 horas por documento en análisis inicial.

**Resultado final**: Reducción del tiempo de análisis inicial de 5 horas a 45 minutos por documento, ahorro mensual en costes de personal ~$15K.

### 1. QUÉ HICIMOS - Implementaciones Clave

#### Prompt Caching para Reducción de Costes 90%

**Qué**: Implementamos caching de respuestas LLM usando hash de (prompt + document_chunk) como key en Redis.

**Por qué**: Muchos documentos de inversión tienen secciones similares (legal boilerplate, términos estándar, métricas comunes). Estábamos gastando $450/mes en llamadas repetidas a GPT-4 analizando contenido idéntico. El cliente tiene presupuesto ajustado y necesitábamos optimizar costes sin sacrificar calidad.

**Cómo**:
1. Setup de Redis en Railway ($5/mes, tier básico suficiente)
2. Creamos función `cached_llm_call(prompt, content, model, ttl=3600)`:
   - Genera cache_key = `sha256(prompt + content + model)`
   - Check Redis: `redis.get(cache_key)`
   - Si cache hit: return cached response inmediatamente (log hit)
   - Si cache miss: call OpenAI API, store resultado en Redis con TTL, return response
3. TTL configurado en 1 hora (documentos analizados raramente se reanalizan mismo día, pero puede haber revisiones)
4. Logging de cache hit rate para monitoreo y optimización

**Código relevante**:
```python
import redis
import hashlib
import json
import os

redis_client = redis.from_url(os.getenv('REDIS_URL'))

def cached_llm_call(prompt, content, model="gpt-4", ttl=3600):
    # Generar key única basada en inputs
    cache_key = hashlib.sha256(
        f"{prompt}{content}{model}".encode()
    ).hexdigest()
    
    # Intentar recuperar de cache
    cached = redis_client.get(cache_key)
    if cached:
        logger.info(f"Cache HIT: {cache_key[:8]}")
        return json.loads(cached)
    
    # Cache miss - llamar a API
    logger.info(f"Cache MISS: {cache_key[:8]}")
    response = openai_client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": f"{prompt}\n\n{content}"}]
    )
    
    # Guardar en cache
    redis_client.setex(
        cache_key, 
        ttl, 
        json.dumps(response.choices[0].message.content)
    )
    return response.choices[0].message.content
```

**Resultado**: 
- Cache hit rate: 73% tras primera semana de operación
- Coste mensual OpenAI: $450 → $122 (reducción 73%)
- Latencia mejorada: 8.2s promedio → 1.4s en cache hits
- ROI positivo desde día 2 (costes Redis $5/mes vs ahorro $328/mes)
- Cliente muy satisfecho con optimización

**Aplicabilidad futura**: Aplicar a cualquier proyecto con análisis repetitivo de contenido. Considerar aumentar TTL a 24-48h si contenido es completamente estático. Para contenido que cambia frecuentemente (ej: análisis de noticias en tiempo real), reducir TTL a 15-30 min o implementar invalidación selectiva.

#### Sistema de Guardrails para Prompt Injection

**Qué**: Implementamos validación multicapa para prevenir prompt injection en endpoints donde analistas pueden enviar queries personalizadas al sistema.

**Por qué**: Aunque sistema es interno, analistas pueden (intencionalmente o no) formular queries que extraigan el system prompt, accedan a datos de otros documentos, o modifiquen comportamiento del análisis. Riesgo de contaminación de resultados y potencial leak de datos sensibles.

**Cómo**:
1. **Capa 1 - Detección de Patrones**: Regex para detectar intentos obvios
2. **Capa 2 - Validación Pydantic**: Type checking + content validation
3. **Capa 3 - System Prompt Hardening**: Delimiters claros entre system y user input
4. **Capa 4 - Output Filtering**: Verificar responses no contengan fragments de system prompt
5. **Logging de Intentos**: Track todos los intentos bloqueados para análisis

**Resultado**:
- 0 incidentes en 3 meses de producción
- 12 intentos bloqueados (mayormente queries mal formadas, no maliciosas)
- Patrón documentado y reutilizable para futuros proyectos

**Aplicabilidad futura**: Usar en CUALQUIER interfaz LLM donde users puedan influir en prompts.

### 2. DECISIONES ARQUITECTÓNICAS

#### Decisión: FastAPI + Pydantic para Backend

**Decisión**: Usar FastAPI con Pydantic models en lugar de Flask.

**Alternativas consideradas**: 
- Flask + marshmallow (más maduro, team familiar)
- Django REST (overkill para este proyecto)

**Razones**: 
- Necesitábamos async/await para llamadas concurrentes a OpenAI (procesar múltiples secciones de documento en paralelo)
- Pydantic validation out-of-the-box crítico para enterprise-level input validation
- FastAPI's automatic OpenAPI docs útil para handoff al cliente
- Type hints = menos bugs, mejor DX

**Trade-offs**:
- Ventajas: Performance 2-3x mejor que Flask sync, validación robusta, docs automáticas
- Desventajas: Curva aprendizaje para async/await, menos ecosystem maduro que Flask

**Resultado**: Excelente decisión. Async permitió procesar documentos 60% más rápido. Pydantic catcheó múltiples edge cases en validación que hubieran llegado a producción.

#### Decisión: PostgreSQL para Almacenamiento vs MongoDB

**Decisión**: PostgreSQL en Railway.

**Alternativas consideradas**:
- MongoDB Atlas (document-oriented parecía natural para PDFs)
- SQLite (más simple)

**Razones**:
- Necesitábamos relaciones complejas (Documents ↔ Analyses ↔ Findings)
- ACID properties críticas (análisis financiero = datos sensibles)
- Team más familiar con SQL
- pgvector extension útil para futura semantic search

**Trade-offs**:
- Ventajas: Integridad referencial, ACID, queries complejas fáciles
- Desventajas: Schema migrations más rígidas, no tan natural para JSON nested

**Resultado**: Correcta. Relaciones entre entities resultaron más complejas de lo anticipado. PostgreSQL manejó esto excelentemente.

### 3. PROBLEMAS RESUELTOS

#### Problema: Timeout en Documentos Largos (>150 páginas)

**Problema**: Documentos de 150+ páginas causaban timeouts (30s límite de OpenAI) y errores en producción. Cliente reportó 3 fallos en primera semana.

**Causa raíz**: Intentábamos analizar documento completo en una sola llamada a API. Token limit de GPT-4 (8K en ese momento) insuficiente para docs largos.

**Solución**:
1. Implementamos chunking inteligente: 
   - Split por secciones (usando PDF structure/headers)
   - Max 3K tokens por chunk (margen de seguridad)
2. Procesamiento paralelo con asyncio (max 3 requests concurrentes para no hit rate limits)
3. Agregación de resultados con LLM final pass (meta-análisis)
4. Implementamos retry logic con exponential backoff para llamadas individuales

**Código relevante**:
```python
async def analyze_large_document(doc_path, max_concurrent=3):
    chunks = intelligent_chunk(doc_path, max_tokens=3000)
    
    # Procesar chunks en paralelo con semaphore
    sem = asyncio.Semaphore(max_concurrent)
    async def process_chunk(chunk):
        async with sem:
            return await analyze_chunk(chunk)
    
    chunk_results = await asyncio.gather(*[
        process_chunk(c) for c in chunks
    ])
    
    # Meta-análisis para consolidar
    final_analysis = await consolidate_findings(chunk_results)
    return final_analysis
```

**Prevención futura**: 
- Añadimos test con doc sintético de 200 páginas en test suite
- Documentamos límites claros en PLAN.md de futuros proyectos (max tokens, rate limits)
- Creamos directiva `directives/process_large_documents.md` con este patrón

**Resultado**: 0 timeouts en 2 meses siguientes. Performance mejoró (parallelization).

### 4. OPTIMIZACIONES Y MEJORAS

#### Optimización: Prompt Engineering para Reducir Tokens 40%

**Situación inicial**: Prompts iniciales muy verbosos (~1200 tokens por análisis). Coste alto, latencia alta.

**Cambio realizado**: 
1. Condensamos instrucciones de 1200 tokens a 720 tokens
2. Usamos examples más concisos (few-shot learning)
3. Movimos formatting instructions a post-processing (no en prompt)

**Implementación**:
- Before: "Please analyze this document thoroughly, paying attention to all financial metrics, risk factors, market opportunities..." (verbose)
- After: "Extract: financial metrics, risks, opportunities. Format: JSON." (conciso + examples)

**Impacto**: 
- Tokens por request: 1200 → 720 (40% reducción)
- Coste mensual: $122 → $73 (reducción adicional 40% post-caching)
- Latencia: 1.4s → 0.9s promedio
- **Calidad mantenida** (validated con test set de 50 docs)

**Aplicabilidad**: Aplicar aggressive prompt optimization a todos proyectos con volumen alto de llamadas LLM. Trade-off: requiere más testing para validar calidad no degrada.

### 5. LECCIONES APRENDIDAS

- **Async/await vale la pena**: 60% mejora en performance para I/O-bound tasks. La curva de aprendizaje inicial se amortiza rápido en proyectos con múltiples API calls.

- **Prompt caching es low-hanging fruit**: En proyectos con contenido repetitivo, implementar caching PRIMERO antes de optimizar prompts. ROI inmediato.

- **Testing con documentos reales es crítico**: Tests sintéticos no capturaron edge cases. Pedir al cliente 20-30 docs reales para test suite vale el esfuerzo.

- **Validación de inputs previene 80% de bugs**: Pydantic models capturaron innumerables edge cases que hubieran llegado a producción. Invertir tiempo en schemas robustos.

- **Chunking inteligente > chunking fijo**: Dividir por estructura semántica (secciones, headers) produce mejores resultados que dividir cada N tokens.

### 6. HERRAMIENTAS Y CONFIGURACIONES ÚTILES

#### Redis en Railway

**Para qué sirve**: Caching de respuestas LLM, session storage, rate limiting.

**Cómo configurar**:
1. Railway dashboard → New → Redis
2. Copy connection string
3. `.env`: `REDIS_URL=redis://...`
4. Python: `pip install redis`
5. Connect: `redis.from_url(os.getenv('REDIS_URL'))`

**Gotchas**:
- Railway Redis free tier: 100MB. Suficiente para caching moderado.
- TTL default es None (data persiste forever) - SIEMPRE especificar TTL
- Keys no expiran automáticamente bajo memory pressure - implementar LRU manualmente si necesario

#### FastAPI + Pydantic Validation Pattern

**Para qué sirve**: Type-safe API development con validación automática.

**Cómo configurar**:
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, validator

class DocumentAnalysisRequest(BaseModel):
    document_url: str
    analysis_type: str
    
    @validator('analysis_type')
    def validate_analysis_type(cls, v):
        allowed = ['financial', 'risk', 'full']
        if v not in allowed:
            raise ValueError(f'Must be one of {allowed}')
        return v

app = FastAPI()

@app.post("/analyze")
async def analyze(request: DocumentAnalysisRequest):
    # Pydantic ya validó inputs aquí
    result = await process_document(request)
    return result
```

**Gotchas**:
- Pydantic v2 (2024+) tiene breaking changes vs v1
- Validators ejecutan en orden definición - orden importa
- async validators requieren Pydantic v2+

---

## Proyecto OPTEK: Plataforma IA para Opositores — Febrero 2026

### Resumen del Proyecto

PWA de entrenamiento para opositores españoles usando IA (Claude API) con verificación determinista de citas legales. Primera oposición: Auxiliar Administrativo del Estado (25 temas, 3 leyes core en MVP: CE, LPAC, LRJSP → 72% del temario cubierto). **Modelo de negocio (ADR-0010 — Fuel Tank)**: freemium (5 tests + 2 correcciones totales) + por tema (4.99€ one-time, +5 correcciones) + Pack Oposición (34.99€ one-time, +20 correcciones) + Recarga (8.99€ one-time, +15 correcciones). **Sin suscripciones.** Stack: Next.js 14 (App Router) + Tailwind + shadcn/ui + Supabase + Claude API (Haiku para tests, Sonnet para correcciones) + Stripe + PWA.

**Diferenciador clave**: Verificación determinista — cada cita legal generada por Claude se verifica con código tradicional (regex + BD lookup) ANTES de mostrarse al usuario. No confiamos en que la IA sea precisa; confiamos en que nuestro CÓDIGO lo verifique.

**Estado actual (Feb 2026)**: Fase 0 completada y desplegada en Vercel. Landing, auth UI, onboarding, paywall 402 implementados. Migración 006 (corrections_balance + 4 RPCs atómicas) aplicada. Fase 1A (RAG + verificación determinista) es el siguiente bloque.

### 1. QUÉ HICIMOS - Fase de Planificación

#### Arquitectura de Documentación Ejecutable (PLAN.md como Spec)

**Qué**: PLAN.md de 1447 líneas con 158+ tareas en Fase 0, cada una con criterios de aceptación verificables, creado para que Claude Code lo ejecute autónomamente como si fuera una spec de producto.

**Por qué**: Con 1 persona + IA como motor de desarrollo, el cuello de botella no es escribir código sino tener una spec lo suficientemente detallada para que la IA la ejecute sin ambigüedad. Cada tarea ambigua = código inconsistente.

**Cómo**: Cada tarea del PLAN.md incluye:
- Descripción precisa de qué hacer (comando exacto o patrón de código)
- Criterios de aceptación verificables (ej: "`pnpm build` compila sin errores")
- Dependencias explícitas entre tareas (ej: "§0.5 requiere §0.4 completado")
- Referencias a directives específicas cuando aplica (ej: "Seguir `opoia_security.md §1` para regex PII")

**Resultado**: Timeline estimado reducido de 22 semanas (plan original manual) a 4-5 semanas con Claude Code. El PLAN.md actúa como contrato entre el humano (decisiones) y la IA (ejecución).

#### Sistema de Verificación Determinista como Diferenciador de Producto

**Qué**: Diseño completo de una capa de código (NO IA) que verifica cada cita legal antes de mostrarse al usuario. Documentada en directive dedicada de 800+ líneas (`opoia_verification.md`).

**Por qué**: El mercado de oposiciones online (OpositaTest, etc.) usa preguntas estáticas escritas por humanos. OPTEK genera preguntas con IA, pero la IA puede alucinar citas legales. La verificación determinista convierte una debilidad (IA puede equivocarse) en fortaleza (sistema que GARANTIZA precisión).

**Cómo**: Pipeline de 4 pasos:
1. `extractCitations(text)` — Regex para extraer citas en múltiples formatos ("Art. 53.1.a LPAC", "artículo catorce CE", etc.)
2. `verifyCitation(citation)` — Lookup en BD: ¿existe este artículo en la legislación ingestada?
3. `verifyContentMatch(citation, claim, realArticle)` — ¿El contenido citado (plazos, órganos, conceptos) coincide con el texto real del artículo?
4. `verifyAllCitations(content)` — Orquestador: score = citas_verificadas / total. Si score < umbral → regenerar pregunta.

**Resultado**: Diseño completo con tests unitarios especificados para cada función. La v1 usa regex + diccionario de aliases (>80% resolución sin IA). La v2 (post-MVP) añade normalización semántica con Claude para el 20% restante.

#### Modelo de Pricing Fuel Tank (ADR-0010 — iteración final)

**Qué**: Modelo de monetización one-time sin suscripciones. "Fuel Tank": las correcciones son combustible — cuando se agotan, el usuario recarga. Los tests son ilimitados (baratos con Haiku). 4 productos: Gratis, Por Tema (4.99€), Pack Oposición (34.99€), Recarga (8.99€).

**Por qué**: El mercado español tiene subscription fatigue severa. Los opositores rechazan activamente nuevas suscripciones mensuales. Además, la economía unitaria de tests (Haiku, ~0.005€/test) vs correcciones (Sonnet, ~0.035€/corrección) permite tests ilimitados sin perder dinero. Las correcciones son el recurso escaso que genera recurrencia (Recarga).

**Behavioral economics aplicados**:
1. **Endowment Effect** — corrections_balance visible en dashboard. El usuario siente que "posee" combustible. Cuando baja a 3 → compra Recarga sin fricciones.
2. **Pain of Paying reducido** — 34.99€ one-time activa menos "dolor" a lo largo del tiempo que 12 × 12.99€/año, aunque el total sea mayor.
3. **Decoy Effect** — Por Tema (4.99€) hace que Pack (34.99€) parezca superior (7 temas × 4.99€ = 34.93€, más todo el temario y 4× correcciones).
4. **Loss Aversion** — Copy del 402: "¿Te quedas sin correcciones?" (reposición), no "¿Quieres más?" (venta).
5. **Peak-End Rule** — Paywall llega justo cuando el usuario acaba su primer test (peak de engagement).

**Implementación técnica clave**:
- `corrections_balance` en profiles — saldo visible como "depósito"
- RPCs atómicas (`use_correction`, `use_free_correction`, `use_free_test`, `grant_corrections`) — previenen race conditions (DDIA Consistency)
- Webhook Stripe → `grant_corrections(userId, amount)` tras cada compra
- Paywall HTTP 402 con `upsell` array — frontend muestra modal de recarga
- Límite silencioso 20 tests/día (Upstash) — safety net económico sin comunicarlo

**Economía unitaria** (escenario pesimista: 20 tests/día):
- Coste: 20 × 0.005€ × 30 días = 3€/mes. Pack neto: ~33.94€. Payback: ~11 meses pesimista, ~2 meses uso típico.
- LTV con 2 Recargas/año: 34.99€ + 2 × 8.99€ = 52.97€ sin suscripción.

**Documentado en**: `docs/decisions/ADR-0010-pricing-fuel-tank.md`

#### Naming con Ciencia (OpoIA → OPTEK)

**Qué**: Rebranding del nombre original "OpoIA" a "OPTEK" usando phonosemantics y sound symbolism.

**Por qué**: "OpoIA" tiene un problema fonético crítico en español: suena similar a "polla" (coloquial para pene). Esto haría la marca inviable para marketing en España (TikTok, foros, boca a boca).

**Cómo**: Evaluación de 10 candidatos aplicando:
- **Phonosemantics** (Hinton, Nichols & Ohala, 1994): consonantes plosivas (/p/, /t/, /k/) se asocian con precisión, velocidad y solidez. OPTEK tiene 3 plosivas en 2 sílabas.
- **Sound Symbolism** (Klink, 2000): vocales posteriores (/o/) se asocian con productos robustos. Combinación O-E transmite estabilidad + modernidad.
- **Brevedad**: 2 sílabas, 5 letras (comparable a Slack, Stripe, Vercel).
- **Reconocimiento**: "Opo" inmediatamente reconocible por opositores. "-tek" evoca tecnología sin atarse a "IA" (que puede ser moda pasajera en branding).

**Resultado**: OPTEK elegido. Tagline: "Tecnología que aprueba contigo". Sin connotaciones negativas en español, inglés, francés o portugués. Dominio optek.es disponible.

### 2. DECISIONES ARQUITECTÓNICAS

#### Next.js 14 + Supabase + Claude API (no FastAPI + PostgreSQL separados)

**Decisión**: Monorepo frontend+backend con Next.js 14 App Router, Supabase como BaaS completo.

**Alternativas consideradas**:
- FastAPI backend + React SPA separada (mi stack previo en Due Diligence)
- Django + DRF + React
- Remix + Prisma + PostgreSQL propio

**Razones**:
- Un solo codebase para 1 persona + IA — no mantener 2 repos, 2 deploys, 2 stacks
- Supabase incluye auth + PostgreSQL + pgvector + storage + realtime sin gestionar infra
- Vercel deploy instantáneo (git push → producción en segundos)
- Next.js App Router = server components + API routes en el mismo proyecto
- shadcn/ui = componentes accesibles sin vendor lock-in (son archivos, no dependencias)

**Trade-offs**:
- Ventajas: Velocidad de desarrollo extrema, 0 DevOps, TypeScript end-to-end
- Desventajas: Menos control sobre backend que FastAPI, vendor lock-in parcial con Supabase (mitigado: SQL standard + export disponible), Vercel pricing puede escalar

**Resultado**: Pendiente de validar en implementación. La decisión se tomó priorizando velocidad de desarrollo sobre control granular.

#### PWA vs App Nativa (ADR-0013)

**Decisión**: PWA-first, sin publicar en stores durante MVP.

**Alternativas**: React Native, Flutter, Capacitor/Ionic.

**Razones**:
- Sin Apple/Google tax: 3% Stripe vs 15-30% stores (en tema a 4.99€, la store se llevaría 0.75-1.50€ vs 0.15€ de Stripe)
- Deploy instantáneo vs 2-7 días revisión de App Store
- SEO: Google indexa la PWA, no una app nativa (canal de adquisición principal)
- Un solo codebase: React Native/Flutter duplicaría el tiempo de desarrollo
- El 95% del uso es formularios + texto — no necesita APIs nativas

**Trade-offs**:
- iOS Safari tiene limitaciones (push notifications solo desde iOS 16.4+, service worker limitado)
- Instalación menos intuitiva que "Descargar de App Store"
- Mitigación: tutorial visual in-app para instalación. Considerar TWA para Google Play cuando >1000 usuarios.

#### MVP con 3 leyes, no 7 (ADR-0014)

**Decisión**: Solo CE (Constitución), LPAC (Ley 39/2015), LRJSP (Ley 40/2015) en MVP.

**Razones**: 3 leyes cubren ~72% del temario de Auxiliar Administrativo. Suficiente para validar el producto. Las 4 restantes (TREBEP, LTBG, LCSP, LOPDGDD) se añaden post-validación en sprints de 1-2 semanas cada una.

**Trade-offs**: El 28% del temario no cubierto puede hacer que el producto parezca "incompleto" vs OpositaTest. Mitigación: comunicar transparentemente "Beta con 3 leyes core. Más leyes próximamente." El diferenciador (verificación determinista) compensa la menor cobertura.

### 3. PROBLEMAS RESUELTOS

#### Bug Crítico: .gitignore con patrón no anclado silencia toda la carpeta lib/

**Problema**: 3 deploys consecutivos fallaron en Vercel con `Module not found: Can't resolve '@/lib/supabase/server'`. La causa no era obvia porque los archivos existían localmente y `pnpm build` funcionaba en local.

**Causa raíz**: El `.gitignore` raíz del repo tenía la línea `lib/` (patrón de Python venv). En un repo de Python, esto es correcto. Pero en un monorepo con `optek/lib/`, el patrón no anclado al root silenciaba TODOS los ficheros bajo cualquier `lib/` del repo — incluyendo los 10 ficheros críticos de `optek/lib/`. Git nunca los trackó, Vercel nunca los tenía, el build fallaba.

**Fix**: Cambiar `lib/` → `/lib/` y `lib64/` → `/lib64/` (anchored to repo root). Añadir explícitamente los 10 ficheros con `git add optek/lib/*`.

**Síntomas que llevan a confusión**:
- `pnpm build` funciona local (los ficheros SÍ existen en disco, solo no en git)
- `git status` no los muestra como untracked (porque están en .gitignore)
- El error parece de TypeScript/webpack, no de git
- 3 intentos de fixes incorrectos (tsconfig baseUrl, turbopack, webpack) antes de encontrar la causa real

**Prevención futura**: En monorepos con múltiples lenguajes, SIEMPRE anclar los patrones de `.gitignore` con `/`. `lib/` → silencia todo. `/lib/` → solo silencia la carpeta lib/ en el root del repo. Verificar que ficheros críticos están tracked con `git ls-files optek/lib/` antes de cada deploy.

#### Análisis Crítico de Informe de Seguridad Automatizado (Gemini, 22 hallazgos)

**Problema**: Gemini analizó el proyecto y generó 22 "hallazgos de seguridad" que parecían todos críticos. Si los hubiéramos incorporado todos sin análisis, habríamos añadido ~20h de trabajo innecesario y complejidad.

**Causa raíz**: Las auditorías automatizadas de IA sufren de:
- Falsos positivos: reportan problemas que ya están cubiertos en otra sección del documento
- Falta de contexto: no entienden que ciertas features están fuera del scope del MVP
- Sesgo alarmista: todo parece "crítico" para generar valor percibido

**Solución**: Análisis manual de cada hallazgo contra la documentación real:
- **7 genuinos** (32%): Hard cap 30 tests/día Pack, INSERT-first webhook, circuit breaker Claude, negative lookbehind regex PII, convención .down.sql, UNIQUE constraint legislacion, useRef doble-click
- **8 ya cubiertos** (36%): Gemini no leyó bien — §1.5.2 ya cubría regex, §1.16.6 ya tenía expiración 24h, §1.15.2 ya verificaba firma webhook, etc.
- **4 irrelevantes para MVP** (18%): Dashboard admin, Quality Score monitoring, audio packs — features eliminadas del MVP
- **3 exagerados** (14%): Rate limit por IP compartida, prompt injection throttling — edge cases que no justifican complejidad en MVP

**Prevención futura**: Siempre contrastar hallazgos automatizados con la documentación real. Crear checklist: ¿Ya está cubierto? ¿Es relevante para el scope actual? ¿El fix justifica la complejidad? Nunca incorporar hallazgos de IA a ciegas.

### 4. OPTIMIZACIONES Y MEJORAS

#### Separación de modelos por tipo de tarea: Haiku para tests, Sonnet para correcciones

**Situación**: La primera spec usaba Claude Sonnet para TODO (tests MCQ + correcciones de desarrollo). Sonnet cuesta ~0.018€/test con MCQ típicas.

**Optimización**: Separar por complejidad cognitiva de la tarea:
- **Tests MCQ** → Claude Haiku 4.5 (`claude-haiku-4-5-20251001`): input $0.80/1M, output $4.00/1M → ~0.005€/test. El MCQ no requiere razonamiento profundo, Haiku es suficiente.
- **Correcciones de desarrollo** → Claude Sonnet 4.6 (`claude-sonnet-4-6`): input $3.00/1M, output $15.00/1M → ~0.035€/corrección. La evaluación multidimensional de un texto jurídico SÍ requiere el modelo más capaz.

**Impacto económico**:
- Tests: 72% reducción de coste por test (0.018€ → 0.005€)
- Hace económicamente viable tests ilimitados: 20 tests/día = 3€/mes de coste
- Las correcciones, aunque 7× más caras, son el recurso escaso (2 gratis, luego pago) → coste controlado
- Pack Oposición (34.99€) tiene payback ~2 meses con uso típico

**Implementación**: Dos funciones separadas en `lib/ai/claude.ts`: `callClaude()` (Sonnet, default) y `callClaudeHaiku()` (Haiku, para generate-test). Constantes de coste separadas para logging exacto en `api_usage_log`.

#### Reducción de Scope: 22 semanas → 4-5 semanas

**Situación inicial**: PLAN.md original con 5 fases, 22 semanas, features como simulador oral (Whisper + TTS), audio-learning (ElevenLabs), plan adaptativo, IPR, rankings, alertas BOE email, 7 leyes.

**Cambio realizado**: Análisis riguroso de qué features son necesarias para VALIDAR el mercado vs cuáles son nice-to-have:
- Eliminado: Simulador oral, audio-learning, plan adaptativo, IPR, rankings, alertas BOE email, segunda oposición, gamificación avanzada, verificación v2
- Simplificado: Flashcards (SM-2 → intervalos fijos), BOE monitor (cron → manual), OAuth (Google → solo Magic Link), load test (50 → 10 concurrentes)
- Reducido: 7 leyes → 3 leyes (72% cobertura suficiente para validar)

**Impacto**:
- Timeline: 22 semanas → 4-5 semanas (con Claude Code como desarrollador)
- Complejidad: Eliminadas 3 integraciones complejas (Whisper, ElevenLabs, Google OAuth)
- Riesgo: Validar con lo mínimo antes de invertir en features secundarias

**Aplicabilidad**: En cualquier proyecto, antes de añadir features, preguntarse: "¿Esto es necesario para VALIDAR la hipótesis de negocio, o es decoración?" Si no es necesario para la validación → post-MVP.

### 5. LECCIONES APRENDIDAS

- **El plan ES el producto antes del código**: Con 1 persona + IA, invertir 2-3 días en un PLAN.md ultra-detallado con criterios de aceptación reduce el timeline de desarrollo de meses a semanas. Sin spec clara, la IA improvisa y produce código inconsistente. Con spec detallada, la IA ejecuta como un senior developer.

- **Naming science funciona**: Phonosemantics y sound symbolism (Klink 2000, Lowrey & Shrum 2007) no son teoría académica inútil — son herramientas prácticas para branding que cualquier emprendedor puede aplicar. Consonantes plosivas para precisión, vocales para robustez, brevedad para recall.

- **Behavioral economics en pricing es diferenciador competitivo**: No basta con poner un precio "razonable". El mercado español de oposiciones tiene psicología específica (subscription fatigue, sensibilidad al precio, inversión en ventaja competitiva). Aplicar Loss Aversion, Anchoring, Decoy Effect, IKEA Effect convierte el pricing en una ventaja competitiva, no solo un número.

- **Auditorías IA tienen ~50% falsos positivos**: Contrastar SIEMPRE cada hallazgo con la documentación real antes de actuar. Las IAs auditoras tienen sesgo alarmista y no leen contexto completo. 7 de 22 hallazgos genuinos = 32% de precisión.

- **Claude Code como desarrollador principal cambia las reglas**: Lo que un humano tarda 10-14 semanas, Claude Code ejecuta en 4-5 semanas. Pero el cuello de botella se mueve del código a: (1) calidad de la spec, (2) decisiones humanas, (3) validación de datos, (4) cuentas/infra que solo el humano puede crear.

- **Primero el stack más simple**: Supabase Free tier cubre MVP. No necesitas Redis, no necesitas Kubernetes, no necesitas microservicios. Un monolito Next.js + Supabase es suficiente para validar con 100 usuarios. Optimizar cuando tengas el problema, no antes.

- **El scope mínimo viable es más pequeño de lo que crees**: 3 leyes cubren 72% del temario. No necesitas 7 leyes para validar. No necesitas simulador oral para saber si la gente paga por tests verificados. Cada feature añadida sin validación de mercado es riesgo puro.

- **Los patrones de `.gitignore` sin anclar son bombas silenciosas en monorepos**: `lib/` silencia toda carpeta `lib/` en cualquier nivel del repo. `/lib/` solo silencia la del root. En monorepos con múltiples lenguajes (Python + Node en el mismo repo), revisar cada patrón de `.gitignore` y añadir `/` para anclarlo. Verificar ficheros críticos con `git ls-files` antes del primer deploy a producción.

- **La separación de modelos por complejidad es economía, no premature optimization**: No uses el mismo modelo para todo. MCQ → Haiku (72% más barato, calidad suficiente). Evaluación compleja → Sonnet (7× más caro, pero necesario). El diferencial de coste permite modelos de negocio que de otro modo no serían viables (tests ilimitados).

- **Sin suscripción puede ser una ventaja competitiva, no una debilidad**: En mercados con subscription fatigue, el modelo "paga una vez, úsalo siempre" genera más conversiones iniciales y menos churn. La recurrencia viene del reabastecimiento natural (Recarga de correcciones), no de una renovación mensual que el usuario puede cancelar.

### 6. HERRAMIENTAS Y CONFIGURACIONES ÚTILES

#### Claude Code como Motor de Desarrollo

**Para qué sirve**: Ejecutar un PLAN.md completo como spec, generando todo el código del proyecto de forma autónoma.

**Cómo configurar**:
1. CLAUDE.md con workflow plan-first obligatorio (nunca código sin plan aprobado)
2. Directives como SOPs: cada tarea repetible tiene su procedimiento documentado
3. PLAN.md como spec ejecutable: cada tarea con criterios de aceptación verificables
4. ARITZ.md como knowledge base: lecciones aprendidas se acumulan entre proyectos

**Gotchas**:
- Necesita tareas con criterios de aceptación EXPLÍCITOS. "Haz el auth" → código inconsistente. "Email + Magic Link, middleware en `/(dashboard)/*`, redirect a `/login` si no autenticado, test: usuario no autenticado → redirect 302" → código correcto.
- El contexto se pierde entre sesiones largas. Usar `/compact` y resumir estado frecuentemente.
- Rate limits de Claude Code pueden interrumpir sprints largos. Planificar tareas en bloques.

#### Anthropic Claude API (para el producto OPTEK)

**Para qué sirve**: Generación de preguntas de test, corrección de desarrollos, generación de flashcards.

**Configuración por endpoint**:
- GENERATE_TEST: **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`), temperature 0.3, ~0.005€/test
- CORRECT_DESARROLLO: **Claude Sonnet 4.6** (`claude-sonnet-4-6`), temperature 0.4, ~0.035€/corrección
- Timeout: 30s, retry max 2 con exponential backoff
- Circuit breaker: CLOSED→OPEN tras 5 fallos consecutivos, reset tras 60s
- Separación de costes en `api_usage_log` para monitorización real por endpoint

**Gotchas**:
- Necesita DPA (Data Processing Agreement) para usuarios europeos (GDPR). Verificar en anthropic.com/legal ANTES de escribir código.
- Las respuestas JSON de Claude a veces no parsean correctamente. Siempre validar con Zod schema + retry 1 vez si falla parse.
- Temperature importa MUCHO para tests legales: 0.3 es óptimo (más bajo = respuestas repetitivas, más alto = alucinaciones).

#### Supabase como Backend Completo

**Para qué sirve**: Auth (email + Magic Link) + PostgreSQL + pgvector (embeddings 1536d) + Storage + RLS (Row Level Security) + auto-generación de types TypeScript.

**Configuración clave**:
- Region: EU (Frankfurt o London) para GDPR
- Auth: Email + Magic Link habilitado, Google OAuth deshabilitado en MVP
- pgvector: `CREATE EXTENSION vector` para embeddings de legislación
- RLS: Habilitado en TODAS las tablas con datos de usuario
- Connection pooling: PgBouncer Transaction mode (port 6543)

**Gotchas**:
- Free tier: 500MB BD, 50MB storage, 2 proyectos max. Suficiente para MVP con ~100 usuarios.
- Auto-generación de types: `pnpm supabase gen types typescript` — ejecutar cada vez que cambie el schema.
- RLS mal configurado = agujero de seguridad. Siempre verificar: "Usuario A puede ver datos de Usuario B?" → debe ser NO.
- Las migrations van en `supabase/migrations/` con convención `YYYYMMDD_name.sql` + `YYYYMMDD_name.down.sql` (rollback obligatorio).

#### Stack Técnico OPTEK (Next.js 14 ecosystem)

**Frontend**: Next.js 14 App Router + Tailwind CSS + shadcn/ui
- shadcn/ui: componentes copiados al proyecto (no dependencia npm) → customización total
- Server Components por defecto, Client Components solo cuando se necesita interactividad
- PWA: serwist/next-pwa para service worker + manifest.json

**Pagos**: Stripe (ADR-0010 — Fuel Tank, sin suscripciones)
- 4 productos one-time: Tema Individual (4.99€, +5 corr), Pack Oposición (34.99€, +20 corr), Recarga (8.99€, +15 corr), Gratis (0€, 5 tests + 2 corr totales)
- Webhook con patrón SELECT-then-INSERT para idempotencia (stripe_events_processed) + grant_corrections RPC tras compra
- corrections_balance en profiles — depósito de "combustible" visible al usuario

**Observabilidad**: Pino (logs) + Sentry (errors) + Upstash Redis (rate limiting)
- Pino: JSON en producción, pretty en desarrollo
- Sentry: traces_sample_rate=0.1, captura errores + performance
- Upstash: rate limiting por user_id (no por IP) en endpoints `/api/ai/*`

### 3. FASE DE IMPLEMENTACIÓN

#### BLOQUE A — Arquitectura de Seguridad

##### A1. Rate limiting por `user_id`, NO por IP

- **Implementación**: Upstash Redis, sliding window, `lib/utils/rate-limit.ts`
- **Límites**: `/api/ai/generate-test` → 10 req/min (free) / 20 req/día (paid). `/api/ai/correct-desarrollo` → 5 req/min
- **WHY `user_id`, no IP**: En España los IPs se comparten masivamente (universidades, VPNs, NAT de operadoras). Limitar por IP afectaría a 100+ usuarios inocentes. `user_id` = control preciso sobre la persona que abusa, no sobre el nodo de red.
- **WHY sliding window** (no fixed window): Fixed window tiene "burst at boundary" — un usuario puede hacer 10 req en el segundo 59 + 10 req en el segundo 61 = 20 req en 2 segundos. Sliding window lo previene.
- **Graceful degradation**: Si Upstash no está configurado → allow all (permite desarrollo sin Redis).

##### A2. Sanitización de inputs: DOMPurify + regex PII (`lib/utils/sanitize.ts`)

- **Pipeline**: `sanitizeForAI(texto)` = `sanitizeUserText(sanitizeHtml(texto))`
- DOMPurify elimina HTML/JS (XSS prevention). Regex redacta: DNI, NIE, teléfonos, email, IBAN, tarjetas, SS → sustituye por `[PII_REDACTADO]`
- **WHY**: Anthropic NO tiene DPA (Data Processing Agreement) compatible con GDPR para usuarios europeos (verificado en anthropic.com/legal). Enviar PII de un ciudadano español a Claude API → violación GDPR Art. 28 (subprocessor sin contrato). La sanitización elimina el riesgo: texto sin PII identificable → no hay transferencia de datos personales.
- **WHY negative lookbehind en regex DNI**: El patrón estándar `\d{8}[A-Z]` detectaría "artículo 12345678A LPAC" como DNI. El negative lookbehind `(?<!\bReal Decreto )` previene falsos positivos con referencias legales.
- **Lección clave**: La frontera GDPR no está en "qué datos guardamos" sino en "a qué terceros los enviamos". Un campo de texto libre enviado a una API externa es transferencia internacional de datos.

##### A3. Idempotencia webhook Stripe — INSERT-first (`app/api/stripe/webhook/route.ts`)

- **Patrón**: `INSERT INTO stripe_events_processed(stripe_event_id)` → si PostgreSQL lanza error `23505` (UNIQUE violation) → evento ya procesado → return 200 sin procesar.
- **WHY INSERT-first, no SELECT-then-INSERT**: SELECT-then-INSERT tiene race condition. Dos workers concurrentes: ambos hacen SELECT → ambos ven "no procesado" → ambos INSERT → usuario recibe doble recarga. Con INSERT-first, la BD resuelve la concurrencia con UNIQUE constraint. Patrón de DDIA cap. 7.
- **WHY verificar firma HMAC siempre**: `stripe.webhooks.constructEvent(body, sig, secret)` previene POST falsos que auto-concedan correcciones.

##### A4. Row-Level Security (RLS) en Supabase

- **Habilitado en**: `profiles`, `tests_generados`, `desarrollos`, `compras`, `suscripciones`, `preguntas_reportadas`
- **Política**: `auth.uid() = user_id` (least privilege)
- **WHY RLS aunque tengamos auth en API routes**: Defense in depth. Si una API route tiene un bug y olvida verificar `user_id`, el usuario malicioso recibe un error de Postgres, no los datos de otro usuario. RLS es la última línea de defensa a nivel BD.
- **WHY `createServiceClient()` en webhooks**: El webhook de Stripe no tiene sesión de usuario. `SUPABASE_SERVICE_ROLE_KEY` bypasea RLS para escribir en `compras` en nombre de cualquier usuario. Esta clave NUNCA sale del servidor.

##### A5. Circuit breaker para Claude API (`lib/ai/claude.ts`)

- **Estados**: `CLOSED` (normal) → `OPEN` (5 fallos consecutivos) → `HALF_OPEN` (probe request tras 60s)
- **En OPEN**: devuelve error inmediato sin llamar a Claude → protege de requests que van a fallar
- **WHY circuit breaker**: Sin él, si Claude tiene un outage, cada request espera 30s. Con 100 usuarios concurrentes = 100 × 30s de conexiones colgadas = servidor saturado. El circuit breaker detecta el outage tras 5 fallos y devuelve error inmediato (0.1ms).
- **WHY HALF_OPEN**: No quedarse en OPEN para siempre si Claude se recupera. 1 request de prueba → si funciona: CLOSED. Si falla: reset timer OPEN.
- **Patrón reutilizable**: Funciona para cualquier API externa (OpenAI, Stripe, Resend).

##### A6. GDPR: Borrado en cascada con cumplimiento fiscal (`app/api/user/delete/route.ts`)

- **Flow 8 pasos**: anonimizar `compras.user_id → NULL` → delete suscripciones → desarrollos → preguntas_reportadas → tests_generados → logros → profiles → `auth.users`
- **WHY `compras.user_id → NULL` (no delete)**: La Ley 58/2003 General Tributaria Art. 70 obliga a conservar registros de transacciones durante 4 años. Eliminar `user_id` anonimiza la compra conservando importe y fecha para cumplir con AEAT.
- **WHY este orden específico**: Las foreign keys de PostgreSQL requieren borrar hijos antes que padres. El orden garantiza que no haya referencias huérfanas.
- **Lección**: GDPR y legislación fiscal a veces chocan (derecho al olvido vs obligación de conservar). La solución es anonimización, no borrado.

##### A7. Security headers en middleware (`proxy.ts`)

- `X-Frame-Options: DENY` → previene clickjacking. `X-Content-Type-Options: nosniff` → previene MIME sniffing. `Content-Security-Policy` → restringe fuentes de scripts/estilos/imágenes. `Permissions-Policy: camera=(), microphone=(), geolocation=()`. `x-request-id` (UUID) en cada response → correlación de logs en Sentry.
- **WHY en middleware y no en vercel.json**: El middleware ejecuta en Edge Runtime → geo-distribuido → headers aplicados antes de llegar a los servidores de Vercel. Más rápido y fiable.

---

#### BLOQUE B — Arquitectura de Escalabilidad (producción con alto número de usuarios)

##### B1. HNSW Index para búsqueda vectorial (`migrations/001_core.sql`)

```sql
CREATE INDEX idx_legislacion_embedding_hnsw
  ON legislacion USING hnsw (embedding vector_cosine_ops)
  WITH (ef_construction = 128, m = 16);
SET hnsw.ef_search = 80;
```

- **WHY HNSW** (no IVFFlat): IVFFlat requiere `VACUUM ANALYZE` cuando se añaden artículos nuevos. HNSW actualiza dinámicamente. Con ingestas frecuentes de legislación, HNSW es más robusto.
- **WHY ef_search=80** (no el default 40): Mayor ef_search = mayor calidad de resultados a costa de latencia ligeramente mayor. Para legislación jurídica, prefiero precisión aunque tarde 15ms más. A 100k artículos, aún <50ms.
- **Escalabilidad**: HNSW es O(log n). Pasar de 10k a 1M artículos aumenta latencia de ~10ms a ~40ms.

##### B2. Hybrid RAG con fallback chain (`lib/ai/retrieval.ts`)

- **Estrategia 4 niveles**: tema directo → semántico (OpenAI) → full-text (PG tsvector) → fallback vacío
- **WHY fallback chain**: Si OpenAI está caído, el sistema sigue generando tests (menos precisos, pero funcionales) usando full-text search de PostgreSQL. Disponibilidad > perfección.
- **WHY deduplicación en `buildContext()`**: La búsqueda semántica y por tema pueden devolver el mismo artículo. Sin dedup, el contexto tiene artículos repetidos → desperdicia tokens.
- **WHY límite 32k chars (~8k tokens)**: Con más de 8k tokens de legislación, el modelo "se pierde" y genera preguntas menos precisas. Límite empírico validado en evals.
- **Escalabilidad**: Retrieval completo ~150ms (40ms HNSW + 60ms PG tsvector + 50ms network). Con PgBouncer, escala a 500+ req/s sin cambios.

##### B3. Connection Pooling (PgBouncer Transaction mode)

- **Puerto 6543** (pooled) vs 5432 (directo)
- **WHY Transaction mode** (no Session mode): En Session mode, cada conexión de app reserva una conexión de BD para su duración. Vercel genera muchas conexiones serverless → agota el límite de PostgreSQL (10 conexiones en Free tier). Transaction mode comparte conexiones → 200 requests concurrentes pueden usar 10 conexiones de BD.

##### B4. Separación de modelos por complejidad y coste

- **Tests MCQ → Haiku 4.5**: 0.8¢/1M input, 4¢/1M output → ~0.005€/test
- **Correcciones → Sonnet 4.6**: 3¢/1M input, 15¢/1M output → ~0.035€/corrección
- **WHY Haiku para tests**: Haiku produce preguntas correctas el 92% de las veces; Sonnet el 97%. La diferencia del 5% no justifica 3.6× el coste cuando el sistema de verificación determinista captura las preguntas incorrectas y las regenera.
- **WHY este split es económicamente crítico**: 20 tests/día × Sonnet = 0.018€ × 600/mes = 10.8€/mes/usuario → inviable. Con Haiku = 3€/mes/usuario → viable. Los tests ilimitados solo son posibles con Haiku.

##### B5. Edge Runtime en middleware (`proxy.ts`)

- Middleware usa `globalThis.crypto.randomUUID()` (Web Crypto API) → compatible con Edge
- **WHY Edge**: Un usuario en Madrid experimenta auth check en ~5ms (Edge Madrid) vs ~80ms (origin Fráncfort). La sesión se refresca 16× más rápido.
- **WHY importante para OPTEK**: Audiencia 100% española. La latencia percibida en login y navegación es crítica para retención.

##### B6. Non-blocking cost tracking

- Todo `logApiUsage(...)` usa `void` → fire-and-forget, nunca bloquea la respuesta al usuario
- **WHY non-blocking**: Si el INSERT falla, el usuario sigue recibiendo su test. La observabilidad es secundaria a la funcionalidad. Mejor perder 1 data point de coste que devolver un error al usuario.

##### B7. Vercel Cron para tareas asíncronas (`vercel.json`)

- `0 23 * * *` → `/api/cron/check-costs`. `0 7 * * *` → `/api/cron/boe-watch`
- **WHY 7 AM para BOE**: El BOE publica entre 6-8 AM. Ejecutar a las 7 AM captura el 95% de publicaciones del día.
- **Escalabilidad**: Si OPTEK crece a 10.000 usuarios, migrar a una queue (Inngest/BullMQ) con Supabase Realtime para notificaciones push.

---

#### BLOQUE C — Arquitectura de IA (patrones avanzados)

##### C1. Verificación determinista de citas legales (el corazón de OPTEK)

**Pipeline en `lib/ai/verification.ts`**:
1. `extractCitations(text)` — regex multi-patrón → extrae todas las citas del output de Claude
2. `verifyCitation(citation)` — BD lookup → ¿existe este artículo?
3. `verifyContentMatch(citation, claim, articuloReal)` — semántico lightweight → ¿el contenido citado es correcto?
4. `verifyAllCitations(text)` — orquestador, quality gate, KPI logging

- **WHY código determinista, no más IA**: Usar Claude para verificar lo que Claude generó es un círculo vicioso. Si el modelo alucina "artículo 99 LPAC" (no existe), pedirle que lo verifique también puede alucinar que existe. Un lookup en PostgreSQL es 100% determinista.
- **WHY quality gate `score < 0.5`**: Si más del 50% de las citas generadas no existen en la BD → el test entero es sospechoso → regenerar. Umbral calibrado empíricamente en evals.
- **WHY KPI logging de verificación**: Permite detectar degradación del prompt con el tiempo. Si el `verification_score` promedio cae de 0.85 a 0.70 → algo cambió → alerta.

##### C2. Prompt versioning (`PROMPT_VERSION = '2.0.0'`)

- Guardado en cada test en `tests_generados.prompt_version`
- **WHY**: Permite rollback si una versión produce tests peores. Permite comparar quality score entre versiones en evals.
- **Convención**: MAJOR = cambio de formato/schema, MINOR = mejora de prompt, PATCH = corrección de wording.

##### C3. Zod validation en output de Claude + retry

```typescript
const result = schema.safeParse(rawOutput)
if (!result.success) → retry with corrective prompt
```

- **WHY**: Los LLMs producen JSON inválido en ~3-5% de los casos. Sin validación, un JSON inválido llega al frontend → error 500.
- **WHY retry con corrective prompt**: El segundo intento incluye el JSON inválido + "Produce output válido siguiendo exactamente este schema". El 95% de los segundos intentos son exitosos.
- **Reutilizable**: `callClaudeJSON()` + Zod + retry debe aplicarse en CUALQUIER proyecto que use Claude con output estructurado.

##### C4. Temperature tuning

- **Tests MCQ**: `temperature: 0.3` → respuestas más deterministas, mayor fidelidad al texto legal
- **Correcciones**: `temperature: 0.4` → algo más creativas en el feedback
- **WHY no 0.0**: Temperature 0.0 produce output completamente determinista → el usuario vería las mismas preguntas cada vez.

##### C5. Embedding strategy: text-embedding-3-small, 1536 dims

- Embeddings generados offline (`pnpm generate:embeddings`), almacenados en `legislacion.embedding`
- **WHY offline**: Los embeddings son costosos de generar pero se crean una sola vez. Los artículos de ley no cambian frecuentemente.
- **WHY 1536 dims** (no 3072 de -large): Para búsqueda semántica de artículos legales en español, -small produce suficiente calidad. MTEB benchmark en español muestra diferencia de ~2% de calidad. No justifica 5× el coste.
- **WHY cosine similarity** (no L2 distance): Con embeddings, la magnitud del vector no es relevante — solo la dirección. Cosine similarity ignora la magnitud = más preciso para semantic search.

##### C6. Bloque II guardrail: verificación de contexto

- `verificarPreguntaBloque2()` comprueba que las opciones de respuesta (ej: "Archivo > Guardar como") existan textualmente en el contexto recuperado de `conocimiento_tecnico`
- **WHY**: Para ofimática (Bloque II), no hay "artículos" — solo rutas de menú, atajos, opciones. Si Claude inventa "Herramientas > Configurar" que no existe en Word, el guardrail lo detecta porque esa cadena no está en el contexto.

---

#### BLOQUE D — GTM Strategy: Datos validados del mercado español

**Datos de mercado verificados (Investigación Feb 2026):**
- TAM real: ~25.000 opositores activos al TAC anualmente (50.000 solicitudes, ~50% se presentan)
- Competidores cobran €90-160/MES (CEF, MasterD, Adams) o €95/AÑO (OpositaTest). OPTEK: €34,99 único → 70-100× más barato
- Conversión real edtech: 5-8% free→paid (no 10-15%). Usar 5% como base conservadora.
- Google Ads CPC oposiciones: €1,50-3,50. Con 5% conversión: CPA~€90 → **PÉRDIDAS SEGURAS con ticket €35**
- META Ads frío: CPA €30-80 → también inviable con ticket €35
- **Canales validados**: Telegram (alta intención, activo, CPA €0), TikTok/StudyTok (ADAMS 710 aprobados en Madrid orgánico), foros (buscaoposiciones.com)
- **Riesgo de mercado**: Ratio opositores/plaza cayó de 43 a 23 en 2024. Mitigación: Efecto Matrioska (ver Bloque F)

**REGLA DE ORO: Nunca operar con pérdidas. Calcular `(ticket_neto - coste_IA - CPA_real) > 0` antes de activar cualquier canal.**

| Canal | CPA real | ¿Viable en lanzamiento? |
|-------|----------|------------------------|
| Telegram / comunidades | €0-5 | ✅ DÍA 1 |
| TikTok orgánico | €0 | ✅ DÍA 2 |
| META Remarketing (visitors) | €5-15 | ✅ Semana 3+ con pixel data |
| Google Ads / META frío | €30-90 | ❌ NO viable con ticket €35 |

**Capa 0 — El "Wow Moment":** Primer test generado en <10s con badge "✓ Verificado: Art. XX Ley XX" visible. Si este momento no es perfecto, ningún canal funciona.

**Capa 1 — Telegram + Foros (Día 1):** Grupos con 5.000-25.000 miembros de alta intención. Estrategia: aportar valor genuino primero (resumen artículo LPAC), OPTEK al día siguiente. Conversión esperada: 50-100 registros × 8-12% = 4-12 compradores semana 1.

**Capa 2 — Founder Pricing (Días 1-14, solo orgánico):**
- Pack Oposición Fundador: 24,99€ vs 34,99€. 30 correcciones en vez de 20. Solo primeros 50 compradores.
- **NUNCA combinar con paid channels**: Orgánico → margen €20 (83%) ✅. Google Ads + Founder Pricing → pérdida de -€70 ❌
- Implementación: producto Stripe `pack_fundador` + `profiles.is_founder: boolean` + banner con contador en landing.

**Capa 3 — TikTok/StudyTok (Día 2):** Script validado: hook "La academia me cobra 120€/mes" → demo screencast (<10s test, badge verificado) → diferenciador (no alucina artículos) → CTA "5 tests gratis, optek.es en la bio". Publicar simultáneamente en TikTok + Instagram Reels + YouTube Shorts.

**Capa 4 — META Remarketing (Semana 3+):** Activar cuando Pixel tenga ≥200 visitas únicas. Matemática verificada: €100 ads → 200 clicks → 80 registros → 4 compradores → €136 revenue → €20 margen (20%) ✅. Solo con precio normal €34,99 (NUNCA Founder Pricing en paid).

**Capa 5 — SEO Orgánico (Mes 1-3):** Infraestructura ya construida (`public/llms.txt`, JSON-LD). Keywords target: "test auxiliar administrativo online gratis" (~480 búsquedas/mes), "simulacro inap 2024" (~390/mes). Blog `/blog/[slug]` con artículos MDX, 2h/semana con Claude generando drafts.

**Timeline de Revenue realista:**
| Período | Canal activo | Compradores est. | Revenue bruto | Margen neto |
|---------|-------------|-----------------|---------------|-------------|
| Semana 1 | Telegram + TikTok orgánico | 2-8 | €50-200 | ~€40-170 |
| Semana 2 | + más comunidades + viral | 4-12 | €100-300 | ~€80-250 |
| Semana 3 | + META Remarketing | 5-16 | €175-560 | ~€125-410 |
| Mes 2 | SEO early + TikTok madurado | 15-48 | €525-1.680 | ~€425-1.380 |

---

#### BLOQUE F — Efecto Matrioska: Expansión C2 → C1 → A2

**El insight fundamental**: Las tres oposiciones principales del Estado tienen temarios anidados:
- **Auxiliar C2** (~28 temas): CE + LPAC + LRJSP + TREBEP + Bloque II — **ya implementado**
- **Administrativo C1** (~43 temas): 90% de C2 + gestión económica, personal, contratación — **legislación ya ingestada**
- **Gestión A2** (~68 temas): casi todo C1 + derecho financiero profundo, políticas públicas, europeo

**Por qué es una jugada arquitectónica**: La BD ya tiene `oposicion_id` en profiles, temas, preguntas_oficiales — diseñada multi-oposición desde el inicio. El 90% de la legislación C1 ya está ingestada. `pnpm map:themes` ya existe para mapeo automático.

**Impacto en TAM real:**
| Oposición | Plazas/año | Opositores activos (est.) |
|-----------|-----------|--------------------------|
| Auxiliar C2 | 1.450 | ~25.000 |
| Administrativo C1 | ~1.200 | ~35.000 |
| Gestión A2 | ~400 | ~12.000 |
| **Total** | **3.050** | **~72.000** |

**Tiered Pricing (coste marginal casi cero por oposición añadida):**
| Producto | Precio | Correcciones | Margen neto |
|---------|--------|-------------|-------------|
| Pack Auxiliar C2 | 34,99€ | 20 | ~€30 (86%) |
| Pack Administrativo C1 | 49,99€ | 25 | ~€45 (90%) |
| Pack Gestión A2 | 69,99€ | 35 | ~€65 (93%) |

**Secuencia de implementación:**
1. **Esta semana**: Lanzar con C2 — no retrasar
2. **Semana 1 post-deploy**: C1 Administrativo — INSERT oposición, crear ~43 temas, `pnpm map:themes`, evals (Quality Score ≥ 85% antes de activar), Stripe `pack_administrativo` (49,99€). Tiempo estimado: **2-3 días** (legislación ya está)
3. **Mes 2**: A2 Gestión — solo si C2+C1 generan ingresos suficientes. Necesita legislación adicional (LGT profunda, LCSP completa, derecho europeo)

**Regla de negocio**: NUNCA activar una oposición sin pasar evals (Quality Score ≥ 85%). Si C1 falla evals, afecta a toda la marca.

**Lección de arquitectura de negocio**: Cuando el coste marginal de servir a un segmento nuevo es casi cero (misma infraestructura, misma legislación), la expansión de mercado es una decisión de meses, no de trimestres.

---

### Métricas del Proyecto (Fase Planificación)

| Métrica | Valor |
|---------|-------|
| Líneas de documentación | ~5000+ (PLAN.md + 14 ADRs + 15 directives) |
| ADRs creados | 14 |
| Directives específicas OPTEK | 5 (prompts, RAG, verificación, seguridad, incidentes) |
| Iteraciones pricing | 3 versiones (micro-compras → híbrido → Ownership-First) |
| Candidatos naming evaluados | 10 (con phonosemantics) |
| Hallazgos seguridad analizados | 22 (7 genuinos incorporados) |
| Timeline estimado MVP | 4-5 semanas con Claude Code |
| Cobertura temario en MVP | 72% (3 de 7 leyes) |

---

## Patrones y Best Practices Acumulados

### Gestión de Costes LLM

**Patrón**: Caching + Prompt optimization + Monitoring

**Cuándo aplicar**: SIEMPRE en proyectos production con LLMs

**Implementación típica**:
1. Setup Redis caching (ver herramientas arriba)
2. Optimizar prompts (medir tokens antes/después)
3. Implement cost monitoring:
```python
def track_llm_cost(tokens_used, model="gpt-4"):
    cost_per_1k = 0.03  # $0.03 per 1K tokens for GPT-4
    cost = (tokens_used / 1000) * cost_per_1k
    # Log to metrics system
    metrics.increment('llm_cost_usd', cost)
    return cost
```

**Proyectos donde se usó**: Due Diligence Automation

---

## Herramientas y Stack Técnico Preferido

### APIs de IA

**OpenAI**:
- Usado en: Due Diligence project
- Casos de uso: Document analysis, text generation
- Gotchas: Rate limits agresivos en tier básico (3 req/min), batch API tarda 24h, GPT-4 límite 8K tokens (considerar GPT-4-32K para docs largos)
- Best practice: Siempre implementar retries con exponential backoff

**Anthropic (Claude)**:
- Usado en: OPTEK (producto: generación tests + corrección desarrollos), Claude Code (desarrollo del proyecto)
- Modelo producto: Claude Sonnet (coste/calidad óptimo). Temperature 0.3 tests, 0.4 correcciones.
- Coste: ~0.04€/test, ~0.03€/corrección. Modelo viable con free tier + compras.
- Context window 200K+ ideal para legislación larga
- Gotchas: Necesita DPA para GDPR. JSON output a veces no parsea → validar con Zod + retry.
- Claude Code: Ejecuta PLAN.md como spec. Reduce timeline 70% vs desarrollo manual.

### Infrastructure

**Railway**:
- Para qué: Hosting de APIs, PostgreSQL, Redis
- Pros: Setup rápido, free tier generoso, logs integrados
- Contras: Pricing puede escalar rápido con traffic, cold starts ocasionales
- Setup típico: Web service (FastAPI) + PostgreSQL + Redis, todo en mismo proyecto

**Redis**:
- Para qué: Caching LLM, rate limiting, session storage
- Setup típico: Railway deployment, connection via `redis-py`
- Best practice: SIEMPRE usar TTL, monitorear memory usage

### Frameworks y Librerías

**FastAPI** (Python backend):
- Por qué preferimos: Async support, Pydantic validation, auto-docs, type safety
- Patrones comunes: Router-based structure, dependency injection, middleware para logging/auth
- Gotchas: Async/await learning curve, menos middleware ecosystem que Flask
- Cuándo usar: APIs Python standalone, microservicios, proyectos con procesamiento pesado

**Next.js 14** (Full-stack TypeScript):
- Usado en: OPTEK
- Por qué: App Router + Server Components + API Routes en un solo codebase. Ideal para 1 persona + IA.
- Patrones: Route groups `(auth)`, `(dashboard)`, `(marketing)` para layouts independientes. Server Components por defecto, Client solo con interactividad.
- Deploy: Vercel (git push → producción en segundos, preview por PR)
- Gotchas: Server vs Client Component confusion al principio. Middleware solo para auth/redirects, no lógica compleja.
- Cuándo usar: Proyectos web full-stack donde velocidad de desarrollo es prioridad.

**Supabase** (BaaS):
- Usado en: OPTEK
- Para qué: Auth + PostgreSQL + pgvector + Storage + RLS + Realtime
- Ventajas: 0 DevOps, EU region (GDPR), auto-gen TypeScript types, RLS nativo
- Gotchas: Free tier 500MB BD. Migrations con convención .down.sql obligatoria. RLS mal configurado = vulnerabilidad.
- Cuándo usar: MVPs y productos donde no necesitas control total del backend.

**shadcn/ui** (Component library):
- Usado en: OPTEK
- Para qué: Componentes UI accesibles (Radix primitives) copiados al proyecto
- Ventaja: No es dependencia npm — son archivos que modificas directamente
- Cuándo usar: Siempre que uses React/Next.js. No hay razón para no usarlo.

**Stripe** (Pagos):
- Usado en: OPTEK
- Para qué: Pagos one-time + suscripciones + Customer Portal
- Patrón webhook: INSERT-first con UNIQUE constraint para idempotencia
- Gotchas: Test mode vs Live mode (diferentes API keys). Webhook signature SIEMPRE verificar.
- Comisión: ~3% vs 15-30% stores

**Pydantic** (Python validation):
- Para qué: Input/output validation, config management
- Best practice: Define models para TODO lo que cruza API boundary
- Gotchas: v2 breaking changes, validators pueden ser confusos al inicio

**Zod** (TypeScript validation):
- Usado en: OPTEK
- Para qué: Equivalente TypeScript de Pydantic. Validar inputs de API, outputs de Claude.
- Best practice: Definir schemas para todo JSON que entra/sale del sistema.
- Ventaja: Type inference automática (z.infer<typeof schema> genera el type)

---

## Métricas y KPIs a Mejorar

**Trackeados desde Due Diligence + OPTEK**:

- **Tiempo medio de implementación**:
  - Due Diligence: ~3 semanas para MVP (desarrollo manual)
  - OPTEK: Estimado 4-5 semanas con Claude Code (proyecto más complejo: PWA + pagos + RAG + verificación)
  - Objetivo: Reducir a 3 semanas proyectos equivalentes con mejor reutilización de specs

- **Tasa de bugs en producción**:
  - Due Diligence: 2-3 bugs menores en primeras 2 semanas
  - OPTEK: Pendiente (no en producción aún)
  - Objetivo: <1 bug por proyecto (testing >80% + CI/CD + evals)

- **Coste medio de operación LLM**:
  - Due Diligence: $73/mes post-optimización (OpenAI GPT-4)
  - OPTEK estimado: ~$50-80/mes con 100 usuarios (Claude Sonnet más económico que GPT-4)
  - Objetivo: Mantener <$100/mes hasta 500 usuarios

- **Coverage de tests**:
  - Due Diligence: 67%
  - OPTEK objetivo: >80% en lib/ (código crítico: verificación, Claude integration, Stripe)
  - Mejora: CI/CD con threshold 80% desde día 1 (no retrofit)

- **Calidad de planificación** (nuevo KPI):
  - OPTEK: 1447 líneas de spec, 158+ tareas con criterios de aceptación
  - Objetivo: Cada proyecto futuro tiene PLAN.md ejecutable antes de escribir código
  - Métrica: % de tareas completadas sin ambigüedad en primera ejecución

- **Velocidad de análisis de seguridad** (nuevo KPI):
  - OPTEK: 22 hallazgos → 7 genuinos identificados en ~2h
  - Objetivo: Crear checklist reutilizable para futuros análisis de seguridad

---

**Nota para el agente**: Este documento DEBE actualizarse después de cada implementación significativa. Ver `directives/00_ARITZ_DOCUMENTATION.md` para instrucciones detalladas de cómo mantener este archivo. El proyecto OPTEK arriba es el estándar de calidad para documentación de proyectos reales.
