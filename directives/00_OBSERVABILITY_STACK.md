# SOP: Advanced Observability & Tracing

**Objetivo**: Reducir el Mean Time to Recovery (MTTR) mediante visibilidad profunda del sistema.

## 1. Structured Logging

- Usar formato JSON para todos los logs en producción.
- Campos obligatorios: `timestamp`, `level`, `message`, `request_id`, `trace_id`.
- Campos recomendados: `service_name`, `module`, `duration_ms`, `user_context` (nunca PII).
- Stack recomendado: `structlog` para Python. Configurar procesadores para output JSON en producción y output legible en desarrollo.

### Referencia de Log Levels

| Level | Cuándo usarlo | Ejemplo |
|---|---|---|
| **DEBUG** | Información detallada para diagnosticar problemas durante desarrollo. NUNCA activar en producción por defecto. | `Parsing document chunk 3/15, tokens: 450` |
| **INFO** | Eventos normales de operación que confirman que el sistema funciona correctamente. | `Invoice processed successfully, id=INV-2024-001` |
| **WARNING** | Situación inesperada que no impide la operación pero requiere atención. | `API rate limit at 80%, throttling requests` |
| **ERROR** | Fallo en una operación específica. El sistema puede seguir funcionando. | `Failed to send email to user, retrying in 30s` |
| **CRITICAL** | Fallo grave que requiere intervención inmediata. El servicio puede estar caído. | `Database connection pool exhausted, all requests failing` |

### Qué NUNCA loguear

- **Secrets**: API keys, tokens de autenticación, contraseñas.
- **PII**: Nombres, emails, teléfonos, direcciones, documentos de identidad.
- **Request/Response bodies completos** que puedan contener datos sensibles. Loguear solo metadata (status code, duración, tamaño).
- **Datos financieros**: Números de tarjeta, cuentas bancarias, importes de facturas de clientes.

## 2. Distributed Tracing

- Propagar `correlation_id` a través de todos los servicios internos y llamadas a LLMs.
- Loguear el "Thought Trace" del agente en `.tmp/` durante desarrollo para debugging.
- Cada request entrante debe generar un `trace_id` único si no viene proporcionado.
- En llamadas a LLMs, incluir el `trace_id` en metadata para poder correlacionar prompt, response y coste.

## 3. Error Reporting en Producción

- Usar `Sentry` (ya incluido en requirements.txt) para captura automática de excepciones no controladas.
- Configurar Sentry con `traces_sample_rate` adecuado al volumen del proyecto (empezar con 0.1 en producción).
- Toda excepción capturada debe incluir contexto suficiente para reproducir el problema (sin PII ni secrets).
- Clasificar errores por severidad y establecer alertas para errores CRITICAL.

## 4. Health Monitoring

- El endpoint `/health` debe verificar: conexión a base de datos, conectividad con servicios externos críticos y validez de API keys.
- Formato de respuesta estandarizado:

```
HTTP 200 (healthy) / HTTP 503 (unhealthy)

{
  "status": "healthy" | "unhealthy",
  "service": "<nombre_del_servicio>",
  "timestamp": "<ISO 8601>",
  "checks": {
    "database": "ok" | "error",
    "cache": "ok" | "error",
    "external_api": "ok" | "error"
  }
}
```

- Los health checks NO deben exponer información interna del sistema (versiones, IPs, configuración).
- Implementar también un endpoint `/ready` separado si el servicio tiene fase de warm-up.

## 5. PII Redaction in Logs

Logging is essential for debugging, but logs that contain PII create compliance liability (GDPR, CCPA) and security risks if logs are compromised.

### Mandatory Redaction
- Create a `redactPII(logEntry)` function that replaces sensitive fields before writing to any log destination.
- Fields to redact: `email`, `full_name`, `name`, `Authorization` header, `token`, `password`, `api_key`, user-generated text content.
- Replacement: `[REDACTED]` for single values, `[TRUNCATED:50chars]` for long text fields (keep first 50 chars for debugging context).

### Implementation Pattern
```
// Example (language-agnostic)
function redactPII(obj):
    for each field in SENSITIVE_FIELDS:
        if obj contains field:
            obj[field] = "[REDACTED]"
    for each field in TEXT_FIELDS:
        if obj contains field and length > 50:
            obj[field] = obj[field].substring(0, 50) + "...[TRUNCATED]"
    return obj
```

### Rules
- NEVER log full request/response bodies of endpoints that handle PII (user profiles, auth, text submissions).
- Log only metadata: status code, duration, request size, response size.
- In development: redaction can be relaxed for debugging (but never commit logs with real PII).
- **Test**: Write a test that submits a request with PII → verify PII does NOT appear in log output.

## 6. Cost Alert Implementation

For systems that consume paid APIs (LLMs, embeddings, TTS/STT), cost monitoring must be MORE than a line in a document — it needs executable code.

### Mandatory Steps
1. **Log consumption**: After every paid API call, log `input_tokens`, `output_tokens`, `model`, `estimated_cost` to a persistent store (database table, not just stdout).
2. **Track daily totals**: Create a `api_usage_log` table with fields: `timestamp`, `endpoint`, `user_id`, `tokens_in`, `tokens_out`, `cost_estimated`, `model`.
3. **Alert mechanism**: Implement a check (cron job, pre-request check, or webhook) that triggers when daily cost exceeds a threshold.
4. **Define thresholds**: Document alert levels (e.g., $10/day = warning, $30/day = pause endpoints, $100/day = emergency).

### Anti-Pattern
"We'll track costs in a markdown file" is NOT cost monitoring. It's a hope and a prayer. The markdown file documents estimates and actuals. The CODE enforces limits.

### Minimum Viable Implementation
- After each LLM call: `INSERT INTO api_usage_log (timestamp, endpoint, tokens_in, tokens_out, cost_estimated, model)`
- Daily cron: `SELECT SUM(cost_estimated) FROM api_usage_log WHERE timestamp > today()` → if > threshold → send alert email
- Alternatively: check before each request if user has exceeded their daily quota
