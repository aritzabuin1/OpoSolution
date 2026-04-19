import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { CookieBanner } from '@/components/shared/CookieBanner'
import { Toaster } from '@/components/ui/sonner'
import { GeoTracker } from '@/components/shared/GeoTracker'
import { JsonLd } from '@/components/shared/JsonLd'
import './globals.css'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

// §2.17.4 — Organization schema (afecta a todas las páginas)
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'OpoRuta',
  url: APP_URL,
  logo: `${APP_URL}/icon.png`,
  description:
    'Plataforma de IA para preparar oposiciones en España. Tests verificados contra BOE, simulacros con exámenes reales, Radar del Tribunal y Tutor IA. AGE, Correos, Justicia, Hacienda, Penitenciarias y Seguridad. 18.000+ plazas.',
  sameAs: [
    'https://www.linkedin.com/in/aritz-abuin/',
    'https://www.linkedin.com/company/oporuta/',
    'https://github.com/aritzabuin1',
  ],
  founder: {
    '@type': 'Person',
    name: 'Aritz Abuin',
    url: 'https://aritz-abuin-ia.vercel.app',
    sameAs: ['https://www.linkedin.com/in/aritz-abuin/'],
    jobTitle: 'AI Solutions Architect',
  },
  foundingDate: '2025-11-01',
  areaServed: { '@type': 'Country', name: 'Spain' },
  knowsLanguage: ['es-ES'],
  slogan: 'El camino más corto hacia el aprobado',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'hola@oporuta.es',
    contactType: 'customer support',
    availableLanguage: 'Spanish',
  },
}

// SoftwareApplication schema — LLM indexing + rich snippets
const softwareAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'OpoRuta',
  url: APP_URL,
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  offers: [
    {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      description: 'Plan gratuito: 1 test por tema + 3 simulacros + 2 sesiones Tutor IA',
    },
    {
      '@type': 'Offer',
      price: '49.99',
      priceCurrency: 'EUR',
      description: 'Pack individual: acceso ilimitado a una oposición, pago único',
    },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '127',
    bestRating: '5',
  },
  description:
    'Plataforma de preparación de oposiciones con IA. Tests con citas legales verificadas contra BOE, simulacros con exámenes reales INAP/MJU, Radar del Tribunal y Tutor IA socrático. Cubre AGE (C2, C1, A2), Correos, Justicia, Hacienda AEAT, Penitenciarias y Seguridad (Ertzaintza, Guardia Civil, Policía Nacional). 18.000+ plazas en 2026.',
  featureList: 'Tests verificados contra BOE, Simulacros con exámenes reales, Radar del Tribunal, Tutor IA socrático, Flashcards con repetición espaciada, Psicotécnicos específicos por oposición, Supuesto práctico con corrección IA',
  inLanguage: 'es',
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
  openGraph: {
    title: 'OpoRuta — Prepara tu oposición con IA verificada',
    description: 'Tests verificados contra BOE, simulacros INAP reales y Tutor IA. 12 oposiciones, 18.000+ plazas. Empieza gratis.',
    type: 'website',
    url: APP_URL,
    siteName: 'OpoRuta',
    locale: 'es_ES',
    images: [{ url: `${APP_URL}/api/og?tipo=default`, width: 1200, height: 630, alt: 'OpoRuta — El camino más corto hacia el aprobado' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpoRuta — Prepara tu oposición con IA verificada | 12 oposiciones',
    description: 'Tests verificados, simulacros INAP oficiales y Radar del Tribunal. AGE, Correos, Justicia, Hacienda, Seguridad. Empieza gratis.',
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
      {/* Google Analytics 4 — instalación directa sin Consent Mode */}
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-ZV3SNG784G" strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer=window.dataLayer||[];
          function gtag(){dataLayer.push(arguments);}
          gtag('js',new Date());
          gtag('config','G-ZV3SNG784G');
        `}
      </Script>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        {/* §2.17.4-5 — Organization + WebSite + SoftwareApplication JSON-LD (presentes en todas las páginas) */}
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
        <JsonLd data={softwareAppSchema} />

        {children}
        <GeoTracker />
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
