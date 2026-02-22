import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Cookies — OPTEK',
  description: 'Información sobre las cookies que utiliza OPTEK.',
}

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <div className="mb-8">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Volver al inicio
        </Link>
      </div>

      <h1 className="text-3xl font-bold tracking-tight mb-2">Política de Cookies</h1>
      <p className="text-sm text-muted-foreground mb-10">
        Última actualización: febrero de 2026
      </p>

      <div className="space-y-8 text-foreground">

        <section>
          <h2 className="text-xl font-semibold mb-3">¿Qué son las cookies?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo
            cuando visitas un sitio web. Permiten que el sitio recuerde tus preferencias y
            mantenga tu sesión activa entre visitas.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Cookies que utilizamos</h2>
          <div className="space-y-4">

            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-1">Cookies técnicas (necesarias)</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Estas cookies son estrictamente necesarias para el funcionamiento del servicio.
                Sin ellas, no es posible mantener la sesión iniciada ni acceder a las funciones
                de la plataforma. No requieren consentimiento.
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1 pr-4 font-medium">Cookie</th>
                      <th className="text-left py-1 pr-4 font-medium">Finalidad</th>
                      <th className="text-left py-1 font-medium">Duración</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b">
                      <td className="py-1.5 pr-4 font-mono">sb-*</td>
                      <td className="py-1.5 pr-4">Sesión de autenticación Supabase</td>
                      <td className="py-1.5">7 días</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5 pr-4 font-mono">optek_onboarded</td>
                      <td className="py-1.5 pr-4">Estado de onboarding completado</td>
                      <td className="py-1.5">1 año</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="font-semibold mb-1">Cookies de preferencias</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Utilizamos localStorage (no cookies) para recordar tu elección de consentimiento
                de cookies. No se transmite al servidor.
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1 pr-4 font-medium">Clave</th>
                      <th className="text-left py-1 pr-4 font-medium">Finalidad</th>
                      <th className="text-left py-1 font-medium">Duración</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr>
                      <td className="py-1.5 pr-4 font-mono">optek_cookie_consent</td>
                      <td className="py-1.5 pr-4">Tu elección sobre cookies</td>
                      <td className="py-1.5">Permanente (localStorage)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border p-4 bg-muted/30">
              <h3 className="font-semibold mb-1">Cookies de analítica y marketing</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Actualmente <strong>no utilizamos</strong> cookies de analítica ni de marketing
                de terceros. Si en el futuro se implementan, actualizaremos esta política y te
                pediremos consentimiento explícito.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Gestión de cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            Puedes gestionar o eliminar las cookies desde la configuración de tu navegador.
            Ten en cuenta que deshabilitar las cookies técnicas puede impedir el correcto
            funcionamiento de OPTEK (no podrás mantener la sesión iniciada).
          </p>
          <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Chrome</a></li>
            <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-que-los-sitios-we" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Firefox</a></li>
            <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Safari</a></li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Más información</h2>
          <p className="text-muted-foreground leading-relaxed">
            Para más información sobre cómo tratamos tus datos, consulta nuestra{' '}
            <Link href="/legal/privacidad" className="text-primary hover:underline">
              política de privacidad
            </Link>
            . Para cualquier duda, escríbenos a{' '}
            <a href="mailto:privacidad@optek.es" className="text-primary hover:underline">
              privacidad@optek.es
            </a>.
          </p>
        </section>

      </div>
    </div>
  )
}
