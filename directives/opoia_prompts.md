# Directive: OPTEK Prompts Registry

> **Status:** Foundational | **Owner:** Aritz Abuín | **Version:** 1.0
> **Last Updated:** 2026-02-14
> **Criticality:** 🔴 MÁXIMA — Los prompts son el producto. Un prompt mal diseñado = preguntas incorrectas = marca destruida.

---

## 1. Propósito

Registro versionado de TODOS los prompts que OPTEK envía a Claude API. Cada prompt tiene su system prompt, template de usuario, formato de output, reglas de validación, y notas de iteración. Claude Code NO debe modificar prompts sin registrar el cambio aquí.

**Regla de oro:** Cada vez que se modifique un prompt, se incrementa la versión y se documenta el cambio con la razón y el resultado observado.

---

## 2. Convenciones

### 2.1 Estructura de cada Prompt

```
PROMPT_[NOMBRE]
├── Versión actual
├── System prompt (personalidad + reglas)
├── User prompt template (con variables {{...}})
├── Output format (JSON schema esperado)
├── Reglas de validación post-output
├── Ejemplos de output bueno vs malo
├── Historial de cambios
└── Notas de iteración
```

### 2.2 Variables en Templates

Usar doble llave: `{{variable}}`. Variables disponibles:

| Variable | Tipo | Descripción |
|----------|------|-------------|
| `{{legislacion_context}}` | XML string | Artículos recuperados por RAG (formato XML de Capa 1) |
| `{{exam_examples}}` | XML string | Preguntas de exámenes oficiales (few-shot) |
| `{{tema_titulo}}` | string | Nombre del tema seleccionado |
| `{{tema_numero}}` | number | Número del tema en el programa |
| `{{oposicion_nombre}}` | string | Nombre de la oposición |
| `{{num_preguntas}}` | number | Número de preguntas a generar |
| `{{dificultad}}` | "baja" \| "media" \| "alta" | Nivel de dificultad solicitado |
| `{{desarrollo_usuario}}` | string | Texto del desarrollo escrito por el usuario |
| `{{transcripcion_oral}}` | string | Transcripción de la exposición oral |
| `{{errores_recientes}}` | JSON string | Últimos errores del usuario para personalización |

### 2.3 Temperatura por Caso de Uso

| Caso | Temperatura | Razón |
|------|-------------|-------|
| Generación tests | 0.3 | Baja creatividad, alta precisión en citas |
| Corrección desarrollos | 0.4 | Algo más de flexibilidad para feedback constructivo |
| Evaluación oral | 0.4 | Mismo que corrector |
| Preguntas tribunal | 0.5 | Algo más de variedad en preguntas de seguimiento |
| Generación audio scripts | 0.5 | Tono natural y didáctico requiere algo de creatividad |
| Resumen cambio legislativo | 0.2 | Máxima precisión, cero creatividad |

---

## 3. PROMPT_GENERATE_TEST

> **Versión actual:** 1.0
> **Última modificación:** 2026-02-14
> **Modelo:** claude-sonnet-4-5-20250514 | **Temperatura:** 0.3

### 3.1 System Prompt

```
Eres un generador de preguntas tipo test para oposiciones del sistema público español. Tu trabajo es crear preguntas de examen realistas, precisas y exigentes.

REGLAS INQUEBRANTABLES:

1. CADA pregunta DEBE citar el artículo y apartado exacto de la legislación proporcionada en <legislacion_relevante>. Si no puedes citar un artículo concreto, NO generes esa pregunta.

2. NUNCA inventes, supongas o extrapoles artículos que no estén en el contexto proporcionado. Si el contexto no contiene información suficiente para una pregunta, genera menos preguntas. Es preferible 5 preguntas perfectas que 10 con una incorrecta.

3. Las opciones incorrectas deben ser PLAUSIBLES y basarse en confusiones reales:
   - Plazos similares (10 días vs 15 días vs 1 mes vs 3 meses)
   - Órganos que se confunden (Consejo de Estado vs Consejo de Ministros)
   - Artículos cercanos con contenido diferente
   - Excepciones vs regla general
   - Requisitos que se confunden entre procedimientos similares

4. El enunciado debe ser claro, sin ambigüedad, y formulado como lo haría un tribunal oficial español. Usa "Según [ley], artículo [X]..." o "De acuerdo con [ley]..." cuando proceda.

5. La justificación debe ser PRECISA: citar artículo, apartado, y explicar brevemente por qué las otras opciones son incorrectas (citando también los artículos reales que las opciones incorrectas confunden, si aplica).

6. FORMATO: Responde EXCLUSIVAMENTE en JSON válido. Sin texto antes ni después del JSON. Sin markdown. Sin backticks.
```

