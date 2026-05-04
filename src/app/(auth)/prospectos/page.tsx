import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProspects, calcMetrics } from '@/lib/data/prospects'
import TopBar from '@/components/ui/TopBar'
import ProspectFormWrapper from '@/components/prospect/ProspectFormWrapper'
import ProspectTable from './ProspectTable'
import { fmtMoney } from '@/lib/utils'

export default async function ProspectosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const prospects = await getProspects(user.id)
  const metrics = calcMetrics(prospects)
  const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
  const initials = (profile?.name ?? 'AL').split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        greeting="Clientes"
        sub={
          <span>
            {metrics.total.count} oportunidades ·{' '}
            <span style={{ color: 'var(--color-ocean)', fontWeight: 600 }}>
              {fmtMoney(metrics.total.value)}
            </span>{' '}
            potencial total
          </span>
        }
        userInitials={initials}
        actions={<ProspectFormWrapper userId={user.id} />}
      />

      <div className="flex-1 flex flex-col min-h-0 px-6 pb-5 gap-3.5 overflow-hidden pt-1">
        <ProspectTable prospects={prospects} />
      </div>
    </div>
  )
}
