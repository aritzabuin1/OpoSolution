import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { CookieBanner } from '@/components/shared/CookieBanner'
import { Toaster } from '@/components/ui/sonner'
import { JsonLd } from '@/components/shared/JsonLd'
import './globals.css'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

// §2.17.4 — Organization schema (afecta a todas las páginas)
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'OpoRuta',
  url: APP_URL,
  description:
    'Plataforma de IA para preparar oposiciones al Cuerpo General de la Administración del Estado. Tests verificados con citas legales reales, Radar del Tribunal y simulacros oficiales INAP.',
  sameAs: [] as string[], // Añadir URLs de redes sociales cuando existan
}

// §2.17.5 — WebSite schema con SearchAction (sitelinks search box)
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'OpoRuta',
  url: APP_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${APP_URL}/tests?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'OpoRuta — El camino más corto hacia el aprobado',
  description:
    'Prepara tu oposición con IA verificada. Tests personalizados, el Radar del Tribunal y simulacros INAP. Cada cita legal comprobada al artículo exacto.',
  manifest: '/manifest.json',
  // PWA meta tags (0.13.5)
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'OpoRuta',
  },
  formatDetection: {
    telephone: false,
  },
  // §2.15.2 — LLMs.txt para indexación por modelos de lenguaje
  alternates: {
    types: {
      'text/plain': `${APP_URL}/llms.txt`,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1B4F72',
}

// META Pixel ID (§1.21.1) — solo activo si env var configurada
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        {/* §2.17.4-5 — Organization + WebSite JSON-LD (presentes en todas las páginas) */}
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />

        {children}
        <CookieBanner />
        <Toaster richColors position="top-right" />

        {/* META Pixel (§1.21.1) — solo se carga si el usuario aceptó cookies (RGPD Art. 7) */}
        {META_PIXEL_ID && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              (function(){
                if(typeof window==='undefined')return;
                var consent=localStorage.getItem('optek_cookie_consent');
                if(consent!=='accepted')return;
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${META_PIXEL_ID}');
                fbq('track', 'PageView');
              })();
            `}
          </Script>
        )}
      </body>
    </html>
  )
}
