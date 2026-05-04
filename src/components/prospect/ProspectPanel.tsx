'use client'

import { X, Phone, Mail, Calendar, MessageCircle, FileText } from 'lucide-react'
import Link from 'next/link'
import type { ProspectView } from '@/types'
import { STAGE_COLORS, TEMP_COLORS, TEMP_LABELS, STAGE_LABELS } from '@/lib/tokens'
import { fmtMoney, fmtDateTime } from '@/lib/utils'

interface Props {
  prospect: ProspectView
  onClose: () => void
}

const QUICK_ACTIONS = [
  { icon: Phone,        color: '#22c55e', label: 'Registrar llamada' },
  { icon: Mail,         color: '#2563EB', label: 'Enviar propuesta'  },
  { icon: Calendar,     color: '#a855f7', label: 'Agendar reunión'   },
  { icon: FileText,     color: '#F2B705', label: 'Agregar nota'      },
]

export default function ProspectPanel({ prospect, onClose }: Props) {
  const stageC = STAGE_COLORS[prospect.stage as keyof typeof STAGE_COLORS] ?? STAGE_COLORS.base
  const tempColor = TEMP_COLORS[prospect.temperature] ?? '#9ca3af'
  const tempLabel = TEMP_LABELS[prospect.temperature] ?? prospect.temperature
  const stageLabel = STAGE_LABELS[prospect.stage] ?? prospect.stage

  return (
    <aside
      className="w-[300px] flex-shrink-0 flex flex-col gap-3.5 overflow-y-auto pb-6"
      style={{ scrollbarWidth: 'thin' }}>

      {/* Profile card */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-base text-white flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg,#475569,#334155)',
                border: `3px solid ${tempColor}`,
                fontFamily: 'var(--font-display)',
              }}>
              {prospect.initials}
            </div>
            <div>
              <div className="text-[17px] font-bold" style={{ color: 'var(--color-fg-hi)' }}>{prospect.name}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-fg-dim)' }}>{prospect.company}</div>
              <div className="mt-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: stageC.ring, color: stageC.label, border: `1px solid ${stageC.border}` }}>
                  ● {stageLabel}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: 'var(--color-fg-dim)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Value */}
        <div className="mb-3.5">
          <div className="text-xs" style={{ color: 'var(--color-fg-dim)' }}>Valor potencial</div>
          <div className="text-[28px] font-bold mt-0.5"
            style={{ color: 'var(--color-fg-hi)', fontFamily: 'var(--font-mono)' }}>
            {prospect.potential_value ? fmtMoney(prospect.potential_value) : '—'}
          </div>
        </div>

        {/* Probability */}
        {prospect.probability !== null && (
          <div className="mb-3.5">
            <div className="text-xs" style={{ color: 'var(--color-fg-dim)' }}>Probabilidad de cierre</div>
            <div className="text-lg font-bold mt-0.5"
              style={{ color: 'var(--color-fg-hi)', fontFamily: 'var(--font-mono)' }}>
              {prospect.probability}%
            </div>
            <div className="mt-1.5 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border-soft)' }}>
              <div className="h-full rounded-full"
                style={{
                  width: `${prospect.probability}%`,
                  background: 'linear-gradient(90deg, var(--color-ocean), var(--color-cyan))',
                }} />
            </div>
          </div>
        )}

        {/* Temperature */}
        <div className="mb-3.5">
          <div className="text-xs mb-1" style={{ color: 'var(--color-fg-dim)' }}>Temperatura</div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full" style={{ background: tempColor }} />
            <span style={{ color: tempColor }}>{tempLabel}</span>
          </span>
        </div>

        {/* Next action */}
        {prospect.next_action_type && (
          <div className="mb-4">
            <div className="text-xs mb-1.5" style={{ color: 'var(--color-fg-dim)' }}>Próxima acción</div>
            <div className="flex items-start gap-2.5">
              <Calendar size={15} style={{ color: 'var(--color-fg-dim)', marginTop: 1, flexShrink: 0 }} />
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--color-fg-hi)' }}>
                  {prospect.next_action_type.replace('_', ' ')}
                </div>
                {prospect.next_action_date && (
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-fg-dim)', fontFamily: 'var(--font-mono)' }}>
                    {fmtDateTime(prospect.next_action_date)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <Link
          href={`/prospectos/${prospect.id}`}
          className="flex h-10 items-center justify-center rounded-xl text-sm font-semibold text-white w-full transition-opacity hover:opacity-90"
          style={{ background: 'var(--color-ocean)' }}>
          Ver detalle completo
        </Link>
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        <div className="text-sm font-bold mb-3" style={{ color: 'var(--color-fg-hi)' }}>Acciones rápidas</div>
        <div className="flex flex-col gap-2">
          {QUICK_ACTIONS.map(a => {
            const Icon = a.icon
            return (
              <button key={a.label}
                className="flex items-center gap-3 px-1 py-1.5 rounded-lg text-sm font-medium text-left transition-colors hover:opacity-80 w-full"
                style={{ color: 'var(--color-fg-hi)', background: 'transparent', border: 'none' }}>
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
                  style={{ background: a.color + '18', color: a.color }}>
                  <Icon size={16} />
                </div>
                {a.label}
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