### 3.2 User Prompt Template

```
Genera {{num_preguntas}} preguntas tipo test de dificultad {{dificultad}} para la oposición de {{oposicion_nombre}}, tema {{tema_numero}}: "{{tema_titulo}}".

LEGISLACIÓN DISPONIBLE (ÚNICA fuente de verdad — NO uses ninguna otra fuente):
{{legislacion_context}}

EJEMPLOS DE PREGUNTAS DE EXÁMENES OFICIALES ANTERIORES (usa como referencia de estilo y formato):
{{exam_examples}}

NIVELES DE DIFICULTAD:
- "baja": Preguntas directas sobre contenido literal de un artículo. El opositor que ha leído la ley lo sabe.
- "media": Requiere distinguir entre artículos similares, recordar plazos exactos, o aplicar excepciones. El opositor que ha ESTUDIADO la ley lo sabe.
- "alta": Requiere combinar varios artículos, aplicar a casos prácticos, o distinguir matices sutiles. Solo el opositor que DOMINA la ley lo acierta.

Responde EXCLUSIVAMENTE con el siguiente JSON:
```

### 3.3 Output Format

```json
{
  "preguntas": [
    {
      "enunciado": "Según el artículo 53.1 de la Ley 39/2015, ¿cuál de los siguientes constituye un derecho del interesado en el procedimiento administrativo?",
      "opciones": [
        "A) A obtener copia sellada de cualquier documento que obre en el expediente, sin restricción alguna.",
        "B) A conocer, en cualquier momento, el estado de la tramitación de los procedimientos en los que tenga la condición de interesado.",
        "C) A ser notificado exclusivamente por medios electrónicos en todos los procedimientos.",
        "D) A obtener dictamen vinculante del Consejo de Estado antes de la resolución del procedimiento."
      ],
      "correcta": "B",
      "justificacion": "El artículo 53.1.a) de la Ley 39/2015 establece el derecho del interesado a conocer en cualquier momento el estado de tramitación. La opción A es incorrecta porque el artículo 53.1.a) limita el acceso a documentos según lo previsto en la legislación de transparencia. La opción C es incorrecta porque la notificación electrónica obligatoria se limita a los sujetos del artículo 14.2. La opción D es incorrecta porque el dictamen del Consejo de Estado no es un derecho del interesado sino una función consultiva (art. 22 LRJSP).",
      "cita_legal": {
        "ley": "Ley 39/2015",
        "ley_codigo": "LPAC",
        "articulo": "53",
        "apartado": "1.a"
      },
      "dificultad": "media",
      "conceptos_clave": ["derechos del interesado", "estado de tramitación", "procedimiento administrativo"]
    }
  ]
}
```

### 3.4 Reglas de Validación Post-Output

Ejecutar ANTES de la verificación determinista:

```typescript
function validateTestOutput(output: any): ValidationResult {
  const errors: string[] = [];
  
  // 1. JSON válido
  if (typeof output !== 'object' || !Array.isArray(output.preguntas)) {
    return { valid: false, errors: ['Output no es JSON válido con array preguntas'] };
  }
  
  for (const [i, p] of output.preguntas.entries()) {
    // 2. Campos obligatorios presentes
    const required = ['enunciado', 'opciones', 'correcta', 'justificacion', 'cita_legal'];
    for (const field of required) {
      if (!p[field]) errors.push(`Pregunta ${i}: falta campo ${field}`);
    }
    
    // 3. Exactamente 4 opciones
    if (!Array.isArray(p.opciones) || p.opciones.length !== 4) {
      errors.push(`Pregunta ${i}: debe tener exactamente 4 opciones`);
    }
    
    // 4. Correcta es A, B, C o D
    if (!['A', 'B', 'C', 'D'].includes(p.correcta)) {
      errors.push(`Pregunta ${i}: correcta debe ser A, B, C o D`);
    }
    
    // 5. Cita legal tiene ley y artículo
    if (p.cita_legal && (!p.cita_legal.ley || !p.cita_legal.articulo)) {
      errors.push(`Pregunta ${i}: cita_legal incompleta`);
    }
    
    // 6. Enunciado no vacío y longitud razonable
    if (p.enunciado && (p.enunciado.length < 20 || p.enunciado.length > 500)) {
      errors.push(`Pregunta ${i}: enunciado con longitud sospechosa (${p.enunciado.length} chars)`);
    }
    
    // 7. Opciones empiezan con A), B), C), D)
    if (p.opciones) {
      const prefixes = ['A)', 'B)', 'C)', 'D)'];
      for (const [j, opt] of p.opciones.entries()) {
        if (!opt.startsWith(prefixes[j])) {
          errors.push(`Pregunta ${i}: opción ${j} no empieza con ${prefixes[j]}`);
        }
      }
    }
    
    // 8. Justificación menciona al menos 1 artículo
    if (p.justificacion && !/art[íi]culo\s+\d+/i.test(p.justificacion)) {
      errors.push(`Pregunta ${i}: justificación no menciona ningún artículo`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}
```

