/**
 * app/(admin)/infrastructure/page.tsx — §2.23
 *
 * Monitor de Infraestructura: semáforos de BD/MAU/Upstash/IA.
 * Server Component — datos cacheados 5 min via getInfraMetrics().
 */

import { getInfraMetrics } from '@/lib/admin/infrastructure'
import type { InfraMetrics } from '@/lib/admin/infrastructure'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status: 'ok' | 'warning' | 'error') {
  if (status === 'error') return 'bg-red-500'
  if (status === 'warning') return 'bg-amber-400'
  return 'bg-green-500'
}

function statusBorder(status: 'ok' | 'warning' | 'error') {
  if (status === 'error') return 'border-red-200 bg-red-50'
  if (status === 'warning') return 'border-amber-200 bg-amber-50'
  return 'border-green-200 bg-green-50'
}

function statusText(status: 'ok' | 'warning' | 'error') {
  if (status === 'error') return 'text-red-800'
  if (status === 'warning') return 'text-amber-800'
  return 'text-green-800'
}

function semaphoreEmoji(status: 'ok' | 'warning' | 'error') {
  if (status === 'error') return '🔴'
  if (status === 'warning') return '🟡'
  return '🟢'
}

function semaphoreLabel(status: 'ok' | 'warning' | 'error') {
  if (status === 'error') return 'ALERTA — acción requerida'
  if (status === 'warning') return 'Atención — monitorizar'
  return 'Todo en orden'
}

function ProgressBar({ pct, status }: { pct: number; status: 'ok' | 'warning' | 'error' }) {
  const clampedPct = Math.min(100, Math.max(0, pct))
  return (
    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden mt-2">
      <div
        className={`h-2.5 rounded-full transition-all ${statusColor(status)}`}
        style={{ width: `${clampedPct}%` }}
      />
    </div>
  )
}

function minutesAgo(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 60_000)
}

// ─── Cards ─────────────────────────────────────────────────────────────────────

function DBCard({ db }: { db: InfraMetrics['db'] }) {
  return (
    <div className={`rounded-xl border p-5 ${statusBorder(db.status)}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-sm">🗄️ Base de datos</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBorder(db.status)} ${statusText(db.status)}`}>
          {semaphoreEmoji(db.status)} {db.status.toUpperCase()}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">Supabase Free: 500 MB</p>
      <p className="text-2xl font-bold">
        {db.sizeMB.toFixed(1)} <span className="text-base font-normal text-muted-foreground">MB de 500 MB</span>
      </p>
      <p className="text-sm text-muted-foreground">{db.pct.toFixed(1)}% utilizado</p>
      <ProgressBar pct={db.pct} status={db.status} />
      {db.status === 'error' && (
        <p className="mt-3 text-sm font-medium text-red-700">
          🔴 URGENTE: Migrar a Supabase Pro antes de quedarte sin espacio
        </p>
      )}
      {db.status === 'warning' && (
        <p className="mt-3 text-sm font-medium text-amber-700">
          🟡 Considera migrar a Supabase Pro (25$/mes)
        </p>
      )}
    </div>
  )
}

function AuthCard({ auth }: { auth: InfraMetrics['auth'] }) {
  return (
    <div className={`rounded-xl border p-5 ${statusBorder(auth.status)}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-sm">👥 Usuarios activos (MAU)</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBorder(auth.status)} ${statusText(auth.status)}`}>
          {semaphoreEmoji(auth.status)} {auth.status.toUpperCase()}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">Supabase Free: 50.000 MAU/mes</p>
      <p className="text-2xl font-bold">
        {auth.mau30d.toLocaleString()} <span className="text-base font-normal text-muted-foreground">MAU (30d)</span>
      </p>
      <p className="text-sm text-muted-foreground">
        {auth.totalRegistrados.toLocaleString()} registrados en total · {auth.pct.toFixed(1)}% del límite
      </p>
      <ProgressBar pct={auth.pct} status={auth.status} />
      {auth.status === 'error' && (
        <p className="mt-3 text-sm font-medium text-red-700">
          🔴 URGENTE: Migrar a Supabase Pro para evitar throttling
        </p>
      )}
      {auth.status === 'warning' && (
        <p className="mt-3 text-sm font-medium text-amber-700">
          🟡 Monitorizar — approaching Supabase MAU limit
        </p>
      )}
    </div>
  )
}

