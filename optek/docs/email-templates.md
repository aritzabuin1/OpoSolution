# OpoRuta Email Templates

Templates para Supabase Dashboard > Authentication > Email Templates.

## Brand guidelines para emails

- **Fondo body**: `#F3F4F6` (gray-100)
- **Card**: `#FFFFFF` con `border-radius: 12px` y sombra sutil
- **Header**: gradiente `#1B4F72` -> `#154360` (navy)
- **Acento**: `#F39C12` (dorado) — para CTA y detalles
- **Texto principal**: `#1F2937` (gray-800)
- **Texto secundario**: `#6B7280` (gray-500)
- **CTA button**: fondo `#F39C12`, texto `#1B4F72`, bold
- **Font stack**: system-ui, -apple-system, sans-serif (no cargar webfonts en email)

---

## 1. Confirm signup

**Subject:** `Confirma tu email y empieza a entrenar`

**HTML body:**

```html
<div style="background-color:#F3F4F6;padding:40px 16px;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:480px;margin:0 auto;">

    <!-- Header con marca -->
    <div style="background:linear-gradient(135deg,#1B4F72,#154360);border-radius:12px 12px 0 0;padding:32px 24px;text-align:center;">
      <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:8px;padding:8px 16px;margin-bottom:12px;">
        <span style="color:#FFFFFF;font-size:24px;font-weight:800;letter-spacing:-1px;">OR</span>
        <span style="display:inline-block;width:6px;height:6px;background:#F39C12;border-radius:50%;vertical-align:top;margin-left:1px;"></span>
      </div>
      <h1 style="color:#FFFFFF;font-size:22px;font-weight:700;margin:8px 0 4px;">OpoRuta</h1>
      <p style="color:#A9CCE3;font-size:13px;margin:0;">El camino mas corto hacia el aprobado</p>
    </div>

    <!-- Cuerpo -->
    <div style="background:#FFFFFF;padding:32px 24px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      <h2 style="color:#1F2937;font-size:20px;font-weight:700;margin:0 0 16px;">Ya casi estas dentro</h2>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 8px;">
        Has dado el primer paso. Ahora confirma tu email para acceder a:
      </p>
      <ul style="color:#374151;font-size:15px;line-height:1.8;padding-left:20px;margin:0 0 24px;">
        <li><strong>Tests con IA</strong> que citan el articulo exacto</li>
        <li><strong>Radar del Tribunal</strong> — que articulos caen de verdad</li>
        <li><strong>Simulacros INAP</strong> con cronometro y penalizacion real</li>
        <li><strong>Analisis de errores</strong> que te explica por que fallaste</li>
      </ul>

      <!-- CTA -->
      <div style="text-align:center;margin:24px 0;">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#F39C12;color:#1B4F72;font-size:16px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;box-shadow:0 2px 4px rgba(243,156,18,0.3);">
          Confirmar mi cuenta
        </a>
      </div>

      <!-- Urgencia sutil -->
      <div style="background:#FEF3C7;border-radius:8px;padding:12px 16px;margin:16px 0 0;">
        <p style="color:#92400E;font-size:13px;margin:0;text-align:center;">
          Este enlace caduca en 24 horas
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 16px;">
      <p style="color:#9CA3AF;font-size:12px;margin:0;">
        Si no creaste esta cuenta, ignora este email.
      </p>
      <p style="color:#9CA3AF;font-size:12px;margin:8px 0 0;">
        OpoRuta · oporuta.es
      </p>
    </div>

  </div>
</div>
```

---

## 2. Reset password

**Subject:** `Recupera tu acceso a OpoRuta`

**HTML body:**

