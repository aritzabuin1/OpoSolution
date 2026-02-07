# SOP: LLM Systematic Evaluation (Evals)

**Objective**: Cuantificar la calidad de los outputs de IA para prevenir regresiones y hallucinations.

---

## 1. El "Golden Dataset"

Para cada flujo critico del proyecto, mantener un fichero JSON en `tests/evals/` con casos de prueba.

### Schema de cada caso de evaluacion

```json
{
  "id": "eval-001",
  "name": "Nombre descriptivo del caso",
  "description": "Contexto y por que este caso es importante",
  "input": "El prompt o datos enviados al modelo",
  "expected_output": {
    "exact": "Respuesta literal esperada (match exacto)",
    "contains": ["fragmento_1", "fragmento_2"],
    "type": "string | json | markdown | number"
  }
}
```

### Tipos de validacion soportados por `run_evals.py`

- **exact**: Comparacion literal. El output debe ser identico al valor esperado. Usar para respuestas deterministas (clasificaciones, IDs, valores numericos).
- **contains**: El output debe incluir TODOS los fragmentos listados, en cualquier orden. Usar para validar que la respuesta menciona conceptos clave sin exigir redaccion exacta.
- **type**: Valida que el output sea del tipo esperado (JSON parseable, Markdown valido, numero, string). Usar para verificar format compliance.
- Si un caso define multiples tipos de validacion, TODOS deben pasar para considerarlo correcto.

### Tamano minimo del dataset

- **Minimo 5 casos por flujo critico** al inicio del proyecto.
- Escalar progresivamente: a medida que el proyecto madura, anadir edge cases, adversarial inputs y casos reales de produccion.
- Priorizar: primero los happy paths, despues errores esperados, por ultimo edge cases.

---

## 2. Evaluation Metrics

- **Faithfulness**: La respuesta se mantiene fiel a los datos fuente? No inventa informacion?
- **Relevance**: Responde exactamente a lo que se pregunto? No divaga ni anade contenido innecesario?
- **Format Compliance**: Sigue el schema JSON/Markdown/tipo requerido por el consumidor del output?

---

## 3. Automated Eval Skill

- Usar `execution/run_evals.py` para comparar los outputs actuales del agente contra el Golden Dataset.
- Reportar un "Quality Score" (0-100) que refleje el porcentaje de casos pasados con exito.

### Cuando ejecutar evals

- **Antes de cada deploy a produccion**: Obligatorio. Sin excepciones.
- **Despues de cambiar cualquier prompt**: Incluso cambios menores pueden causar regresiones inesperadas.
- **Despues de cambiar de modelo o version**: Diferentes modelos producen outputs diferentes; validar siempre.
- **Despues de modificar la logica de procesamiento**: Cambios en parsing, formateo o post-procesado afectan los resultados.
- **Periodicamente en produccion**: Si el proyecto depende de APIs externas cuyo comportamiento puede cambiar.

---

## 4. Performance Benchmarking

- Una tarea NO esta completa si el Quality Score esta por debajo del **85%** para logica de negocio critica.
- Para flujos secundarios o no criticos, el umbral minimo aceptable es **70%**.
- Si el score cae por debajo del umbral tras un cambio, revertir el cambio y analizar antes de re-intentar.
- Documentar los resultados de cada eval run en el log del proyecto para trazabilidad.
