# SOP: Secrets Rotation & Emergency Response

**Objective**: Asegurar que los secrets del proyecto no permanezcan validos indefinidamente y definir el protocolo de actuacion ante filtraciones.

---

## 1. Principio General de Rotacion

- Todos los secrets (API keys, tokens, passwords, certificados) deben rotarse periodicamente.
- La frecuencia exacta depende del nivel de riesgo del proyecto: proyectos con datos sensibles o expuestos a internet requieren rotacion mas frecuente.
- Como referencia: evaluar rotacion al menos cada 90 dias para produccion. Ajustar segun las politicas del proveedor y la sensibilidad de los datos.
- Documentar en el `PLAN.md` del proyecto que secrets existen y cual es su politica de rotacion.

---

## 2. Almacenamiento de Secrets

- **NUNCA** hardcodear secrets en el codigo fuente, ficheros de configuracion commiteados, logs, o mensajes de error.
- Usar **variables de entorno** (fichero `.env`) como minimo. Para produccion, preferir un secrets manager del proveedor cloud si esta disponible.
- El fichero `.env` debe estar en `.gitignore`. Sin excepciones.

---

## 3. Procedimiento de Emergencia: Secret Filtrado

Si un secret se expone (commit accidental, log publico, leak de cualquier tipo), ejecutar estos 5 pasos **inmediatamente**:

1. **Revocar**: Invalidar el secret comprometido en el proveedor (dashboard, API, CLI). No esperar.
2. **Rotar**: Generar un nuevo secret y actualizar todos los sistemas que lo consumen.
3. **Auditar**: Revisar logs de acceso del secret comprometido para detectar uso no autorizado.
4. **Notificar**: Informar a Aritz y a cualquier stakeholder afectado. Si hay datos de usuarios implicados, evaluar obligaciones legales de notificacion.
5. **Documentar**: Registrar el incidente (que paso, cuando, impacto, acciones tomadas) en el log del proyecto para evitar recurrencia.

**Tiempo maximo de respuesta**: Un secret filtrado es equivalente a una vulnerabilidad Critical. Actuar en menos de 1 hora.
