import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Términos y Condiciones — OPTEK',
  description: 'Términos y condiciones de uso del servicio OPTEK.',
}

export default function TerminosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <div className="mb-8">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Volver al inicio
        </Link>
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-2">Términos y Condiciones</h1>
      <p className="text-sm text-muted-foreground mb-10">
        Última actualización: febrero de 2026
      </p>

      <div className="space-y-8 text-foreground">

        <section>
          <h2 className="text-xl font-semibold mb-3">1. Descripción del servicio</h2>
          <p className="text-muted-foreground leading-relaxed">
            OPTEK es una plataforma de preparación de oposiciones que utiliza inteligencia
            artificial para generar tests personalizados, corregir desarrollos escritos y
            proporcionar simulacros de examen. El servicio incluye un motor de verificación
            determinista que valida las citas legales generadas por la IA contra bases de
            datos de legislación real.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Limitaciones importantes</h2>
          <div className="space-y-3 text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">La IA puede equivocarse.</strong> Aunque
              OPTEK incorpora verificación determinista de citas legales, el contenido
              generado por inteligencia artificial puede contener errores. No utilices OPTEK
              como única fuente de estudio ni como sustituto de material oficial o asesoría
              legal especializada.
            </p>
            <p>
              <strong className="text-foreground">No es asesoría jurídica.</strong> El
              contenido de OPTEK es material de estudio para preparación de oposiciones. No
              constituye asesoría legal, laboral ni de ningún otro tipo.
            </p>
            <p>
              <strong className="text-foreground">Sin garantía de aprobado.</strong> OPTEK
              es una herramienta de entrenamiento. El resultado final de los exámenes depende
              de múltiples factores fuera de nuestro control.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Uso aceptable</h2>
          <div className="text-muted-foreground leading-relaxed space-y-2">
            <p>El usuario se compromete a:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>No compartir su cuenta con terceros.</li>
              <li>No intentar vulnerar la seguridad del sistema.</li>
              <li>No usar el servicio para fines contrarios a la ley.</li>
              <li>No introducir datos personales de terceros sin su consentimiento.</li>
              <li>No intentar extraer, copiar o redistribuir el contenido generado de forma masiva.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Planes y pagos</h2>
          <div className="text-muted-foreground leading-relaxed space-y-2">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Plan gratuito:</strong> 5 tests/mes y 2
                correcciones de desarrollo. Sin tarjeta de crédito requerida.
              </li>
              <li>
                <strong className="text-foreground">Plan por tema:</strong> Pago único por
                tema. Acceso durante 6 meses desde la fecha de compra.
              </li>
              <li>
                <strong className="text-foreground">Plan Premium:</strong> Suscripción mensual.
                Renovación automática hasta cancelación.
              </li>
            </ul>
            <p className="mt-3">
              Todos los precios incluyen IVA cuando corresponda. Los pagos se procesan de
              forma segura a través de Stripe.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Política de reembolso</h2>
          <p className="text-muted-foreground leading-relaxed">
            Dado que el servicio es digital y se consume en el momento de la entrega,
            no se ofrecen reembolsos salvo error técnico imputable a OPTEK. En caso de
            problema, contáctanos en{' '}
            <a href="mailto:soporte@optek.es" className="text-primary hover:underline">
              soporte@optek.es
            </a>{' '}
            y lo resolveremos. Para el Plan Premium, puedes cancelar en cualquier momento;
            el acceso permanece activo hasta el final del período pagado.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Cancelación de cuenta</h2>
          <p className="text-muted-foreground leading-relaxed">
            Puedes eliminar tu cuenta en cualquier momento desde Cuenta → Eliminar cuenta.
            Tus datos serán eliminados conforme a nuestra{' '}
            <Link href="/legal/privacidad" className="text-primary hover:underline">
              política de privacidad
            </Link>
            . Las compras realizadas no son reembolsables salvo causa imputable a OPTEK.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Propiedad intelectual</h2>
          <p className="text-muted-foreground leading-relaxed">
            El contenido generado por OPTEK (tests, correcciones, explicaciones) es para uso
            personal del usuario. Queda prohibida su reproducción o distribución comercial.
            La legislación reproducida en el servicio es de dominio público. Los textos
            propios de OPTEK (metodología, interfaz, código) son propiedad del titular del
            servicio.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Modificaciones del servicio</h2>
          <p className="text-muted-foreground leading-relaxed">
            OPTEK se reserva el derecho de modificar los términos del servicio con un aviso
            previo de 15 días por email. El uso continuado tras la notificación implica
            aceptación de los nuevos términos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Ley aplicable y jurisdicción</h2>
          <p className="text-muted-foreground leading-relaxed">
            Estos términos se rigen por la legislación española. Para cualquier controversia,
            las partes se someten a los juzgados y tribunales del domicilio del titular del
            servicio, sin perjuicio de los derechos que como consumidor te correspondan
            conforme al Real Decreto Legislativo 1/2007.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Contacto</h2>
          <p className="text-muted-foreground leading-relaxed">
            Para cualquier consulta sobre estos términos, escríbenos a{' '}
            <a href="mailto:soporte@optek.es" className="text-primary hover:underline">
              soporte@optek.es
            </a>.
          </p>
        </section>

      </div>
    </div>
  )
}