function UpstashCard({ upstash }: { upstash: InfraMetrics['upstash'] }) {
  return (
    <div className={`rounded-xl border p-5 ${statusBorder(upstash.status)}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-sm">⚡ Upstash Redis</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBorder(upstash.status)} ${statusText(upstash.status)}`}>
          {semaphoreEmoji(upstash.status)} {upstash.status.toUpperCase()}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">Upstash Free: 10.000 comandos/día</p>
      <p className="text-2xl font-bold">
        ~{upstash.estimatedCmdsDay.toLocaleString()} <span className="text-base font-normal text-muted-foreground">cmd/día estimados</span>
      </p>
      <p className="text-sm text-muted-foreground">
        Base: {upstash.dau} DAU × 3 cmd/usuario · {upstash.pct.toFixed(1)}% del límite
      </p>
      <ProgressBar pct={upstash.pct} status={upstash.status} />
      {upstash.status === 'error' && (
        <p className="mt-3 text-sm font-medium text-red-700">
          🔴 URGENTE: Rate limiting fallará si se superan 10.000 cmd/día
        </p>
      )}
      {upstash.status === 'warning' && (
        <p className="mt-3 text-sm font-medium text-amber-700">
          🟡 Considera Upstash Pay-as-you-go (~0,2$/10k cmd)
        </p>
      )}
    </div>
  )
}

