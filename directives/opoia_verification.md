# Directive: OPTEK Capa de Verificación Determinista

> **Status:** Foundational | **Owner:** Aritz Abuín | **Version:** 1.0
> **Last Updated:** 2026-02-14
> **Criticality:** 🔴 MÁXIMA — Esta es la funcionalidad más importante del producto. Sin ella, OPTEK es un wrapper de GPT. Con ella, es el único sistema del mercado que garantiza que cada cita legal es real y verificada.

---

## 1. Propósito

Definir el SOP completo de la Capa de Verificación Determinista: el sistema de código tradicional (NO IA) que verifica cada cita legal generada por Claude antes de que llegue al usuario. Esta capa es la diferencia entre "una IA que a veces se equivoca" y "un sistema que garantiza precisión legal".

**Principio:** No confiamos en que Claude sea preciso. Confiamos en que nuestro CÓDIGO lo verifique.

---

## 2. Arquitectura de la Verificación

```
┌──────────────────────────────────────────────────────────────────┐
│                FLUJO DE VERIFICACIÓN DETERMINISTA                │
│                                                                  │
│  Output de Claude                                                │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐                 │
│  │ EXTRACCIÓN│────▶│  LOOKUP   │────▶│ MATCHING  │                │
│  │ de citas  │     │ en BD     │     │ contenido │                │
│  └──────────┘     └──────────┘     └──────────┘                 │
│       │                │                 │                        │
│       │           Si no existe:      Si no coincide:             │
│       │           DESCARTAR          MARCAR WARNING              │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────┐                                                    │
│  │ SCORE    │──▶ Si score ≥ 0.8 → ✅ ENTREGAR AL USUARIO        │
│  │ GLOBAL   │──▶ Si score < 0.8 → ❌ REGENERAR (max 2 veces)    │
│  └──────────┘──▶ Si tras 2 reintentos < 0.8 → ⚠️ ENTREGAR      │
│                   SOLO lo verificado + disclaimer                │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Módulo de Extracción de Citas

### 3.1 Ubicación

`lib/ai/verification.ts` → función `extractCitations(text: string): Citation[]`

### 3.2 Patrones de Citas a Detectar

Los patrones están ordenados de más específico a más genérico. El parser debe intentar los más específicos primero.

```typescript
interface Citation {
  raw: string;              // Texto original encontrado: "artículo 53.1.a de la Ley 39/2015"
  ley_nombre: string;       // "Ley 39/2015" (normalizado)
  ley_codigo: string | null;// "LPAC" (si se puede inferir)
  articulo: string;         // "53" (solo número principal)
  apartado: string | null;  // "1.a" (todo lo que sigue al artículo)
  position: {               // Posición en el texto (para highlighting en UI)
    start: number;
    end: number;
  };
}
```

### 3.3 Patrones Regex

**CRÍTICO:** Estos regex deben cubrir TODAS las variaciones que Claude puede usar. Si Claude usa un formato no detectado, la cita pasará sin verificar (falso negativo). Iterar con outputs reales de Claude.

```typescript
const CITATION_PATTERNS: RegExp[] = [
  // Patrón 1: "artículo 53.1.a de la Ley 39/2015"
  // Patrón 2: "art. 53.1.a) de la Ley 39/2015"
  // Patrón 3: "artículo 53 de la Ley 39/2015"
  // Patrón 4: "arts. 71 a 74 LPAC" (rango — extraer cada uno)
  // Patrón 5: "art. 53.1.a LPAC" (sin "de la")
  // Patrón 6: "(art. 53.1 LPAC)" (entre paréntesis)
  // Patrón 7: "artículos 14.2 y 14.3 de la Ley 39/2015" (múltiples)
  
  // Formato completo con ley
  /(?:art[íi]culos?|arts?)\.\s*(\d+(?:\.\d+)*(?:\.[a-z])?(?:\))?)\s+(?:de la |de |del |)?((?:Ley(?: Org[aá]nica)?|Real Decreto(?: Legislativo)?|Constituci[oó]n|TREBEP|LPAC|LRJSP|CE|LOPDGDD|LTBG|LCSP|LGP|LJCA)\s*(?:\d+\/\d+)?(?:,\s*de\s+\d+\s+de\s+\w+)?)/gi,
  
  // Formato abreviado: "art. 53.1.a LPAC"
  /(?:art[íi]culos?|arts?)\.\s*(\d+(?:\.\d+)*(?:\.[a-z])?(?:\))?)\s+(LPAC|LRJSP|CE|TREBEP|LOPDGDD|LTBG|LCSP|LGP|LJCA)/gi,
  
  // Formato con "según el artículo X"
  /seg[uú]n\s+(?:el\s+)?(?:art[íi]culo|art\.)\s*(\d+(?:\.\d+)*(?:\.[a-z])?(?:\))?)\s+(?:de la |de |del |)?((?:Ley|Real Decreto|Constituci[oó]n|TREBEP|LPAC|LRJSP|CE)[^,\.\n]*)/gi,
  
  // Formato entre paréntesis: "(art. 53.1 LPAC)"
  /\(\s*(?:art[íi]culos?|arts?)\.\s*(\d+(?:\.\d+)*(?:\.[a-z])?(?:\))?)\s+(LPAC|LRJSP|CE|TREBEP|LOPDGDD|LTBG|LCSP|LGP|LJCA)\s*\)/gi,
];
```

### 3.4 Normalización de Ley

Mapear todas las variaciones al código y nombre estándar:

```typescript
const LEY_NORMALIZATION: Record<string, {codigo: string, nombre: string}> = {
  // Constitución
  'constitución': {codigo: 'CE', nombre: 'Constitución Española'},
  'constitución española': {codigo: 'CE', nombre: 'Constitución Española'},
  'ce': {codigo: 'CE', nombre: 'Constitución Española'},
  
  // LPAC
  'ley 39/2015': {codigo: 'LPAC', nombre: 'Ley 39/2015'},
  'lpac': {codigo: 'LPAC', nombre: 'Ley 39/2015'},
  'ley 39/2015, de 1 de octubre': {codigo: 'LPAC', nombre: 'Ley 39/2015'},
  'ley del procedimiento administrativo': {codigo: 'LPAC', nombre: 'Ley 39/2015'},
  
  // LRJSP
  'ley 40/2015': {codigo: 'LRJSP', nombre: 'Ley 40/2015'},
  'lrjsp': {codigo: 'LRJSP', nombre: 'Ley 40/2015'},
  'ley 40/2015, de 1 de octubre': {codigo: 'LRJSP', nombre: 'Ley 40/2015'},
  
  // TREBEP
  'real decreto legislativo 5/2015': {codigo: 'TREBEP', nombre: 'RDL 5/2015'},
  'rdl 5/2015': {codigo: 'TREBEP', nombre: 'RDL 5/2015'},
  'trebep': {codigo: 'TREBEP', nombre: 'RDL 5/2015'},
  
  // LTBG
  'ley 19/2013': {codigo: 'LTBG', nombre: 'Ley 19/2013'},
  'ltbg': {codigo: 'LTBG', nombre: 'Ley 19/2013'},
  
  // LCSP
  'ley 9/2017': {codigo: 'LCSP', nombre: 'Ley 9/2017'},
  'lcsp': {codigo: 'LCSP', nombre: 'Ley 9/2017'},
  
  // LOPDGDD
  'ley orgánica 3/2018': {codigo: 'LOPDGDD', nombre: 'LO 3/2018'},
  'lopdgdd': {codigo: 'LOPDGDD', nombre: 'LO 3/2018'},
  
  // LGP
  'ley 47/2003': {codigo: 'LGP', nombre: 'Ley 47/2003'},
  'lgp': {codigo: 'LGP', nombre: 'Ley 47/2003'},
  
  // LJCA
  'ley 29/1998': {codigo: 'LJCA', nombre: 'Ley 29/1998'},
  'ljca': {codigo: 'LJCA', nombre: 'Ley 29/1998'},
};
```

### 3.5 Parsing del Artículo y Apartado

```typescript
function parseArticuloApartado(raw: string): { articulo: string; apartado: string | null } {
  // Input: "53.1.a)" o "53" o "53.1" o "14.2.b"
  const cleaned = raw.replace(/\)$/, '').trim();
  const parts = cleaned.split('.');
  
  if (parts.length === 1) {
    // Solo artículo: "53"
    return { articulo: parts[0], apartado: null };
  }
  
  // El primer número es siempre el artículo
  const articulo = parts[0];
  // El resto es el apartado
  const apartado = parts.slice(1).join('.');
  
  return { articulo, apartado };
}
```

### 3.6 Deduplicación

Si el mismo artículo se cita múltiples veces en un output, solo verificar una vez. Deduplicar por `ley_codigo + articulo + apartado`.

---

## 4. Módulo de Lookup en Base de Datos

### 4.1 Ubicación

`lib/ai/verification.ts` → función `verifyCitation(citation: Citation): VerificationResult`

### 4.2 Estrategia de Lookup

```typescript
interface VerificationResult {
  exists: boolean;
  verified: boolean;
  articuloReal: ArticuloLegal | null;
  reason: 
    | 'articulo_encontrado'
    | 'articulo_no_existe'
    | 'ley_no_reconocida'
    | 'apartado_no_encontrado_pero_articulo_si'
    | 'error_bd';
  confidence: 'high' | 'medium' | 'low';
}
```

**Flujo de búsqueda (cascada de 3 niveles):**

```
Nivel 1: Búsqueda exacta
  SELECT * FROM legislacion 
  WHERE ley_codigo = $1 AND articulo = $2 AND apartado = $3
  → Si encuentra: {exists: true, confidence: 'high'}

