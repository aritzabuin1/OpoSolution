import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, ClipboardCheck, CreditCard, Sparkles, Target, User, Zap } from 'lucide-react'
import { getUserDetail, getUserTimeline, type TimelineEvent } from '@/lib/admin/user-explorer'
import { verifyAdmin } from '@/lib/admin/auth'
import { redirect } from 'next/navigation'

export const metadata = { title: 'User Detail — Admin' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function UserDetailPage({ params }: Props) {
  const auth = await verifyAdmin('admin/users/[id]')
  if (!auth.authorized) redirect('/login')

  const { id } = await params
  const [user, timeline] = await Promise.all([
    getUserDetail(id),
    getUserTimeline(id),
  ])

  if (!user) notFound()

  const daysRegistered = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
        <ArrowLeft className="h-3 w-3" /> Volver a búsqueda
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <User className="h-5 w-5" /> {user.email}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {user.fullName ?? '—'} · {user.oposicionNombre ?? 'Sin oposición'} · Registrado hace {daysRegistered}d
          </p>
        </div>
        <div className="flex gap-2">
          {user.isAdmin && <Badge className="bg-red-100 text-red-700">Admin</Badge>}
          {user.isPremium && !user.isAdmin && <Badge className="bg-green-100 text-green-700">Premium</Badge>}
          {!user.isPremium && <Badge variant="secondary">Free</Badge>}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<ClipboardCheck className="h-4 w-4 text-blue-500" />} label="Tests" value={user.testsCompleted} />
        <StatCard icon={<Target className="h-4 w-4 text-green-500" />} label="Temas explorados" value={user.temasExplored} />
        <StatCard icon={<Sparkles className="h-4 w-4 text-purple-500" />} label="Nota media" value={user.avgScore !== null ? `${user.avgScore}%` : '—'} />
        <StatCard icon={<CreditCard className="h-4 w-4 text-emerald-500" />} label="Revenue" value={`€${user.totalSpent.toFixed(2)}`} />
      </div>

      {/* Balances */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Análisis IA</p>
              <p className="font-semibold">{user.correctionsBalance} restantes</p>
              <p className="text-xs text-muted-foreground">{user.freeCorrectionsUsed}/2 gratis usados</p>
            </div>
            <div>
              <p className="text-muted-foreground">Supuestos</p>
              <p className="font-semibold">{user.supuestosBalance} restantes</p>
            </div>
            <div>
              <p className="text-muted-foreground">Racha</p>
              <p className="font-semibold">{user.rachaActual} días</p>
            </div>
            <div>
              <p className="text-muted-foreground">Último test</p>
              <p className="font-semibold">{user.lastTestDate ? formatDate(user.lastTestDate) : '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchases */}
      {user.purchases.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Compras ({user.purchases.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {user.purchases.map((p, i) => (
                <div key={i} className="flex justify-between py-2 text-sm">
                  <span>{p.tipo}</span>
                  <span className="font-medium">€{p.amount.toFixed(2)} — {formatDate(p.date)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Timeline ({timeline.length} eventos)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {timeline.map((event, i) => (
              <TimelineRow key={i} event={event} />
            ))}
            {timeline.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">Sin actividad</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-muted-foreground">{label}</span></div>
        <p className="text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}

const TYPE_ICONS: Record<string, string> = {
  register: '📝',
  test: '📋',
  test_completed: '✅',
  analysis: '🔬',
  purchase: '💳',
  supuesto: '📄',
  nurture: '📧',
}

const TYPE_COLORS: Record<string, string> = {
  register: 'border-blue-200',
  test: 'border-muted',
  test_completed: 'border-green-200',
  analysis: 'border-purple-200',
  purchase: 'border-emerald-200',
  supuesto: 'border-amber-200',
  nurture: 'border-pink-200',
}

function TimelineRow({ event }: { event: TimelineEvent }) {
  return (
    <div className={`flex items-start gap-3 py-2 pl-2 border-l-2 ${TYPE_COLORS[event.type] ?? 'border-muted'}`}>
      <span className="text-sm shrink-0 mt-0.5">{TYPE_ICONS[event.type] ?? '•'}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm">{event.detail}</p>
        <p className="text-xs text-muted-foreground">{formatDateTime(event.date)}</p>
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
