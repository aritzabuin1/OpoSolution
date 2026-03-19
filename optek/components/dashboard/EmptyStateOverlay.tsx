'use client'

import { Lock } from 'lucide-react'

interface EmptyStateOverlayProps {
  locked: boolean
  message: string
  children: React.ReactNode
}

export function EmptyStateOverlay({ locked, message, children }: EmptyStateOverlayProps) {
  if (!locked) return <>{children}</>

  return (
    <div className="relative">
      <div className="blur-[3px] opacity-50 pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/30 rounded-xl">
        <Lock className="h-6 w-6 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground text-center px-4 max-w-xs">
          {message}
        </p>
      </div>
    </div>
  )
}
