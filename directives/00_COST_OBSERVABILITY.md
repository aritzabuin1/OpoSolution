# SOP: Monitorización de Costes y Observabilidad

**Objetivo**: Garantizar que el cliente nunca reciba una factura sorpresa y que la solución sea financieramente sostenible.

## 1. Acciones Obligatorias por el Agente

1. **Estimación Inicial**: En cada `PLAN.md`, el agente DEBE estimar el coste de tokens basado en el volumen de datos previsto.
2. **Log de Consumo**: Si se implementa un script en `execution/`, este debe incluir una función para contar tokens y loguear el coste aproximado en `monitoring/COSTS.md`.
3. **Alertas**: Si una tarea de procesamiento masivo supera los $10 de coste estimado, el agente DEBE detenerse y pedir confirmación explícita.

## 2. Metodología de Estimación Pre-Ejecución

Antes de ejecutar cualquier tarea que consuma tokens o recursos de pago:

1. **Estimar el volumen de entrada**: Calcular número de documentos, longitud media, y tokens aproximados por documento.
2. **Consultar pricing oficial**: NUNCA hardcodear precios de modelos. Los proveedores cambian tarifas con frecuencia. Consultar siempre la página de pricing oficial del proveedor antes de estimar.
3. **Calcular coste bruto**: `tokens_estimados x precio_por_token`.
4. **Aplicar margen de seguridad del 20%**: Los prompts del sistema, retries y overhead siempre añaden consumo extra.
5. **Documentar la estimación** en `PLAN.md` con la fórmula usada y la fecha de consulta de precios.

## 3. Budget Tiers (Orientativos)

Estos rangos son guías para dimensionar proyectos. El presupuesto real se define en cada `PLAN.md`:

| Tipo de Proyecto | Rango Mensual Orientativo | Notas |
|---|---|---|
| MVP / Prototipo | < $50/mes | Validación de concepto, volumen bajo |
| Producto Client-Facing | < $200/mes | Uso regular, requiere optimización activa |
| Enterprise | Definido por proyecto | Acordar con el cliente, revisar semanalmente |

- Si un proyecto no encaja en estos rangos, **escalar al cliente antes de continuar**.

## 4. Estrategias de Optimización de Costes

Aplicar estos principios por orden de prioridad:

1. **Caching**: Cachear respuestas de LLMs para inputs idénticos o muy similares. Evitar reprocesar lo que ya se ha procesado.
2. **Prompts concisos**: Reducir tokens de entrada eliminando instrucciones redundantes y contexto innecesario. Cada token cuenta.
3. **Modelo apropiado para la tarea**: Usar modelos más baratos/rápidos para tareas simples (clasificación, extracción) y reservar los potentes para razonamiento complejo.
4. **Batching**: Agrupar peticiones pequeñas en una sola llamada cuando la API lo permita.
5. **Truncado inteligente**: Si un documento es muy largo, resumir o extraer secciones relevantes antes de enviarlo al LLM.
6. **Evitar retries innecesarios**: Implementar backoff exponencial y límite de reintentos para no multiplicar costes por errores transitorios.

## 5. Tracking de Consumo Real

- Todo script en `execution/` que llame a APIs de pago DEBE capturar `response.usage` (o equivalente del SDK) para registrar tokens reales consumidos.
- Loguear el consumo real en `monitoring/COSTS.md` inmediatamente después de cada ejecución significativa.
- Si el consumo real supera la estimación en >30%, investigar la causa antes de continuar.

## 6. Revisión Mensual de Costes

Al cierre de cada mes (o sprint):

1. **Comparar estimado vs. real** en `monitoring/COSTS.md`.
2. **Identificar desviaciones** >20% y documentar la causa.
3. **Ajustar estimaciones futuras** basándose en datos reales acumulados.
4. **Reportar al cliente** si el proyecto tiene presupuesto acordado.

## 7. Estructura de monitoring/COSTS.md

| Fecha | Tarea | Modelo | Tokens/Units | Coste Est. |
|---|---|---|---|---|
| 2026-02-05 | Test de Ingesta | Claude 3.5 Sonnet | 150k | $0.45 |

- Añadir una columna de **Coste Real** cuando se disponga del dato de `response.usage`.
- Mantener un **total acumulado** al final del archivo por período (semanal o mensual).
