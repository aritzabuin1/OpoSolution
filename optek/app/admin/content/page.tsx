import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, BookOpen, CheckCircle2 } from 'lucide-react'
import { verifyAdmin } from '@/lib/admin/auth'
import { getContentHealth } from '@/lib/admin/content-health'

export const metadata = { title: 'Salud del Contenido — Admin' }

export default async function ContentPage() {
  const auth = await verifyAdmin('admin/content')
  if (!auth.authorized) redirect('/login')

  const health = await getContentHealth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" /> Salud del Contenido
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cobertura del banco de preguntas y calidad por tema.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Total temas</p>
          <p className="text-2xl font-bold">{health.totalTemas}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Con free bank</p>
          <p className="text-2xl font-bold text-green-600">{health.temasWithFreeBank}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Sin free bank</p>
          <p className="text-2xl font-bold text-red-600">{health.temasWithoutFreeBank}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground">Nota media global</p>
          <p className="text-2xl font-bold">{health.avgScoreAll !== null ? `${health.avgScoreAll}%` : '—'}</p>
        </CardContent></Card>
      </div>

      {/* Worst temas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Temas con peor nota (prioridad de mejora)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {health.worstTemas.map(t => (
              <div key={t.temaId} className="flex items-center justify-between text-sm py-1.5 border-b border-muted/50 last:border-0">
                <div className="min-w-0 flex-1">
                  <span className="text-muted-foreground mr-2">T{t.numero}</span>
                  <span className="truncate">{t.titulo}</span>
                  <Badge variant="secondary" className="text-[9px] ml-2">{t.oposicion}</Badge>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="text-xs text-muted-foreground">{t.testCount} tests</span>
                  <span className={`font-medium ${(t.avgScore ?? 100) < 50 ? 'text-red-600' : 'text-amber-600'}`}>
                    {t.avgScore}%
                  </span>
                  {t.hasFreeBankData ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <AlertTriangle className="h-3 w-3 text-red-400" />}
                </div>
              </div>
            ))}
            {health.worstTemas.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin datos suficientes</p>}
          </div>
        </CardContent>
      </Card>

      {/* Most tested */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Temas más practicados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {health.mostTestedTemas.map(t => (
              <div key={t.temaId} className="flex items-center justify-between text-sm py-1.5 border-b border-muted/50 last:border-0">
                <div className="min-w-0 flex-1">
                  <span className="text-muted-foreground mr-2">T{t.numero}</span>
                  <span className="truncate">{t.titulo}</span>
                  <Badge variant="secondary" className="text-[9px] ml-2">{t.oposicion}</Badge>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="font-medium">{t.testCount} tests</span>
                  <span className="text-xs text-muted-foreground">{t.avgScore !== null ? `${t.avgScore}%` : '—'}</span>
                  <span className="text-xs text-muted-foreground">{t.premiumBankQuestions}q premium</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
