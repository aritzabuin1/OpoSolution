import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart3, LineChart, Server, Users, Activity, BookOpen, Calendar, ArrowRight } from 'lucide-react'
import { ExportMetricsButton } from '@/components/admin/ExportMetricsButton'

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Panel de Administracion</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoriza el negocio y la infraestructura de OpoRuta.
          </p>
        </div>
        <ExportMetricsButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/economics" className="group">
          <Card className="h-full hover:border-primary/40 transition-colors">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Unit Economics</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ingresos vs costes IA, margen bruto, coste por usuario, embudo AARRR y revenue mensual.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/analytics" className="group">
          <Card className="h-full hover:border-primary/40 transition-colors">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <LineChart className="h-6 w-6 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Analytics</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Conversion, churn, DAU, engagement por feature, funnel onboarding, feedback y mas.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/infrastructure" className="group">
          <Card className="h-full hover:border-primary/40 transition-colors">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Server className="h-6 w-6 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Infraestructura</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Semaforos de BD, MAU, Upstash Redis y costes IA. Limites del plan Free en tiempo real.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/users" className="group">
          <Card className="h-full hover:border-primary/40 transition-colors">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">User Explorer</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Busca usuarios, ve su timeline, balances, compras y actividad completa.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/retention" className="group">
          <Card className="h-full hover:border-primary/40 transition-colors">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Retención</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Cohortes semanales con heatmap. ¿Vuelven los usuarios?
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/content" className="group">
          <Card className="h-full hover:border-primary/40 transition-colors">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Contenido</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Cobertura del banco, notas por tema, temas problemáticos.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/activity" className="group">
          <Card className="h-full hover:border-primary/40 transition-colors">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Actividad</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Feed en tiempo real: registros, tests, compras de las últimas 24h.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
