import { Suspense } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Users } from 'lucide-react'
import { getUserSearch } from '@/lib/admin/user-explorer'
import { verifyAdmin } from '@/lib/admin/auth'
import { redirect } from 'next/navigation'

export const metadata = { title: 'User Explorer — Admin' }

interface Props {
  searchParams?: Promise<Record<string, string>>
}

export default async function UsersPage({ searchParams }: Props) {
  const auth = await verifyAdmin('admin/users')
  if (!auth.authorized) redirect('/login')

  const params = await (searchParams ?? Promise.resolve({}))
  const query = (params.q ?? '').trim()

  const users = query.length >= 2 ? await getUserSearch(query) : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" /> User Explorer
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Buscar usuarios por email o nombre. Click para ver timeline completa.
        </p>
      </div>

      {/* Search */}
      <form className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            name="q"
            type="text"
            defaultValue={query}
            placeholder="Buscar por email o nombre..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            autoFocus
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Buscar
        </button>
      </form>

      {/* Results */}
      {query.length >= 2 && (
        <Suspense fallback={<p className="text-sm text-muted-foreground">Buscando...</p>}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{users.length} resultado{users.length !== 1 ? 's' : ''}</CardTitle>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No se encontraron usuarios con &quot;{query}&quot;
                </p>
              ) : (
                <div className="divide-y">
                  {users.map(user => (
                    <Link
                      key={user.id}
                      href={`/admin/users/${user.id}`}
                      className="flex items-center justify-between py-3 hover:bg-muted/50 -mx-3 px-3 rounded transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{user.email}</p>
                          {user.isPremium && <Badge className="text-[10px] bg-green-100 text-green-700">Premium</Badge>}
                          {!user.isPremium && <Badge variant="secondary" className="text-[10px]">Free</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {user.fullName ?? '—'} · {user.oposicion ?? 'Sin oposición'}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-sm font-medium tabular-nums">{user.testsCompleted} tests</p>
                        <p className="text-xs text-muted-foreground">{user.temasExplored} temas</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Suspense>
      )}

      {query.length > 0 && query.length < 2 && (
        <p className="text-sm text-muted-foreground">Escribe al menos 2 caracteres</p>
      )}
    </div>
  )
}