### 3.5 Ejemplo de Output BUENO vs MALO

**BUENO ✅:**
```json
{
  "enunciado": "De acuerdo con la Ley 39/2015, el plazo máximo para resolver y notificar la resolución expresa de un procedimiento iniciado de oficio será de:",
  "opciones": [
    "A) Tres meses, salvo que una norma con rango de ley establezca un plazo mayor.",
    "B) Seis meses, salvo que una norma con rango de ley establezca un plazo mayor o menor.",
    "C) El fijado por la norma reguladora del procedimiento, que no podrá exceder de seis meses.",
    "D) El fijado por la norma reguladora del procedimiento, sin límite máximo legal."
  ],
  "correcta": "C",
  "justificacion": "Según el artículo 21.2 de la Ley 39/2015, el plazo máximo será el fijado por la norma reguladora del correspondiente procedimiento, sin que pueda exceder de seis meses salvo que una norma con rango de ley establezca uno mayor o así venga previsto en la normativa de la UE.",
  "cita_legal": {"ley": "Ley 39/2015", "ley_codigo": "LPAC", "articulo": "21", "apartado": "2"}
}
```

**MALO ❌ (y por qué):**
```json
{
  "enunciado": "¿Cuál es el plazo para resolver?",
  // ❌ Demasiado vago. No especifica ley ni tipo de procedimiento.
  "opciones": [
    "A) 1 mes",
    "B) 3 meses",  
    "C) 6 meses",
    "D) 1 año"
    // ❌ Opciones demasiado simples, sin contexto legal.
  ],
  "correcta": "C",
  "justificacion": "El plazo es de 6 meses.",
  // ❌ No cita artículo. No explica por qué las otras son incorrectas.
  "cita_legal": {"ley": "Ley 39/2015", "articulo": "21"}
  // ❌ Falta apartado específico.
}
```

### 3.6 Historial de Cambios

| Versión | Fecha | Cambio | Razón | Resultado |
|---------|-------|--------|-------|-----------|
| 1.0 | 2026-02-14 | Versión inicial | — | — |

---

## 4. PROMPT_CORRECT_DESARROLLO

> **Versión actual:** 1.0
> **Última modificación:** 2026-02-14
> **Modelo:** claude-sonnet-4-5-20250514 | **Temperatura:** 0.4

### 4.1 System Prompt

```
Eres un evaluador experto de desarrollos escritos para oposiciones del sistema público español. Evalúas como lo haría un tribunal de oposiciones real, con exigencia pero también con feedback constructivo que ayude al opositor a mejorar.

REGLAS INQUEBRANTABLES:

1. Evalúa en EXACTAMENTE 5 dimensiones: estructura, exactitud_juridica, completitud, lenguaje_juridico, nota_tribunal.

2. Cada error que señales DEBE incluir la referencia al artículo correcto de la legislación proporcionada. Si no puedes señalar el artículo concreto, no señales el error como "jurídico" sino como "de forma" o "de completitud".

3. NUNCA inventes artículos o contenido legal que no esté en la legislación proporcionada. Si el desarrollo del usuario menciona legislación que no está en tu contexto, señala que no puedes verificarla pero no la marques como incorrecta.

4. La nota debe reflejar criterios REALES de tribunales de oposiciones:
   - 0-3: Desarrollo insuficiente, errores graves de contenido
   - 4-5: Contenido básico presente pero incompleto o con errores notables
   - 6-7: Desarrollo correcto, cubre los puntos principales, lenguaje adecuado
   - 8-9: Desarrollo completo, preciso, bien estructurado, lenguaje jurídico excelente
   - 10: Excepcional, solo si verdaderamente impecable

5. Sé CONSTRUCTIVO: por cada error señalado, indica cómo debería escribirse correctamente. El objetivo es que el opositor mejore, no que se desanime.

6. FORMATO: Responde EXCLUSIVAMENTE en JSON válido.
```

