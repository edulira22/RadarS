'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText, Phone, MessageCircle, Mail, Users,
  ArrowRight, Sparkles, Send,
} from 'lucide-react'
import type { Activity, ActivityType } from '@/types'
import { ACTIVITY_LABELS } from '@/lib/tokens'
import { relativeDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/browser'

const ACTIVITY_ICONS: Record<ActivityType, React.ElementType> = {
  nota:              FileText,
  llamada:           Phone,
  whatsapp:          MessageCircle,
  correo:            Mail,
  reunion:           Users,
  propuesta_enviada: FileText,
  seguimiento:       ArrowRight,
  cambio_etapa:      ArrowRight,
}

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  nota:              '#F2B705',
  llamada:           '#22c55e',
  whatsapp:          '#22c55e',
  correo:            '#2563EB',
  reunion:           '#a855f7',
  propuesta_enviada: '#2563EB',
  seguimiento:       '#04C4D9',
  cambio_etapa:      '#04C4D9',
}

const QUICK_TYPES: Array<{ type: ActivityType; icon: React.ElementType }> = [
  { type: 'nota',     icon: FileText      },
  { type: 'llamada',  icon: Phone         },
  { type: 'whatsapp', icon: MessageCircle },
  { type: 'correo',   icon: Mail          },
  { type: 'reunion',  icon: Users         },
]

interface Props {
  activities: Activity[]
  prospectId: string
  userId: string
}

export default function ActivityTimeline({ activities: initial, prospectId, userId }: Props) {
  const router = useRouter()
  const [activities, setActivities] = useState(initial)
  const [quickType, setQuickType] = useState<ActivityType>('nota')
  const [quickText, setQuickText] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!quickText.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('activities')
      .insert({
        prospect_id: prospectId,
        user_id: userId,
        type: quickType,
        title: ACTIVITY_LABELS[quickType],
        description: quickText,
        activity_date: new Date().toISOString(),
      })
      .select('*, profiles(name)')
      .single()
    if (data) setActivities(prev => [data as Activity, ...prev])
    setQuickText('')
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="flex-1 flex flex-col rounded-2xl overflow-hidden"
      style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
      <div className="px-5 pt-5 pb-0">
        <div className="text-sm font-bold mb-3" style={{ color: 'var(--color-fg-hi)' }}>
          Bitácora · {activities.length} actividades
        </div>

        {/* Quick log */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl mb-5"
          style={{ background: 'var(--color-card-soft)', border: '1px solid var(--color-border)' }}>
          <div className="flex gap-1">
            {QUICK_TYPES.map(qt => {
              const Icon = qt.icon
              const isActive = quickType === qt.type
              const color = ACTIVITY_COLORS[qt.type]
              return (
                <button key={qt.type}
                  onClick={() => setQuickType(qt.type)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    background: isActive ? color + '20' : 'var(--color-card)',
                    color: isActive ? color : 'var(--color-fg-dim)',
                    border: `1px solid ${isActive ? color + '40' : 'var(--color-border)'}`,
                  }}>
                  <Icon size={13} />
                </button>
              )
            })}
          </div>
          <input
            value={quickText}
            onChange={e => setQuickText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="Registrar actividad rápida…"
            className="flex-1 bg-transparent border-none outline-none text-sm h-8"
            style={{ color: 'var(--color-fg-hi)' }}
          />
          <button
            onClick={handleSave}
            disabled={saving || !quickText.trim()}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
            style={{ background: 'var(--color-ocean)' }}>
            <Send size={12} />
            Guardar
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <div className="relative flex flex-col gap-4">
          {/* Vertical line */}
          <div className="absolute left-[17px] top-3 bottom-3 w-0.5"
            style={{ background: 'var(--color-border)' }} />

          {activities.map(a => {
            const type = a.type as ActivityType
            const Icon = ACTIVITY_ICONS[type] ?? FileText
            const color = ACTIVITY_COLORS[type] ?? '#9ca3af'
            return (
              <div key={a.id} className="flex gap-4 relative">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                  style={{
                    background: 'var(--color-card)',
                    border: `2px solid ${color}`,
                    color,
                  }}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-fg-hi)' }}>
                      {(a.profiles as { name?: string } | null)?.name ?? 'Tú'}
                    </span>
                    <span className="text-[11px]"
                      style={{ color: 'var(--color-fg-dim)', fontFamily: 'var(--font-mono)' }}>
                      {relativeDate(a.activity_date)}
                    </span>
                  </div>
                  {a.description && (
                    <div className="text-sm mt-0.5 leading-snug" style={{ color: 'var(--color-fg)' }}>
                      {a.description}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {activities.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12">
              <Sparkles size={24} style={{ color: 'var(--color-fg-muted)' }} />
              <div className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>Sin actividades aún</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
