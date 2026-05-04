import { createClient } from '@/lib/supabase/server'
import { calcTemperature, getInitials } from '@/lib/utils'
import type { Prospect, ProspectView, RadarMetrics } from '@/types'

export async function getProspects(userId: string): Promise<ProspectView[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('prospects')
    .select(`
      *,
      prospect_tags (
        tags (id, name, color)
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((p: Prospect & { prospect_tags?: Array<{ tags: unknown }> }) => ({
    ...p,
    temperature: calcTemperature(p.next_action_date, p.last_contact_date, p.status),
    initials: getInitials(p.name),
    tags: (p.prospect_tags ?? []).map((pt: { tags: unknown }) => pt.tags as import('@/types').Tag).filter(Boolean),
  }))
}

export async function getProspect(id: string): Promise<ProspectView | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('prospects')
    .select(`
      *,
      prospect_tags (
        tags (id, name, color)
      )
    `)
    .eq('id', id)
    .single()

  if (error) return null

  return {
    ...data,
    temperature: calcTemperature(data.next_action_date, data.last_contact_date, data.status),
    initials: getInitials(data.name),
    tags: (data.prospect_tags ?? []).map((pt: { tags: unknown }) => pt.tags).filter(Boolean),
  }
}

export function calcMetrics(prospects: ProspectView[]): RadarMetrics {
  const active = ['base', 'prospeccion', 'interes', 'decision', 'cierre'] as const
  const metrics = {} as RadarMetrics

  for (const stage of active) {
    const group = prospects.filter(p => p.stage === stage)
    metrics[stage] = {
      count: group.length,
      value: group.reduce((s, p) => s + (p.potential_value ?? 0), 0),
    }
  }

  metrics.total = {
    count: prospects.filter(p => active.includes(p.stage as typeof active[number])).length,
    value: active.reduce((s, st) => s + metrics[st].value, 0),
  }

  return metrics
}
