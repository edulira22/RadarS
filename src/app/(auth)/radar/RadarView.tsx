'use client'

import { useState, useTransition, useRef, useEffect, useCallback } from 'react'
import { Crosshair, List, Flame, BarChart2, Filter, ZoomIn, ZoomOut } from 'lucide-react'
import RadarCanvas from '@/components/radar/RadarCanvas'
import ProspectPanel from '@/components/prospect/ProspectPanel'
import ProspectFormWrapper from '@/components/prospect/ProspectFormWrapper'
import ProspectForm from '@/components/prospect/ProspectForm'
import { fmtMoneyShort } from '@/lib/utils'
import type { ProspectView, RadarMetrics, RadarType, Stage } from '@/types'
import { updateProspectStage } from './actions'

const RADAR_TYPES: Array<{ id: RadarType; label: string; icon: typeof Crosshair }> = [
  { id: 'etapa',       label: 'Etapa',       icon: Crosshair },
  { id: 'temperatura', label: 'Temperatura',  icon: Flame     },
  { id: 'valor',       label: 'Valor',        icon: BarChart2 },
]
const FILTERS = ['Todos', 'Hoy', 'Vencidos', 'Alto valor', 'Sin acción'] as const
const METRIC_STAGES = [
  { key: 'base' as const,        label: 'Base',      color: '#6B8FB5' },
  { key: 'prospeccion' as const, label: 'Prosp',     color: '#2563EB' },
  { key: 'interes' as const,     label: 'Interés',   color: '#F25C05' },
  { key: 'decision' as const,    label: 'Decisión',  color: '#F2B705' },
  { key: 'cierre' as const,      label: 'Cierre',    color: '#22c55e' },
]

// Zoom steps: 60 % → 130 % in 10 % increments
const ZOOM_MIN = 0.60
const ZOOM_MAX = 1.30
const ZOOM_STEP = 0.10

interface Props {
  prospects: ProspectView[]
  metrics: RadarMetrics
  defaultRadarType: RadarType
  userId: string
}

