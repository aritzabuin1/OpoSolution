'use client'

import { useRouter } from 'next/navigation'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ReplayTourButton() {
  const router = useRouter()

  function handleReplay() {
    localStorage.setItem('oporuta_replay_tour', '1')
    router.push('/dashboard')
  }

  return (
    <Button variant="outline" size="sm" onClick={handleReplay} className="gap-2">
      <Compass className="h-4 w-4" />
      Repetir tour de bienvenida
    </Button>
  )
}
