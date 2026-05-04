'use client'

import { useState, useTransition, useRef, useEffect, useCallback } from 'react'
import { Crosshair, List, Flame, BarChart2, Filter } from 'lucide-react'
import RadarCanvas from '@/components/radar/RadarCanvas'
import ProspectPanel from '@/components/prospect/ProspectPanel'
import ProspectFormWrapper from '@/components/prospect/ProspectFormWrapper'
import ProspectForm from '@/components/prospect/ProspectForm'
import { fmtMoneyShort } from '@/lib/utils'
import type { ProspectView, RadarMetrics, RadarType, Stage } from '@/types'
import { updateProspectStage } from './actions'

const RADAR_TYPES: Array<{ id: RadarType; label: string; icon: typeof Crosshair }> = [
  { id: 'etapa',       label: 'Etapa comercial',  icon: Crosshair },
  { id: 'temperatura', label: 'Temperatura',       icon: Flame     },
  { id: 'valor',       label: 'Valor potencial',   icon: BarChart2 },
]

const RESOLUTIONS = ['Baja', 'Media', 'Alta'] as const
type Resolution = typeof RESOLUTIONS[number]
// Fraction of the smaller dimension (canvas area) the radar occupies
const RESOLUTION_MULT: Record<Resolution, number> = { Baja: 0.76, Media: 0.88, Alta: 0.98 }

const FILTERS = ['Todos', 'Hoy', 'Vencidos', 'Alto valor', 'Sin acción'] as const

const METRIC_STAGES = [
  { key: 'base' as const,        label: 'Base',      color: '#6B8FB5' },
  { key: 'prospeccion' as const, label: 'Prospección', color: '#2563EB' },
  { key: 'interes' as const,     label: 'Interés',   color: '#F25C05' },
  { key: 'decision' as const,    label: 'Decisión',  color: '#F2B705' },
  { key: 'cierre' as const,      label: 'Cierre',    color: '#22c55e' },
]

interface Props {
  prospects: ProspectView[]
  metrics: RadarMetrics
  defaultRadarType: RadarType
  userId: string
}