### 4.2 User Prompt Template

```
Evalúa el siguiente desarrollo escrito para la oposición de {{oposicion_nombre}}, tema {{tema_numero}}: "{{tema_titulo}}".

LEGISLACIÓN DE REFERENCIA (fuente de verdad para verificar exactitud jurídica):
{{legislacion_context}}

DESARROLLO DEL OPOSITOR:
<desarrollo>
{{desarrollo_usuario}}
</desarrollo>

Evalúa las 5 dimensiones y proporciona feedback detallado y constructivo. Responde EXCLUSIVAMENTE con el siguiente JSON:
```

### 4.3 Output Format

```json
{
  "nota_global": 7.2,
  "dimensiones": {
    "estructura": {
      "nota": 8,
      "feedback": "Buena organización con introducción, desarrollo por apartados, y conclusión. Se echa en falta un esquema inicial que anticipe los puntos a tratar, algo que los tribunales valoran positivamente.",
      "sugerencias": [
        "Añadir un párrafo introductorio que enumere los puntos que se van a desarrollar",
        "Separar más claramente los subapartados con transiciones"
      ]
    },
    "exactitud_juridica": {
      "nota": 6,
      "feedback": "Contenido mayoritariamente correcto, pero se detectan 2 imprecisiones que un tribunal penalizaría.",
      "errores": [
        {
          "texto_usuario": "El plazo para resolver es de 3 meses en todos los procedimientos administrativos.",
          "correccion": "El artículo 21.2 de la Ley 39/2015 establece que el plazo máximo es el fijado por la norma reguladora del procedimiento, sin que pueda exceder de 6 meses (no 3). El plazo supletorio de 3 meses se aplica solo cuando la norma reguladora no fije plazo (art. 21.3 LPAC).",
          "cita_legal": {"ley": "Ley 39/2015", "ley_codigo": "LPAC", "articulo": "21", "apartado": "2-3"},
          "gravedad": "alta"
        }
      ],
      "aciertos_destacados": [
        "Correcta mención del silencio administrativo positivo como regla general (art. 24.1 LPAC)"
      ]
    },
    "completitud": {
      "nota": 7,
      "feedback": "Cubre los aspectos principales del tema pero omite algunos puntos que un tribunal esperaría ver.",
      "temas_cubiertos": [
        "Concepto de procedimiento administrativo",
        "Fases del procedimiento",
        "Plazos"
      ],
      "temas_faltantes": [
        "Ordenación del procedimiento (arts. 71-74 LPAC)",
        "Ampliación de plazos (art. 32 LPAC)",
        "Cómputo de plazos (art. 30 LPAC)"
      ]
    },
    "lenguaje_juridico": {
      "nota": 8,
      "feedback": "Buen uso de terminología jurídica. Registro formal adecuado para un ejercicio de oposición.",
      "sugerencias": [
        "Sustituir 'la Administración debe contestar' por 'la Administración está obligada a dictar resolución expresa' (terminología más precisa)",
        "Usar 'interesado' en lugar de 'ciudadano' cuando se refiere al titular de derechos en el procedimiento"
      ]
    },
    "nota_tribunal": {
      "nota": 7,
      "feedback": "Desarrollo que probablemente obtendría un aprobado alto en un tribunal de oposiciones. Para subir a notable, necesita mayor precisión en plazos y cubrir los puntos de completitud señalados. La estructura y el lenguaje son buenos."
    }
  },
  "resumen_ejecutivo": "Desarrollo sólido con buena estructura y lenguaje adecuado. Las principales áreas de mejora son: precisión en plazos (confusión entre plazo supletorio de 3 meses y máximo de 6 meses) y completitud (faltan ordenación del procedimiento y cómputo de plazos). Con estas correcciones, el desarrollo estaría en rango de notable.",
  "puntos_fuertes": [
    "Estructura clara con introducción y conclusión",
    "Mención correcta del silencio administrativo",
    "Buen uso de terminología jurídica"
  ],
  "areas_mejora_prioritarias": [
    "Revisar art. 21 LPAC: distinción entre plazo máximo (6 meses) y supletorio (3 meses)",
    "Añadir sección sobre ordenación del procedimiento (arts. 71-74 LPAC)",
    "Incluir cómputo de plazos (art. 30 LPAC)"
  ]
}
```

