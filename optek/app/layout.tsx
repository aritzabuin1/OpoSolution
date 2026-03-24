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
  sameAs: ['https://www.linkedin.com/in/aritz-abuin/'],
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
  metadataBase: new URL(APP_URL),
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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
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
  twitter: {
    card: 'summary_large_image',
    title: 'OpoRuta — Prepara tu oposición de Auxiliar (C2) y Administrativo (C1) con IA verificada',
    description: 'Tests verificados, simulacros INAP oficiales y Radar del Tribunal para C1 y C2. Empieza gratis.',
  },
  other: {
    'google-site-verification': process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? '',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1B4F72',
}

// META Pixel ID (§1.21.1) — solo activo si env var configurada
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      {/* Google Tag Manager — solo si el usuario aceptó cookies (RGPD Art. 7) */}
      {GTM_ID && (
        <Script id="gtm-script" strategy="afterInteractive">
          {`
            (function(){
              if(typeof window==='undefined')return;
              var consent=localStorage.getItem('oporuta_cookie_consent');
              if(consent!=='accepted')return;
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');
            })();
          `}
        </Script>
      )}
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        {/* GTM noscript fallback */}
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
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
                var consent=localStorage.getItem('oporuta_cookie_consent');
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
