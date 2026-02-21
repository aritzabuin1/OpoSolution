# Directiva de Respuesta a Incidentes — OPTEK

**Proyecto**: OPTEK
**Stack**: Next.js (Vercel) + Supabase + Claude API + Stripe + OpenAI Embeddings
**Última actualización**: 2026-02-15
**Contacto primario**: Aritz (email configurado en Sentry alerts)

---

## Principios

1. **Detectar rápido**: Sentry + /api/health + cron de costes
2. **Comunicar al usuario**: Mensajes en español, nunca errores técnicos
3. **Degradar con gracia**: Funcionalidad parcial > caída total
4. **Documentar siempre**: Cada incidente → ARITZ.md

---

## Runbook 1: Claude API Caído

### Detección
- Sentry alerta: error rate >10% en endpoints `/api/ai/*`
- `/api/health` retorna `{"checks":{"claude_api":"error"}}`
- Logs muestran timeout (30s) o HTTP 500/503 de api.anthropic.com

### Verificación
1. Comprobar [status.anthropic.com](https://status.anthropic.com)
2. Verificar que ANTHROPIC_API_KEY no ha expirado (error 401 ≠ API caída)
3. Verificar que no es un problema de rate limit nuestro (429 ≠ API caída)

### Acciones

| Duración estimada | Acción |
|-------------------|--------|
| < 15 min | Mostrar al usuario: "La IA está procesando mucho tráfico. Reintenta en unos minutos." |
| 15 min - 2 horas | Activar fallback: servir tests cacheados del mismo tema si existen en BD |
| > 2 horas | Enviar email a usuarios activos: "Mantenimiento temporal. Volvemos pronto." |

### Fallback disponible
- Tests ya generados: accesibles (están en Supabase)
- Flashcards: accesibles (están en Supabase)
- Generar NUEVOS tests: NO disponible
- Corrector de desarrollos: NO disponible
- PWA offline: funcionalidad reducida con datos cacheados en IndexedDB

### Post-incidente
- Log en `ARITZ.md`: fecha, duración, causa, impacto (usuarios afectados, revenue perdido)
- Si fue rate limit nuestro: revisar uso y optimizar
- Si fue caída de Anthropic: evaluar implementar fallback a modelo alternativo

---

## Runbook 2: Supabase Caído

### Detección
- `/api/health` retorna `{"checks":{"database":"error"}}` → HTTP 503
- Sentry alerta: connection timeout errors masivos
- Usuarios reportan: no pueden hacer login, no cargan datos

### Verificación
1. Comprobar [status.supabase.com](https://status.supabase.com)
2. Verificar que SUPABASE_URL y keys son correctos
3. Verificar connection pooling: ¿se agotaron las conexiones? (PgBouncer stats en Dashboard)

### Acciones

| Situación | Acción |
|-----------|--------|
| Supabase reporta incidente | Esperar. Mostrar: "Mantenimiento en curso. Tus datos están seguros." |
| Connection pool agotado | Reiniciar connection pool en Supabase Dashboard. Revisar si hay leak de conexiones. |
| Supabase OK pero no conecta | Verificar configuración de red, VPC, o firewall en Vercel. |

### Funcionalidad durante caída

| Feature | Disponible | Razón |
|---------|------------|-------|
| Login/Registro | NO | Requiere auth.users |
| Ver tests anteriores | PARCIAL | Solo si cacheados en PWA/IndexedDB |
| Generar nuevo test | NO | Requiere BD para legislación + guardar resultado |
| Flashcards ya creadas | PARCIAL | Solo si cacheadas en PWA |
| Landing page | SI | Estática, no requiere BD |
| Páginas legales | SI | Estáticas |

### Post-incidente
- Verificar integridad de datos: `SELECT count(*) FROM tests_generados` vs pre-incidente
- Verificar backup status en Supabase Dashboard
- Si hubo connection exhaustion: revisar código para connection leaks, reducir max connections
- Log en `ARITZ.md`

---

## Runbook 3: Error Rate Alto (>5% en 5 minutos)

### Detección
- Sentry auto-alert configurado: "Error rate >5% in 5 minutes"
- Vercel Dashboard: deployment reciente con errores

### Diagnóstico (< 5 minutos)

```
¿Los errores son de un endpoint específico?
├── SI: ¿Es un endpoint que llama a servicio externo?
│   ├── SI → Ir a Runbook del servicio (1: Claude, 2: Supabase)
│   └── NO → Bug en nuestro código. Continuar abajo.
└── NO (errores en múltiples endpoints):
    ├── ¿Hubo deploy reciente? → ROLLBACK INMEDIATO
    └── ¿No hubo deploy? → Investigar: ¿cambió algo en servicios externos?
```

### Acción: Rollback
1. Ir a Vercel Dashboard → Deployments
2. Identificar el último deployment estable (antes del pico de errores)
3. Click "Promote to Production" en ese deployment (rollback instantáneo)
4. Verificar: error rate vuelve a <1%
5. Investigar: ¿qué commit causó el problema?

### Post-incidente (< 24 horas)
- Postmortem escrito en `ARITZ.md`:
  - **Qué pasó**: descripción del error
  - **Impacto**: usuarios afectados, duración, revenue impactado
  - **Causa raíz**: commit/cambio que causó el problema
  - **Fix**: qué se corrigió
  - **Prevención**: qué test/check añadir para que no vuelva a pasar
- Añadir test que cubra el caso que falló
- Re-deploy con fix

---

## Runbook 4: Coste Diario Elevado

### Detección
- Cron `/api/cron/check-costs` → email alert a Aritz
- Thresholds: $10/día warning, $15/día investigar, $30/día pausar

### Diagnóstico

```
¿De dónde vienen los costes?
├── SELECT endpoint, SUM(cost_estimated), COUNT(*)
│   FROM api_usage_log
│   WHERE timestamp > today()
│   GROUP BY endpoint
│   ORDER BY SUM(cost_estimated) DESC
│
├── ¿Un solo usuario genera la mayoría?
│   ├── SI → Posible abuso. Ver su actividad.
│   │   ├── ¿Actividad legítima (opositor dedicado)? → Ajustar rate limit personal
│   │   └── ¿Bot o abuso? → Bloquear user_id, investigar cómo pasó el rate limit
│   └── NO → Crecimiento orgánico. Revisar si es sostenible.
│
├── ¿Un endpoint genera la mayoría?
│   ├── generate-test → ¿Los prompts están optimizados? ¿Se puede reducir contexto?
│   └── correct-desarrollo → ¿Se puede cachear feedback para desarrollos similares?
```

### Acciones por nivel

| Nivel | Umbral | Acción |
|-------|--------|--------|
| Warning | > $10/día | Email a Aritz. Revisar en próximas 24h. |
| Investigar | > $15/día | Analizar causa (query arriba). Optimizar si es posible. |
| Pausar | > $30/día | Desactivar temporalmente endpoints AI: retornar "Servicio en mantenimiento" hasta revisión de Aritz |
| Emergencia | > $100/día | Revocar ANTHROPIC_API_KEY temporalmente. Investigar. |

### Optimizaciones posibles
- Reducir `max_tokens` en prompts de Claude si el output está sobredimensionado
- Implementar cache para tests del mismo tema + dificultad + versión de legislación
- Reducir contexto de legislación en `buildContext()` (actualmente max ~8000 tokens)
- Considerar Claude Haiku para operaciones menos críticas (flashcards, resúmenes)

---

## Runbook 5: Credencial Filtrada

### Detección
- Alerta de GitHub: "Potential secret detected in commit"
- Notificación del proveedor: "Your API key was used from an unknown IP"
- Descubrimiento manual: credencial en código committeado o expuesta en logs

### Acción INMEDIATA (< 15 minutos)

| Paso | Acción | Detalle |
|------|--------|---------|
| 1 | **REVOCAR** | Ir al dashboard del proveedor → revocar/desactivar la key comprometida |
| 2 | **GENERAR** | Crear nueva key en el dashboard del proveedor |
| 3 | **ACTUALIZAR** | Cambiar la key en Vercel → Environment Variables → producción + preview |
| 4 | **RE-DEPLOY** | Trigger redeploy en Vercel para que tome la nueva key |
| 5 | **VERIFICAR** | Confirmar que la app funciona con la nueva key (/api/health) |

### Post-acción (< 24 horas)

| Paso | Acción |
|------|--------|
| 6 | Revisar logs de las últimas 24-72h para detectar uso malicioso de la key filtrada |
| 7 | Si hubo uso malicioso: contactar al proveedor para disputar cargos |
| 8 | Identificar cómo se filtró: ¿commit accidental? ¿log? ¿screenshot? |
| 9 | Implementar prevención: pre-commit hook para detectar secrets, redacción en logs |
| 10 | Documentar en `ARITZ.md`: qué key, cómo se filtró, impacto, fix, prevención |

### Keys y sus dashboards

| Key | Dashboard de revocación |
|-----|------------------------|
| ANTHROPIC_API_KEY | console.anthropic.com → API Keys |
| SUPABASE_SERVICE_ROLE_KEY | app.supabase.com → Project Settings → API |
| STRIPE_SECRET_KEY | dashboard.stripe.com → Developers → API Keys |
| OPENAI_API_KEY | platform.openai.com → API Keys |
| SENTRY_DSN | Público por diseño, no revocable (pero se puede regenerar proyecto) |

### Prevención
- `.env.local` en `.gitignore` (ya configurado)
- Pre-commit hook: `git-secrets` o `gitleaks` para detectar patterns de API keys
- Logs: función `redactPII()` redacta Authorization headers y tokens
- Nunca copiar keys en chats, tickets, o documentación pública

---

## Escalation Matrix

| Severidad | Criterio | Tiempo de respuesta | Acción |
|-----------|----------|--------------------:|--------|
| **P0 - Crítico** | App completamente caída, datos comprometidos, credencial filtrada | < 15 min | Todas las acciones, Aritz notificado inmediatamente |
| **P1 - Alto** | Feature principal no funciona (tests, corrector), error rate >5% | < 1 hora | Investigar, rollback si necesario |
| **P2 - Medio** | Feature secundaria no funciona (flashcards, rankings), costes elevados | < 4 horas | Investigar, planificar fix |
| **P3 - Bajo** | UI bug, performance degradada pero funcional | < 24 horas | Ticket, fix en próximo deploy |
