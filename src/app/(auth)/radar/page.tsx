import { createClient } from '@/lib/supabase/server'
import { getProspects, calcMetrics } from '@/lib/data/prospects'
import { redirect } from 'next/navigation'
import TopBar from '@/components/ui/TopBar'
import RadarView from './RadarView'
import ProspectFormWrapper from '@/components/prospect/ProspectFormWrapper'

export default async function RadarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: settings }, prospects] = await Promise.all([
    supabase.from('profiles').select('name').eq('id', user.id).single(),
    supabase.from('radar_settings').select('default_radar_type').eq('user_id', user.id).single(),
    getProspects(user.id),
  ])

  const metrics = calcMetrics(prospects)
  const firstName = profile?.name?.split(' ')[0] ?? 'Alex'
  const initials = (profile?.name ?? 'AL').split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        greeting={`Hola, ${firstName} 👋`}
        sub="Este es tu radar de oportunidades. Enfócate, actúa y cierra."
        userInitials={initials}
        actions={<ProspectFormWrapper userId={user.id} />}
      />
      <RadarView
        prospects={prospects}
        metrics={metrics}
        defaultRadarType={settings?.default_radar_type ?? 'etapa'}
        userId={user.id}
      />
    </div>
  )
}
