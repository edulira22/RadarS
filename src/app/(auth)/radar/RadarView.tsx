'use client'

import { useState, useTransition, useRef, useEffect, useCallback } from 'react'
import {
  Crosshair, List, Flame, BarChart2, Filter,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
} from 'lucide-react'
import RadarCanvas from '@/components/radar/RadarCanvas'
import ProspectPanel from '@/components/prospect/ProspectPanel'
import ProspectFormWrapper from '@/components/prospect/ProspectFormWrapper'
import ProspectForm from '@/components/prospect/ProspectForm'
import { fmtMoneyShort } from '@/lib/utils'
import type { ProspectView, RadarMetrics, RadarType, Stage } from '@/types'
import { updateProspectStage } from './actions'

const RADAR_TYPES: Array<{ id: RadarType; label: string; icon: typeof Crosshair }> = [
  { id: 'etapa',       label: 'Etapa',        icon: Crosshair },
  { id: 'temperatura', label: 'Temperatura',   icon: Flame     },
  { id: 'valor',       label: 'Valor',         icon: BarChart2 },
]
const FILTERS = ['Todos', 'Hoy', 'Vencidos', 'Alto valor', 'Sin acción'] as const
const METRIC_STAGES = [
  { key: 'base' as const,        label: 'Base',     color: '#6B8FB5' },
  { key: 'prospeccion' as const, label: 'Prosp',    color: '#2563EB' },
  { key: 'interes' as const,     label: 'Interés',  color: '#F25C05' },
  { key: 'decision' as const,    label: 'Decisión', color: '#F2B705' },
  { key: 'cierre' as const,      label: 'Cierre',   color: '#22c55e' },
]

const ZOOM_MIN = 0.60
const ZOOM_MAX = 1.60
const ZOOM_STEP = 0.10

interface Props {
  prospects: ProspectView[]
  metrics: RadarMetrics
  defaultRadarType: RadarType
  userId: string
}

