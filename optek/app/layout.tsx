import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { CookieBanner } from '@/components/shared/CookieBanner'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'OPTEK — Entrena tu oposición',
  description:
    'Plataforma de entrenamiento inteligente para opositores. Tests, corrección de desarrollos y simulacros con IA.',
  manifest: '/manifest.json',
  // PWA meta tags (0.13.5)
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'OPTEK',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1B4F72',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        {children}
        <CookieBanner />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