Nivel 2: Búsqueda sin apartado (si Nivel 1 falla)
  SELECT * FROM legislacion 
  WHERE ley_codigo = $1 AND articulo = $2
  → Si encuentra: {exists: true, confidence: 'medium', reason: 'apartado_no_encontrado_pero_articulo_si'}
  → El artículo existe pero el apartado no. Puede ser:
    a) Claude inventó el apartado → WARNING
    b) Nuestro parsing es incompleto → Revisar ingesta

Nivel 3: Búsqueda fuzzy (si Nivel 2 falla)
  SELECT * FROM legislacion 
  WHERE ley_codigo = $1 AND articulo LIKE $2 || '%'
  → Si encuentra algo cercano: {exists: false, confidence: 'low', suggestion: '...'}
  → Puede ser error de Claude ("artículo 531" en vez de "53.1")
  → Si no encuentra nada: {exists: false, reason: 'articulo_no_existe'}
```

### 4.3 Manejo de Ley No Reconocida

Si `ley_codigo` es null (la normalización no reconoció la ley):

```
1. Intentar búsqueda por ley_nombre en la tabla legislacion
2. Si encuentra: normalizar y añadir al mapa LEY_NORMALIZATION (auto-mejora)
3. Si no encuentra: 
   - Si la ley parece real (formato "Ley X/XXXX"): marcar como 'no_verificable', confidence: 'low'
   - Si parece inventada: marcar como 'ley_no_reconocida', confidence: 'low'
