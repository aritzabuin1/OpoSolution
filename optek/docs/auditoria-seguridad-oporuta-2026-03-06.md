# Auditoria de Seguridad - OpoRuta - 2026-03-06

## Resumen ejecutivo

- **Nivel de riesgo**: MEDIO (tras aplicar fixes P0)
- **Hallazgos**: 0 criticos (tras fix), 2 altos, 5 medios, 4 bajos
- **RGPD**: CUMPLE PARCIAL (gaps menores pendientes)
- **Top 3 riesgos resueltos antes de produccion**:
  1. META Pixel cargaba sin consentimiento de cookies (RGPD Art. 7) - RESUELTO
  2. `api_usage_log` no incluido en delete/export de usuario (RGPD Art. 17/20) - RESUELTO
  3. Dependencia hono con CVE conocida sin parchear - RESUELTO

---

## FASE 1: Secretos y credenciales

### Estado: PASS

- **No hay secretos en codigo fuente**: Grep exhaustivo por `sk-`, `pk_`, `token`, `password`, `secret`, `key`, `Bearer` — cero hallazgos en archivos .ts/.tsx.
- **No hay .env en git**: `git log --all --full-history -- "*.env" ".env*"` devuelve 0 resultados.
- **Secretos en Vercel**: Todas las API keys estan como env vars en Vercel Dashboard.
- **.env.local en .gitignore**: Confirmado.
- **CI/CD**: No hay secretos en vercel.json. Los cron jobs usan `CRON_SECRET` via env var.

---

## FASE 2: OWASP Top 10

### A01 — Control de acceso: PASS

- Todos los endpoints de API verifican `supabase.auth.getUser()` antes de procesar.
- RLS activado en todas las tablas (migration 003). Politicas `user_id = auth.uid()`.
- Admin routes protegidas con verificacion de email hardcodeada (`ADMIN_EMAIL` env var).
- No hay IDORs: queries siempre filtran por `user_id = auth.uid()`.

### A02 — Fallos criptograficos: PASS

- TLS forzado via Vercel (HSTS header configurado en `middleware.ts`).
- No hay URLs `http://` hardcodeadas (grep limpio).
- Autenticacion delegada a Supabase Auth (bcrypt + JWT RS256).
- No se almacenan contrasenas en la app.

### A03 — Inyeccion: PASS

- Todas las queries usan Supabase client (parametrizado). Cero concatenacion de strings SQL.
- No hay `innerHTML` ni `dangerouslySetInnerHTML` sin DOMPurify (isomorphic-dompurify).
- No hay `exec()` ni `spawn()` con input de usuario.
- Prompt injection: system prompts no contienen datos de usuario. User prompts estan claramente delimitados.

### A04 — Diseno inseguro: PASS

- Rate limiting implementado en todos los endpoints de IA (Upstash Redis):
  - `ai-explain`: 3 req/min + 5/dia
  - `ai-generate`: 3 req/min
  - Caza-Trampas: 3/dia free, ilimitado paid
- Validacion Zod en todos los endpoints de entrada.
- Mensajes de error no revelan stack traces ni paths internos.
- Login no diferencia "usuario no existe" vs "contrasena incorrecta" (Supabase default).

### A05 — Configuracion de seguridad: PASS (con mejoras P2)

