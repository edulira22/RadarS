'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, MessageCircle, Mail, FileText } from 'lucide-react'
import type { ProspectView } from '@/types'
import { STAGE_COLORS, TEMP_COLORS, TEMP_LABELS, STAGE_LABELS } from '@/lib/tokens'
import { fmtMoney, relativeDate, fmtDateTime } from '@/lib/utils'
import ProspectPanel from '@/components/prospect/ProspectPanel'

const COLS = ['Prospecto', 'Etapa', 'Valor pot.', 'Temperatura', 'Próxima acción', 'Últ. contacto', 'Acciones']

interface Props { prospects: ProspectView[] }

export default function ProspectTable({ prospects }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const router = useRouter()
  const selected = prospects.find(p => p.id === selectedId) ?? null

  return (
    <div className="flex gap-4 flex-1 min-h-0">
      <div className="flex-1 rounded-2xl overflow-hidden flex flex-col"
        style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
        {/* Header */}
        <div className="grid px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.5px] flex-shrink-0"
          style={{
            gridTemplateColumns: '2.4fr 1.2fr 1.1fr 1.2fr 1.6fr 1fr 0.9fr',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-card-soft)',
            color: 'var(--color-fg-dim)',
          }}>
          {COLS.map(h => <div key={h}>{h}</div>)}
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto">
          {prospects.map(p => {
            const sc = STAGE_COLORS[p.stage as keyof typeof STAGE_COLORS] ?? STAGE_COLORS.base
            const tc = TEMP_COLORS[p.temperature] ?? '#9ca3af'
            const isSel = p.id === selectedId
            return (
              <div key={p.id}
                className="grid px-5 py-3.5 items-center cursor-pointer transition-colors hover:opacity-90"
                style={{
                  gridTemplateColumns: '2.4fr 1.2fr 1.1fr 1.2fr 1.6fr 1fr 0.9fr',
                  background: isSel ? '#EEF4FF' : 'transparent',
                  borderLeft: isSel ? '3px solid var(--color-ocean)' : '3px solid transparent',
                  borderBottom: '1px solid var(--color-border-soft)',
                }}
                onClick={() => setSelectedId(isSel ? null : p.id)}>

                {/* Prospecto */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#475569,#334155)', border: `2px solid ${tc}` }}>
                    {p.initials}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold" style={{ color: 'var(--color-fg-hi)' }}
                      onClick={(e) => { e.stopPropagation(); router.push(`/prospectos/${p.id}`) }}>
                      {p.name}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-fg-dim)' }}>{p.company}</div>
                  </div>
                </div>

                {/* Etapa */}
                <div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ background: sc.ring, color: sc.label, border: `1px solid ${sc.border}` }}>
                    ● {STAGE_LABELS[p.stage]}
                  </span>
                </div>

                {/* Valor */}
                <div className="text-[13px] font-semibold" style={{ color: 'var(--color-fg-hi)', fontFamily: 'var(--font-mono)' }}>
                  {p.potential_value ? fmtMoney(p.potential_value) : '—'}
                </div>

                {/* Temperatura */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ background: tc }} />
                  <span style={{ color: tc, fontWeight: 600 }}>{TEMP_LABELS[p.temperature]}</span>
                </div>

                {/* Próxima acción */}
                <div className="text-xs" style={{ color: 'var(--color-fg)' }}>
                  {p.next_action_type ? (
                    <>
                      <div>{p.next_action_type.replace('_', ' ')}</div>
                      {p.next_action_date && (
                        <div style={{
                          color: (p.temperature === 'urgente' || p.temperature === 'riesgo')
                            ? '#ef4444' : 'var(--color-fg-muted)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                        }}>
                          {fmtDateTime(p.next_action_date)}
                        </div>
                      )}
                    </>
                  ) : '—'}
                </div>

                {/* Último contacto */}
                <div className="text-[11px]" style={{ color: 'var(--color-fg-dim)', fontFamily: 'var(--font-mono)' }}>
                  {relativeDate(p.last_contact_date)}
                </div>

                {/* Acciones */}
                <div className="flex gap-1">
                  {[Phone, MessageCircle, Mail, FileText].map((Icon, i) => (
                    <button key={i}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      onClick={e => e.stopPropagation()}
                      style={{ background: 'var(--color-card-soft)', border: '1px solid var(--color-border)', color: 'var(--color-fg-dim)' }}>
                      <Icon size={12} />
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {selected && <ProspectPanel prospect={selected} onClose={() => setSelectedId(null)} />}
    </div>
  )
}
