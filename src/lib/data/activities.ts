import { createClient } from '@/lib/supabase/server'
import type { Activity } from '@/types'

export async function getActivities(prospectId: string): Promise<Activity[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('activities')
    .select('*, profiles(name)')
    .eq('prospect_id', prospectId)
    .order('activity_date', { ascending: false })
    .limit(50)
  if (error) throw error
  return data ?? []
}

export async function createActivity(payload: {
  prospect_id: string
  user_id: string
  type: string
  title: string
  description?: string
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('activities').insert({
    ...payload,
    activity_date: new Date().toISOString(),
  })
  if (error) throw error
}
