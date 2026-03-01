/**
 * components/dashboard/StatsCard.tsx — §1.13.1
 *
 * Tarjeta de estadística con ícono, valor y etiqueta.
 * Server-renderable (sin estado cliente).
 */

import { cn } from '@/lib/utils'

interface StatsCardProps {
  icon: React.ReactNode
  value: string | number
  label: string
  sub?: string
  className?: string
  valueClassName?: string
}

export function StatsCard({ icon, value, label, sub, className, valueClassName }: StatsCardProps) {
  return (
    <div className={cn('bg-card border rounded-xl p-5 flex items-start gap-4', className)}>
      <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className={cn('text-2xl font-bold tracking-tight', valueClassName)}>{value}</p>
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
