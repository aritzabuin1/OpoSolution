import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function AuthErrorPage() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-8 text-center space-y-4">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-xl font-bold">Enlace no válido</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          El enlace que has usado ha expirado o ya no es válido. Esto puede pasar si el
          enlace tiene más de 1 hora o si ya lo has usado antes.
        </p>
        <div className="flex flex-col gap-3 pt-2">
          <Link href="/login">
            <Button className="w-full">Solicitar nuevo enlace</Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="w-full">
              Volver al inicio
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