4. Log para revisión manual
```

---

## 5. Módulo de Matching de Contenido

### 5.1 Ubicación

`lib/ai/verification.ts` → función `verifyContentMatch(citation, claimText, articuloReal): ContentMatchResult`

### 5.2 Propósito

El lookup confirma que el artículo EXISTE. El matching confirma que lo que Claude DICE sobre el artículo es CORRECTO. Esta es la capa más sutil y la que previene el tipo de error más peligroso: "el artículo existe pero Claude dice que dice algo que no dice".

### 5.3 Estrategia de Matching (Determinista, NO IA)

```typescript
interface ContentMatchResult {
  match: boolean;
  confidence: 'high' | 'medium' | 'low';
  details: string;
  dataPointsChecked: DataPointCheck[];
}

interface DataPointCheck {
  type: 'plazo' | 'organo' | 'cifra' | 'condicion' | 'procedimiento';
  claimed: string;      // Lo que Claude afirma
  found: boolean;       // Si se encontró en el texto real
  actualText: string;   // El texto real del artículo (fragmento relevante)
}
```

**5 verificaciones deterministas (ejecutar todas las aplicables):**

#### Verificación 1: Plazos

```typescript
function checkPlazos(claimText: string, articuloTexto: string): DataPointCheck[] {
  // Extraer plazos del claim de Claude
  const plazosRegex = /(\d+)\s*(d[ií]as?|meses?|a[ñn]os?|horas?)/gi;
  const plazosClaim = [...claimText.matchAll(plazosRegex)];
  
  const checks: DataPointCheck[] = [];
  
  for (const plazo of plazosClaim) {
    const numero = plazo[1];
    const unidad = plazo[2].toLowerCase();
    
    // Buscar el mismo número en el texto real del artículo
    const found = articuloTexto.includes(numero);
    
    // Buscar también la unidad cerca del número
    const contextRegex = new RegExp(`${numero}\\s*${unidad.substring(0, 3)}`, 'i');
    const exactMatch = contextRegex.test(articuloTexto);
    
    checks.push({
      type: 'plazo',
      claimed: `${numero} ${unidad}`,
      found: exactMatch,
      actualText: found 
        ? extractContext(articuloTexto, numero, 50) // 50 chars around
        : 'No encontrado en el artículo'
    });
  }
  
  return checks;
}
```

#### Verificación 2: Órganos e Instituciones

```typescript
const ORGANOS_CONOCIDOS = [
  'Consejo de Estado', 'Consejo de Ministros', 'Congreso de los Diputados',
  'Senado', 'Tribunal Constitucional', 'Tribunal Supremo', 'Defensor del Pueblo',
  'Tribunal de Cuentas', 'Gobierno', 'Administración General del Estado',
  'Comunidades Autónomas', 'Entidades Locales', 'Cortes Generales',
  'Comisión Nacional', 'Agencia Española', 'Secretaría de Estado',
  'Subsecretaría', 'Dirección General', 'Delegación del Gobierno'
];

