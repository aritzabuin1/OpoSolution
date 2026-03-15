import { Sparkles } from 'lucide-react'

/**
 * Banner informativo estático que avisa al usuario de que el contenido
 * se genera con IA y puede tardar unos segundos.
 * Se coloca en páginas donde la generación no es instantánea (/tests, /cazatrampas, /radar).
 */
export function AIGenerationBanner() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/30">
      <Sparkles className="h-4 w-4 shrink-0 text-blue-500" />
      <p className="text-sm text-blue-700 dark:text-blue-300">
        Generamos cada test con IA en tiempo real — tarda unos segundos.
      </p>
    </div>
  )
}
