import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Sparkles, Clock, CheckCircle2, Lock } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Supuesto Práctico — OpoRuta',
  robots: { index: false, follow: false },
}

/**
 * /supuesto-practico — Hub page for AI-corrected written exercises (GACE A2 only).
 *
 * Shows:
 * - "Nuevo supuesto" CTA
 * - List of previous supuestos with scores
 * - Info about how the AI correction works
 */
export default async function SupuestoPracticoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check user's oposición has supuesto_practico feature
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileData } = await (supabase as any)
    .from('profiles')
    .select('oposicion_id, supuestos_balance, corrections_balance, is_admin')
    .eq('id', user.id)
    .single()

  const profile = profileData as {
    oposicion_id?: string
    supuestos_balance?: number
    corrections_balance?: number
    is_admin?: boolean
  } | null
  const isAdmin = profile?.is_admin === true

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: opoData } = await (supabase as any)
    .from('oposiciones')
    .select('nombre, features')
    .eq('id', profile?.oposicion_id ?? '')
    .single()

  const features = (opoData as { features?: { supuesto_practico?: boolean } } | null)?.features
  // Supuesto práctico solo disponible si la oposición elegida lo tiene (A2)
  const hasSupuestoPractico = features?.supuesto_practico === true
  const balance = isAdmin ? 999 : (profile?.supuestos_balance ?? 0)

  // Load previous supuestos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: supuestosData } = await (supabase as any)
    .from('supuestos_practicos')
    .select('id, caso, puntuacion_total, completado, corregido, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const supuestos = (supuestosData ?? []) as {
    id: string
    caso: { titulo: string }
    puntuacion_total: number | null
    completado: boolean
    corregido: boolean
    created_at: string
  }[]

  if (!hasSupuestoPractico) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Supuesto Práctico</h1>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">Esta funcionalidad no está disponible para tu oposición</p>
                <p className="text-sm text-amber-700 mt-1">
                  El supuesto práctico con corrección IA está disponible para la oposición Gestión del Estado (A2 GACE),
                  que incluye un ejercicio de desarrollo escrito en el examen oficial.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Supuesto Práctico</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Practica el segundo ejercicio del examen GACE con corrección IA
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Sparkles className="h-3 w-3" />
          {balance} disponibles
        </Badge>
      </div>

      {/* Info card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Cómo funciona
              </h3>
              <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li>La IA genera un caso realista tipo INAP (5 cuestiones)</li>
                <li>Escribes tus respuestas — sin límite de tiempo o en modo examen (150 min)</li>
                <li>La IA corrige con la rúbrica oficial del INAP</li>
                <li>Recibes: puntuación /50, feedback detallado y respuesta modelo</li>
              </ol>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Rúbrica oficial INAP
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li><strong>Conocimiento aplicado</strong>: 0-30 pts (60%)</li>
                <li><strong>Análisis</strong>: 0-10 pts (20%)</li>
                <li><strong>Sistemática</strong>: 0-5 pts (10%)</li>
                <li><strong>Expresión escrita</strong>: 0-5 pts (10%)</li>
              </ul>
              <p className="text-xs text-muted-foreground">Aprobado: ≥ 25/50 puntos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New supuesto CTA */}
      {balance > 0 ? (
        <Card>
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <p className="text-center font-medium">Genera un nuevo supuesto práctico tipo INAP</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Caso realista con 5 cuestiones mezclando contratación, presupuestos y RRHH — como en el examen real.
            </p>
            <Button size="lg" className="gap-2" asChild>
              <Link href="/supuesto-practico/nuevo">
                <Sparkles className="h-4 w-4" />
                Nuevo supuesto práctico
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200">
          <CardContent className="pt-6 text-center space-y-3">
            <Lock className="h-8 w-8 text-amber-500 mx-auto" />
            <p className="font-medium">No tienes supuestos disponibles</p>
            <p className="text-sm text-muted-foreground">
              Compra el Pack Gestión del Estado (A2) para obtener 5 supuestos prácticos con corrección IA.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Previous supuestos */}
      {supuestos.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Supuestos anteriores
          </h2>
          <div className="grid gap-3">
            {supuestos.map(s => (
              <Link key={s.id} href={`/supuesto-practico/${s.id}`}>
                <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                  <CardContent className="pt-4 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{s.caso?.titulo ?? 'Supuesto práctico'}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(s.created_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.corregido && s.puntuacion_total !== null ? (
                        <Badge variant={s.puntuacion_total >= 25 ? 'default' : 'destructive'}>
                          {s.puntuacion_total}/50
                        </Badge>
                      ) : s.completado ? (
                        <Badge variant="secondary">Pendiente corrección</Badge>
                      ) : (
                        <Badge variant="outline">En progreso</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