function checkOrganos(claimText: string, articuloTexto: string): DataPointCheck[] {
  const checks: DataPointCheck[] = [];
  
  for (const organo of ORGANOS_CONOCIDOS) {
    if (claimText.toLowerCase().includes(organo.toLowerCase())) {
      const found = articuloTexto.toLowerCase().includes(organo.toLowerCase());
      checks.push({
        type: 'organo',
        claimed: organo,
        found,
        actualText: found 
          ? extractContext(articuloTexto, organo, 50)
          : `"${organo}" NO aparece en el artículo`
      });
    }
  }
  
  return checks;
}
```

#### Verificación 3: Cifras y Cantidades

```typescript
function checkCifras(claimText: string, articuloTexto: string): DataPointCheck[] {
  // Detectar cifras monetarias, porcentajes, cantidades
  const cifrasRegex = /(\d+(?:\.\d+)?(?:,\d+)?)\s*(euros?|€|%|por ciento)/gi;
  const cifras = [...claimText.matchAll(cifrasRegex)];
  
  const checks: DataPointCheck[] = [];
  
  for (const cifra of cifras) {
    const numero = cifra[1];
    const found = articuloTexto.includes(numero);
    checks.push({
      type: 'cifra',
      claimed: `${numero} ${cifra[2]}`,
      found,
      actualText: found
        ? extractContext(articuloTexto, numero, 50)
        : 'Cifra no encontrada en el artículo'
    });
  }
  
  return checks;
}
```

#### Verificación 4: Keywords de Condición

```typescript
function checkCondiciones(claimText: string, articuloTexto: string): DataPointCheck[] {
  // Detectar condiciones específicas que Claude afirma
  const condicionPatterns = [
    /(?:siempre que|cuando|si|salvo que|excepto|a menos que)\s+(.{10,60})/gi,
    /(?:será necesario|se requiere|se exige|es obligatorio)\s+(.{10,60})/gi,
  ];
  
  const checks: DataPointCheck[] = [];
  
  for (const pattern of condicionPatterns) {
    const matches = [...claimText.matchAll(pattern)];
    for (const match of matches) {
      const condicion = match[1].trim();
      // Buscar keywords principales de la condición en el texto real
      const keywords = condicion.split(/\s+/).filter(w => w.length > 4);
      const keywordsFound = keywords.filter(kw => 
        articuloTexto.toLowerCase().includes(kw.toLowerCase())
      );
      const matchRatio = keywordsFound.length / keywords.length;
      
      checks.push({
        type: 'condicion',
        claimed: condicion,
        found: matchRatio > 0.5, // Al menos 50% de keywords presentes
        actualText: `${keywordsFound.length}/${keywords.length} keywords encontradas`
      });
    }
  }
  
  return checks;
}
```

#### Verificación 5: Helper de Contexto

```typescript
function extractContext(text: string, search: string, charsAround: number): string {
  const idx = text.toLowerCase().indexOf(search.toLowerCase());
  if (idx === -1) return '';
  const start = Math.max(0, idx - charsAround);
  const end = Math.min(text.length, idx + search.length + charsAround);
  return '...' + text.slice(start, end).trim() + '...';
}
```

### 5.4 Cálculo de Resultado de Matching

```typescript
function calculateContentMatch(checks: DataPointCheck[]): ContentMatchResult {
  if (checks.length === 0) {
    // No se encontraron data points verificables
    return {
      match: true,  // No hay nada que contradiga
      confidence: 'low', // Pero tampoco podemos confirmar
      details: 'No se encontraron datos verificables (plazos, órganos, cifras) en la afirmación',
      dataPointsChecked: []
    };
  }
  
  const totalChecks = checks.length;
  const passedChecks = checks.filter(c => c.found).length;
  const failedChecks = checks.filter(c => !c.found);
  const ratio = passedChecks / totalChecks;
  
  // Plazos incorrectos son CRÍTICOS (un plazo mal = suspender)
  const plazosIncorrectos = failedChecks.filter(c => c.type === 'plazo');
  if (plazosIncorrectos.length > 0) {
    return {
      match: false,
      confidence: 'high',
      details: `PLAZO INCORRECTO: Claude afirma "${plazosIncorrectos[0].claimed}" pero el artículo dice "${plazosIncorrectos[0].actualText}"`,
      dataPointsChecked: checks
    };
  }
  
  // Órganos incorrectos son GRAVES
  const organosIncorrectos = failedChecks.filter(c => c.type === 'organo');
  if (organosIncorrectos.length > 0) {
    return {
      match: false,
      confidence: 'high',
      details: `ÓRGANO INCORRECTO: "${organosIncorrectos[0].claimed}" no aparece en el artículo citado`,
      dataPointsChecked: checks
    };
  }
  
  // Para el resto, evaluar ratio
  if (ratio >= 0.8) {
    return { match: true, confidence: 'high', details: `${passedChecks}/${totalChecks} verificaciones OK`, dataPointsChecked: checks };
  } else if (ratio >= 0.5) {
    return { match: true, confidence: 'medium', details: `${passedChecks}/${totalChecks} verificaciones OK (${failedChecks.length} no coincidentes)`, dataPointsChecked: checks };
  } else {
    return { match: false, confidence: 'medium', details: `Solo ${passedChecks}/${totalChecks} verificaciones coinciden`, dataPointsChecked: checks };
  }
}
```

---

## 6. Score Global y Decisión

### 6.1 Función Orquestadora

`lib/ai/verification.ts` → función `verifyAllCitations(generatedContent: string): VerificationReport`

```typescript
interface VerificationReport {
  score: number;                    // 0.0 - 1.0
  allVerified: boolean;             // true si score >= threshold
  totalCitations: number;
  verifiedCitations: number;
  failedCitations: FailedCitation[];
  warnings: string[];
  decision: 'deliver' | 'regenerate' | 'deliver_partial';
}

