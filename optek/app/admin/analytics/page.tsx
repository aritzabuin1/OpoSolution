/**
 * app/admin/analytics/page.tsx
 *
 * Dashboard de analiticas: 10 metricas clave para decisiones de negocio.
 * Server Component — datos fetcheados con createServiceClient.
 */

export const dynamic = 'force-dynamic'

import {
  getConversionMetrics,
  getDAU30d,
  getFeatureEngagement,
  getChurnMetrics,
  getOnboardingFunnel,
  getTopTemas,
  getTemaScores,
  getCorrectionsUsage,
  getCompletionRate,
  getFeedbackSummary,
  getAnalysisUsageByType,
  getDashboardPhaseDistribution,
  getDeviceDistribution,
  getOposicionBreakdown,
} from '@/lib/admin/analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// ─── Helpers ────────────────────────────────────────────────────────────────────

function MetricInfo({ text }: { text: string }) {
  return (
    <span className="relative group ml-1.5 inline-flex">
      <span className="cursor-help text-muted-foreground/50 hover:text-muted-foreground text-xs">ℹ</span>
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50 w-64 rounded-md bg-popover border px-3 py-2 text-xs text-popover-foreground shadow-md leading-relaxed">
        {text}
      </span>
    </span>
  )
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
      <div
        className={`h-2 rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function FunnelBar({ label, value, total, desc }: { label: string; value: number; total: number; desc: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs font-medium text-muted-foreground shrink-0">{label}</div>
      <div className="flex-1 space-y-0.5">
        <ProgressBar value={pct} max={100} color="bg-primary" />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{desc}</span>
          <span className="font-medium text-foreground">{value} ({pct.toFixed(1)}%)</span>
        </div>
      </div>
    </div>
  )
}

function ScoreColor({ val }: { val: number }) {
  if (val >= 70) return <span className="text-green-600 font-bold">{val}%</span>
  if (val >= 50) return <span className="text-amber-600 font-bold">{val}%</span>
  return <span className="text-red-600 font-bold">{val}%</span>
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  let conversion, dau, engagement, churn, funnel, topTemas, temaScores, corrections, completion, feedback, analysisUsage, phaseDistribution, deviceDist, oposicionBreakdown

  try {
    ;[conversion, dau, engagement, churn, funnel, topTemas, temaScores, corrections, completion, feedback, analysisUsage, phaseDistribution, deviceDist, oposicionBreakdown] =
      await Promise.all([
        getConversionMetrics(),
        getDAU30d(),
        getFeatureEngagement(),
        getChurnMetrics(),
        getOnboardingFunnel(),
        getTopTemas(10),
        getTemaScores(10),
        getCorrectionsUsage(),
        getCompletionRate(),
        getFeedbackSummary(),
        getAnalysisUsageByType(),
        getDashboardPhaseDistribution(),
        getDeviceDistribution(),
        getOposicionBreakdown(),
      ])
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No se pudieron cargar las metricas.
          <pre className="mt-2 text-xs opacity-60">{msg}</pre>
        </div>
      </div>
    )
  }

  // DAU chart: max for scaling
  const maxDAU = Math.max(...dau.map(d => d.activeUsers), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Metricas clave para decisiones de negocio. Datos en tiempo real.
        </p>
      </div>

      {/* ── Row 1: Conversion + Churn + Completion ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* 1. Conversion Free -> Paid */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Conversion Free → Paid <MetricInfo text="Porcentaje de usuarios registrados que han comprado. Benchmark SaaS freemium: 2-5%. Si es <2%, revisar propuesta de valor o pricing." /></CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-extrabold text-primary">{conversion.conversionPct}%</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Free</span>
                <p className="font-bold text-lg">{conversion.freeUsers}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Paid</span>
                <p className="font-bold text-lg text-green-600">{conversion.paidUsers}</p>
              </div>
            </div>
            {conversion.avgDaysToConvert !== null && (
              <p className="text-xs text-muted-foreground">
                Tiempo medio hasta compra: <span className="font-medium text-foreground">{conversion.avgDaysToConvert} dias</span>
              </p>
            )}
            <ProgressBar value={conversion.conversionPct} max={100} color="bg-green-500" />
          </CardContent>
        </Card>

        {/* 4. Churn */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Churn (7 dias) <MetricInfo text="Usuarios que dejaron de usar la app en los ultimos 7 dias, respecto al total que alguna vez hicieron un test. <30% es bueno, >50% es preocupante." /></CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className={`text-3xl font-extrabold ${churn.churnPct > 50 ? 'text-red-600' : churn.churnPct > 30 ? 'text-amber-600' : 'text-green-600'}`}>
              {churn.churnPct}%
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Activos (7d)</span>
                <p className="font-bold text-lg text-green-600">{churn.activeNow}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Inactivos</span>
                <p className="font-bold text-lg text-red-600">{churn.churned7d}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              De {churn.totalActive} usuarios que han hecho al menos 1 test
            </p>
            <ProgressBar value={churn.churnPct} max={100} color={churn.churnPct > 50 ? 'bg-red-500' : churn.churnPct > 30 ? 'bg-amber-500' : 'bg-green-500'} />
          </CardContent>
        </Card>

        {/* 9. Completion rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tests Completados <MetricInfo text="Ratio de tests que se terminan vs se abandonan a mitad. Si muchos se abandonan, puede indicar tests demasiado largos o UX confusa." /></CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-extrabold">{completion.completionPct}%</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Completados</span>
                <p className="font-bold text-lg text-green-600">{completion.completed}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Abandonados</span>
                <p className="font-bold text-lg text-red-600">{completion.abandoned}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{completion.total} tests generados en total</p>
            <ProgressBar value={completion.completionPct} max={100} color="bg-primary" />
          </CardContent>
        </Card>
      </div>

      {/* ── 2. DAU Chart ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Usuarios Activos Diarios (DAU) — ultimos 30 dias <MetricInfo text="Usuarios Activos Diarios. Muestra tendencia de uso. Picos indican campanas efectivas. Caidas a 0 indican problema tecnico o perdida de interes." /></CardTitle>
        </CardHeader>
        <CardContent>
          {dau.every(d => d.activeUsers === 0) ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Sin actividad en los ultimos 30 dias.</p>
          ) : (
            <div className="flex items-end gap-[2px] h-28">
              {dau.map((point) => {
                const heightPct = (point.activeUsers / maxDAU) * 100
                const isToday = point.date === new Date().toISOString().slice(0, 10)
                return (
                  <div
                    key={point.date}
                    className="flex-1 flex flex-col items-center justify-end group relative"
                    style={{ height: '100%' }}
                  >
                    <div
                      className={`w-full rounded-t transition-all ${isToday ? 'bg-primary' : 'bg-primary/50'}`}
                      style={{ height: `${Math.max(heightPct, point.activeUsers > 0 ? 4 : 0)}%` }}
                    />
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute bottom-full mb-1 hidden group-hover:block z-50 bg-popover border rounded px-2 py-1 text-[10px] whitespace-nowrap shadow">
                      {point.date.slice(5)}: {point.activeUsers} usuarios
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
            <span>{dau[0]?.date.slice(5)}</span>
            <span>Hoy</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Row 2: Funnel + Tour + Phases + Engagement ─────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 5. Onboarding Funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Funnel de Onboarding <MetricInfo text="Embudo de activacion: cuantos usuarios pasan de registrarse a hacer su primer test, segundo test y comprar. Los drop-offs indican donde se pierden usuarios." /></CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FunnelBar label="Registro" value={funnel.registered} total={funnel.registered} desc="registros totales" />
            <FunnelBar label="Tour" value={funnel.tourCompleted} total={funnel.registered} desc="completaron el tour" />
            <FunnelBar label="1er test" value={funnel.firstTest} total={funnel.registered} desc="completaron 1 test" />
            <FunnelBar label="2o test" value={funnel.secondTest} total={funnel.registered} desc="completaron 2+ tests" />
            <FunnelBar label="Compra" value={funnel.purchased} total={funnel.registered} desc="compraron" />

            {/* Drop-off highlights */}
            <div className="border-t pt-2 space-y-1">
              <p className="text-[10px] text-muted-foreground font-medium">Drop-off criticos:</p>
              {funnel.registered > 0 && (
                <>
                  <p className="text-[10px]">
                    Registro → Tour: <Badge variant={funnel.tourCompletionRate >= 50 ? 'default' : 'destructive'} className="text-[10px] ml-1">
                      {funnel.tourCompletionRate}% completaron
                    </Badge>
                  </p>
                  <p className="text-[10px]">
                    Registro → 1er test: <span className={`font-bold ${funnel.pctFirstTest < 50 ? 'text-red-600' : 'text-green-600'}`}>
                      {(100 - funnel.pctFirstTest).toFixed(1)}% se pierde
                    </span>
                  </p>
                  {funnel.firstTest > 0 && (
                    <p className="text-[10px]">
                      1er test → Compra: <span className={`font-bold ${funnel.pctPurchased < 10 ? 'text-amber-600' : 'text-green-600'}`}>
                        {funnel.firstTest > 0 ? ((1 - funnel.purchased / funnel.firstTest) * 100).toFixed(1) : 0}% se pierde
                      </span>
                    </p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 3. Feature Engagement */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Engagement por Feature (30d) <MetricInfo text="Que funciones usan los usuarios activos (ultimos 30 dias). Ayuda a decidir donde invertir desarrollo y que features promocionar." /></CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {engagement.map((f) => (
              <div key={f.feature} className="flex items-center gap-3">
                <div className="w-24 text-xs font-medium text-muted-foreground shrink-0">
                  {f.feature}
                </div>
                <div className="flex-1 space-y-0.5">
                  <ProgressBar value={f.pct} max={100} color="bg-violet-500" />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{f.count} usos</span>
                    <span className="font-medium text-foreground">{f.pct}%</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Dashboard Phase Distribution ─────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Distribucion de Fases de Usuario <MetricInfo text="En que fase se encuentra cada usuario: nuevo (0 tests), empezando (<5 tests), activo (5+ tests, reciente) o inactivo (5+ tests, >7 dias sin actividad). Ayuda a segmentar estrategias de retencion." /></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <p className="text-2xl font-extrabold text-blue-600">{phaseDistribution.new}</p>
              <p className="text-xs text-muted-foreground mt-1">Nuevos</p>
              <p className="text-[10px] text-muted-foreground">0 tests</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
              <p className="text-2xl font-extrabold text-amber-600">{phaseDistribution.starting}</p>
              <p className="text-xs text-muted-foreground mt-1">Empezando</p>
              <p className="text-[10px] text-muted-foreground">1-4 tests</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
              <p className="text-2xl font-extrabold text-green-600">{phaseDistribution.active}</p>
              <p className="text-xs text-muted-foreground mt-1">Activos</p>
              <p className="text-[10px] text-muted-foreground">5+ tests, reciente</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
              <p className="text-2xl font-extrabold text-red-600">{phaseDistribution.lapsed}</p>
              <p className="text-xs text-muted-foreground mt-1">Inactivos</p>
              <p className="text-[10px] text-muted-foreground">7+ dias sin actividad</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-3">{phaseDistribution.total} usuarios totales</p>
        </CardContent>
      </Card>

      {/* ── Row 3: Top Temas + Scores ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 6. Top temas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Temas Mas Generados <MetricInfo text="Los temas mas populares entre los usuarios. Util para priorizar contenido y detectar que partes del temario generan mas demanda." /></CardTitle>
          </CardHeader>
          <CardContent>
            {topTemas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Sin datos</p>
            ) : (
              <div className="space-y-2">
                {topTemas.map((t, i) => (
                  <div key={t.temaId} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-5 text-right">{i + 1}.</span>
                    <span className="text-xs flex-1 truncate">{t.titulo}</span>
                    <Badge variant="secondary" className="text-[10px]">{t.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 7. Temas con peor puntuacion */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Temas con Peor Puntuacion <MetricInfo text="Temas donde los usuarios sacan peor nota media. Indica que temas necesitan mejor contenido o explicaciones mas claras." /></CardTitle>
          </CardHeader>
          <CardContent>
            {temaScores.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Sin datos</p>
            ) : (
              <div className="space-y-2">
                {temaScores.map((t, i) => (
                  <div key={t.temaId} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-5 text-right">{i + 1}.</span>
                    <span className="text-xs flex-1 truncate">{t.titulo}</span>
                    <span className="text-[10px] text-muted-foreground">{t.testCount} tests</span>
                    <ScoreColor val={t.avgScore} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Corrections + Feedback ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 8. Uso de creditos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Creditos de Correccion <MetricInfo text="Saldo de analisis detallados de IA por usuario. Usuarios con 0 creditos son candidatos a comprar recarga. El minimo/maximo ayuda a ver la distribucion." /></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Media</p>
                <p className="text-xl font-bold">{corrections.avgBalance}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Min</p>
                <p className="text-xl font-bold text-red-600">{corrections.minBalance}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Max</p>
                <p className="text-xl font-bold text-green-600">{corrections.maxBalance}</p>
              </div>
            </div>
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Usuarios con 0 creditos</span>
                <span className={`font-bold ${corrections.usersWithZero > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {corrections.usersWithZero} de {corrections.totalUsers}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Usuarios con 0 creditos son candidatos a comprar recarga (8,99 EUR)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 10. Feedback */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Feedback de Usuarios <MetricInfo text="Sugerencias y reportes enviados por usuarios desde el boton flotante. Revisar periodicamente para detectar bugs y oportunidades de mejora." /></CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{feedback.total}</span>
              <span className="text-sm text-muted-foreground">sugerencias totales</span>
            </div>

            {feedback.byTipo.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {feedback.byTipo.map(({ tipo, count }) => (
                  <Badge key={tipo} variant="outline" className="text-[10px]">
                    {tipo}: {count}
                  </Badge>
                ))}
              </div>
            )}

            {feedback.byEstado.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {feedback.byEstado.map(({ estado, count }) => (
                  <Badge
                    key={estado}
                    variant={estado === 'recibida' ? 'default' : 'secondary'}
                    className="text-[10px]"
                  >
                    {estado}: {count}
                  </Badge>
                ))}
              </div>
            )}

            {feedback.recent.length > 0 && (
              <div className="border-t pt-2 space-y-2">
                <p className="text-[10px] text-muted-foreground font-medium">Ultimos mensajes:</p>
                {feedback.recent.map((r, i) => (
                  <div key={i} className="text-xs">
                    <span className="text-muted-foreground">[{r.tipo}]</span>{' '}
                    <span className="line-clamp-2">{r.mensaje}</span>
                  </div>
                ))}
              </div>
            )}

            {feedback.total === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">Sin feedback recibido aun.</p>
            )}
          </CardContent>
        </Card>

        {/* 11. Uso de analisis por tipo */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Analisis Detallados por Tipo <MetricInfo text="Desglose de como gastan los usuarios sus analisis de IA: explicar errores, informes de simulacro, flashcards o caza-trampas. Muestra donde aporta mas valor la IA." /></CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysisUsage.length > 0 ? (
              <>
                {(() => {
                  const maxCount = Math.max(...analysisUsage.map((a: { count: number }) => a.count), 1)
                  return analysisUsage.map((a: { endpoint: string; label: string; count: number; totalCost: number }) => (
                    <div key={a.endpoint} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground truncate mr-2">{a.label}</span>
                        <span className="font-bold shrink-0">
                          {a.count} <span className="font-normal text-muted-foreground">({a.totalCost.toFixed(2)} EUR)</span>
                        </span>
                      </div>
                      <ProgressBar value={a.count} max={maxCount} color="bg-primary" />
                    </div>
                  ))
                })()}
                <p className="text-[10px] text-muted-foreground border-t pt-2">
                  Muestra donde gastan mas analisis los usuarios — util para decidir donde ampliar valor.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">Sin datos de uso aun.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 7: Device Distribution ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Dispositivos (30d) <MetricInfo text="Distribucion mobile vs desktop de las llamadas a la API. Si >60% movil, priorizar UX mobile." /></CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-extrabold text-blue-600">{deviceDist.mobilePct}%</div>
                <div className="text-xs text-muted-foreground">Movil</div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Mobile</span>
                  <span className="font-bold">{deviceDist.mobile}</span>
                </div>
                <ProgressBar value={deviceDist.mobile} max={deviceDist.totalRequests || 1} color="bg-blue-500" />
                <div className="flex justify-between text-xs">
                  <span>Tablet</span>
                  <span className="font-bold">{deviceDist.tablet}</span>
                </div>
                <ProgressBar value={deviceDist.tablet} max={deviceDist.totalRequests || 1} color="bg-purple-500" />
                <div className="flex justify-between text-xs">
                  <span>Desktop</span>
                  <span className="font-bold">{deviceDist.desktop}</span>
                </div>
                <ProgressBar value={deviceDist.desktop} max={deviceDist.totalRequests || 1} color="bg-green-500" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground border-t pt-2">
              Total: {deviceDist.totalRequests} requests. Si movil alto, priorizar UX responsive.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── 14. Desglose por Oposición ──────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            Desglose por Oposición
            <MetricInfo text="Usuarios, conversión, tests y revenue desglosados por oposición." />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Oposición</th>
                  <th className="pb-2 font-medium text-right">Usuarios</th>
                  <th className="pb-2 font-medium text-right">Pagados</th>
                  <th className="pb-2 font-medium text-right">Conv. %</th>
                  <th className="pb-2 font-medium text-right">Tests</th>
                  <th className="pb-2 font-medium text-right">Nota media</th>
                  <th className="pb-2 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {oposicionBreakdown.map((o) => (
                  <tr key={o.slug} className="border-b last:border-0">
                    <td className="py-2 font-medium">{o.oposicion}</td>
                    <td className="py-2 text-right">{o.usuarios}</td>
                    <td className="py-2 text-right">{o.pagados}</td>
                    <td className="py-2 text-right">
                      <Badge variant={o.conversionPct >= 10 ? 'default' : o.conversionPct >= 5 ? 'secondary' : 'outline'}>
                        {o.conversionPct}%
                      </Badge>
                    </td>
                    <td className="py-2 text-right">{o.tests}</td>
                    <td className="py-2 text-right">
                      {o.notaMedia !== null ? <ScoreColor val={o.notaMedia} /> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="py-2 text-right font-medium">{o.revenue.toFixed(2)}€</td>
                  </tr>
                ))}
                {oposicionBreakdown.length === 0 && (
                  <tr><td colSpan={7} className="py-4 text-center text-muted-foreground">Sin datos</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t font-semibold">
                  <td className="pt-2">Total</td>
                  <td className="pt-2 text-right">{oposicionBreakdown.reduce((s, o) => s + o.usuarios, 0)}</td>
                  <td className="pt-2 text-right">{oposicionBreakdown.reduce((s, o) => s + o.pagados, 0)}</td>
                  <td className="pt-2 text-right">—</td>
                  <td className="pt-2 text-right">{oposicionBreakdown.reduce((s, o) => s + o.tests, 0)}</td>
                  <td className="pt-2 text-right">—</td>
                  <td className="pt-2 text-right">{oposicionBreakdown.reduce((s, o) => s + o.revenue, 0).toFixed(2)}€</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