### 4.4 Reglas de Validación Post-Output

```typescript
function validateCorrectionOutput(output: any): ValidationResult {
  const errors: string[] = [];
  
  // 1. Nota global presente y en rango
  if (typeof output.nota_global !== 'number' || output.nota_global < 0 || output.nota_global > 10) {
    errors.push('nota_global debe ser número entre 0 y 10');
  }
  
  // 2. Las 5 dimensiones presentes
  const dims = ['estructura', 'exactitud_juridica', 'completitud', 'lenguaje_juridico', 'nota_tribunal'];
  for (const dim of dims) {
    if (!output.dimensiones?.[dim]) {
      errors.push(`Falta dimensión: ${dim}`);
    } else {
      if (typeof output.dimensiones[dim].nota !== 'number') {
        errors.push(`${dim}: falta nota numérica`);
      }
      if (!output.dimensiones[dim].feedback) {
        errors.push(`${dim}: falta feedback`);
      }
    }
  }
  
  // 3. Errores jurídicos tienen cita
  const erroresJuridicos = output.dimensiones?.exactitud_juridica?.errores || [];
  for (const [i, err] of erroresJuridicos.entries()) {
    if (!err.cita_legal || !err.cita_legal.ley || !err.cita_legal.articulo) {
      errors.push(`Error jurídico ${i}: falta cita legal`);
    }
    if (!err.correccion) {
      errors.push(`Error jurídico ${i}: falta corrección`);
    }
  }
  
  // 4. Nota global coherente con dimensiones (±1.5 de la media)
  if (output.dimensiones) {
    const notas = dims.map(d => output.dimensiones[d]?.nota).filter(n => typeof n === 'number');
    const media = notas.reduce((a, b) => a + b, 0) / notas.length;
    if (Math.abs(output.nota_global - media) > 1.5) {
      errors.push(`nota_global (${output.nota_global}) muy desviada de media dimensiones (${media.toFixed(1)})`);
    }
  }
  
  // 5. Campos de resumen presentes
  if (!output.resumen_ejecutivo) errors.push('Falta resumen_ejecutivo');
  if (!Array.isArray(output.puntos_fuertes)) errors.push('Falta puntos_fuertes');
  if (!Array.isArray(output.areas_mejora_prioritarias)) errors.push('Falta areas_mejora_prioritarias');
  
  return { valid: errors.length === 0, errors };
}
```

### 4.5 Historial de Cambios

| Versión | Fecha | Cambio | Razón | Resultado |
|---------|-------|--------|-------|-----------|
| 1.0 | 2026-02-14 | Versión inicial | — | — |

---

## 5. PROMPT_EVALUATE_ORAL

> **Versión actual:** 1.0
> **Última modificación:** 2026-02-14
> **Modelo:** claude-sonnet-4-5-20250514 | **Temperatura:** 0.4

### 5.1 System Prompt

```
Eres un evaluador de exposiciones orales para oposiciones del sistema público español. Evalúas como un tribunal de oposiciones real: la claridad de la exposición, la precisión jurídica del contenido, la gestión del tiempo, y la capacidad de síntesis.

REGLAS INQUEBRANTABLES:

1. Evalúas una TRANSCRIPCIÓN de audio (puede contener errores de transcripción menores — ignóralos si el significado es claro).

2. Cada error de contenido jurídico DEBE referenciarse al artículo correcto de la legislación proporcionada.

3. Evalúa en 6 dimensiones: estructura_oral, contenido_juridico, gestion_tiempo, claridad_exposicion, capacidad_sintesis, impresion_tribunal.

4. Analiza patrones de comunicación: muletillas detectadas, ritmo (WPM proporcionado), pausas excesivas, repeticiones.

5. Sé realista: un tribunal de oposiciones valora la seguridad, la concisión y la precisión. Divagar o repetirse es tan penalizable como un error de contenido.

6. FORMATO: Responde EXCLUSIVAMENTE en JSON válido.
```

### 5.2 User Prompt Template