interface FailedCitation {
  citation: Citation;
  reason: string;
  step: 'extraction' | 'lookup' | 'matching';
}
```

### 6.2 Cálculo del Score

```typescript
function calculateScore(results: CitationVerification[]): number {
  if (results.length === 0) return 1.0; // Sin citas = no hay nada que falle (pero es sospechoso)
  
  let score = 0;
  
  for (const result of results) {
    if (result.lookup.exists && result.contentMatch.match) {
      // Artículo existe Y contenido coincide
      if (result.contentMatch.confidence === 'high') score += 1.0;
      else if (result.contentMatch.confidence === 'medium') score += 0.75;
      else score += 0.5;
    } else if (result.lookup.exists && !result.contentMatch.match) {
      // Artículo existe pero contenido NO coincide — GRAVE
      score += 0.0;
    } else if (result.lookup.reason === 'apartado_no_encontrado_pero_articulo_si') {
      // Artículo existe, apartado no — WARNING
      score += 0.5;
    } else {
      // Artículo no existe — CRÍTICO
      score += 0.0;
    }
  }
  
  return score / results.length;
}
```

### 6.3 Umbrales de Decisión

| Score | Decisión | Acción |
|-------|----------|--------|
| ≥ 0.90 | `deliver` | Entregar al usuario con badges de verificación ✅ |
| 0.80 - 0.89 | `deliver` | Entregar, pero log warning para revisión |
| 0.60 - 0.79 | `regenerate` | Regenerar contenido (max 2 reintentos) |
| < 0.60 | `deliver_partial` | Entregar SOLO las preguntas/citas verificadas. Descartar el resto. Disclaimer al usuario. |

### 6.4 Flujo de Regeneración

```
Intento 1: Generación normal
  → Verificación → Score < 0.80
  → Identificar qué citas fallaron
  