function AICard({ ai }: { ai: InfraMetrics['ai'] }) {
  const aiPct = Math.min(100, (ai.costsMonth / 100) * 100) // 100€ = 100%
  return (
    <div className={`rounded-xl border p-5 ${statusBorder(ai.status)}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-sm">🤖 Costes IA</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBorder(ai.status)} ${statusText(ai.status)}`}>
          {semaphoreEmoji(ai.status)} {ai.status.toUpperCase()}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">Umbral sostenibilidad: 100€/mes</p>
      <div className="grid grid-cols-3 gap-3 mt-1">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Hoy</p>
          <p className="text-xl font-bold">€{ai.costsToday.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Semana</p>
          <p className="text-xl font-bold">€{ai.costsWeek.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Mes</p>
          <p className={`text-xl font-bold ${ai.status === 'error' ? 'text-red-700' : ai.status === 'warning' ? 'text-amber-700' : ''}`}>
            €{ai.costsMonth.toFixed(2)}
          </p>
        </div>
      </div>
      <ProgressBar pct={aiPct} status={ai.status} />
      {ai.status === 'error' && (
        <p className="mt-3 text-sm font-medium text-red-700">
          🔴 URGENTE: Costes IA superan umbral de sostenibilidad
        </p>
      )}
      {ai.status === 'warning' && (
        <p className="mt-3 text-sm font-medium text-amber-700">
          🟡 Revisar eficiencia de prompts o ajustar precios
        </p>
      )}
    </div>
  )
}

function VercelCard({ vercel }: { vercel: InfraMetrics['vercel'] }) {
  return (
    <div className={`rounded-xl border p-5 ${statusBorder(vercel.status)}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-sm">Vercel Invocaciones</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBorder(vercel.status)} ${statusText(vercel.status)}`}>
          {semaphoreEmoji(vercel.status)} {vercel.status.toUpperCase()}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">Vercel Hobby: 100.000/mes</p>
      <p className="text-2xl font-bold">
        ~{vercel.estimatedInvocationsMonth.toLocaleString()} <span className="text-base font-normal text-muted-foreground">/ {vercel.limitInvocationsMonth.toLocaleString()}</span>
      </p>
      <p className="text-sm text-muted-foreground">{vercel.pct.toFixed(1)}% utilizado (estimado)</p>
      <ProgressBar pct={vercel.pct} status={vercel.status} />
      {vercel.status !== 'ok' && (
        <p className={`mt-3 text-sm font-medium ${vercel.status === 'error' ? 'text-red-700' : 'text-amber-700'}`}>
          {vercel.status === 'error' ? 'URGENTE:' : 'Considera'} Vercel Pro ($20/mes) para 1M invocaciones + 60s timeout
        </p>
      )}
    </div>
  )
}

function GrowthCard({ growth, auth }: { growth: InfraMetrics['growth']; auth: InfraMetrics['auth'] }) {
  return (
    <div className="rounded-xl border p-5 border-blue-200 bg-blue-50/30">
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-sm">Crecimiento</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-2">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Hoy</p>
          <p className="text-xl font-bold">{growth.newUsersToday}</p>
          <p className="text-xs text-muted-foreground">nuevos</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Semana</p>
          <p className="text-xl font-bold">{growth.newUsersWeek}</p>
          <p className="text-xs text-muted-foreground">nuevos</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
          <p className="text-xl font-bold">{growth.totalUsers}</p>
          <p className="text-xs text-muted-foreground">usuarios</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">DAU</p>
          <p className="text-xl font-bold">{growth.dauToday}</p>
          <p className="text-xs text-muted-foreground">activos hoy</p>
        </div>
      </div>
      {growth.daysToMauLimit !== null && growth.daysToMauLimit < 180 && (
        <p className={`mt-3 text-sm font-medium ${growth.daysToMauLimit < 30 ? 'text-red-700' : growth.daysToMauLimit < 90 ? 'text-amber-700' : 'text-blue-700'}`}>
          Proyeccion: limite MAU ({auth.limitMAU.toLocaleString()}) en ~{growth.daysToMauLimit} dias
        </p>
      )}
    </div>
  )
}

function BusinessCard({ business }: { business: InfraMetrics['business'] }) {
  return (
    <div className="rounded-xl border p-5 border-green-200 bg-green-50/30">
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-sm">Negocio</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-2">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Compras hoy</p>
          <p className="text-xl font-bold">{business.purchasesToday}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Compras semana</p>
          <p className="text-xl font-bold">{business.purchasesWeek}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Revenue semana</p>
          <p className="text-xl font-bold">{business.revenueWeekEur.toFixed(2)} EUR</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Conversion</p>
          <p className="text-xl font-bold">{business.conversionRatePct.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InfrastructurePage() {
  let metrics
  try {
    metrics = await getInfraMetrics()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-2xl font-bold">Infrastructure Monitor</h1>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No se pudieron cargar las metricas de infraestructura.
          <pre className="mt-2 text-xs opacity-60">{msg}</pre>
        </div>
      </div>
    )
  }
  const mins = minutesAgo(metrics.cachedAt)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Infrastructure Monitor</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Datos actualizados hace {mins} min.
        </p>
      </div>

      {/* Semaphore banner */}
      <div className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${statusBorder(metrics.semaphore)} ${statusText(metrics.semaphore)}`}>
        <span className="font-semibold">
          {semaphoreEmoji(metrics.semaphore)} Infraestructura: {semaphoreLabel(metrics.semaphore)}
        </span>
        <span className="text-xs opacity-70">
          Actualizado hace {mins} min
        </span>
      </div>

      {/* Infra grid */}
      <h2 className="text-lg font-semibold">Free Tier Limits</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DBCard db={metrics.db} />
        <AuthCard auth={metrics.auth} />
        <UpstashCard upstash={metrics.upstash} />
        <VercelCard vercel={metrics.vercel} />
        <AICard ai={metrics.ai} />
      </div>

      {/* Growth + Business */}
      <h2 className="text-lg font-semibold">Crecimiento y Negocio</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GrowthCard growth={metrics.growth} auth={metrics.auth} />
        <BusinessCard business={metrics.business} />
      </div>

      <p className="text-xs text-muted-foreground">
        * Vercel y Upstash son estimaciones. Costes IA desde api_usage_log.
        BD y MAU son valores reales desde Supabase. Alertas se envian a aritzabuin1@gmail.com.
      </p>
    </div>
  )
}