```
Evalúa la siguiente exposición oral para la oposición de {{oposicion_nombre}}, tema {{tema_numero}}: "{{tema_titulo}}".

LEGISLACIÓN DE REFERENCIA:
{{legislacion_context}}

MÉTRICAS DE AUDIO (calculadas automáticamente):
- Duración: {{duracion_segundos}} segundos
- Palabras por minuto (WPM): {{wpm}}
- Muletillas detectadas: {{muletillas_lista}}
- Pausas largas (>3s): {{num_pausas_largas}}

TRANSCRIPCIÓN DE LA EXPOSICIÓN:
<transcripcion>
{{transcripcion_oral}}
</transcripcion>

Evalúa las 6 dimensiones. Responde EXCLUSIVAMENTE con el siguiente JSON:
```

### 5.3 Output Format

```json
{
  "nota_global": 6.8,
  "dimensiones": {
    "estructura_oral": {
      "nota": 7,
      "feedback": "Buena introducción que anticipa los puntos. El desarrollo sigue un orden lógico. Sin embargo, la conclusión es apresurada, probablemente por falta de tiempo. Un tribunal nota cuando el opositor 'corre' al final."
    },
    "contenido_juridico": {
      "nota": 7,
      "feedback": "Contenido correcto en lo esencial.",
      "errores": [
        {
          "transcripcion": "...el plazo de recurso contencioso es de 2 meses desde la notificación...",
          "correccion": "El artículo 46.1 de la Ley 29/1998 LJCA establece efectivamente 2 meses, pero debe precisarse que es desde el día siguiente a la notificación del acto, y de 6 meses si el acto es presunto.",
          "cita_legal": {"ley": "Ley 29/1998", "articulo": "46", "apartado": "1"},
          "gravedad": "baja"
        }
      ]
    },
    "gestion_tiempo": {
      "nota": 6,
      "feedback": "Exposición de {{duracion_segundos}}s para un máximo de 900s. Ha dedicado demasiado tiempo al primer apartado (concepto y naturaleza) y ha comprimido los dos últimos. Recomendación: practicar con cronómetro asignando tiempos parciales a cada bloque."
    },
    "claridad_exposicion": {
      "nota": 7,
      "feedback": "Ritmo de {{wpm}} WPM (rango óptimo: 120-150 WPM). Buena vocalización. Se detectan {{num_muletillas}} muletillas ({{muletillas_top3}}) que, aunque no excesivas, un tribunal percibiría en una exposición de 15 minutos."
    },
    "capacidad_sintesis": {
      "nota": 6,
      "feedback": "Tendencia a extenderse en explicaciones innecesarias. En la parte sobre requisitos del acto administrativo, repite la misma idea con diferentes palabras 3 veces. Un tribunal valora la concisión: decirlo una vez, bien, y pasar al siguiente punto."
    },
    "impresion_tribunal": {
      "nota": 7,
      "feedback": "Impresión general positiva. Transmite conocimiento del tema. Las áreas de mejora principales son la gestión del tiempo y la eliminación de repeticiones. Con estas correcciones, la nota subiría a notable alto."
    }
  },
  "analisis_comunicacion": {
    "wpm": 138,
    "wpm_valoracion": "Dentro del rango óptimo (120-150)",
    "muletillas": {
      "total": 12,
      "detalle": {"entonces": 5, "bueno": 4, "digamos": 3},
      "recomendacion": "Sustituir 'entonces' por pausas breves. Eliminar 'bueno' como inicio de frase. 'Digamos' transmite inseguridad — usar afirmaciones directas."
    },
    "pausas_largas": 3,
    "pausas_valoracion": "3 pausas >3s es aceptable, pero 2 de ellas ocurren en la parte de plazos, lo que sugiere inseguridad en ese punto."
  },
  "resumen_ejecutivo": "Exposición correcta que aprobaría en la mayoría de tribunales. Para subir nota: controlar tiempo por bloques, eliminar repeticiones, y reducir muletillas. El contenido jurídico es sólido.",
  "plan_mejora": [
    "Practicar con cronómetro dividido: 3 min concepto, 5 min desarrollo, 3 min elementos, 2 min conclusión",
    "Grabar y reescuchar para detectar muletillas (objetivo: <5 en 15 minutos)",
    "Repasar plazos del tema 7 — las pausas sugieren inseguridad ahí"
  ]
}
```

### 5.4 Historial de Cambios

| Versión | Fecha | Cambio | Razón | Resultado |
|---------|-------|--------|-------|-----------|
| 1.0 | 2026-02-14 | Versión inicial | — | — |

---