Intento 2: Regeneración dirigida
  → Prompt ajustado: "Las siguientes preguntas fueron descartadas por citas no verificables: [lista]. 
     Genera {{N}} preguntas adicionales usando EXCLUSIVAMENTE estos artículos: [lista de artículos válidos del contexto]"
  → Verificación → Score < 0.80
  
Intento 3: Regeneración mínima
  → Prompt: "Genera {{N}} preguntas SIMPLES usando solo los artículos {{lista corta}} de la {{ley}}.
     Cada pregunta debe ser directa sobre el contenido literal del artículo."
  → Verificación → Si aún falla: deliver_partial
  
Si tras 3 intentos no hay suficientes preguntas verificadas:
  → Entregar las que pasaron + mensaje: "Se han generado X de las Y preguntas solicitadas. 
     El resto no superó nuestra verificación de calidad."
  → Log CRITICAL para investigación
```

---

## 7. Presentación al Usuario (UI)

### 7.1 Badges de Verificación

Cada cita legal en la interfaz muestra un badge:

| Badge | Significado | Color | Tooltip |
|-------|-------------|-------|---------|
| ✅ Verificado | Artículo existe, contenido confirmado, confidence high | Verde (#27AE60) | "Cita verificada contra legislación vigente en BOE" |
| ⚠️ Parcialmente verificado | Artículo existe, confidence medium | Amarillo (#F39C12) | "Artículo verificado, apartado pendiente de confirmación" |
| ⓘ No verificable | Ley no en nuestra BD o sin data points | Gris (#95A5A6) | "No disponemos de esta ley en nuestra base de datos" |

**NUNCA mostrar badge rojo o "incorrecto" al usuario.** Si no pasa verificación, simplemente no se muestra la pregunta. El usuario nunca ve contenido no verificado.

### 7.2 Ejemplo de UI

```
Pregunta 3 de 10

Según el artículo 53.1 de la Ley 39/2015, ¿cuál de los siguientes 
constituye un derecho del interesado en el procedimiento administrativo?

A) A obtener copia sellada de cualquier documento...
B) A conocer, en cualquier momento, el estado de tramitación...  
C) A ser notificado exclusivamente por medios electrónicos...
D) A obtener dictamen vinculante del Consejo de Estado...

[Respuesta correcta: B]

Justificación: El artículo 53.1.a) de la Ley 39/2015 ✅ establece 
el derecho del interesado a conocer en cualquier momento el estado 
de tramitación...
```

---

## 8. Logging y Monitorización

### 8.1 Log de Verificación

Cada verificación genera un registro para monitorización:

```typescript
interface VerificationLog {
  timestamp: string;
  tipo: 'test' | 'corrector' | 'oral';
  total_citas: number;
  verificadas: number;
  fallidas: number;
  score: number;
  decision: string;
  reintentos: number;
  fallos_detalle: {
    cita: string;
    paso: string;
    razon: string;
  }[];
  tiempo_verificacion_ms: number;
  coste_regeneracion_estimado: number; // Si hubo reintentos
}
```

### 8.2 Métricas Agregadas (Dashboard Interno)

| Métrica | Cálculo | Alerta |
|---------|---------|--------|
| Tasa de verificación global | verificadas / total últimas 24h | < 85% → 🔴 |
| Tasa de regeneración | tests regenerados / total | > 20% → ⚠️ (prompts necesitan ajuste) |
| Fallos por ley | Agrupar fallos por ley_codigo | Si una ley concentra >50% fallos → revisar ingesta |
| Falsos positivos reportados | Preguntas reportadas que sí eran correctas | > 1% → revisar matching |
| Tiempo medio verificación | P50 y P95 de tiempo_verificacion_ms | P95 > 2000ms → optimizar queries |

### 8.3 Alertas Automáticas

```
Si tasa verificación < 80% en últimas 2 horas:
  → Notificación Slack/email a Aritz
  → Log: "Tasa de verificación crítica. Posibles causas: prompt degradado, BD desactualizada, o cambio legislativo no detectado"
  → Acción automática: activar modo conservador (solo generar con artículos de Fuente 1 / mapeo directo)

