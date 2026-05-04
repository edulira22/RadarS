'use client'

import { useState, useTransition, useRef, useEffect, useCallback } from 'react'
import { Crosshair, List, Flame, BarChart2, Filter } from 'lucide-react'
import RadarCanvas from '@/components/radar/RadarCanvas'
import MetricsBar from '@/components/radar/MetricsBar'
import ProspectPanel from '@/components/prospect/ProspectPanel'
import ProspectFormWrapper from '@/components/prospect/ProspectFormWrapper'
import ProspectForm from '@/components/prospect/ProspectForm'
import type { ProspectView, RadarMetrics, RadarType, Stage } from '@/types'
import { updateProspectStage } from './actions'

const RADAR_TYPES: Array<{ id: RadarType; label: string; icon: typeof Crosshair }> = [
  { id: 'etapa',       label: 'Etapa comercial',  icon: Crosshair },
  { id: 'temperatura', label: 'Temperatura',       icon: Flame     },
  { id: 'valor',       label: 'Valor potencial',   icon: BarChart2 },
]

const RESOLUTIONS = ['Baja', 'Media', 'Alta'] as const
type Resolution = typeof RESOLUTIONS[number]
// Based on card WIDTH so there's no feedback loop with height
const RESOLUTION_MULT: Record<Resolution, number> = { Baja: 0.52, Media: 0.68, Alta: 0.84 }

const FILTERS = ['Todos', 'Hoy', 'Vencidos', 'Alto valor', 'Sin acción'] as const

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
  const [radarSize, setRadarSize] = useState(560)
  const cardRef = useRef<HTMLDivElement>(null)

  const selectedProspect = prospects.find(p => p.id === selectedId) ?? null

  // Size radar based on card WIDTH to avoid feedback loop with height
  useEffect(() => {
    const update = () => {
      if (!cardRef.current) return
      const { width } = cardRef.current.getBoundingClientRect()
      // card p-5 = 20px each side → inner width = width - 40
      const inner = Math.max(width - 40, 300)
      const size = Math.min(Math.floor(inner * RESOLUTION_MULT[resolution]), 860)
      setRadarSize(Math.max(size, 420))
    }
    const timer = setTimeout(update, 0)
    window.addEventListener('resize', update)
    return () => { clearTimeout(timer); window.removeEventListener('resize', update) }
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
    <div className="flex-1 flex flex-col min-h-0 px-6 pb-5 gap-3">

      {/* Main row: radar card + optional detail panel */}
      <div className="flex-1 flex gap-3.5 min-h-0">
        <main className="flex-1 flex flex-col gap-3 min-w-0 min-h-0">

          {/* Radar card — scrollable so the large radar is always fully visible */}
          <div
            ref={cardRef}
            className="rounded-2xl flex-1 flex flex-col p-5 overflow-y-auto"
            style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>

            {/* Compact header + controls (single area) */}
            <div className="flex items-center gap-2 mb-4 flex-wrap flex-shrink-0">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-extrabold tracking-[1.2px]" style={{ color: 'var(--color-fg-hi)' }}>
                  RADAR DE OPORTUNIDADES
                </div>
                {isPending && (
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-fg-dim)' }}>Guardando…</div>
                )}
              </div>

              {/* Radar type */}
              <TabGroup>
                {RADAR_TYPES.map(rt => {
                  const Icon = rt.icon
                  return (
                    <TabBtn key={rt.id} active={radarType === rt.id} onClick={() => setRadarType(rt.id)}>
                      <Icon size={12} />{rt.label}
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
                <TabBtn active={true} onClick={() => {}}><Crosshair size={12} />Radar</TabBtn>
                <TabBtn active={false} onClick={() => {}}><List size={12} />Lista</TabBtn>
              </TabGroup>
            </div>

            {/* Filters row */}
            <div className="flex items-center gap-1.5 mb-5 flex-wrap flex-shrink-0">
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
              <div className="ml-auto text-[11px]" style={{ color: 'var(--color-fg-muted)' }}>
                Arrastra y suelta para mover clientes
              </div>
            </div>

            {/* Radar canvas — centered, generous space */}
            <div className="flex items-center justify-center pb-4 flex-shrink-0"
              style={{ minHeight: radarSize + 16 }}>
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
          </div>

          <MetricsBar metrics={metrics} />
        </main>

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
    <div className="flex items-center gap-0.5 p-1 rounded-xl"
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
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
      style={{
        background: active ? 'var(--color-card)' : 'transparent',
        color: active ? 'var(--color-ocean)' : 'var(--color-fg-dim)',
        boxShadow: active ? '0 1px 3px rgba(11,27,61,0.10)' : 'none',
      }}>
      {children}
    </button>
  )
}

function EmptyRadar({ userId }: { userId: string }) {
  const rings = [80, 160, 240, 320, 400]
  return (
    <div className="flex flex-col items-center gap-6 relative">
      <div className="opacity-20 pointer-events-none absolute">
        <svg width="400" height="400" viewBox="0 0 400 400">
          {rings.map((r, i) => (
            <circle key={i} cx="200" cy="200" r={r * 0.48}
              fill="none" stroke="var(--color-border)" strokeWidth="1.5" strokeDasharray="6 4" />
          ))}
        </svg>
      </div>
      <div className="relative flex flex-col items-center gap-4 z-10">
        <div className="text-xl font-bold" style={{ color: 'var(--color-fg-dim)' }}>Tu radar está vacío</div>
        <div className="text-sm text-center max-w-xs" style={{ color: 'var(--color-fg-muted)' }}>
          Agrega tu primer prospecto y empieza a visualizar tus oportunidades
        </div>
        <ProspectFormWrapper userId={userId} />
      </div>
    </div>
  )
}
