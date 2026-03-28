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

      return { users: userCount ?? 0 }
    } catch {
      return { users: 0 }
    }
  },
  ['social-proof-data'],
  { revalidate: 300 } // 5 minutes
)

export async function SocialProofCounter() {
  const data = await getSocialProofData()

  // Show as soon as there are real users
  if (data.users < 3) return null

  return (
    <div className="mt-6 inline-flex items-center gap-2 rounded-full border bg-background/80 backdrop-blur px-4 py-2 text-sm text-muted-foreground">
      <Users className="h-4 w-4 text-primary" />
      <span>
        <strong className="text-foreground">{data.users}+ opositores</strong> ya preparan con OpoRuta
      </span>
    </div>
  )
}