Si fallos concentrados en una ley:
  → Notificación: "El 60% de los fallos de verificación son en {{ley}}. Revisar ingesta."
  → No acción automática (requiere revisión humana)
```

---

## 9. Testing de la Capa de Verificación

### 9.1 Tests Unitarios (OBLIGATORIOS antes de lanzar)

```typescript
// test/verification.test.ts

describe('extractCitations', () => {
  it('extrae cita completa con ley y apartado', () => {
    const text = 'Según el artículo 53.1.a de la Ley 39/2015, el interesado tiene derecho...';
    const citations = extractCitations(text);
    expect(citations).toHaveLength(1);
    expect(citations[0].ley_nombre).toBe('Ley 39/2015');
    expect(citations[0].articulo).toBe('53');
    expect(citations[0].apartado).toBe('1.a');
  });
  
  it('extrae cita abreviada', () => {
    const text = 'Los derechos del art. 53 LPAC incluyen...';
    const citations = extractCitations(text);
    expect(citations[0].ley_codigo).toBe('LPAC');
    expect(citations[0].articulo).toBe('53');
  });
  
  it('extrae múltiples citas del mismo texto', () => {
    const text = 'El art. 53.1 LPAC y el art. 14.2 LRJSP establecen...';
    const citations = extractCitations(text);
    expect(citations).toHaveLength(2);
  });
  
  it('extrae cita de la Constitución', () => {
    const text = 'El artículo 103.1 de la Constitución Española establece...';
    const citations = extractCitations(text);
    expect(citations[0].ley_codigo).toBe('CE');
  });
  
  it('extrae cita entre paréntesis', () => {
    const text = 'El derecho de acceso (art. 53.1.a LPAC) permite...';
    const citations = extractCitations(text);
    expect(citations).toHaveLength(1);
  });
  
  it('maneja texto sin citas', () => {
    const text = 'Los derechos fundamentales son importantes.';
    const citations = extractCitations(text);
    expect(citations).toHaveLength(0);
  });
  
  it('no extrae citas falsas (números sueltos)', () => {
    const text = 'Hay 53 tipos de procedimientos y 14 categorías.';
    const citations = extractCitations(text);
    expect(citations).toHaveLength(0);
  });
});

describe('verifyCitation', () => {
  it('verifica artículo existente con confidence high', async () => {
    const citation = { ley_codigo: 'LPAC', articulo: '53', apartado: '1.a' };
    const result = await verifyCitation(citation);
    expect(result.exists).toBe(true);
    expect(result.confidence).toBe('high');
  });
  
  it('rechaza artículo inventado', async () => {
    const citation = { ley_codigo: 'LPAC', articulo: '999', apartado: null };
    const result = await verifyCitation(citation);
    expect(result.exists).toBe(false);
    expect(result.reason).toBe('articulo_no_existe');
  });
  
  it('detecta artículo existente con apartado inventado', async () => {
    const citation = { ley_codigo: 'LPAC', articulo: '53', apartado: '99.z' };
    const result = await verifyCitation(citation);
    expect(result.exists).toBe(true);
    expect(result.reason).toBe('apartado_no_encontrado_pero_articulo_si');
    expect(result.confidence).toBe('medium');
  });
});

