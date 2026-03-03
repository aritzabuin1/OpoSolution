import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Psicotécnicos' }

export default function PsicotecnicosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
