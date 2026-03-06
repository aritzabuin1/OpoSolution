# Plan de Respuesta ante Incidentes de Seguridad - OpoRuta

> Responsable: Aritz Abuin (aritzabuin1@gmail.com)
> Ultima actualizacion: marzo 2026

---

## 1. Definicion de incidente

Cualquier evento que comprometa la confidencialidad, integridad o disponibilidad de:
- Datos personales de usuarios (email, historial de tests, pagos)
- Credenciales de acceso a servicios (API keys, tokens, passwords)
- Disponibilidad del servicio (caida prolongada >4h)

## 2. Clasificacion de severidad

| Nivel | Descripcion | Ejemplos | Plazo respuesta |
|-------|-------------|----------|-----------------|
| CRITICO | Datos personales expuestos o acceso no autorizado confirmado | API key filtrada en repo publico, dump de BD, acceso admin comprometido | Inmediato (<1h) |
| ALTO | Vulnerabilidad explotable o servicio caido | XSS activo, endpoint sin auth, downtime >4h | <4h |
| MEDIO | Vulnerabilidad potencial sin explotacion confirmada | Dependencia con CVE, config insegura detectada en auditoria | <24h |
| BAJO | Mejora de seguridad, no explotable actualmente | Header faltante, log verbose, mejora de rate limiting | <1 semana |

## 3. Protocolo de respuesta (CRITICO/ALTO)

### Fase 1: Contener (primeros 30 minutos)

1. **Identificar el alcance**: Que datos/sistemas estan afectados
2. **Contener la brecha**:
   - API key filtrada → revocar inmediatamente en el panel del proveedor
   - Endpoint vulnerable → desplegar hotfix o desactivar ruta en Vercel
   - Acceso comprometido → invalidar todas las sesiones en Supabase Dashboard
3. **Preservar evidencia**: Guardar logs, capturas, timestamps antes de remediar

### Fase 2: Evaluar (primeras 2 horas)

1. **Determinar datos afectados**: Que datos personales se han visto comprometidos
2. **Numero de usuarios afectados**: Query en Supabase para cuantificar
3. **Riesgo para los derechos**: Evaluar si hay riesgo para derechos y libertades de los interesados
4. **Documentar todo** en un incidente log (ver seccion 6)

### Fase 3: Notificar (plazo legal: 72 horas)

#### 3a. Notificacion a la AEPD (obligatoria si hay riesgo)

**Plazo**: Maximo 72 horas desde que se tiene conocimiento de la brecha (Art. 33 RGPD).

**Canal**: Sede electronica de la AEPD → https://sedeagpd.gob.es
- Formulario: "Comunicacion de brechas de datos personales"
- Requiere certificado digital o Cl@ve

**Contenido minimo de la notificacion**:
- Naturaleza de la brecha (confidencialidad/integridad/disponibilidad)
- Categorias y numero aproximado de interesados afectados
- Categorias y numero aproximado de registros afectados
- Datos de contacto del responsable
- Consecuencias probables
- Medidas adoptadas o propuestas para remediar

#### 3b. Notificacion a los usuarios (si riesgo alto)

Si la brecha supone un "alto riesgo" para derechos y libertades (Art. 34 RGPD):

- Notificar por email a cada usuario afectado
- Usar lenguaje claro y sencillo
- Template:

```
Asunto: Aviso de seguridad importante sobre tu cuenta en OpoRuta

Estimado/a usuario/a,

Te escribimos para informarte de un incidente de seguridad detectado el [FECHA]
que ha podido afectar a [DESCRIPCION DE DATOS AFECTADOS].

Que ha ocurrido:
[Descripcion breve y honesta]

Que datos se han visto afectados:
[Lista concreta]

Que hemos hecho:
[Medidas adoptadas]

Que puedes hacer tu:
- Cambia tu contrasena en oporuta.es/cuenta
- [Otras recomendaciones especificas]

Lamentamos profundamente este incidente. Si tienes cualquier pregunta,
contacta con nosotros en privacidad@oporuta.es.

Atentamente,
Aritz Abuin
OpoRuta
```

