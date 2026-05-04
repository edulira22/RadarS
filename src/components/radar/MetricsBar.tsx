import { LayoutGrid, Check } from 'lucide-react'
import type { RadarMetrics } from '@/types'
import { fmtMoney } from '@/lib/utils'

const CARDS = [
  { key: 'prospeccion', label: 'Prospección',    color: '#3E78C2', Icon: LayoutGrid },
  { key: 'interes',     label: 'Interés real',   color: '#F25C05', Icon: LayoutGrid },
  { key: 'decision',    label: 'Decisión',       color: '#F2B705', Icon: LayoutGrid },
  { key: 'cierre',      label: 'Cierre',         color: '#22c55e', Icon: Check      },
] as const

interface Props { metrics: RadarMetrics }

export default function MetricsBar({ metrics }: Props) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
      <div className="text-[11px] font-extrabold tracking-[1.2px] mb-3" style={{ color: 'var(--color-fg-hi)' }}>
        RESUMEN DEL RADAR
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {CARDS.map(c => {
          const m = metrics[c.key]
          const Icon = c.Icon
          return (
            <div key={c.key} className="flex flex-col gap-1.5 p-3.5 rounded-xl"
              style={{ background: 'var(--color-card-soft)', border: '1px solid var(--color-border-soft)' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: c.color + '18', color: c.color }}>
                  <Icon size={15} />
                </div>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-fg-dim)' }}>{c.label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-fg-hi)', fontFamily: 'var(--font-mono)' }}>
                {m.count}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-fg-dim)', fontFamily: 'var(--font-mono)' }}>
                {fmtMoney(m.value)}
              </div>
            </div>
          )
        })}

        {/* Total */}
        <div className="flex flex-col gap-1.5 p-3.5 rounded-xl"
          style={{ background: 'var(--color-card-soft)', border: '1px solid var(--color-border-soft)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--color-navy-deep)' + '12', color: 'var(--color-navy-deep)' }}>
              <LayoutGrid size={15} />
            </div>
            <span className="text-xs font-semibold" style={{ color: 'var(--color-fg-dim)' }}>Total potencial</span>
          </div>
          <div className="text-xl font-bold" style={{ color: 'var(--color-fg-hi)', fontFamily: 'var(--font-mono)' }}>
            {fmtMoney(metrics.total.value)}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-fg-dim)' }}>
            {metrics.total.count} oportunidades
          </div>
        </div>
      </div>
    </div>
  )
}