```html
<div style="background-color:#F3F4F6;padding:40px 16px;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:480px;margin:0 auto;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1B4F72,#154360);border-radius:12px 12px 0 0;padding:32px 24px;text-align:center;">
      <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:8px;padding:8px 16px;margin-bottom:12px;">
        <span style="color:#FFFFFF;font-size:24px;font-weight:800;letter-spacing:-1px;">OR</span>
        <span style="display:inline-block;width:6px;height:6px;background:#F39C12;border-radius:50%;vertical-align:top;margin-left:1px;"></span>
      </div>
      <h1 style="color:#FFFFFF;font-size:22px;font-weight:700;margin:8px 0 4px;">OpoRuta</h1>
    </div>

    <!-- Cuerpo -->
    <div style="background:#FFFFFF;padding:32px 24px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      <h2 style="color:#1F2937;font-size:20px;font-weight:700;margin:0 0 16px;">Restablece tu contrasena</h2>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Has solicitado cambiar tu contrasena. Haz clic abajo para elegir una nueva y seguir entrenando.
      </p>

      <div style="text-align:center;margin:24px 0;">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#F39C12;color:#1B4F72;font-size:16px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;box-shadow:0 2px 4px rgba(243,156,18,0.3);">
          Elegir nueva contrasena
        </a>
      </div>

      <div style="background:#FEF3C7;border-radius:8px;padding:12px 16px;margin:16px 0 0;">
        <p style="color:#92400E;font-size:13px;margin:0;text-align:center;">
          Este enlace caduca en 1 hora
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 16px;">
      <p style="color:#9CA3AF;font-size:12px;margin:0;">
        Si no solicitaste esto, ignora este email — tu cuenta sigue segura.
      </p>
      <p style="color:#9CA3AF;font-size:12px;margin:8px 0 0;">
        OpoRuta · oporuta.es
      </p>
    </div>

  </div>
</div>
```

---

## 3. Magic link

**Subject:** `Tu enlace de acceso a OpoRuta`

**HTML body:**

```html
<div style="background-color:#F3F4F6;padding:40px 16px;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:480px;margin:0 auto;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1B4F72,#154360);border-radius:12px 12px 0 0;padding:32px 24px;text-align:center;">
      <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:8px;padding:8px 16px;margin-bottom:12px;">
        <span style="color:#FFFFFF;font-size:24px;font-weight:800;letter-spacing:-1px;">OR</span>
        <span style="display:inline-block;width:6px;height:6px;background:#F39C12;border-radius:50%;vertical-align:top;margin-left:1px;"></span>
      </div>
      <h1 style="color:#FFFFFF;font-size:22px;font-weight:700;margin:8px 0 4px;">OpoRuta</h1>
    </div>

    <!-- Cuerpo -->
    <div style="background:#FFFFFF;padding:32px 24px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      <h2 style="color:#1F2937;font-size:20px;font-weight:700;margin:0 0 16px;">Accede a tu cuenta</h2>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Haz clic abajo para entrar directamente. Sin contrasena, sin complicaciones.
      </p>

      <div style="text-align:center;margin:24px 0;">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#F39C12;color:#1B4F72;font-size:16px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;box-shadow:0 2px 4px rgba(243,156,18,0.3);">
          Entrar a OpoRuta
        </a>
      </div>

      <div style="background:#FEF3C7;border-radius:8px;padding:12px 16px;margin:16px 0 0;">
        <p style="color:#92400E;font-size:13px;margin:0;text-align:center;">
          Este enlace caduca en 10 minutos y solo se puede usar una vez
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 16px;">
      <p style="color:#9CA3AF;font-size:12px;margin:0;">
        Si no solicitaste este enlace, ignora este email.
      </p>
      <p style="color:#9CA3AF;font-size:12px;margin:8px 0 0;">
        OpoRuta · oporuta.es
      </p>
    </div>

  </div>
</div>
```

---

## Notas de implementacion

1. `{{ .ConfirmationURL }}` es la variable de Supabase. No cambiarla.
2. Supabase Email Templates NO soportan CSS externo ni `<style>` tags. Todo inline.
3. No usar emojis en subjects — algunos clientes de email los filtran como spam.
4. Los `linear-gradient` en email funcionan en Gmail, Apple Mail y Outlook web.
   En Outlook desktop (Windows) se degrada a color solido — aceptable.
5. Sender recomendado: `hola@oporuta.es` (Sender name: `OpoRuta`)