### Fase 4: Remediar

1. **Aplicar fix definitivo** (no solo parche temporal)
2. **Verificar** que la vulnerabilidad esta cerrada
3. **Monitorizar** durante 48h para confirmar que no hay reincidencia
4. **Actualizar** dependencias, credenciales o configuraciones afectadas

### Fase 5: Post-mortem

Dentro de los 7 dias siguientes al cierre del incidente:

1. **Timeline detallado**: Que paso, cuando, como se detecto
2. **Causa raiz**: No solo el sintoma, sino por que existia la vulnerabilidad
3. **Que funciono**: Que parte del protocolo funciono bien
4. **Que fallo**: Que se puede mejorar para la proxima vez
5. **Acciones preventivas**: Cambios concretos para evitar que se repita
6. **Actualizar este documento** si el protocolo necesita mejoras

## 4. Escenarios especificos

### API key filtrada en repositorio

1. **Revocar** la key inmediatamente en el panel del proveedor (Anthropic, OpenAI, Stripe, Supabase, Upstash, Resend)
2. **Generar** nueva key y actualizar en Vercel Dashboard → Environment Variables
3. **Redesplegar** en Vercel para que tome las nuevas variables
4. **Auditar uso**: Revisar logs del proveedor para detectar uso no autorizado
5. Si la key permitia acceso a datos de usuario → NOTIFICAR AEPD
6. Si estaba en historial git: ejecutar `git filter-repo` o BFG Repo Cleaner

### Acceso no autorizado a Supabase

1. **Revocar** todas las sesiones: Supabase Dashboard → Authentication → Users → Revoke all
2. **Rotar** `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_ANON_KEY`
3. **Verificar RLS**: Comprobar que todas las politicas estan activas
4. **Revisar logs** de Supabase para identificar queries sospechosas
5. **Notificar** a usuarios afectados + AEPD

### Caida del servicio (>4h)

1. **Verificar** estado de Vercel (vercel-status.com) y Supabase (status.supabase.com)
2. Si es problema nuestro: **diagnosticar** y aplicar fix o rollback
3. **Comunicar** en landing page si la caida es prolongada (>8h)
4. **Post-mortem** obligatorio si la caida supera 24h

## 5. Contactos de emergencia

| Servicio | Como contactar | Que pueden hacer |
|----------|----------------|-----------------|
| Vercel | support@vercel.com / Dashboard | Rollback deploys, logs |
| Supabase | support@supabase.io / Dashboard | Pausar proyecto, backups, RLS |
| Stripe | dashboard.stripe.com | Pausar pagos, revocar keys |
| Anthropic | console.anthropic.com | Revocar API keys |
| OpenAI | platform.openai.com | Revocar API keys |
| Upstash | console.upstash.com | Flush Redis, revocar tokens |
| Resend | resend.com/api-keys | Revocar API keys |
| AEPD | sedeagpd.gob.es | Notificacion brechas |

## 6. Registro de incidentes

Cada incidente se documenta en `docs/incidents/YYYY-MM-DD-descripcion.md` con:

```markdown
# Incidente: [Titulo breve]
- Fecha deteccion: YYYY-MM-DD HH:MM UTC
- Fecha resolucion: YYYY-MM-DD HH:MM UTC
- Severidad: CRITICO/ALTO/MEDIO/BAJO
- Datos afectados: [descripcion]
- Usuarios afectados: [numero]
- Notificado a AEPD: Si/No (motivo si No)
- Notificado a usuarios: Si/No
- Causa raiz: [descripcion]
- Acciones correctivas: [lista]
- Acciones preventivas: [lista]
```

## 7. Revision periodica

- Este documento se revisa cada 6 meses o tras cada incidente
- Proxima revision: septiembre 2026
