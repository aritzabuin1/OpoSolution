import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidad — OpoRuta',
  description: 'Información sobre cómo OpoRuta trata tus datos personales conforme al RGPD.',
}

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <div className="mb-8">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Volver al inicio
        </Link>
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-2">Política de Privacidad</h1>
      <p className="text-sm text-muted-foreground mb-10">
        Última actualización: 14 de marzo de 2026
      </p>

      <div className="prose prose-sm max-w-none space-y-8 text-foreground">

        <section>
          <h2 className="text-xl font-semibold mb-3">1. Responsable del tratamiento</h2>
          <p className="text-muted-foreground leading-relaxed">
            El responsable del tratamiento de sus datos personales es el titular del servicio
            OpoRuta, con domicilio en España. Para cualquier consulta relativa a privacidad,
            puede contactar en:{' '}
            <a href="mailto:privacidad@oporuta.es" className="text-primary hover:underline">
              privacidad@oporuta.es
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Datos que recogemos y finalidad</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>Recogemos los siguientes datos y los utilizamos para las siguientes finalidades:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Email y contraseña:</strong> Creación y
                gestión de tu cuenta de usuario. Base legal: ejecución de contrato (Art. 6.1.b
                RGPD).
              </li>
              <li>
                <strong className="text-foreground">Nombre (opcional):</strong> Personalización
                de la experiencia. Base legal: consentimiento (Art. 6.1.a RGPD).
              </li>
              <li>
                <strong className="text-foreground">Textos de desarrollos:</strong> Corrección
                mediante IA. Los textos son anonimizados antes de enviarse a terceros (ver §5).
                Base legal: ejecución de contrato (Art. 6.1.b RGPD).
              </li>
              <li>
                <strong className="text-foreground">Datos de uso:</strong> Historial de tests,
                puntuaciones, temas estudiados. Se usan para personalizar tu experiencia y
                mostrarte estadísticas. Base legal: ejecución de contrato (Art. 6.1.b RGPD).
              </li>
              <li>
                <strong className="text-foreground">Datos de pago:</strong> Gestionados
                íntegramente por Stripe. OpoRuta no almacena números de tarjeta ni datos de pago.
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Base legal del tratamiento</h2>
          <p className="text-muted-foreground leading-relaxed">
            El tratamiento de tus datos se basa en el Art. 6.1 del Reglamento General de
            Protección de Datos (RGPD/GDPR): (a) consentimiento para datos opcionales, (b)
            ejecución del contrato de servicio para datos necesarios para el funcionamiento de
            OpoRuta, y (f) interés legítimo para datos de seguridad y prevención de fraude.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Conservación de datos</h2>
          <div className="text-muted-foreground leading-relaxed space-y-3">
            <p>
              Conservamos tus datos mientras tu cuenta esté activa. Si solicitas la eliminación
              de tu cuenta, tus datos personales serán eliminados en un plazo máximo de 30 días,
              salvo obligación legal de conservación.
            </p>
            <p>
              <strong className="text-foreground">Excepción fiscal:</strong> Los registros de
              compras se anonimizan (se elimina tu identificación) pero se conservan durante
              4 años para cumplir con la obligación de registro de transacciones establecida en
              la Ley 58/2003, de 17 de diciembre, General Tributaria (Art. 66). Transcurrido
              este plazo, se eliminan definitivamente.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Terceros con acceso a datos y transferencias internacionales</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>OpoRuta comparte datos con los siguientes terceros proveedores:</p>
            <ul className="list-disc pl-5 space-y-3">
              <li>
                <strong className="text-foreground">Supabase</strong> (Supabase Inc., EE.UU.):
                Base de datos y autenticación. Datos almacenados en región EU-West. Consulta su{' '}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  política de privacidad
                </a>.
              </li>
              <li>
                <strong className="text-foreground">Anthropic</strong> (Anthropic PBC, EE.UU.):
                Procesamiento de IA para generación de tests y corrección de desarrollos.{' '}
                <strong>Importante:</strong> Los textos de los usuarios son anonimizados y eliminados
                de cualquier PII antes de enviarse a Anthropic. No se envían nombres, emails ni
                datos identificativos.
              </li>
              <li>
                <strong className="text-foreground">OpenAI</strong> (OpenAI LLC, EE.UU.):
                Generación de retos diarios y procesamiento auxiliar de IA. Los datos enviados
                no contienen información personal identificable.
              </li>
              <li>
                <strong className="text-foreground">Stripe</strong> (Stripe Inc., EE.UU.):
                Procesamiento de pagos. Consulta su{' '}
                <a href="https://stripe.com/es/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  política de privacidad
                </a>.
              </li>
              <li>
                <strong className="text-foreground">Vercel</strong> (Vercel Inc., EE.UU.):
                Alojamiento web y distribución de contenido.
              </li>
              <li>
                <strong className="text-foreground">Resend</strong> (Resend Inc., EE.UU.):
                Envío de emails transaccionales (confirmación de cuenta, alertas).
              </li>
              <li>
                <strong className="text-foreground">Meta Platforms</strong> (Meta Platforms Ireland Ltd., Irlanda / EE.UU.):
                Medición de conversiones publicitarias mediante Meta Pixel.{' '}
                <strong>Solo se activa si aceptas cookies opcionales</strong> en el banner de consentimiento.
                Datos tratados: páginas visitadas y eventos de conversión (registro, compra).
                No se envían nombres, emails ni datos personales directamente.
                Amparado por el EU-US Data Privacy Framework. Consulta su{' '}
                <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  política de privacidad
                </a>.
              </li>
            </ul>
            <p>
              <strong className="text-foreground">Transferencias internacionales:</strong> Algunos
              de nuestros proveedores están ubicados en Estados Unidos. Estas transferencias se
              realizan al amparo del EU-US Data Privacy Framework (Stripe, Vercel) o mediante
              Cláusulas Contractuales Tipo (SCCs) aprobadas por la Comisión Europea (Art. 46.2.c
              RGPD) para los proveedores de IA (Anthropic, OpenAI). En todos los casos, los datos
              personales enviados se minimizan al máximo necesario y se anonimizan cuando es
              técnicamente posible.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Tus derechos</h2>
          <div className="text-muted-foreground leading-relaxed space-y-2">
            <p>Conforme al RGPD, tienes derecho a:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">Acceso:</strong> Solicitar una copia de tus datos personales.</li>
              <li><strong className="text-foreground">Rectificación:</strong> Corregir datos inexactos.</li>
              <li><strong className="text-foreground">Supresión:</strong> Solicitar la eliminación de tus datos («derecho al olvido»).</li>
              <li><strong className="text-foreground">Portabilidad:</strong> Recibir tus datos en formato estructurado (JSON). Disponible desde tu cuenta → Exportar datos.</li>
              <li><strong className="text-foreground">Oposición y limitación:</strong> Oponerte al tratamiento o solicitar su limitación.</li>
            </ul>
            <p className="mt-3">
              Para ejercer tus derechos, escríbenos a{' '}
              <a href="mailto:privacidad@oporuta.es" className="text-primary hover:underline">
                privacidad@oporuta.es
              </a>
              . Responderemos en un plazo máximo de 30 días. También puedes presentar una
              reclamación ante la Agencia Española de Protección de Datos (AEPD) en{' '}
              <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                aepd.es
              </a>.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            Utilizamos cookies técnicas necesarias para el funcionamiento del servicio
            (gestión de sesión). Para más información, consulta nuestra{' '}
            <Link href="/legal/cookies" className="text-primary hover:underline">
              política de cookies
            </Link>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Contacto</h2>
          <p className="text-muted-foreground leading-relaxed">
            Para cualquier consulta sobre privacidad o protección de datos, contáctanos en{' '}
            <a href="mailto:privacidad@oporuta.es" className="text-primary hover:underline">
              privacidad@oporuta.es
            </a>.
          </p>
        </section>

      </div>
    </div>
  )
}
