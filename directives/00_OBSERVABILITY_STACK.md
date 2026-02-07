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
