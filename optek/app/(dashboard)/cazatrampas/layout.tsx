import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Caza-Trampas' }

export default function CazaTrampasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
