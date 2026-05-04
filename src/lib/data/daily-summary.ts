import { createClient } from '@/lib/supabase/server'
import type { DailySummary } from '@/types'

export async function getDailySummary(userId: string): Promise<DailySummary> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const monthStart = today.slice(0, 7) + '-01'

  const [{ data: prospects }, { data: meetings }, { data: closings }] = await Promise.all([
    supabase
      .from('prospects')
      .select('stage, potential_value')
      .eq('user_id', userId)
      .eq('status', 'active'),
    supabase
      .from('activities')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'reunion')
      .gte('activity_date', today + 'T00:00:00')
      .lt('activity_date', today + 'T23:59:59'),
    supabase
      .from('prospects')
      .select('id')
      .eq('user_id', userId)
      .eq('stage', 'ganado')
      .gte('updated_at', monthStart),
  ])

  const moneyInDecision = (prospects ?? [])
    .filter((p: { stage: string; potential_value: number | null }) => p.stage === 'decision')
    .reduce((sum: number, p: { potential_value: number | null }) => sum + (p.potential_value ?? 0), 0)

  return {
    moneyInDecision,
    totalOpportunities: (prospects ?? []).length,
    meetingsToday: (meetings ?? []).length,
    closingsThisMonth: (closings ?? []).length,
  }
}
