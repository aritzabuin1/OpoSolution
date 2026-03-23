import { createServiceClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import { Users } from 'lucide-react'

/**
 * SocialProofCounter — Server Component
 *
 * Shows real-time social proof: registered users + questions generated.
 * Data cached for 5 minutes (unstable_cache).
 * Cialdini's Social Proof principle: people follow what others do.
 */

const getSocialProofData = unstable_cache(
  async () => {
    try {
      const supabase = await createServiceClient()

      // Count registered users (excluding admin)
      const { count: userCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_admin', false)

      // Count total questions generated (completed tests × ~10 questions each)
      const { count: testCount } = await supabase
        .from('tests_generados')
        .select('id', { count: 'exact', head: true })
        .eq('completado', true)

      return {
        users: userCount ?? 0,
        questions: (testCount ?? 0) * 10, // ~10 questions per test
      }
    } catch {
      return { users: 0, questions: 0 }
    }
  },
  ['social-proof-data'],
  { revalidate: 300 } // 5 minutes
)

export async function SocialProofCounter() {
  const data = await getSocialProofData()

  // Only show when the number is impressive enough to be social proof
  if (data.users < 50) return null

  return (
    <div className="mt-6 inline-flex items-center gap-2 rounded-full border bg-background/80 backdrop-blur px-4 py-2 text-sm text-muted-foreground">
      <Users className="h-4 w-4 text-primary" />
      <span>
        <strong className="text-foreground">{data.users}+ opositores</strong> ya preparan con OpoRuta
        {data.questions > 50 && (
          <> · <strong className="text-foreground">{data.questions.toLocaleString('es-ES')}</strong> preguntas generadas</>
        )}
      </span>
    </div>
  )
}