describe('verifyContentMatch', () => {
  it('detecta plazo incorrecto', () => {
    const claim = 'El plazo para resolver es de 3 meses';
    const articuloTexto = 'El plazo máximo será de seis meses...';
    const result = verifyContentMatch(claim, articuloTexto);
    expect(result.match).toBe(false);
    expect(result.dataPointsChecked[0].type).toBe('plazo');
  });
  
  it('confirma plazo correcto', () => {
    const claim = 'El plazo para resolver es de 6 meses';
    const articuloTexto = 'El plazo máximo será de seis meses...'; 
    // NOTA: "6" vs "seis" — necesitamos normalización de números escritos
    const result = verifyContentMatch(claim, articuloTexto);
    expect(result.match).toBe(true);
  });
  
  it('detecta órgano incorrecto', () => {
    const claim = 'La competencia corresponde al Consejo de Estado';
    const articuloTexto = 'La competencia corresponde al Consejo de Ministros...';
    const result = verifyContentMatch(claim, articuloTexto);
    expect(result.match).toBe(false);
  });
});
```

### 9.2 Tests de Integración (Pipeline Completo)

```typescript
describe('Pipeline completo de verificación', () => {
  it('genera test y verifica con score > 0.8', async () => {
    const test = await generateTest(tema1Id, 5, 'media');
    const report = await verifyAllCitations(JSON.stringify(test));
    expect(report.score).toBeGreaterThan(0.8);
    expect(report.decision).toBe('deliver');
  });
  
  it('detecta y descarta pregunta con artículo inventado', async () => {
    // Simular output de Claude con un artículo que no existe
    const fakeOutput = '...según el artículo 999.1 de la Ley 39/2015...';
    const report = await verifyAllCitations(fakeOutput);
    expect(report.failedCitations).toHaveLength(1);
    expect(report.failedCitations[0].reason).toContain('no_existe');
  });
});
```

### 9.3 Test de Stress

```
Generar 100 tests (1000 preguntas) y medir:
- % que pasan verificación (objetivo: >90%)
- Falsos positivos (preguntas correctas marcadas como fallidas): <1%
- Falsos negativos (preguntas incorrectas no detectadas): <2%
- Tiempo medio de verificación por pregunta: <200ms
```

---

## 10. Evolución y Mejoras Futuras

### Mejoras planificadas (post-MVP):

| Mejora | Impacto | Complejidad | Fase |
|--------|---------|-------------|------|
| Normalización números escritos ("seis" → 6) | Reduce falsos negativos en plazos | Baja | 2 |
| Cache de verificaciones (misma cita = no repetir lookup) | Performance | Baja | 2 |
| Matching semántico ligero (sinónimos jurídicos) | Reduce falsos negativos | Media | 3 |
| Dashboard visual de métricas de verificación | Monitorización | Media | 2 |
| Auto-detección de nuevas leyes citadas por Claude | Ampliar cobertura | Alta | 3 |

### Lo que NO haremos:

- **NO usaremos IA para verificar IA.** La capa de verificación es y será siempre código determinista. Si añadimos matching semántico, será con diccionarios de sinónimos predefinidos, no con otro LLM.
- **NO relajaremos umbrales para mejorar "conversion".** Si el 20% de preguntas no pasan, mejoraremos los prompts, no bajaremos el umbral. La calidad es innegociable.

---

## 11. Checklist de Implementación

- [ ] `extractCitations()` implementada con todos los patrones regex
- [ ] `LEY_NORMALIZATION` completo para todas las leyes P0 y P1
- [ ] `parseArticuloApartado()` implementado y testeado con 20+ formatos
- [ ] `verifyCitation()` con cascada de 3 niveles de lookup
- [ ] `verifyContentMatch()` con las 5 verificaciones deterministas
- [ ] `verifyAllCitations()` orquestador con score y decisión
- [ ] Normalización de números escritos ("seis" → 6, "diez" → 10) — PENDIENTE
- [ ] Todos los tests unitarios pasando (§9.1)
- [ ] Test de integración pipeline completo pasando (§9.2)
- [ ] Test de stress con 100 tests: >90% tasa verificación (§9.3)
- [ ] Logging configurado y métricas definidas
- [ ] Alertas automáticas configuradas
- [ ] Badges de UI implementados
