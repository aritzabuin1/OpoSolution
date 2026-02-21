# Directive: OPTEK RAG Pipeline

> **Status:** Foundational | **Owner:** Aritz Abuín | **Version:** 1.0
> **Last Updated:** 2026-02-14
> **Criticality:** 🔴 MÁXIMA — Un error aquí llega al usuario final como información legal incorrecta.

---

## 1. Propósito

Definir el flujo completo desde la fuente de verdad legal (BOE) hasta la respuesta verificada que recibe el usuario. Este pipeline es el núcleo de OPTEK y la razón por la que NO somos "otro wrapper de GPT".

**Principio inquebrantable:** Claude nunca habla sin artículo exacto delante. Cada cita se verifica con código determinista antes de mostrarse.

---

## 2. Arquitectura del Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO COMPLETO RAG + VERIFICACIÓN            │
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │  INGESTA  │───▶│ RETRIEVAL │───▶│GENERACIÓN│───▶│VERIFICAC.│  │
│  │  (Capa 0) │    │ (Capa 1)  │    │ (Capa 2) │    │(Capa 3)  │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│       │                                                │        │
│       │            Si falla verificación:               │        │
│       │            ◀──── REGENERAR (max 2 reintentos) ──┘        │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────┐    ┌──────────┐                                   │
│  │MONITORIZ.│───▶│  ALERTAS  │                                   │
│  │BOE (Capa4│    │ (Capa 5)  │                                   │
│  └──────────┘    └──────────┘                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Capa 0 — Ingesta de Legislación

### 3.1 Fuentes de Datos

**Legislación para Auxiliar Administrativo del Estado (MVP):**

| Ley | Identificador corto | Artículos clave | Prioridad |
|-----|---------------------|-----------------|-----------|
| Constitución Española 1978 | CE | Título Preliminar, Títulos I-IV, VIII | P0 |
| Ley 39/2015 Procedimiento Administrativo Común | LPAC | Completa | P0 |
| Ley 40/2015 Régimen Jurídico Sector Público | LRJSP | Completa | P0 |
| RDL 5/2015 TREBEP | TREBEP | Completa | P0 |
| Ley 19/2013 Transparencia | LTBG | Títulos I-II | P1 |
| Ley 9/2017 Contratos Sector Público | LCSP | Títulos I-II (principios, tipos) | P1 |
| LO 3/2018 Protección Datos | LOPDGDD | Títulos I-V | P1 |
| Ley 47/2003 General Presupuestaria | LGP | Arts. seleccionados según temario | P2 |

### 3.2 Formato de Almacenamiento

Cada artículo se almacena como un registro independiente en la tabla `legislacion`:

```typescript
interface ArticuloLegal {
  id: string;                    // UUID
  ley_codigo: string;            // "LPAC", "CE", "TREBEP"
  ley_nombre: string;            // "Ley 39/2015"
  ley_nombre_completo: string;   // "Ley 39/2015, de 1 de octubre, del Procedimiento..."
  titulo: string;                // "Título IV"
  capitulo: string;              // "Capítulo II"
  seccion: string | null;        // "Sección 1ª"
  articulo: string;              // "53" (sin "artículo", solo el número)
  apartado: string | null;       // "1.a" o null si es artículo completo
  epigrafe: string;              // "Derechos del interesado en el procedimiento"
  texto_integro: string;         // Texto literal del BOE
  hash_sha256: string;           // SHA-256 de texto_integro (para detección cambios)
  tema_ids: string[];            // UUIDs de temas donde es relevante
  fecha_publicacion: string;     // Fecha BOE original
  fecha_ultima_modificacion: string; // Última modificación conocida
  fecha_ultima_verificacion: string; // Última vez que verificamos contra BOE
  embedding: number[] | null;    // Vector embedding para búsqueda semántica
  activo: boolean;               // false si artículo ha sido derogado
  notas_internas: string | null; // Notas para el equipo (no visibles al usuario)
}
```

### 3.3 Script de Ingesta

**Ubicación:** `execution/ingest_legislacion.ts`

**Flujo del script:**

```
1. Leer archivo fuente (JSON estructurado por ley)
2. Para cada artículo:
   a. Parsear: extraer título, capítulo, sección, número, apartado, epígrafe, texto
   b. Generar hash: SHA-256 del campo texto_integro (normalizado: trim + lowercase + remove extra spaces)
   c. Generar embedding: llamar a API de embeddings (text-embedding-3-small)
   d. Mapear a temas: asignar tema_ids según tabla de mapeo manual
   e. Insertar en Supabase
3. Verificar integridad:
   a. Contar artículos insertados por ley
   b. Verificar que todos los temas tienen al menos 5 artículos mapeados
   c. Verificar que no hay duplicados (ley + articulo + apartado = unique)
   d. Log de resumen
```

**Normalización del hash (CRÍTICO para comparación BOE):**

```typescript
function normalizeForHash(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')        // Colapsar espacios múltiples
    .replace(/\u00a0/g, ' ')     // Reemplazar non-breaking spaces
    .replace(/[""]/g, '"')       // Normalizar comillas tipográficas
    .replace(/['']/g, "'")       // Normalizar apóstrofes
    .normalize('NFC');            // Normalización Unicode
}

function generateHash(text: string): string {
  const normalized = normalizeForHash(text);
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}
```

### 3.4 Formato de Archivos Fuente

Los archivos fuente de legislación se almacenan en `data/legislacion/` como JSON:

```json
// data/legislacion/ley_39_2015_lpac.json
{
  "ley_codigo": "LPAC",
  "ley_nombre": "Ley 39/2015",
  "ley_nombre_completo": "Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas",
  "articulos": [
    {
      "titulo": "Título Preliminar",
      "capitulo": "",
      "seccion": "",
      "articulo": "1",
      "apartado": null,
      "epigrafe": "Objeto de la Ley",
      "texto_integro": "La presente Ley tiene por objeto regular..."
    },
    {
      "titulo": "Título IV",
      "capitulo": "Capítulo I",
      "seccion": "",
      "articulo": "53",
      "apartado": "1.a",
      "epigrafe": "Derechos del interesado en el procedimiento administrativo",
      "texto_integro": "A conocer, en cualquier momento, el estado de la tramitación..."
    }
  ]
}
```

### 3.5 Mapeo Temas ↔ Artículos

**Ubicación:** `data/mapeo_temas_legislacion.json`

Archivo manual (curado por humano) que asigna artículos a temas del temario oficial:

```json
{
  "oposicion": "auxiliar_administrativo_estado",
  "mapeo": [
    {
      "tema_numero": 1,
      "tema_titulo": "La Constitución Española de 1978: estructura y contenido",
      "articulos": [
        {"ley": "CE", "rango": "1-9"},
        {"ley": "CE", "rango": "10-55"},
        {"ley": "CE", "rango": "56-65"}
      ]
    },
    {
      "tema_numero": 7,
      "tema_titulo": "El acto administrativo: concepto, clases y elementos",
      "articulos": [
        {"ley": "LPAC", "rango": "34-52"},
        {"ley": "LRJSP", "rango": "34-39"}
      ]
    }
  ]
}
```

**IMPORTANTE:** Este mapeo es la única parte del sistema que requiere intervención humana experta. Un mapeo incorrecto = preguntas irrelevantes para el tema. Revisar con el temario oficial de la última convocatoria.

---

## 4. Capa 1 — Retrieval (Recuperación de Contexto)

### 4.1 Estrategia Híbrida

**Ubicación:** `lib/ai/retrieval.ts`

El retrieval usa 3 fuentes en orden de prioridad, combinadas en un único contexto:

```
Fuente 1: Mapeo directo (ALTA PRECISIÓN)
  → Artículos explícitamente mapeados al tema solicitado
  → SELECT * FROM legislacion WHERE tema_ids @> ARRAY[tema_id]
  → Prioridad máxima. Siempre se incluyen primero.

Fuente 2: Búsqueda semántica (AMPLIAR RECALL)
  → Artículos semánticamente cercanos a la query del usuario o al tema
  → match_legislacion(query_embedding, match_threshold: 0.75, match_count: 10)
  → Filtra duplicados con Fuente 1
  → Útil para preguntas transversales que cruzan temas

Fuente 3: Few-shot examples (CALIDAD DE OUTPUT)
  → Preguntas de exámenes oficiales anteriores del mismo tema/oposición
  → SELECT * FROM examenes_oficiales WHERE oposicion_id = X ORDER BY anio DESC LIMIT 3
  → Se incluyen como ejemplos del formato y estilo esperado
```

### 4.2 Construcción del Contexto

**Función `buildContext(temaId, query?, maxTokens = 8000)`:**

```typescript
interface RAGContext {
  legislacion: ArticuloLegal[];     // Artículos recuperados
  examples: PreguntaOficial[];       // Preguntas de exámenes oficiales
  metadata: {
    tema: string;
    oposicion: string;
    totalArticulos: number;
    fuentesUsadas: ('mapeo' | 'semantico' | 'examples')[];
  };
  formattedPrompt: string;           // Contexto formateado listo para Claude
}
```

**Formato del contexto para Claude:**

```xml
<legislacion_relevante>
  <articulo ley="Ley 39/2015" numero="53" apartado="1.a" epigrafe="Derechos del interesado">
    A conocer, en cualquier momento, el estado de la tramitación de los procedimientos...
  </articulo>
  <articulo ley="Ley 39/2015" numero="53" apartado="1.b" epigrafe="Derechos del interesado">
    A identificar a las autoridades y al personal al servicio de las Administraciones...
  </articulo>
  <!-- más artículos -->
</legislacion_relevante>

<ejemplos_examenes_oficiales>
  <pregunta anio="2023" convocatoria="OEP 2022">
    <enunciado>Según el artículo 53 de la Ley 39/2015, ¿cuál de los siguientes es un derecho del interesado?</enunciado>
    <opciones>
      <a>A obtener copia sellada de los documentos que presente</a>
      <b>A conocer el estado de tramitación de los procedimientos</b>
      <c>A ser notificado exclusivamente por medios electrónicos</c>
      <d>A obtener dictamen vinculante del Consejo de Estado</d>
    </opciones>
    <correcta>B</correcta>
  </pregunta>
</ejemplos_examenes_oficiales>
```

### 4.3 Límites y Guardrails

| Parámetro | Valor | Razón |
|-----------|-------|-------|
| Max tokens de contexto | 8.000 | Dejar espacio para generación (~4K) en ventana de 12K útiles |
| Max artículos por retrieval | 25 | Más = ruido. Menos = lagunas |
| Umbral similitud semántica | 0.75 | Balance precision/recall. Iterar con datos reales |
| Max few-shot examples | 3 | Suficiente para estilo sin consumir tokens |
| Prioridad Fuente 1 vs 2 | 70% / 30% | Mapeo directo siempre prioritario |

**Si el contexto supera el límite de tokens:**
1. Recortar Fuente 2 (semántica) primero
2. Nunca recortar Fuente 1 (mapeo directo)
3. Reducir few-shot a 1 ejemplo si necesario
4. Log warning: contexto recortado (investigar si tema tiene demasiados artículos)

---

## 5. Capa 2 — Generación con Claude

### 5.1 Configuración de Llamadas

| Parámetro | Tests | Corrector | Oral |
|-----------|-------|-----------|------|
| Modelo | claude-sonnet-4-5-20250514 | claude-sonnet-4-5-20250514 | claude-sonnet-4-5-20250514 |
| Temperatura | 0.3 | 0.4 | 0.4 |
| Max tokens output | 4.096 | 4.096 | 4.096 |
| Streaming | Sí (UX) | Sí (UX) | No (batch) |

**Sonnet para todo en MVP.** Opus solo si calidad de Sonnet insuficiente tras iteración de prompts. El coste de Opus es ~5x Sonnet y para este caso de uso la diferencia de calidad es marginal si los prompts están bien diseñados.

### 5.2 Flujo de Generación (Tests)

```
1. Usuario solicita test (tema + dificultad + nº preguntas)
2. Verificar acceso (compra/suscripción)
3. buildContext(temaId) → contexto RAG
4. Construir prompt completo (system + contexto + instrucciones)
5. Llamar Claude API con streaming
6. Parsear respuesta JSON
7. Para cada pregunta generada:
   a. Extraer citas (verification.extractCitations)
   b. Verificar cada cita (verification.verifyCitation)
   c. Verificar contenido (verification.verifyContentMatch)
   d. Si pregunta NO pasa verificación → descartar
8. Si preguntas verificadas < solicitadas:
   a. Regenerar faltantes (max 2 reintentos, prompt ajustado)
   b. Si tras 2 reintentos sigue faltando → entregar las que hay + log warning
9. Guardar test en BD
10. Retornar al usuario
```

### 5.3 Flujo de Generación (Corrector)

```
1. Usuario envía desarrollo escrito (texto + tema)
2. Verificar acceso
3. buildContext(temaId) → contexto RAG
4. Construir prompt de corrección (system + legislación + desarrollo del usuario)
5. Llamar Claude API con streaming
6. Parsear respuesta JSON (5 dimensiones + errores + citas)
7. Para cada cita en la corrección:
   a. Verificar determinísticamente
   b. Si cita inválida → marcar corrección como "sin verificar" (NO eliminar, pero mostrar disclaimer)
8. Guardar evaluación en BD
9. Retornar al usuario con badges de verificación en cada cita
```

### 5.4 Manejo de Errores en Generación

| Error | Acción | Log |
|-------|--------|-----|
| Claude retorna JSON inválido | Reintentar 1 vez con prompt más estricto. Si falla → error al usuario | ⚠️ Warning |
| Claude no cita artículos | Reintentar con instrucción explícita. Si persiste → descartar pregunta | ⚠️ Warning |
| Timeout de API | Reintentar con backoff exponencial (1s, 2s, 4s). Max 3 intentos | ⚠️ Warning |
| Rate limit (429) | Queue + retry tras Retry-After header | ℹ️ Info |
| >50% preguntas no pasan verificación | Parar. Revisar prompt o contexto. No entregar test de baja calidad | 🔴 Critical |
| Error de Supabase al guardar | Retry 2 veces. Si falla → retornar test sin guardar + error no-blocking | ⚠️ Warning |

---

## 6. Capa 3 — Verificación Determinista

**Ver `directives/opoia_verification.md` para SOP completo.**

Resumen: después de que Claude genera contenido, código determinista (NO IA) verifica que cada cita legal existe y es correcta. Es un lookup en base de datos + matching de datos clave. Si no pasa, el contenido no llega al usuario.

---

## 7. Capa 4 — Monitorización BOE

### 7.1 Cron Job Diario

**Ubicación:** `execution/boe_monitor.ts`
**Frecuencia:** Diaria, 08:00 CET
**Trigger:** Vercel Cron / GitHub Actions scheduled

**Flujo:**

```
1. Obtener lista de leyes monitorizadas (SELECT DISTINCT ley_codigo FROM legislacion WHERE activo = true)
2. Para cada ley:
   a. Scraping del BOE: buscar si ha habido modificación publicada hoy
      - Endpoint: https://www.boe.es/buscar/act.php?id=BOE-A-XXXX (por ley)
      - O usar API BOE si disponible
   b. Si hay modificación:
      - Para cada artículo modificado:
        1. Obtener texto nuevo del BOE
        2. Normalizar texto (normalizeForHash)
        3. Generar hash SHA-256
        4. Comparar con hash almacenado en BD
        5. Si hash difiere:
           - Actualizar texto_integro en BD
           - Actualizar hash_sha256
           - Actualizar fecha_ultima_verificacion
           - Registrar cambio en tabla cambios_legislativos
           - Marcar preguntas afectadas (flag needs_regeneration = true)
3. Generar informe diario:
   - Leyes revisadas: N
   - Cambios detectados: N
   - Artículos actualizados: [lista]
   - Preguntas invalidadas: N
4. Si hay cambios → trigger pipeline de alertas (Capa 5)
```

### 7.2 Tabla de Cambios

```sql
CREATE TABLE cambios_legislativos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legislacion_id UUID REFERENCES legislacion(id),
  texto_anterior TEXT NOT NULL,
  texto_nuevo TEXT NOT NULL,
  hash_anterior TEXT NOT NULL,
  hash_nuevo TEXT NOT NULL,
  fecha_boe DATE NOT NULL,
  resumen_cambio TEXT,              -- Generado por Claude (breve)
  preguntas_invalidadas UUID[],     -- IDs de tests afectados
  alertas_enviadas BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.3 Regeneración de Preguntas Afectadas

Cuando un artículo cambia:

```
1. SELECT tests donde preguntas contienen cita al artículo modificado
2. Para cada pregunta afectada:
   a. Regenerar con el texto actualizado (pipeline completo: retrieval → generación → verificación)
   b. Marcar pregunta anterior como "obsoleta" (no eliminar, mantener para auditoría)
   c. Vincular pregunta nueva con pregunta obsoleta
3. Si la regeneración falla (verificación no pasa):
   a. Marcar pregunta como "pendiente revisión manual"
   b. No mostrarla al usuario hasta que se resuelva
```

---

## 8. Capa 5 — Alertas Personalizadas

### 8.1 Criterios de Alerta

Un usuario recibe alerta si:
- Ha realizado al menos 1 test de un tema que contiene el artículo modificado
- O tiene el tema asignado en su plan de estudio
- O ha escrito un desarrollo sobre ese tema

### 8.2 Contenido de la Alerta

```typescript
interface AlertaCambioLegislativo {
  usuario_id: string;
  articulo_modificado: {
    ley: string;
    articulo: string;
    epigrafe: string;
  };
  resumen_cambio: string;          // 2-3 frases generadas por Claude
  impacto_estudio: string;         // "Afecta al Tema 7 que estudiaste el 12/02"
  mini_test_url: string;           // Link a test de 5 preguntas sobre el cambio
}
```

### 8.3 Canales

| Canal | Prioridad | Implementación |
|-------|-----------|----------------|
| In-app (badge dashboard) | P0 (MVP) | Badge + página de cambios recientes |
| Email | P1 (Fase 2) | Resend/SendGrid con template |
| Push notification (PWA) | P2 (Fase 3) | Web Push API |

---

## 9. Métricas del Pipeline

### 9.1 KPIs Operativos (monitorizar desde día 1)

| Métrica | Objetivo | Alerta si |
|---------|----------|-----------|
| % preguntas que pasan verificación | > 90% | < 80% |
| % preguntas reportadas por usuarios | < 2% | > 5% |
| Tiempo medio generación test (10 preguntas) | < 8 segundos | > 15 segundos |
| Tiempo medio corrección desarrollo | < 12 segundos | > 20 segundos |
| Coste medio por test generado | < 0,05€ | > 0,10€ |
| Coste medio por corrección | < 0,08€ | > 0,15€ |
| Uptime del cron BOE | 99% | < 95% |
| Latencia retrieval (P95) | < 500ms | > 1000ms |

### 9.2 KPIs de Calidad (evaluar semanalmente)

| Métrica | Método | Objetivo |
|---------|--------|----------|
| Precisión de preguntas | Revisión manual 20 preguntas/semana | > 95% correctas |
| Relevancia de preguntas | Feedback beta testers (1-5) | > 4.0 media |
| Calidad del corrector | Comparar con evaluación humana (10 desarrollos) | Correlación > 0.8 |
| Detección de cambios BOE | Test manual: modificar artículo → verificar alerta | 100% detección |

---

## 10. Decisiones Arquitectónicas (ADRs pendientes)

| ADR | Decisión | Alternativa descartada | Razón |
|-----|----------|----------------------|-------|
| ADR-001 | Sonnet para generación | Opus | Coste 5x mayor, calidad suficiente con buenos prompts |
| ADR-002 | pgvector en Supabase | Pinecone | Un servicio menos, coste cero adicional, suficiente para <100K artículos |
| ADR-003 | Hash SHA-256 para detección cambios | Polling texto completo | Eficiente, determinista, comparación O(1) |
| ADR-004 | Verificación determinista post-generación | IA verificando IA | Eliminamos dependencia probabilística en la capa de seguridad |
| ADR-005 | JSON estructurado para output Claude | Texto libre + parsing | Más fiable, parseable, versionable |

---

## 11. Checklist Pre-Lanzamiento

- [ ] Legislación de TODAS las leyes P0 ingestada y verificada
- [ ] Hash de cada artículo generado y almacenado
- [ ] Mapeo temas ↔ artículos revisado contra temario oficial 2025
- [ ] Pipeline completo (retrieval → generación → verificación) testado con 100+ preguntas
- [ ] Tasa de verificación > 90%
- [ ] Tasa de reporte < 2% en beta testing
- [ ] Cron BOE funcionando y testado con cambio simulado
- [ ] Métricas de coste dentro de presupuesto
- [ ] Prompts versionados y documentados en `directives/opoia_prompts.md`
