import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TopBar from '@/components/ui/TopBar'
import { ACTIVITY_LABELS } from '@/lib/tokens'
import { relativeDate } from '@/lib/utils'
import Link from 'next/link'

export default async function ActividadesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: activities } = await supabase
    .from('activities')
    .select('*, prospects(name, company), profiles(name)')
    .eq('user_id', user.id)
    .order('activity_date', { ascending: false })
    .limit(100)

  const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
  const initials = (profile?.name ?? 'AL').split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        greeting="Actividades"
        sub={`${(activities ?? []).length} registros recientes`}
        userInitials={initials}
      />

      <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
        <div className="max-w-2xl flex flex-col gap-2">
          {(activities ?? []).map((a: {
            id: string
            type: string
            title: string
            description: string | null
            activity_date: string
            prospects: { name: string; company: string | null } | null
            profiles: { name: string } | null
          }) => (
            <div key={a.id} className="p-4 rounded-xl"
              style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--color-bg-2)', color: 'var(--color-fg-dim)' }}>
                      {ACTIVITY_LABELS[a.type as keyof typeof ACTIVITY_LABELS] ?? a.type}
                    </span>
                    {a.prospects && (
                      <Link href={`/prospectos/${(a as { prospect_id?: string }).prospect_id ?? ''}`}
                        className="text-xs font-semibold hover:underline"
                        style={{ color: 'var(--color-ocean)' }}>
                        {a.prospects.name} · {a.prospects.company}
                      </Link>
                    )}
                  </div>
                  {a.description && (
                    <div className="text-sm mt-1.5 leading-snug" style={{ color: 'var(--color-fg)' }}>
                      {a.description}
                    </div>
                  )}
                </div>
                <div className="text-[11px] flex-shrink-0" style={{ color: 'var(--color-fg-muted)', fontFamily: 'var(--font-mono)' }}>
                  {relativeDate(a.activity_date)}
                </div>
              </div>
            </div>
          ))}

          {(activities ?? []).length === 0 && (
            <div className="text-center py-16" style={{ color: 'var(--color-fg-muted)' }}>
              Sin actividades registradas aún.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