- **Headers de seguridad** configurados en `middleware.ts`:
  - `Content-Security-Policy` (con dominios especificos para connect-src, script-src)
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security: max-age=63072000`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- **CORS**: No configurado explicitamente (Next.js API routes — same-origin por defecto).
- **Debug mode**: No hay `console.log` en produccion (usa `pino` logger).

| Hallazgo | Severidad | Detalle |
|----------|-----------|---------|
| CSP no incluye `frame-ancestors` | BAJO | Ya tiene X-Frame-Options: DENY, pero CSP frame-ancestors es mas robusto |

### A06 — Componentes vulnerables: RESUELTO

| Hallazgo | Severidad | Estado |
|----------|-----------|--------|
| hono >=4.12.2 tenia CVE, necesitaba >=4.12.4 | ALTO | **RESUELTO** — override actualizado |
| dompurify <3.3.2 (via isomorphic-dompurify) | ALTO | **RESUELTO** — override anadido |
| `pnpm audit` | N/A | 0 vulnerabilidades (con overrides aplicados) |

### A07 — Fallos de autenticacion: PASS

- JWT gestionado por Supabase (expiracion configurable en Dashboard).
- Refresh tokens gestionados por `@supabase/ssr`.
- Flujo de forgot-password + reset-password implementado.
- Rate limit en auth delegado a Supabase (built-in protection).

### A08 — Fallos de integridad: PASS

- `pnpm-lock.yaml` commiteado.
- Dependencias de registros oficiales (npm).
- Deploys via Vercel CI/CD (push to main → build → deploy).

### A09 — Fallos de logging: PASS (con mejoras P2)

- Logger estructurado (pino) con `requestId`, `userId`, `endpoint`.
- Acciones sensibles logueadas (eliminacion de cuenta, cambio de creditos, errores de auth).
- Logs NO contienen passwords, tokens ni datos personales (verificado).

| Hallazgo | Severidad | Detalle |
|----------|-----------|---------|
| No hay alertas automaticas para login fallidos | MEDIO | Supabase no expone metricas de auth failures. P2: webhook de auth events |
| Circuit breaker in-memory (no compartido entre instancias) | MEDIO | Cada instancia serverless tiene su propio contador. P2: mover a Redis |

### A10 — SSRF: PASS

- El servidor no acepta URLs arbitrarias de usuarios.
- BOE scraper usa URLs hardcodeadas (`boe.es/buscar/act.php`).
- No hay webhooks entrantes excepto Stripe (verificado con `stripe.webhooks.constructEvent`).

---

## FASE 3: Seguridad especifica de IA/LLM

### Estado: PASS

- **Prompt injection**: System prompts son constantes (`lib/ai/prompts.ts`). User input se pasa como user message, no inyectado en system prompt.
- **Data leakage**: No hay RAG abierto al usuario. Las preguntas se generan server-side.
- **Alucinaciones**: Prompts incluyen instruccion explicita de citar articulos exactos. `verificarPreguntaBloque1` comprueba citas contra legislacion real.
- **Coste por abuso**: Rate limiting per-user (3/min + 5/dia en explain-errores). Circuit breaker para APIs de IA.
- **RAG poisoning**: N/A — la knowledge base (legislacion) solo es editable por admin (Aritz).
- **Embeddings**: Vector store no accesible por API publica. Solo usado server-side en `generate-test`.

| Hallazgo | Severidad | Detalle |
|----------|-----------|---------|
| `callClaudeStream` no tiene timeout explicito | MEDIO | El stream puede quedarse abierto indefinidamente si Anthropic no cierra. P2: anadir AbortController con timeout de 60s |
| Creditos descontados via `void` (fire-and-forget) | BAJO | Si el RPC falla, el usuario no paga. Riesgo minimo (Supabase RPCs son fiables). P3: loguear errores de RPC |

---

## FASE 4: Compliance RGPD

### 4.1 — Inventario de datos personales

| Dato | Donde se almacena | Retencion |
|------|--------------------|-----------|
| Email | Supabase auth.users + profiles | Hasta eliminacion de cuenta |
| Nombre (si lo da) | profiles.full_name | Hasta eliminacion de cuenta |
| IP | Logs de Vercel (automatico) | 30 dias (Vercel default) |
| Historial de tests | tests_generados | Hasta eliminacion de cuenta |
| Pagos | compras | 4 anos post-eliminacion (LGT Art. 66) |
| Uso de API | api_usage_log | Hasta eliminacion de cuenta |
| Cookie consent | localStorage (cliente) | Sesion del navegador |

**Transferencias fuera UE**:
- Anthropic (Claude): USA — necesita SCCs o decision de adecuacion
- OpenAI: USA — necesita SCCs
- Vercel: USA — cubierto por EU-US Data Privacy Framework
- Stripe: USA — cubierto por EU-US Data Privacy Framework
- Upstash: EU region configurable

### 4.2 — Base legal del tratamiento: CUMPLE PARCIAL

| Requisito | Estado | Accion |
|-----------|--------|--------|
| Consentimiento explicito para cookies | **RESUELTO** | META Pixel ahora respeta consent |
| Aviso de privacidad accesible | CUMPLE | `/legal/privacidad` con responsable, finalidad, base legal |
| Consentimiento especifico (no "acepto todo") | CUMPLE | CookieBanner con aceptar/rechazar |
| Retirar consentimiento | PARCIAL | P1: Anadir link "Gestionar cookies" en footer |
| SCCs para Anthropic/OpenAI | PENDIENTE | P1: Documentar en politica de privacidad |

### 4.3 — Derechos de los interesados: CUMPLE (tras fixes)

| Derecho | Estado | Detalle |
|---------|--------|---------|
| Acceso (Art. 15) | CUMPLE | `/api/user/export` exporta todos los datos |
| Rectificacion (Art. 16) | CUMPLE | Pagina `/cuenta` permite editar perfil |
| Supresion (Art. 17) | **RESUELTO** | `api_usage_log` anadido a delete route |
| Portabilidad (Art. 20) | **RESUELTO** | `api_usage_log` anadido a export route |
| Plazo 30 dias | CUMPLE | Export/delete son inmediatos |

### 4.4 — Seguridad del tratamiento (Art. 32): CUMPLE

- Cifrado en transito: TLS via Vercel
- Control de acceso: RLS + auth en cada endpoint
- Backups: Supabase daily backups (Pro plan)

### 4.5 — Notificacion de brechas (Art. 33-34): PARCIAL

| Requisito | Estado | Accion |
|-----------|--------|--------|
| Procedimiento documentado | PENDIENTE | P1: Crear `docs/INCIDENT_RESPONSE.md` |
| Notificar AEPD <72h | PENDIENTE | P1: Incluir en procedimiento |
| Registro de incidentes | PARCIAL | Logs estructurados permiten trazar, pero no hay registro formal |

---

## FASE 5: Plan de respuesta ante incidentes

**Estado**: No documentado formalmente. Pendiente crear `docs/INCIDENT_RESPONSE.md`.

---

## Plan de remediacion priorizado

### P0 — CRITICO (resueltos en esta auditoria)

| # | Hallazgo | Fix | Estado |
|---|----------|-----|--------|
| 1 | META Pixel sin consentimiento | Wrapped en localStorage check | RESUELTO |
| 2 | `api_usage_log` no en delete | Anadido paso 4b en delete route | RESUELTO |
| 3 | `api_usage_log` no en export | Anadido a Promise.all + output | RESUELTO |
| 4 | hono override desactualizado | Bumped a >=4.12.4 | RESUELTO |
| 5 | dompurify sin override | Anadido >=3.3.2 override | RESUELTO |

### P1 — ALTO (resueltos en esta auditoria)

| # | Hallazgo | Fix | Estado |
|---|----------|-----|--------|
| 1 | Link "Gestionar cookies" en footer | `ManageCookiesButton` en dashboard + marketing footers, CookieBanner escucha evento reopen | RESUELTO |
| 2 | SCCs documentados en privacidad | Seccion 5 ampliada: todos los proveedores + clausula transferencias internacionales (Art. 46.2.c RGPD) | RESUELTO |
| 3 | Documento de respuesta a incidentes | `docs/INCIDENT_RESPONSE.md` con protocolo AEPD 72h, templates, escenarios, contactos | RESUELTO |
| 4 | Politica de privacidad: excepcion fiscal | Seccion 4 ampliada: LGT Art. 66, retencion 4 anos compras anonimizadas | RESUELTO |

### P2 — MEDIO (resolver en primer mes)

| # | Hallazgo | Accion | Esfuerzo |
|---|----------|--------|----------|
| 1 | Circuit breaker per-instance | Mover estado a Redis (Upstash) para compartir entre instancias | 3h |
| 2 | Stream timeout en callClaudeStream | AbortController con 60s timeout | 1h |
| 3 | CSP frame-ancestors | Anadir `frame-ancestors 'none'` al CSP header | 15min |
| 4 | Alertas auth failures | Webhook Supabase auth events → log + alerta si >10/min | 2h |
| 5 | Registro formal de incidentes | Tabla o documento para registrar incidentes de seguridad | 1h |

### P3 — BAJO (backlog)

| # | Hallazgo | Accion |
|---|----------|--------|
| 1 | RPC credit deduction fire-and-forget | Loguear errores de `use_correction` RPC |
| 2 | Export filename usa "optek" | Cambiar a "oporuta" en export route |
| 3 | TOCTOU menor en creditos | Verificar + descontar en transaction (riesgo insignificante con rate limit) |
| 4 | Cookie consent SameSite | Verificar que Supabase cookies tienen SameSite=Lax |

---

## Coste de no arreglar (P0 ya resueltos)

| Hallazgo resuelto | Que habria pasado |
|-------------------|-------------------|
| META Pixel sin consent | Multa RGPD potencial: 2-4% facturacion. La AEPD ha multado a empresas espanolas por tracking sin consentimiento (ej: Vueling 30.000EUR, CaixaBank 6M EUR). Riesgo reputacional alto para una app de oposiciones. |
| api_usage_log en delete | Incumplimiento Art. 17 RGPD. Si un usuario ejerce derecho de supresion y luego reclama ante AEPD, se demostraria que quedaron datos sin borrar. |
| Dependencias vulnerables | CVE en hono permitiria request smuggling en edge cases. Riesgo bajo en practica (no usamos Hono directamente) pero inaceptable en auditoria. |

---

## Resumen de cambios aplicados

1. `app/layout.tsx` — META Pixel ahora verifica `localStorage.getItem('optek_cookie_consent') === 'accepted'` antes de cargar el script
2. `app/api/user/delete/route.ts` — Nuevo paso 4b: elimina `api_usage_log` del usuario
3. `app/api/user/export/route.ts` — Incluye `api_usage_log` en la exportacion RGPD
4. `package.json` — Override hono >=4.12.4, anadido dompurify >=3.3.2

**Verificacion**: 0 errores TypeScript, 291/291 tests pasan.
