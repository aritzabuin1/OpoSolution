/**
 * app/(admin)/economics/page.tsx — §2.18.7
 *
 * Unit Economics Dashboard "Fuel Tank".
 * Responde: ¿OpoRuta genera más dinero del que gasta?
 *
 * KPIs:
 *   - Fuel Tank: ingresos vs costes IA → margen bruto
 *   - Coste por usuario: coste medio por test y por usuario activo
 *   - Embudo AARRR: acquisition → revenue
 *   - Revenue mensual: últimos 6 meses
 *   - Alertas automáticas
 *
 * Server Component — datos fetcheados en el servidor con createServiceClient.
 */

import {
  getFuelTank,
  getCostPerUser,
  getAARRR,
  getMRRHistory,
  getAlerts,
} from '@/lib/admin/metrics'
import { getInfraMetrics } from '@/lib/admin/infrastructure'
import { getAdminUserIds } from '@/lib/admin/metrics-filter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle2, Info, TrendingUp } from 'lucide-react'
import Link from 'next/link'

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function MarginColor({ pct }: { pct: number }) {
  if (pct >= 40) return <span className="text-green-600 font-bold">{pct.toFixed(1)}%</span>
  if (pct >= 20) return <span className="text-amber-600 font-bold">{pct.toFixed(1)}%</span>
  return <span className="text-red-600 font-bold">{pct.toFixed(1)}%</span>
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

function AlertIcon({ nivel }: { nivel: 'error' | 'warning' | 'info' }) {
  if (nivel === 'error')
    return <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
  if (nivel === 'warning')
    return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
  return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function EconomicsPage() {
  let fuelTank, costPerUser, aarrr, mrrHistory, infra

  try {
    const adminIds = await getAdminUserIds()
    ;[fuelTank, costPerUser, aarrr, mrrHistory, infra] = await Promise.all([
      getFuelTank(adminIds),
      getCostPerUser(adminIds),
      getAARRR(adminIds),
      getMRRHistory(6, adminIds),
      getInfraMetrics(),
    ])
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-2xl font-bold">Unit Economics Dashboard</h1>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No se pudieron cargar las metricas. Probablemente faltan tablas en la BD (migrations pendientes).
          <pre className="mt-2 text-xs opacity-60">{msg}</pre>
        </div>
      </div>
    )
  }

  const alerts = getAlerts(fuelTank, costPerUser)

  // Calcular máximo para el gráfico de barras de MRR
  const maxMRR = Math.max(...mrrHistory.map((m) => m.ingresos), 1)

  const semaphoreEmoji = infra.semaphore === 'error' ? '🔴' : infra.semaphore === 'warning' ? '🟡' : '🟢'
  const semaphoreLabel = infra.semaphore === 'error' ? 'ALERTA — acción requerida' : infra.semaphore === 'warning' ? 'Atención — monitorizar' : 'Todo en orden'

  return (
    <div className="space-y-6">
      {/* §2.23 — Infrastructure semaphore card */}
      <div className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
        infra.semaphore === 'error' ? 'border-red-200 bg-red-50 text-red-800' :
        infra.semaphore === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-800' :
        'border-green-200 bg-green-50 text-green-800'
      }`}>
        <span className="flex items-center gap-2 font-medium">
          {semaphoreEmoji} Infraestructura: {semaphoreLabel}
        </span>
        <Link href="/admin/infrastructure" className="text-xs underline opacity-70 hover:opacity-100">
          Ver detalles →
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Unit Economics Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fuel Tank: ¿OpoRuta genera más dinero del que gasta?
        </p>
      </div>

      {/* ── Alertas ──────────────────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
                alert.nivel === 'error'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : alert.nivel === 'warning'
                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                  : 'border-green-200 bg-green-50 text-green-800'
              }`}
            >
              <AlertIcon nivel={alert.nivel} />
              {alert.mensaje}
            </div>
          ))}
        </div>
      )}

      {/* ── Fuel Tank ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            ⛽ Fuel Tank — Margen Bruto
            <MetricInfo text="Ingresos de Stripe menos costes de APIs de IA. El margen bruto debe ser >40% para un SaaS saludable. Si baja de 20%, los costes de IA estan comiendo el negocio." />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Ingresos</p>
              <p className="text-2xl font-extrabold text-green-600">
                €{fuelTank.ingresos.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Costes IA</p>
              <p className="text-2xl font-extrabold text-red-600">
                €{fuelTank.costes.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Margen €</p>
              <p className={`text-2xl font-extrabold ${fuelTank.margen >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                €{fuelTank.margen.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Margen %</p>
              <p className="text-2xl font-extrabold">
                <MarginColor pct={fuelTank.margenPct} />
              </p>
            </div>
          </div>

          {/* Barra de margen */}
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Costes</span>
              <span>Margen</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden flex">
              {fuelTank.ingresos > 0 && (
                <>
                  <div
                    className="h-3 bg-red-400 transition-all"
                    style={{
                      width: `${Math.min(100, (fuelTank.costes / fuelTank.ingresos) * 100)}%`,
                    }}
                  />
                  <div
                    className="h-3 bg-green-500 transition-all"
                    style={{
                      width: `${Math.max(0, (fuelTank.margen / fuelTank.ingresos) * 100)}%`,
                    }}
                  />
                </>
              )}
              {fuelTank.ingresos === 0 && (
                <div className="h-3 w-full bg-muted-foreground/20 rounded-full" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Grid 2 columnas ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Coste por usuario */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">💸 Coste por usuario (30d) <MetricInfo text="Cuanto cuesta en APIs de IA cada test generado y cada usuario activo al mes. Objetivo: <0.01 EUR/test y <0.50 EUR/usuario. Si sube, optimizar prompts o cambiar modelo." /></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Coste/test
                </p>
                <p className="text-xl font-bold">
                  €{costPerUser.costeMedioTest.toFixed(3)}
                </p>
                <p className="text-[10px] text-muted-foreground">objetivo &lt;€0.01</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Coste/usuario
                </p>
                <p className={`text-xl font-bold ${costPerUser.costeMedioUsuario > 0.5 ? 'text-red-600' : costPerUser.costeMedioUsuario > 0.25 ? 'text-amber-600' : 'text-green-600'}`}>
                  €{costPerUser.costeMedioUsuario.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground">umbral €0.50</p>
              </div>
            </div>
            <div className="space-y-1 border-t pt-3">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Usuarios activos (30d)</span>
                <span className="font-medium">{costPerUser.usuariosActivos30d}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Tests completados (30d)</span>
                <span className="font-medium">{costPerUser.testsUltimos30d}</span>
              </div>
            </div>
            {/* Barra coste/usuario vs umbral */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>€0</span>
                <span>umbral €0.50</span>
              </div>
              <ProgressBar
                value={costPerUser.costeMedioUsuario}
                max={0.5}
                color={costPerUser.costeMedioUsuario > 0.5 ? 'bg-red-500' : costPerUser.costeMedioUsuario > 0.25 ? 'bg-amber-500' : 'bg-green-500'}
              />
            </div>
          </CardContent>
        </Card>

        {/* Embudo AARRR */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Embudo AARRR
              <MetricInfo text="Modelo pirata de metricas startup: Acquisition (registros), Activation (usan el producto), Retention (vuelven), Revenue (pagan), Referral (recomiendan). Cada paso debe mejorar." />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                label: 'Acquisition',
                value: aarrr.acquisition,
                display: String(aarrr.acquisition),
                pct: 100,
                color: 'bg-primary',
                desc: 'registros totales',
              },
              {
                label: 'Activation',
                value: aarrr.activation,
                display: `${aarrr.activation.toFixed(1)}%`,
                pct: aarrr.activation,
                color: 'bg-blue-500',
                desc: 'completaron ≥1 test',
              },
              {
                label: 'Retention',
                value: aarrr.retention,
                display: `${aarrr.retention.toFixed(1)}%`,
                pct: aarrr.retention,
                color: 'bg-violet-500',
                desc: 'racha ≥3 días',
              },
              {
                label: 'Revenue',
                value: aarrr.revenue,
                display: `${aarrr.revenue.toFixed(1)}%`,
                pct: aarrr.revenue,
                color: 'bg-green-500',
                desc: 'han comprado',
              },
              {
                label: 'Referral',
                value: aarrr.referral,
                display: `${aarrr.referral.toFixed(1)}%`,
                pct: aarrr.referral,
                color: 'bg-amber-500',
                desc: 'tracking pendiente',
              },
            ].map((step) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className="w-20 text-xs font-medium text-muted-foreground shrink-0">
                  {step.label}
                </div>
                <div className="flex-1 space-y-0.5">
                  <ProgressBar value={step.pct} max={100} color={step.color} />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{step.desc}</span>
                    <span className="font-medium text-foreground">{step.display}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Revenue mensual (MRR) ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">📈 Revenue mensual (últimos 6 meses) <MetricInfo text="Ingresos totales por mes desde Stripe. Muestra la tendencia de crecimiento. El badge inferior indica el numero de transacciones por mes." /></CardTitle>
        </CardHeader>
        <CardContent>
          {mrrHistory.every((m) => m.ingresos === 0) ? (
            <div className="flex items-center gap-2 py-6 justify-center text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              Sin ventas registradas todavía.
            </div>
          ) : (
            <div className="flex items-end gap-3 h-32">
              {mrrHistory.map((punto) => {
                const heightPct = maxMRR > 0 ? (punto.ingresos / maxMRR) * 100 : 0
                return (
                  <div key={punto.mes} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                      {punto.ingresos > 0 ? `€${punto.ingresos.toFixed(0)}` : '—'}
                    </span>
                    <div className="w-full flex items-end" style={{ height: '80px' }}>
                      <div
                        className="w-full rounded-t bg-primary/80 transition-all"
                        style={{ height: `${Math.max(heightPct, punto.ingresos > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground text-center">
                      {punto.mes.slice(5)} {/* MM */}
                    </span>
                    {punto.numCompras > 0 && (
                      <Badge variant="secondary" className="text-[8px] h-4 px-1">
                        {punto.numCompras}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
