/**
 * Maps oposicion UUIDs to human-readable labels.
 * Used by admin notification emails to show which oposicion a user selected.
 */
const OPOSICION_LABELS: Record<string, string> = {
  'a0000000-0000-0000-0000-000000000001': 'Auxiliar Administrativo (C2)',
  'b0000000-0000-0000-0000-000000000001': 'Administrativo del Estado (C1)',
  'c2000000-0000-0000-0000-000000000001': 'Gestión del Estado (A2)',
}

export function resolveOposicionLabel(oposicionId: string): string {
  return OPOSICION_LABELS[oposicionId] ?? oposicionId
}
