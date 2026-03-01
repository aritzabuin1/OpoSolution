'use client'

/**
 * components/cuenta/AccountActions.tsx — §1.14.4, 1.14.5, 1.14.6
 *
 * Acciones de cuenta: cerrar sesión, exportar datos, eliminar cuenta.
 * Client Component para manejo de eventos.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Download, LogOut, Loader2, Trash2 } from 'lucide-react'

export function AccountActions() {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  // ── Cerrar sesión ──────────────────────────────────────────────────────────
  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // ── Exportar datos ─────────────────────────────────────────────────────────
  async function handleExport() {
    setExportLoading(true)
    try {
      const res = await fetch('/api/user/export')
      if (!res.ok) throw new Error('Error al exportar')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `optek-datos-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Datos exportados correctamente')
    } catch {
      toast.error('No se pudieron exportar los datos')
    } finally {
      setExportLoading(false)
    }
  }

  // ── Eliminar cuenta ────────────────────────────────────────────────────────
  async function handleDelete() {
    if (deleteConfirm !== 'ELIMINAR') return
    setDeleting(true)
    try {
      const res = await fetch('/api/user/delete', { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      toast.success('Cuenta eliminada. Redirigiendo...')
      setTimeout(() => router.push('/'), 2000)
    } catch {
      toast.error('No se pudo eliminar la cuenta. Inténtalo más tarde.')
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Cerrar sesión */}
      <Button
        variant="outline"
        onClick={handleSignOut}
        disabled={signingOut}
        className="w-full sm:w-auto"
      >
        {signingOut ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <LogOut className="w-4 h-4 mr-2" />
        )}
        Cerrar sesión
      </Button>

      {/* Exportar datos */}
      <Button
        variant="outline"
        onClick={handleExport}
        disabled={exportLoading}
        className="w-full sm:w-auto"
      >
        {exportLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        Exportar mis datos (JSON)
      </Button>

      {/* Eliminar cuenta */}
      <div className="pt-4 border-t">
        <p className="text-sm text-muted-foreground mb-2">Zona de peligro</p>
        <Button
          variant="destructive"
          onClick={() => setDeleteDialogOpen(true)}
          className="w-full sm:w-auto"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Eliminar mi cuenta
        </Button>
      </div>

      {/* Dialog de confirmación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar tu cuenta?</DialogTitle>
            <DialogDescription>
              Esta acción es irreversible. Se eliminarán todos tus datos: tests, correcciones,
              historial y compras. No hay recuperación posible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm">
              Para confirmar, escribe <span className="font-mono font-bold">ELIMINAR</span> en el
              campo de abajo:
            </p>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="ELIMINAR"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConfirm !== 'ELIMINAR' || deleting}
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Eliminar cuenta definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
