'use client'

import { FileText, Phone, Calendar, Clock } from 'lucide-react'
import type { Stage } from '@/types'
import { STAGE_LABELS } from '@/lib/tokens'

interface Props {
  prospectId: string
  newStage: Stage
  prospectName: string
  onConfirm: (action: string) => void
  onCancel: () => void
}

const ACTIONS = [
  { id: 'enviar_propuesta', label: 'Enviar propuesta', icon: FileText, color: '#2563EB' },
  { id: 'llamar',           label: 'Agendar llamada',  icon: Phone,    color: '#22c55e' },
  { id: 'agendar_reunion',  label: 'Agendar reunión',  icon: Calendar, color: '#a855f7' },
  { id: 'despues',          label: 'Después',          icon: Clock,    color: '#9ca3af' },
]

export default function StageChangeModal({ newStage, prospectName, onConfirm, onCancel }: Props) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(11,27,61,0.35)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}>
      <div
        className="rounded-2xl p-6 w-[380px]"
        style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 20px 60px rgba(11,27,61,0.20)',
        }}
        onClick={e => e.stopPropagation()}>

        <div className="text-[11px] font-bold tracking-widest mb-1" style={{ color: 'var(--color-ocean)' }}>
          MOVER ETAPA
        </div>
        <div className="text-xl font-bold mb-1" style={{ color: 'var(--color-fg-hi)' }}>
          Mover a {STAGE_LABELS[newStage] ?? newStage}
        </div>
        <div className="text-sm mb-5" style={{ color: 'var(--color-fg-dim)' }}>
          {prospectName} · ¿Actualizar próxima acción?
        </div>

        <div className="flex flex-col gap-2">
          {ACTIONS.map(a => {
            const Icon = a.icon
            return (
              <button
                key={a.id}
                onClick={() => onConfirm(a.id)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-colors hover:opacity-90"
                style={{
                  background: a.color + '12',
                  border: `1px solid ${a.color}30`,
                  color: 'var(--color-fg-hi)',
                }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: a.color + '20', color: a.color }}>
                  <Icon size={15} />
                </div>
                {a.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
