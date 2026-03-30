import { createClient } from '@/lib/supabase/server'
import { DEFAULT_OPOSICION_ID } from '@/lib/freemium'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Sparkles, Clock, CheckCircle2, Lock } from 'lucide-react'
import Link from 'next/link'
import { BuyButton } from '@/components/cuenta/BuyButton'

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
    .select('oposicion_id, corrections_balance, free_corrector_used, is_admin')
    .eq('id', user.id)
    .single()

  const profile = profileData as {
    oposicion_id?: string
    corrections_balance?: number
    free_corrector_used?: number
    is_admin?: boolean
  } | null
  const isAdmin = profile?.is_admin === true

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: opoData } = await (supabase as any)
    .from('oposiciones')
    .select('nombre, features, slug, rama')
    .eq('id', profile?.oposicion_id ?? DEFAULT_OPOSICION_ID)
    .single()

  const opoInfo = opoData as { nombre?: string; features?: { supuesto_practico?: boolean }; slug?: string; rama?: string } | null
  const features = opoInfo?.features
  // Supuesto práctico solo disponible si la oposición elegida lo tiene (A2)
  const hasSupuestoPractico = features?.supuesto_practico === true
  // Créditos IA: supuesto desarrollo = 2 créditos (1 generar + 1 corregir)
  const paidBalance = profile?.corrections_balance ?? 0
  const freeRemaining = Math.max(0, 2 - (profile?.free_corrector_used ?? 0))
  const balance = isAdmin ? 999 : Math.floor((paidBalance + freeRemaining) / 2) // show as supuestos disponibles

  // Load previous supuestos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: supuestosData } = await (supabase as any)
    .from('supuestos_practicos')
    .select('id, caso, puntuacion_total, completado, corregido, created_at')
    .eq('user_id', user.id)
    .eq('oposicion_id', profile?.oposicion_id ?? DEFAULT_OPOSICION_ID)
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

  // Determine rubric type: MJU (Gestión Procesal) vs AEAT (Hacienda) vs INAP (GACE A2)
  const isMJU = opoInfo?.slug === 'gestion-procesal' || opoInfo?.rama === 'justicia'
  const isAEAT = opoInfo?.slug === 'hacienda-aeat'
  const rubricaLabel = isMJU ? 'MJU' : (isAEAT ? 'AEAT' : 'INAP')
  const rubricaItems = isMJU
    ? [
        { label: 'Conocimiento', detail: '0-3 pts/pregunta (60%)' },
        { label: 'Claridad y orden', detail: '0-1 pt/pregunta (20%)' },
        { label: 'Expresión escrita', detail: '0-0.5 pts/pregunta (10%)' },
        { label: 'Presentación', detail: '0-0.5 pts/pregunta (10%)' },
      ]
    : isAEAT
    ? [
        { label: 'Corrección jurídica', detail: '0-1,5 pts/supuesto (50%)' },
        { label: 'Adecuación al caso', detail: '0-1 pt/supuesto (33%)' },
        { label: 'Expresión y estructura', detail: '0-0,5 pts/supuesto (17%)' },
      ]
    : [
        { label: 'Conocimiento aplicado', detail: '0-30 pts (60%)' },
        { label: 'Análisis', detail: '0-10 pts (20%)' },
        { label: 'Sistemática', detail: '0-5 pts (10%)' },
        { label: 'Expresión escrita', detail: '0-5 pts (10%)' },
      ]
  const maxPuntos = isMJU ? 25 : (isAEAT ? 30 : 50)
  const minAprobado = isMJU ? 12.5 : (isAEAT ? 15 : 25)
  const numCuestiones = isAEAT ? 10 : 5
  const tiempoExamen = isMJU ? 45 : 150
  const opoNombreCorto = opoInfo?.nombre ?? 'tu oposición'

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
                  El supuesto práctico con corrección IA está disponible para oposiciones que incluyen
                  un ejercicio de desarrollo escrito en el examen oficial.
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
            Practica el ejercicio de desarrollo con corrección IA
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
                <li>La IA genera un caso realista tipo {rubricaLabel} ({numCuestiones} cuestiones)</li>
                <li>Escribes tus respuestas — sin límite de tiempo o en modo examen ({tiempoExamen} min)</li>
                <li>La IA corrige con la rúbrica oficial {rubricaLabel}</li>
                <li>Recibes: puntuación /{maxPuntos}, feedback detallado y respuesta modelo</li>
              </ol>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Rúbrica oficial {rubricaLabel}
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                {rubricaItems.map(r => (
                  <li key={r.label}><strong>{r.label}</strong>: {r.detail}</li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">Aprobado: ≥ {minAprobado}/{maxPuntos} puntos</p>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
            <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Cada supuesto consume <strong>2 créditos IA</strong> (1 para generar el caso + 1 para la corrección con rúbrica {rubricaLabel}).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* New supuesto CTA */}
      {balance > 0 ? (
        <Card>
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <p className="text-center font-medium">Genera un nuevo supuesto práctico tipo {rubricaLabel}</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Caso realista con {numCuestiones} cuestiones como en el examen real de {opoNombreCorto}.
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
          <CardContent className="pt-6 text-center space-y-4">
            <Lock className="h-8 w-8 text-amber-500 mx-auto" />
            <p className="font-medium">Sin créditos IA disponibles</p>
            {paidBalance > 0 || supuestos.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Has agotado tus créditos IA. Recarga para seguir practicando supuestos con corrección {rubricaLabel}.
                </p>
                <BuyButton tier="recarga" label="Recargar créditos — 9,99€" />
                <p className="text-xs text-muted-foreground">+10 créditos IA · 5 supuestos más</p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  El Pack incluye supuestos prácticos con corrección IA + rúbrica oficial {rubricaLabel}.
                </p>
                <BuyButton tier={isAEAT ? 'pack_hacienda' : isMJU ? 'pack_gestion_j' : 'pack_a2'} label="Desbloquear Pack" />
                <p className="text-xs text-muted-foreground">Pago único · Sin suscripción</p>
              </>
            )}
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
                        <Badge variant={s.puntuacion_total >= minAprobado ? 'default' : 'destructive'}>
                          {s.puntuacion_total}/{maxPuntos}
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