export default function RadarView({ prospects, metrics, defaultRadarType, userId }: Props) {
  const [radarType, setRadarType] = useState<RadarType>(defaultRadarType)
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [formSource, setFormSource] = useState<string | undefined>(undefined)
  const [baseSize, setBaseSize] = useState(500)
  const [zoom, setZoom] = useState(1.0)
  const cardRef = useRef<HTMLDivElement>(null)

  const selectedProspect = prospects.find(p => p.id === selectedId) ?? null
  const radarSize = Math.round(baseSize * zoom)

  // Base size = fills the card (controls float on top, only subtract metrics strip ~46px)
  useEffect(() => {
    const update = () => {
      if (!cardRef.current) return
      const { width, height } = cardRef.current.getBoundingClientRect()
      const h = Math.max(0, height - 46)   // only metrics strip
      const w = Math.max(0, width - 40)    // card horizontal padding
      setBaseSize(Math.max(Math.min(h, w), 320))
    }
    const id = setTimeout(update, 0)
    window.addEventListener('resize', update)
    return () => { clearTimeout(id); window.removeEventListener('resize', update) }
  }, [])

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

  const zoomIn  = () => setZoom(z => Math.min(+(z + ZOOM_STEP).toFixed(1), ZOOM_MAX))
  const zoomOut = () => setZoom(z => Math.max(+(z - ZOOM_STEP).toFixed(1), ZOOM_MIN))

  return (
    <div className="flex-1 flex flex-col min-h-0 px-6 pb-5">
      <div className="flex-1 flex gap-3.5 min-h-0">

        {/* ── Main radar card ─────────────────────────── */}
        <main className="flex-1 min-w-0 min-h-0 flex flex-col">
          <div
            ref={cardRef}
            className="flex-1 flex flex-col rounded-2xl overflow-hidden relative min-h-0"
            style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>

            {/* ── FLOATING TOP CONTROLS ─────────────────
                Positioned absolute so they don't steal height */}
            <div className="absolute top-3 left-4 right-4 z-20 flex items-center gap-2 flex-wrap pointer-events-none">
              {/* Title */}
              <div className="pointer-events-auto">
                <GlassPill>
                  <span className="text-[11px] font-extrabold tracking-[1px]"
                    style={{ color: 'var(--color-fg-hi)' }}>RADAR</span>
                  {isPending && <span className="text-[10px] ml-1" style={{ color: 'var(--color-fg-muted)' }}>·</span>}
                </GlassPill>
              </div>

              <div className="ml-auto flex items-center gap-1.5 flex-wrap pointer-events-auto">
                {/* Radar type */}
                <GlassPill noPad>
                  {RADAR_TYPES.map(rt => {
                    const Icon = rt.icon
                    return (
                      <button key={rt.id}
                        onClick={() => setRadarType(rt.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                        style={{
                          background: radarType === rt.id ? 'var(--color-ocean)' : 'transparent',
                          color: radarType === rt.id ? '#fff' : 'var(--color-fg-dim)',
                        }}>
                        <Icon size={11} />{rt.label}
                      </button>
                    )
                  })}
                </GlassPill>

                {/* View toggle */}
                <GlassPill noPad>
                  <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
                    style={{ background: 'var(--color-ocean)', color: '#fff' }}>
                    <Crosshair size={11} />Radar
                  </button>
                  <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
                    style={{ color: 'var(--color-fg-dim)' }}>
                    <List size={11} />Lista
                  </button>
                </GlassPill>
              </div>
            </div>

            {/* ── RADAR CANVAS — full height ────────────── */}
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

            {/* ── FLOATING BOTTOM CONTROLS ──────────────── */}
            <div className="absolute bottom-[50px] left-4 right-4 z-20 flex items-center justify-between gap-2 pointer-events-none">
              {/* Filters */}
              <div className="flex items-center gap-1 flex-wrap pointer-events-auto">
                {FILTERS.map(f => (
                  <button key={f}
                    onClick={() => setActiveFilter(f)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
                    style={{
                      background: activeFilter === f
                        ? 'var(--color-ocean)'
                        : 'rgba(255,255,255,0.88)',
                      color: activeFilter === f ? '#fff' : 'var(--color-fg-dim)',
                      border: `1px solid ${activeFilter === f ? 'var(--color-ocean)' : 'rgba(228,233,242,0.8)'}`,
                      backdropFilter: 'blur(6px)',
                    }}>
                    {f === 'Todos' && <Filter size={9} />}
                    {f}
                  </button>
                ))}
              </div>

              {/* Zoom control */}
              <div className="flex items-center gap-1 pointer-events-auto">
                <GlassPill noPad>
                  <button onClick={zoomOut} disabled={zoom <= ZOOM_MIN}
                    className="p-1.5 rounded-lg transition-opacity disabled:opacity-30"
                    style={{ color: 'var(--color-fg-dim)' }}>
                    <ZoomOut size={13} />
                  </button>
                  <span className="text-[11px] font-bold px-1 min-w-[36px] text-center"
                    style={{ color: 'var(--color-fg-hi)', fontFamily: 'var(--font-mono)' }}>
                    {Math.round(zoom * 100)}%
                  </span>
                  <button onClick={zoomIn} disabled={zoom >= ZOOM_MAX}
                    className="p-1.5 rounded-lg transition-opacity disabled:opacity-30"
                    style={{ color: 'var(--color-fg-dim)' }}>
                    <ZoomIn size={13} />
                  </button>
                </GlassPill>
              </div>
            </div>

            {/* ── METRICS STRIP — always at bottom ─────── */}
            <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 flex-wrap z-10 relative"
              style={{ borderTop: '1px solid var(--color-border-soft)', background: 'rgba(248,250,253,0.95)' }}>
              {METRIC_STAGES.map(s => {
                const m = metrics[s.key]
                if (!m) return null
                return (
                  <div key={s.key} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
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
              <div className="ml-auto flex items-center gap-1.5">
                <span className="text-[11px]" style={{ color: 'var(--color-fg-muted)' }}>Pipeline</span>
                <span className="text-[13px] font-bold"
                  style={{ color: 'var(--color-ocean)', fontFamily: 'var(--font-mono)' }}>
                  {fmtMoneyShort(metrics.total.value)}
                </span>
              </div>
            </div>
          </div>
        </main>

        {/* ── Detail panel ──────────────────────────────── */}
        {selectedProspect && (
          <ProspectPanel prospect={selectedProspect} onClose={() => setSelectedId(null)} />
        )}
      </div>

      {showForm && (
        <ProspectForm
          userId={userId}
          defaultSource={formSource}
          onClose={() => { setShowForm(false); setFormSource(undefined) }}
          onSaved={() => { setShowForm(false); setFormSource(undefined); window.location.reload() }}
        />
      )}
    </div>
  )
}

// ─── Glass pill container ──────────────────────────────────────────

function GlassPill({ children, noPad }: { children: React.ReactNode; noPad?: boolean }) {
  return (
    <div
      className={`flex items-center rounded-xl ${noPad ? 'p-0.5' : 'px-3 py-1.5'}`}
      style={{
        background: 'rgba(255,255,255,0.90)',
        border: '1px solid rgba(228,233,242,0.85)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 2px 8px rgba(11,27,61,0.06)',
      }}>
      {children}
    </div>
  )
}

// ─── Empty state ───────────────────────────────────────────────────

function EmptyRadar({ userId }: { userId: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <svg width="260" height="260" viewBox="0 0 260 260" className="opacity-12">
        {[30, 60, 90, 120, 150].map((r, i) => (
          <circle key={i} cx="130" cy="130" r={r}
            fill="none" stroke="var(--color-border)" strokeWidth="1.5" strokeDasharray="6 5" />
        ))}
      </svg>
      <div className="-mt-52 flex flex-col items-center gap-3 z-10 relative">
        <p className="text-base font-bold" style={{ color: 'var(--color-fg-dim)' }}>Tu radar está vacío</p>
        <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>Agrega tu primer prospecto</p>
        <ProspectFormWrapper userId={userId} />
      </div>
    </div>
  )
}
