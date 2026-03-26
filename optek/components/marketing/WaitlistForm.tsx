'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bell, CheckCircle2, Loader2 } from 'lucide-react'

interface Props {
  oposicionSlug: string
}

export function WaitlistForm({ oposicionSlug }: Props) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, oposicionSlug }),
      })
      if (res.ok || res.status === 409) {
        setStatus('success')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span>Te avisaremos cuando esté disponible.</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="email"
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="h-8 text-xs"
      />
      <Button
        type="submit"
        size="sm"
        variant="outline"
        disabled={status === 'loading'}
        className="h-8 text-xs shrink-0 gap-1.5"
      >
        {status === 'loading' ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Bell className="h-3 w-3" />
        )}
        Avísame
      </Button>
    </form>
  )
}
