'use client'

import { useState, useTransition } from 'react'
import { Crosshair, List, Flame, BarChart2, Plus, Filter } from 'lucide-react'
import RadarCanvas from '@/components/radar/RadarCanvas'
import MetricsBar from '@/components/radar/MetricsBar'
import ProspectPanel from '@/components/prospect/ProspectPanel'
import ProspectFormWrapper from '@/components/prospect/ProspectFormWrapper'
import type { ProspectView, RadarMetrics, RadarType, Stage } from '@/types'
import { updateProspectStage } from './actions'

const RADAR_TYPES: Array<{ id: RadarType; label: string; icon: typeof Crosshair }> = [
  { id: 'etapa',       label: 'Etapa comercial',  icon: Crosshair },
  { id: 'temperatura', label: 'Temperatura',       icon: Flame     },
  { id: 'valor',       label: 'Valor potencial',   icon: BarChart2 },
]

const RESOLUTIONS = ['Baja', 'Media', 'Alta'] as const
const FILTERS = ['Todos', 'Hoy', 'Vencidos', 'Alto valor', 'Sin acción'] as const

interface Props {
  prospects: ProspectView[]
  metrics: RadarMetrics
  defaultRadarType: RadarType
  userId: string
}

export default function RadarView({ prospects, metrics, defaultRadarType, userId }: Props) {
  const [radarType, setRadarType] = useState<RadarType>(defaultRadarType)
  const [resolution] = useState<string>('Media')
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const selectedProspect = prospects.find(p => p.id === selectedId) ?? null

  const filtered = prospects.filter(p => {
    if (activeFilter === 'Todos') return true
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    if (activeFilter === 'Hoy') return p.next_action_date?.startsWith(today)
    if (activeFilter === 'Vencidos') return p.temperature === 'urgente' || p.temperature === 'riesgo'
    if (activeFilter === 'Alto valor') return (p.potential_value ?? 0) >= 200_000
    if (activeFilter === 'Sin acción') return !p.next_action_date
    return true
  })

  const handleStageChange = async (prospectId: string, newStage: Stage) => {
    startTransition(async () => {
      await updateProspectStage(prospectId, newStage)
    })
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 px-6 pb-5 gap-3.5">
      <div className="flex-1 flex gap-3.5 min-h-0">
        {/* Radar card */}
        <main className="flex-1 flex flex-col gap-3.5 min-w-0">
          <div
            className="rounded-2xl flex-1 flex flex-col p-5"
            style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>

            {/* Card header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs font-extrabold tracking-[1.2px]" style={{ color: 'var(--color-fg-hi)' }}>
                  RADAR DE OPORTUNIDADES
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--color-fg-dim)' }}>
                  Arrastra y suelta para mover clientes
                  {isPending && <span className="ml-2 opacity-60">· Guardando…</span>}
                </div>
              </div>

              {/* View toggle */}
              <div className="flex items-center gap-2">
                <ToggleGroup
                  options={[
                    { id: 'radar', label: 'Radar', icon: Crosshair },
                    { id: 'lista', label: 'Lista',  icon: List      },
                  ]}
                  active="radar"
                  onChange={() => {}}
                />
              </div>
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {/* Radar type */}
              <div className="flex items-center gap-1 p-1 rounded-xl"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                {RADAR_TYPES.map(rt => {
                  const Icon = rt.icon
                  return (
                    <button key={rt.id}
                      onClick={() => setRadarType(rt.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: radarType === rt.id ? 'var(--color-card)' : 'transparent',
                        color: radarType === rt.id ? 'var(--color-ocean)' : 'var(--color-fg-dim)',
                        boxShadow: radarType === rt.id ? '0 1px 3px rgba(11,27,61,0.10)' : 'none',
                      }}>
                      <Icon size={12} />
                      {rt.label}
                    </button>
                  )
                })}
              </div>

              {/* Resolution */}
              <div className="flex items-center gap-1 p-1 rounded-xl"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                {RESOLUTIONS.map(r => (
                  <button key={r}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: resolution === r ? 'var(--color-card)' : 'transparent',
                      color: resolution === r ? 'var(--color-ocean)' : 'var(--color-fg-dim)',
                    }}>
                    {r}
                  </button>
                ))}
              </div>

              {/* Quick filters */}
              <div className="flex items-center gap-1 flex-wrap">
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
              </div>
            </div>

            {/* Canvas or empty state */}
            <div className="flex-1 flex items-center justify-center min-h-0">
              {filtered.length === 0 ? (
                <EmptyRadar userId={userId} />
              ) : (
                <RadarCanvas
                  prospects={filtered}
                  radarType={radarType}
                  size={600}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onStageChange={handleStageChange}
                />
              )}
            </div>
          </div>

          <MetricsBar metrics={metrics} />
        </main>

        {/* Right detail panel */}
        {selectedProspect && (
          <ProspectPanel prospect={selectedProspect} onClose={() => setSelectedId(null)} />
        )}
      </div>
    </div>
  )
}

function ToggleGroup({
  options,
  active,
  onChange,
}: {
  options: Array<{ id: string; label: string; icon: typeof Crosshair }>
  active: string
  onChange: (id: string) => void
}) {
  return (
    <div className="flex p-1 rounded-xl"
      style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
      {options.map(o => {
        const Icon = o.icon
        const isActive = o.id === active
        return (
          <button key={o.id}
            onClick={() => onChange(o.id)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: isActive ? 'var(--color-card)' : 'transparent',
              color: isActive ? 'var(--color-ocean)' : 'var(--color-fg-dim)',
              boxShadow: isActive ? '0 1px 3px rgba(11,27,61,0.10)' : 'none',
            }}>
            <Icon size={13} />
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function EmptyRadar({ userId }: { userId: string }) {
  const rings = [80, 160, 240, 320, 400]
  return (
    <div className="flex flex-col items-center gap-6 relative">
      {/* Ghost radar */}
      <div className="opacity-20 pointer-events-none absolute">
        <svg width="400" height="400" viewBox="0 0 400 400">
          {rings.map((r, i) => (
            <circle key={i} cx="200" cy="200" r={r * 0.48}
              fill="none" stroke="var(--color-border)" strokeWidth="1.5" strokeDasharray="6 4" />
          ))}
        </svg>
      </div>
      <div className="relative flex flex-col items-center gap-4 z-10">
        <div className="text-xl font-bold" style={{ color: 'var(--color-fg-dim)' }}>
          Tu radar está vacío
        </div>
        <div className="text-sm text-center max-w-xs" style={{ color: 'var(--color-fg-muted)' }}>
          Agrega tu primer prospecto y empieza a visualizar tus oportunidades
        </div>
        <ProspectFormWrapper userId={userId} />
      </div>
    </div>
  )
}
