import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProspect } from '@/lib/data/prospects'
import { getActivities } from '@/lib/data/activities'
import TopBar from '@/components/ui/TopBar'
import ActivityTimeline from '@/components/prospect/ActivityTimeline'
import ProspectFormWrapper from '@/components/prospect/ProspectFormWrapper'
import { STAGE_COLORS, STAGE_LABELS, TEMP_COLORS, TEMP_LABELS, ACTION_LABELS } from '@/lib/tokens'
import { fmtMoney, fmtDateTime } from '@/lib/utils'
import {
  Building2, Phone, Mail, MapPin, UserPlus,
  Flame, Calendar, Check, Share2,
} from 'lucide-react'

const STAGES = ['base', 'prospeccion', 'interes', 'decision', 'cierre'] as const
const STAGE_COLORS_LIST = ['#6B8FB5', '#2563EB', '#F25C05', '#F2B705', '#22c55e']

export default async function ProspectProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [prospect, activities] = await Promise.all([
    getProspect(id),
    getActivities(id),
  ])

  if (!prospect) notFound()

  const stageC = STAGE_COLORS[prospect.stage as keyof typeof STAGE_COLORS] ?? STAGE_COLORS.base
  const tempColor = TEMP_COLORS[prospect.temperature] ?? '#9ca3af'
  const currentStageIdx = STAGES.indexOf(prospect.stage as typeof STAGES[number])

  const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
  const initials = (profile?.name ?? 'AL').split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        greeting={prospect.name}
        sub={`Clientes · ${prospect.company ?? ''}`}
        userInitials={initials}
        actions={
          <>
            <button className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-medium"
              style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}>
              <Share2 size={14} /> Compartir
            </button>
            <ProspectFormWrapper userId={user.id} prospect={prospect} />
          </>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 pb-6 pt-1">
        <div className="grid gap-5" style={{ gridTemplateColumns: '5fr 7fr' }}>
          {/* Left column */}
          <div className="flex flex-col gap-3.5">
            {/* Hero card */}
            <Card>
              <div className="flex items-center gap-4">
                <div className="w-[68px] h-[68px] rounded-full flex items-center justify-center font-bold text-lg text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#475569,#334155)', border: `3px solid ${tempColor}`, fontFamily: 'var(--font-display)' }}>
                  {prospect.initials}
                </div>
                <div className="flex-1">
                  <div className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--color-fg-hi)' }}>{prospect.name}</div>
                  {prospect.company && (
                    <div className="flex items-center gap-1.5 text-sm mt-0.5" style={{ color: 'var(--color-fg-dim)' }}>
                      <Building2 size={12} /> {prospect.company}
                    </div>
                  )}
                  <div className="flex gap-1.5 mt-2">
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: stageC.ring, color: stageC.label, border: `1px solid ${stageC.border}` }}>
                      ● {STAGE_LABELS[prospect.stage] ?? prospect.stage}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: tempColor + '20', color: tempColor }}>
                      ● {TEMP_LABELS[prospect.temperature] ?? prospect.temperature}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Contact */}
            <Card title="Contacto">
              {prospect.phone && <ContactRow icon={Phone}   color="#22c55e" label={prospect.phone}  sub="Móvil" />}
              {prospect.email && <ContactRow icon={Mail}    color="#2563EB" label={prospect.email}  sub="Correo" />}
              {prospect.source && <ContactRow icon={UserPlus} color="#F2B705" label={`Fuente: ${prospect.source}`} sub="" />}
              {prospect.contact_medium && <ContactRow icon={MapPin} color="#04C4D9" label={`Medio: ${prospect.contact_medium}`} sub="Preferido" />}
            </Card>

            {/* Metrics */}
            <Card title="Métricas">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px]" style={{ color: 'var(--color-fg-dim)' }}>VALOR POTENCIAL</div>
                  <div className="text-2xl font-bold mt-0.5" style={{ color: 'var(--color-fg-hi)', fontFamily: 'var(--font-mono)' }}>
                    {prospect.potential_value ? fmtMoney(prospect.potential_value) : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px]" style={{ color: 'var(--color-fg-dim)' }}>TEMPERATURA</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Flame size={18} style={{ color: tempColor }} />
                    <span className="text-base font-bold" style={{ color: tempColor }}>
                      {TEMP_LABELS[prospect.temperature]}
                    </span>
                  </div>
                </div>
              </div>
              {prospect.probability !== null && (
                <div className="mt-3.5">
                  <div className="flex justify-between text-[11px] mb-1.5" style={{ color: 'var(--color-fg-dim)' }}>
                    <span>Probabilidad</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-fg-hi)', fontWeight: 700 }}>
                      {prospect.probability}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border-soft)' }}>
                    <div className="h-full rounded-full"
                      style={{
                        width: `${prospect.probability}%`,
                        background: 'linear-gradient(90deg, var(--color-ocean), var(--color-cyan))',
                      }} />
                  </div>
                </div>
              )}
            </Card>

            {/* Stage stepper */}
            <Card title="Etapa actual">
              <div className="flex items-center">
                {STAGES.map((s, i) => {
                  const reached = i <= currentStageIdx
                  const active = i === currentStageIdx
                  const color = STAGE_COLORS_LIST[i]
                  return (
                    <div key={s} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{
                            background: reached ? color : 'var(--color-card-soft)',
                            border: `2px solid ${reached ? color : 'var(--color-border)'}`,
                            boxShadow: active ? `0 0 0 4px ${color}33` : 'none',
                          }}>
                          {reached && <Check size={13} color="#fff" strokeWidth={2.5} />}
                        </div>
                        <span className="text-[10px] font-semibold"
                          style={{ color: active ? color : 'var(--color-fg-dim)' }}>
                          {STAGE_LABELS[s]?.split(' ')[0]}
                        </span>
                      </div>
                      {i < STAGES.length - 1 && (
                        <div className="flex-1 h-0.5 mb-4 mx-1"
                          style={{ background: i < currentStageIdx ? STAGE_COLORS_LIST[i] : 'var(--color-border)' }} />
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Next action */}
            {prospect.next_action_type && (
              <Card title="Próxima acción">
                <div className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--color-card-soft)', border: '1px solid var(--color-border-soft)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--color-gold)20', color: 'var(--color-gold)' }}>
                    <Calendar size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--color-fg-hi)' }}>
                      {ACTION_LABELS[prospect.next_action_type]}
                    </div>
                    {prospect.next_action_date && (
                      <div className="text-xs mt-0.5" style={{ color: 'var(--color-fg-dim)', fontFamily: 'var(--font-mono)' }}>
                        {fmtDateTime(prospect.next_action_date)}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-3.5" style={{ minHeight: 0 }}>
            <ActivityTimeline
              activities={activities}
              prospectId={prospect.id}
              userId={user.id}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function Card({ title, action, children }: { title?: string; action?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
      {title && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-bold" style={{ color: 'var(--color-fg-hi)' }}>{title}</span>
          {action && <span className="text-xs font-semibold" style={{ color: 'var(--color-ocean)' }}>{action}</span>}
        </div>
      )}
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  )
}

function ContactRow({
  icon: Icon, color, label, sub,
}: {
  icon: React.ElementType; color: string; label: string; sub: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + '18', color }}>
        <Icon size={15} />
      </div>
      <div>
        <div className="text-sm font-medium" style={{ color: 'var(--color-fg-hi)' }}>{label}</div>
        {sub && <div className="text-xs" style={{ color: 'var(--color-fg-dim)' }}>{sub}</div>}
      </div>
    </div>
  )
}