export default function RadarView({ prospects, metrics, defaultRadarType, userId }: Props) {
  const [radarType, setRadarType] = useState<RadarType>(defaultRadarType)
  const [resolution, setResolution] = useState<Resolution>('Media')
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [formSource, setFormSource] = useState<string | undefined>(undefined)
  const [radarSize, setRadarSize] = useState(480)
  const cardRef = useRef<HTMLDivElement>(null)

  const selectedProspect = prospects.find(p => p.id === selectedId) ?? null

  // Size radar to fill the card without ever overflowing or needing scroll
  // cardRef is flex-1 so its size is determined by the parent, not its content → no feedback loop
  useEffect(() => {
    const update = () => {
      if (!cardRef.current) return
      const { width, height } = cardRef.current.getBoundingClientRect()
      // Known overhead inside card:
      // p-5 top+bottom (40) + header row (44) + filters row (38) + gap×2 (28) + metrics strip (46) = 196px
      const canvasH = Math.max(0, height - 196)
      const canvasW = Math.max(0, width - 40) // p-5 left + right
      const available = Math.min(canvasH, canvasW)
      setRadarSize(Math.max(Math.floor(available * RESOLUTION_MULT[resolution]), 320))
    }
    const id = setTimeout(update, 0) // defer to after paint
    window.addEventListener('resize', update)
    return () => { clearTimeout(id); window.removeEventListener('resize', update) }
  }, [resolution])

  const filtered = prospects.filter(p => {
    if (activeFilter === 'Todos') return true
    const today = new Date().toISOString().split('T')[0]
    if (activeFilter === 'Hoy') return p.next_action_date?.startsWith(today)
    if (activeFilter === 'Vencidos') return p.temperature === 'urgente' || p.temperature === 'riesgo'
    if (activeFilter === 'Alto valor') return (p.potential_value ?? 0) >= 200_000
    if (activeFilter === 'Sin acción') return !p.next_action_date
    return true
  })

  const handleStageChange = async (prospectId: string, newStage: Stage) => {
    startTransition(async () => { await updateProspectStage(prospectId, newStage) })
  }

  const handleGhostClick = useCallback((source: string) => {
    setFormSource(source === 'nuevo' ? undefined : source)
    setShowForm(true)
  }, [])

  const closeForm = () => { setShowForm(false); setFormSource(undefined) }

  return (
    <div className="flex-1 flex flex-col min-h-0 px-6 pb-5">
      <div className="flex-1 flex gap-3.5 min-h-0">

        {/* ── Radar card ─────────────────────────────────── */}
        <main className="flex-1 min-w-0 min-h-0 flex flex-col">
          <div
            ref={cardRef}
            className="flex-1 flex flex-col p-5 rounded-2xl min-h-0"
            style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>

            {/* Header row ─ title + all controls */}
            <div className="flex items-center gap-2 mb-2 flex-shrink-0 flex-wrap">
              <span className="text-xs font-extrabold tracking-[1.2px] mr-1" style={{ color: 'var(--color-fg-hi)' }}>
                RADAR DE OPORTUNIDADES
              </span>
              {isPending && <span className="text-[11px]" style={{ color: 'var(--color-fg-muted)' }}>Guardando…</span>}

              <div className="ml-auto flex items-center gap-1.5 flex-wrap">
                {/* Radar type */}
                <TabGroup>
                  {RADAR_TYPES.map(rt => {
                    const Icon = rt.icon
                    return (
                      <TabBtn key={rt.id} active={radarType === rt.id} onClick={() => setRadarType(rt.id)}>
                        <Icon size={11} />{rt.label}
                      </TabBtn>
                    )
                  })}
                </TabGroup>

                {/* Resolution */}
                <TabGroup>
                  {RESOLUTIONS.map(r => (
                    <TabBtn key={r} active={resolution === r} onClick={() => setResolution(r)}>{r}</TabBtn>
                  ))}
                </TabGroup>

                {/* View toggle */}
                <TabGroup>
                  <TabBtn active={true} onClick={() => {}}><Crosshair size={11} />Radar</TabBtn>
                  <TabBtn active={false} onClick={() => {}}><List size={11} />Lista</TabBtn>
                </TabGroup>
              </div>
            </div>

            {/* Filters row */}
            <div className="flex items-center gap-1.5 mb-2 flex-shrink-0 flex-wrap">
              {FILTERS.map(f => (
                <button key={f}
                  onClick={() => setActiveFilter(f)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                  style={{
                    background: activeFilter === f ? 'var(--color-ocean)' : 'var(--color-bg)',
                    color: activeFilter === f ? '#fff' : 'var(--color-fg-dim)',
                    border: `1px solid ${activeFilter === f ? 'var(--color-ocean)' : 'var(--color-border)'}`,
                  }}>
                  {f === 'Todos' && <Filter size={10} />}
                  {f}
                </button>
              ))}
              <span className="ml-auto text-[10px]" style={{ color: 'var(--color-fg-muted)' }}>
                Arrastra y suelta para mover
              </span>
            </div>

            {/* Radar canvas — flex-1 so it takes all remaining space in the card */}
            <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
              {filtered.length === 0 ? (
                <EmptyRadar userId={userId} />
              ) : (
                <RadarCanvas
                  prospects={filtered}
                  radarType={radarType}
                  size={radarSize}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onStageChange={handleStageChange}
                  onGhostClick={handleGhostClick}
                />
              )}
            </div>

            {/* Compact metrics strip — replaces the full MetricsBar card */}
            <div className="flex-shrink-0 flex items-center gap-4 pt-2.5 mt-1 flex-wrap"
              style={{ borderTop: '1px solid var(--color-border-soft)' }}>
              {METRIC_STAGES.map(s => {
                const m = metrics[s.key]
                if (!m) return null
                return (
                  <div key={s.key} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span className="text-[11px]" style={{ color: 'var(--color-fg-muted)' }}>{s.label}</span>
                    <span className="text-[11px] font-bold"
                      style={{ color: 'var(--color-fg-hi)', fontFamily: 'var(--font-mono)' }}>
                      {m.count}
                    </span>
                    {m.value > 0 && (
                      <span className="text-[10px]"
                        style={{ color: 'var(--color-fg-muted)', fontFamily: 'var(--font-mono)' }}>
                        {fmtMoneyShort(m.value)}
                      </span>
                    )}
                  </div>
                )
              })}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[11px]" style={{ color: 'var(--color-fg-muted)' }}>Pipeline</span>
                <span className="text-sm font-bold"
                  style={{ color: 'var(--color-ocean)', fontFamily: 'var(--font-mono)' }}>
                  {fmtMoneyShort(metrics.total.value)}
                </span>
              </div>
            </div>
          </div>
        </main>

        {/* ── Detail panel ─────────────────────────────── */}
        {selectedProspect && (
          <ProspectPanel prospect={selectedProspect} onClose={() => setSelectedId(null)} />
        )}
      </div>

      {showForm && (
        <ProspectForm
          userId={userId}
          defaultSource={formSource}
          onClose={closeForm}
          onSaved={() => { closeForm(); window.location.reload() }}
        />
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────

function TabGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-xl"
      style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
      {children}
    </div>
  )
}

function TabBtn({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
      style={{
        background: active ? 'var(--color-card)' : 'transparent',
        color: active ? 'var(--color-ocean)' : 'var(--color-fg-dim)',
        boxShadow: active ? '0 1px 3px rgba(11,27,61,0.10)' : 'none',
        whiteSpace: 'nowrap',
      }}>
      {children}
    </button>
  )
}

function EmptyRadar({ userId }: { userId: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <svg width="200" height="200" viewBox="0 0 200 200" className="opacity-15">
        {[40, 70, 100, 130, 160].map((r, i) => (
          <circle key={i} cx="100" cy="100" r={r * 0.6}
            fill="none" stroke="var(--color-border)" strokeWidth="1.5" strokeDasharray="5 4" />
        ))}
      </svg>
      <div className="-mt-44 flex flex-col items-center gap-3 z-10 relative">
        <div className="text-base font-bold" style={{ color: 'var(--color-fg-dim)' }}>Tu radar está vacío</div>
        <div className="text-sm text-center max-w-xs" style={{ color: 'var(--color-fg-muted)' }}>
          Agrega tu primer prospecto
        </div>
        <ProspectFormWrapper userId={userId} />
      </div>
    </div>
  )
}