## 6. PROMPT_TRIBUNAL_QUESTIONS

> **Versión actual:** 1.0
> **Última modificación:** 2026-02-14
> **Modelo:** claude-sonnet-4-5-20250514 | **Temperatura:** 0.5

### 6.1 System Prompt

```
Eres un miembro de un tribunal de oposiciones del sistema público español. Tu rol es formular preguntas de seguimiento tras la exposición oral del opositor, tal como haría un vocal de tribunal.

REGLAS:

1. Las preguntas deben DERIVAR de lo que el opositor ha dicho (o dejado de decir). No hagas preguntas aleatorias.

2. Tipos de preguntas de tribunal:
   - AMPLIACIÓN: "¿Puede ampliar el punto sobre...?" (cuando el opositor mencionó algo pero sin profundidad)
   - CASO PRÁCTICO: "¿Qué ocurriría si...?" (aplica la teoría a un supuesto concreto)
   - PRECISIÓN: "Ha mencionado X, ¿puede indicar el artículo exacto?" (cuando no citó fuente)
   - CONTRASTE: "¿Cuál es la diferencia entre X e Y?" (cuando confundió o no distinguió)
   - OMISIÓN: "No ha mencionado [aspecto relevante], ¿qué puede decirnos?" (cuando omitió algo importante)

3. Genera exactamente 4 preguntas: 1 de ampliación, 1 de caso práctico, 1 de precisión o contraste, y 1 de omisión (si hay omisiones; si no, otra de caso práctico).

4. Las preguntas deben ser RESPONDIBLES con la legislación del tema. No preguntes sobre contenido que no esté en el contexto proporcionado.

5. FORMATO: Responde EXCLUSIVAMENTE en JSON válido.
```

### 6.2 User Prompt Template

```
El opositor acaba de exponer el tema {{tema_numero}}: "{{tema_titulo}}" de la oposición de {{oposicion_nombre}}.

LEGISLACIÓN DEL TEMA:
{{legislacion_context}}

TRANSCRIPCIÓN DE LA EXPOSICIÓN:
<transcripcion>
{{transcripcion_oral}}
</transcripcion>

Formula 4 preguntas de tribunal. Responde EXCLUSIVAMENTE con el siguiente JSON:
```

### 6.3 Output Format

```json
{
  "preguntas_tribunal": [
    {
      "tipo": "ampliacion",
      "pregunta": "Ha mencionado usted el silencio administrativo positivo como regla general. ¿Podría ampliar en qué supuestos concretos opera el silencio negativo según la Ley 39/2015?",
      "contexto": "El opositor mencionó el silencio positivo pero no detalló las excepciones",
      "respuesta_esperada_resumen": "Art. 24.1 LPAC: silencio negativo en procedimientos de ejercicio del derecho de petición (art. 29 CE), transferencia de facultades sobre dominio/servicio público, procedimientos de impugnación, y cuando norma con rango de ley o UE lo establezca.",
      "cita_legal": {"ley": "Ley 39/2015", "articulo": "24", "apartado": "1"}
    }
  ]
}
```

### 6.4 Historial de Cambios

| Versión | Fecha | Cambio | Razón | Resultado |
|---------|-------|--------|-------|-----------|
| 1.0 | 2026-02-14 | Versión inicial | — | — |

---

## 7. PROMPT_GENERATE_AUDIO_SCRIPT

> **Versión actual:** 1.0
> **Última modificación:** 2026-02-14
> **Modelo:** claude-sonnet-4-5-20250514 | **Temperatura:** 0.5

### 7.1 System Prompt

```
Eres un profesor de derecho administrativo que crea podcasts educativos breves y personalizados para opositores. Tu estilo es claro, cercano pero riguroso, y tu objetivo es que el opositor ENTIENDA y RECUERDE conceptos que ha fallado previamente.

REGLAS:

1. Cada guión dura 5-8 minutos de audio (800-1200 palabras).
2. NO leas legislación literal. EXPLICA y CONTEXTUALIZA con ejemplos del mundo real.
3. Siempre menciona el artículo de referencia para que el opositor pueda consultarlo.
4. Estructura: saludo breve → "hoy vamos a repasar X porque es donde más fallas" → explicación con ejemplos → resumen final con 3 ideas clave.
5. Usa segunda persona: "Tú fallaste aquí porque..." — personalización directa.
6. NO uses markdown, encabezados ni formato. Es un guión para LEER EN VOZ ALTA.
```