export default function RadarView({ prospects, metrics, defaultRadarType, userId }: Props) {
  const [radarType, setRadarType]     = useState<RadarType>(defaultRadarType)
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [selectedId, setSelectedId]   = useState<string | null>(null)
  const [isPending, startTransition]  = useTransition()
  const [showForm, setShowForm]       = useState(false)
  const [formSource, setFormSource]   = useState<string | undefined>(undefined)
  const [baseSize, setBaseSize]       = useState(500)
  const [zoom, setZoom]               = useState(1.0)
  const [leftOpen, setLeftOpen]       = useState(true)
  const [rightOpen, setRightOpen]     = useState(true)

  // Pan state
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0 })

  const cardRef   = useRef<HTMLDivElement>(null)
  const selectedProspect = prospects.find(p => p.id === selectedId) ?? null
  const radarSize = Math.round(baseSize * zoom)

  // Base size: fill the card height (minus metrics strip 46px)
  useEffect(() => {
    const update = () => {
      if (!cardRef.current) return
      const { width, height } = cardRef.current.getBoundingClientRect()
      const h = Math.max(0, height - 46)
      const w = Math.max(0, width - 40)
      setBaseSize(Math.max(Math.min(h, w), 320))
    }
    const id = setTimeout(update, 0)
    window.addEventListener('resize', update)
    return () => { clearTimeout(id); window.removeEventListener('resize', update) }
  }, [])

  // Reset pan when zoom returns to 1
  useEffect(() => {
    if (zoom <= 1.0) setPanOffset({ x: 0, y: 0 })
  }, [zoom])

  // Global mouse handlers for panning
  useEffect(() => {
    if (!isPanning) return
    const move = (e: MouseEvent) => {
      const maxPan = radarSize * 0.40
      const clamp = (v: number) => Math.max(-maxPan, Math.min(maxPan, v))
      setPanOffset({
        x: clamp(e.clientX - panStart.current.x),
        y: clamp(e.clientY - panStart.current.y),
      })
    }
    const up = () => setIsPanning(false)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [isPanning, radarSize])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1.0) return
    const target = e.target as HTMLElement
    if (target.closest('[data-prospect-node]') || target.closest('[data-ghost-btn]')) return
    e.preventDefault()
    panStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y }
    setIsPanning(true)
  }, [zoom, panOffset])

  const filtered = prospects.filter(p => {
    if (activeFilter === 'Todos') return true
    const today = new Date().toISOString().split('T')[0]
    if (activeFilter === 'Hoy') return p.next_action_date?.startsWith(today)
    if (activeFilter === 'Vencidos') return p.temperature === 'urgente' || p.temperature === 'riesgo'
    if (activeFilter === 'Alto valor') return (p.potential_value ?? 0) >= 200_000
    if (activeFilter === 'Sin acción') return !p.next_action_date
    return true
  })

  const handleStageChange = async (id: string, stage: Stage) => {
    startTransition(async () => { await updateProspectStage(id, stage) })
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

        {/* ── Radar card ─────────────────────────────── */}
        <main className="flex-1 min-w-0 min-h-0 flex flex-col">
          <div
            ref={cardRef}
            className="flex-1 flex flex-col rounded-2xl overflow-hidden relative min-h-0"
            style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>

            {/* ── LEFT PANEL: Radar type + view toggle ── */}
            <div className="absolute left-3 top-0 bottom-[46px] z-20 flex flex-col items-start justify-center"
              style={{ pointerEvents: 'none' }}>
              {leftOpen ? (
                <div className="flex flex-col gap-1" style={{ pointerEvents: 'auto' }}>
                  {/* Collapse button */}
                  <button onClick={() => setLeftOpen(false)}
                    className="self-end mb-1 p-1 rounded-lg transition-opacity hover:opacity-70"
                    style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(228,233,242,0.8)', color: 'var(--color-fg-dim)' }}>
                    <ChevronLeft size={12} />
                  </button>

                  {/* Glass card */}
                  <div className="flex flex-col gap-0.5 p-1.5 rounded-2xl"
                    style={{
                      background: 'rgba(255,255,255,0.92)',
                      border: '1px solid rgba(228,233,242,0.85)',
                      backdropFilter: 'blur(12px)',
                      boxShadow: '0 4px 16px rgba(11,27,61,0.08)',
                    }}>
                    {RADAR_TYPES.map(rt => {
                      const Icon = rt.icon
                      const active = radarType === rt.id
                      return (
                        <button key={rt.id} onClick={() => setRadarType(rt.id)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all text-left"
                          style={{
                            background: active ? 'var(--color-ocean)' : 'transparent',
                            color: active ? '#fff' : 'var(--color-fg-dim)',
                          }}>
                          <Icon size={13} />{rt.label}
                        </button>
                      )
                    })}

                    <div className="my-1" style={{ height: 1, background: 'var(--color-border-soft)' }} />

                    {[
                      { id: 'radar', label: 'Radar', icon: Crosshair },
                      { id: 'lista', label: 'Lista',  icon: List      },
                    ].map(v => (
                      <button key={v.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all"
                        style={{
                          background: v.id === 'radar' ? 'rgba(37,99,235,0.10)' : 'transparent',
                          color: v.id === 'radar' ? 'var(--color-ocean)' : 'var(--color-fg-dim)',
                        }}>
                        <v.icon size={13} />{v.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button onClick={() => setLeftOpen(true)}
                  style={{ pointerEvents: 'auto', background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(228,233,242,0.85)', backdropFilter: 'blur(12px)', color: 'var(--color-fg-dim)' }}
                  className="p-1.5 rounded-xl shadow-sm">
                  <ChevronRight size={13} />
                </button>
              )}
            </div>

            {/* ── RIGHT PANEL: Filters ────────────────── */}
            <div className="absolute right-3 top-0 bottom-[46px] z-20 flex flex-col items-end justify-center"
              style={{ pointerEvents: 'none' }}>
              {rightOpen ? (
                <div className="flex flex-col gap-1" style={{ pointerEvents: 'auto' }}>
                  {/* Collapse */}
                  <button onClick={() => setRightOpen(false)}
                    className="self-start mb-1 p-1 rounded-lg transition-opacity hover:opacity-70"
                    style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(228,233,242,0.8)', color: 'var(--color-fg-dim)' }}>
                    <ChevronRight size={12} />
                  </button>

                  {/* Glass card */}
                  <div className="flex flex-col gap-0.5 p-1.5 rounded-2xl"
                    style={{
                      background: 'rgba(255,255,255,0.92)',
                      border: '1px solid rgba(228,233,242,0.85)',
                      backdropFilter: 'blur(12px)',
                      boxShadow: '0 4px 16px rgba(11,27,61,0.08)',
                    }}>
                    {FILTERS.map(f => {
                      const active = activeFilter === f
                      return (
                        <button key={f} onClick={() => setActiveFilter(f)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all"
                          style={{
                            background: active ? 'var(--color-ocean)' : 'transparent',
                            color: active ? '#fff' : 'var(--color-fg-dim)',
                          }}>
                          {f === 'Todos' && <Filter size={11} />}
                          {f}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <button onClick={() => setRightOpen(true)}
                  style={{ pointerEvents: 'auto', background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(228,233,242,0.85)', backdropFilter: 'blur(12px)', color: 'var(--color-fg-dim)' }}
                  className="p-1.5 rounded-xl shadow-sm">
                  <ChevronLeft size={13} />
                </button>
              )}
            </div>

            {/* ── ZOOM control (bottom-right, above metrics) */}
            <div className="absolute bottom-[52px] right-3 z-20 flex items-center gap-0.5 rounded-xl p-0.5"
              style={{
                background: 'rgba(255,255,255,0.92)',
                border: '1px solid rgba(228,233,242,0.85)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 2px 8px rgba(11,27,61,0.07)',
              }}>
              <button onClick={zoomOut} disabled={zoom <= ZOOM_MIN}
                className="p-1.5 rounded-lg transition-opacity disabled:opacity-30 hover:opacity-60"
                style={{ color: 'var(--color-fg-dim)' }}>
                <ZoomOut size={13} />
              </button>
              <span className="text-[11px] font-bold min-w-[34px] text-center"
                style={{ color: 'var(--color-fg-hi)', fontFamily: 'var(--font-mono)' }}>
                {Math.round(zoom * 100)}%
              </span>
              <button onClick={zoomIn} disabled={zoom >= ZOOM_MAX}
                className="p-1.5 rounded-lg transition-opacity disabled:opacity-30 hover:opacity-60"
                style={{ color: 'var(--color-fg-dim)' }}>
                <ZoomIn size={13} />
              </button>
            </div>

            {/* ── Pending indicator ─────────────────────── */}
            {isPending && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full text-[11px]"
                style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid var(--color-border)', color: 'var(--color-fg-muted)', backdropFilter: 'blur(8px)' }}>
                Guardando…
              </div>
            )}

            {/* ── RADAR CANVAS ─────────────────────────── */}
            <div
              className="flex-1 min-h-0 flex items-center justify-center overflow-hidden select-none"
              style={{ cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
              onMouseDown={handleCanvasMouseDown}>
              <div style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
                transition: isPanning ? 'none' : 'transform 0.2s ease',
              }}>
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

            {/* ── METRICS STRIP ────────────────────────── */}
            <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 flex-wrap z-10"
              style={{ borderTop: '1px solid var(--color-border-soft)', background: 'rgba(248,250,253,0.97)' }}>
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

function EmptyRadar({ userId }: { userId: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <svg width="260" height="260" viewBox="0 0 260 260" className="opacity-10">
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
