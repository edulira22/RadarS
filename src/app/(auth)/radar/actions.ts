'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Stage } from '@/types'

export async function updateProspectStage(prospectId: string, newStage: Stage) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('prospects')
    .update({ stage: newStage })
    .eq('id', prospectId)
  if (error) throw error
  revalidatePath('/radar')
}
