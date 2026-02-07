# SOP: Data Governance & Privacy (Enterprise Grade)

**Objetivo**: Garantizar cumplimiento con GDPR, CCPA y políticas corporativas estrictas de datos.

## 1. Clasificación de Datos

Antes de procesar cualquier dato, clasificar según su nivel de sensibilidad:

| Nivel | Descripción | Ejemplos | Tratamiento |
|---|---|---|---|
| **Public** | Información de acceso libre | Documentación pública, precios publicados | Sin restricciones especiales |
| **Internal** | Información interna de la organización | Notas de reuniones, roadmaps internos | No exponer externamente, loguear acceso |
| **Confidential** | Datos sensibles del negocio | Contratos, datos financieros, estrategias | Cifrado en reposo y tránsito, acceso restringido |
| **Restricted** | PII, datos regulados, secretos | Nombres, emails, DNIs, tokens API, datos médicos | Sanitización obligatoria antes de cualquier procesamiento externo |

- Todo dataset nuevo debe clasificarse ANTES de procesarse.
- En caso de duda, clasificar al nivel más restrictivo.

## 2. Data Lineage & Provenance

- **Trazabilidad**: Todo output debe ser trazable hasta su documento fuente en `docs/` o una respuesta de API externa.
- **Etiquetado**: Mantener un mapa claro de dónde provienen los datos y hacia dónde se envían.
- **Registro de transformaciones**: Documentar qué transformaciones se aplican a los datos en cada paso del pipeline.

## 3. PII & Sensitive Information Handling

- **Sanitización**: ANTES de enviar cualquier dato a un LLM externo (OpenAI/Anthropic), el agente DEBE sanitizar PII (nombres, emails, IDs, teléfonos).
- **Redacción**: Usar placeholders como `[USER_EMAIL_REDACTED]` para logs y procesamiento intermedio.
- **Detección de PII**: Utilizar librerías especializadas (ej. `presidio`, patterns de regex adaptados al locale del proyecto) para detección automática. No confiar solo en búsqueda manual.
- **Principio de mínimo privilegio**: Solo acceder a los campos de datos estrictamente necesarios para la tarea. No extraer datasets completos si solo se necesitan 3 columnas.

## 4. Data Retention & Cleanup

Principios de retención por tipo de dato:

| Tipo | Retención | Acción |
|---|---|---|
| Datos efímeros (`.tmp/`) | Duración de la ejecución | Eliminar inmediatamente al completar la fase |
| Logs operativos | Definido por proyecto | Rotar según política del proyecto, nunca indefinido |
| Datos con PII | Mínimo necesario | Eliminar en cuanto dejen de ser necesarios para el objetivo |
| Resultados procesados | Según acuerdo con cliente | Documentar período de retención en `PLAN.md` |

- **Ephemeral Storage**: Los archivos en `.tmp/` DEBEN eliminarse tras completar la fase de ejecución.
- **Log Privacy**: Nunca loguear respuestas raw de APIs que contengan datos sensibles del usuario. Loguear solo metadata y estado.
- **Limpieza proactiva**: Revisar periódicamente que no haya datos residuales en directorios temporales o logs antiguos.

## 5. Principios GDPR Esenciales

Toda solución que maneje datos de personas en la UE debe respetar estos principios:

1. **Minimización de datos**: Recoger y procesar SOLO los datos estrictamente necesarios. Si no lo necesitas, no lo pidas.
2. **Derecho de acceso**: El sistema debe poder responder a "¿qué datos tienes sobre mí?" de forma razonable.
3. **Derecho de supresión (Right to Erasure)**: Debe ser posible eliminar todos los datos de un individuo si lo solicita. Diseñar la arquitectura de datos teniendo esto en cuenta desde el inicio.
4. **Limitación del propósito**: Los datos recogidos para un fin NO pueden reutilizarse para otro sin consentimiento.
5. **Base legal**: Toda operación de procesamiento de datos personales debe tener una base legal documentada (consentimiento, interés legítimo, obligación contractual, etc.).

## 6. Consent & Access Control

- **Verificación de autorización**: Antes de realizar operaciones de escritura en sistemas externos (ej. Google Drive, Databases), verificar que la acción está alineada con el scope del proyecto en `PLAN.md`.
- **Principio de mínimo acceso**: Los scripts solo deben solicitar los scopes y permisos estrictamente necesarios para su función.
- **Audit trail**: Registrar quién accedió a qué datos y cuándo, especialmente para datos clasificados como Confidential o Restricted.
