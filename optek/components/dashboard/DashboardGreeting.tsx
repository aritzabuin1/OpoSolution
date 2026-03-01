'use client'

/**
 * components/dashboard/DashboardGreeting.tsx — §BUG-004
 *
 * Saludo dependiente de la hora del día.
 * Client Component para evitar hydration mismatch (servidor ≠ cliente en hora).
 */

import { useEffect, useState } from 'react'

interface DashboardGreetingProps {
  nombre: string
  diasParaExamen: number | null
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 13) return '¡Buenos días'
  if (h < 20) return '¡Buenas tardes'
  return '¡Buenas noches'
}

export function DashboardGreeting({ nombre, diasParaExamen }: DashboardGreetingProps) {
  const [greeting, setGreeting] = useState<string>('¡Hola')

  useEffect(() => {
    setGreeting(getGreeting())
  }, [])

  const nombreDisplay = nombre && nombre !== 'opositor' ? `, ${nombre}` : ''

  return (
    <div>
      <h1 className="text-2xl font-bold">
        {greeting}{nombreDisplay}!
      </h1>
      <p className="text-muted-foreground text-sm mt-1">
        {diasParaExamen !== null
          ? `Quedan ${diasParaExamen} días para tu examen`
          : 'Tu panel de control de oposiciones'}
      </p>
    </div>
  )
}