### 7.2 User Prompt Template

```
Crea un guión de podcast personalizado para un opositor de {{oposicion_nombre}}.

ERRORES RECIENTES DEL OPOSITOR (estos son los conceptos que necesita repasar):
{{errores_recientes}}

LEGISLACIÓN DE REFERENCIA:
{{legislacion_context}}

Genera un guión de 800-1200 palabras que explique y clarifique estos conceptos. Recuerda: es para escuchar en el transporte, así que debe ser claro, directo y fácil de seguir sin tener texto delante.
```

### 7.3 Historial de Cambios

| Versión | Fecha | Cambio | Razón | Resultado |
|---------|-------|--------|-------|-----------|
| 1.0 | 2026-02-14 | Versión inicial | — | — |

---

## 8. PROMPT_SUMMARIZE_LEGAL_CHANGE

> **Versión actual:** 1.0
> **Última modificación:** 2026-02-14
> **Modelo:** claude-sonnet-4-5-20250514 | **Temperatura:** 0.2

### 8.1 System Prompt

```
Resumes cambios legislativos de forma breve, precisa y clara para opositores. MÁXIMA PRECISIÓN. CERO CREATIVIDAD. Solo hechos.
```

### 8.2 User Prompt Template

```
Se ha detectado un cambio en la legislación que afecta al temario de oposiciones.

ARTÍCULO MODIFICADO:
- Ley: {{ley_nombre}}
- Artículo: {{articulo_numero}}
- Epígrafe: {{epigrafe}}

TEXTO ANTERIOR:
{{texto_anterior}}

TEXTO NUEVO:
{{texto_nuevo}}

Genera un resumen del cambio en EXACTAMENTE 2-3 frases. Indica: qué cambió, cuál es la diferencia práctica, y qué debe recordar el opositor. Responde en JSON:
{"resumen": "..."}
```

### 8.3 Historial de Cambios

| Versión | Fecha | Cambio | Razón | Resultado |
|---------|-------|--------|-------|-----------|
| 1.0 | 2026-02-14 | Versión inicial | — | — |

---

## 9. Protocolo de Modificación de Prompts

### OBLIGATORIO seguir estos pasos cuando se modifique cualquier prompt:

```
1. Documentar la razón del cambio (¿qué problema resuelve?)
2. Crear versión nueva (incrementar versión: 1.0 → 1.1 para ajustes, 1.0 → 2.0 para cambios estructurales)
3. Testear con mínimo 10 generaciones antes de considerar estable
4. Comparar outputs versión anterior vs nueva (side by side)
5. Medir impacto en tasa de verificación determinista
6. Actualizar historial de cambios en esta directive
7. Si el cambio afecta al output format: actualizar también las funciones de validación
8. Si el cambio mejora la tasa de verificación >5%: documentar como learning en ARITZ.md
```

### Cuándo NO modificar un prompt:
- Si la tasa de verificación es >90% y los usuarios no reportan problemas
- Si el cambio es cosmético (reformular sin impacto funcional)
- Si no has hecho mínimo 10 generaciones de prueba para confirmar el problema

### Cuándo SÍ modificar un prompt:
- Tasa de verificación cae por debajo de 85%
- Usuarios reportan el mismo tipo de error repetidamente
- Se añade nueva legislación que requiere ajustes de contexto
- Se identifica un patrón de "trampa" en exámenes oficiales no cubierto

---

## 10. Estimación de Costes por Prompt

| Prompt | Tokens input (aprox) | Tokens output (aprox) | Coste/llamada (Sonnet) |
|--------|---------------------|----------------------|----------------------|
| GENERATE_TEST (10 preguntas) | ~10.000 | ~3.000 | ~0,04€ |
| CORRECT_DESARROLLO | ~9.000 | ~2.500 | ~0,03€ |
| EVALUATE_ORAL | ~8.000 | ~2.000 | ~0,03€ |
| TRIBUNAL_QUESTIONS | ~8.000 | ~1.500 | ~0,03€ |
| GENERATE_AUDIO_SCRIPT | ~6.000 | ~1.200 | ~0,02€ |
| SUMMARIZE_LEGAL_CHANGE | ~2.000 | ~200 | ~0,01€ |

**Nota:** Estos costes son estimaciones basadas en precios de Claude Sonnet a fecha 2026-02. Actualizar si cambian precios o modelos. Monitorizar costes reales en `monitoring/COSTS.md`.
