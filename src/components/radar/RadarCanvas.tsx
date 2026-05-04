'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Plus, Upload, Users, UserPlus } from 'lucide-react'
import { RING_DEFS, STAGE_COLORS, TEMP_COLORS, T } from '@/lib/tokens'
import { polar, fmtMoneyShort } from '@/lib/utils'
import type { ProspectView, Stage, RadarType } from '@/types'
import StageChangeModal from './StageChangeModal'

// Positions for each ring: angle spread, radius fraction
const RING_RADII: Record<string, number> = {
  cierre:      75,
  decision:    150,
  interes:     230,
  prospeccion: 310,
  base:        390,
}

// Deterministic layout: distribute nodes around each ring
function layoutProspects(prospects: ProspectView[], radarType: RadarType, size: number) {
  const cx = size / 2, cy = size / 2
  const scale = (size / 2) / 415

  const byRing: Record<string, ProspectView[]> = {}
  for (const p of prospects) {
    const ring = radarType === 'etapa' ? p.stage :
                 radarType === 'temperatura' ? p.temperature : valueRing(p.potential_value)
    if (!byRing[ring]) byRing[ring] = []
    byRing[ring].push(p)
  }

  const nodes: Array<ProspectView & { x: number; y: number; ring: string }> = []

  for (const [ring, group] of Object.entries(byRing)) {
    const r = (RING_RADII[ring] ?? 390) * scale
    const total = group.length
    const startAngle = -60
    const spread = Math.min(total * 45, 300)
    const step = total > 1 ? spread / (total - 1) : 0

    group.forEach((p, i) => {
      const angle = startAngle + (total === 1 ? spread / 2 : i * step)
      const pos = polar(cx, cy, r * 0.82, angle)
      nodes.push({ ...p, x: pos.x, y: pos.y, ring })
    })
  }

  return nodes
}

function valueRing(v: number | null): string {
  if (!v || v < 50_000) return 'bajo'
  if (v < 200_000) return 'medio'
  if (v < 500_000) return 'alto'
  return 'muy_alto'
}

const VALUE_RINGS = [
  { id: 'muy_alto', label: 'MUY ALTO',    fill: '#D8F0DC', border: '#88D29C', textColor: '#16a34a', r: 75  },
  { id: 'alto',     label: 'ALTO',        fill: '#FFF1CF', border: '#F2D277', textColor: '#B5870A', r: 150 },
  { id: 'medio',    label: 'MEDIO',       fill: '#C7DDF0', border: '#9DC4E5', textColor: '#F25C05', r: 230 },
  { id: 'bajo',     label: 'BAJO',        fill: '#EAF1F8', border: '#CFE0EE', textColor: '#6B8FB5', r: 310 },
]

const TEMP_RINGS = [
  { id: 'urgente',  label: 'URGENTE',     fill: '#FEE2E2', border: '#FCA5A5', textColor: '#ef4444', r: 75  },
  { id: 'riesgo',   label: 'RIESGO',      fill: '#FEF2F2', border: '#FCA5A5', textColor: '#dc2626', r: 150 },
  { id: 'atencion', label: 'ATENCIÓN',    fill: '#FFF1CF', border: '#F2D277', textColor: '#B5870A', r: 230 },
  { id: 'activo',   label: 'ACTIVO',      fill: '#D8F0DC', border: '#88D29C', textColor: '#16a34a', r: 310 },
  { id: 'dormido',  label: 'DORMIDO',     fill: '#F3F4F6', border: '#D1D5DB', textColor: '#9ca3af', r: 390 },
]

interface Props {
  prospects: ProspectView[]
  radarType: RadarType
  size?: number
  selectedId?: string | null
  onSelect: (id: string | null) => void
  onStageChange: (prospectId: string, newStage: Stage) => Promise<void>
}

const GHOSTS = [
  { label: 'Nuevo lead',        icon: Plus,     x: -260, y: 0   },
  { label: 'Importar contacto', icon: Upload,   x: 280,  y: -40 },
  { label: 'Networking',        icon: Users,    x: 235,  y: 175 },
  { label: 'Referido',          icon: Users,    x: -130, y: 235 },
  { label: 'Contacto',          icon: UserPlus, x: -250, y: 155 },
]

export default function RadarCanvas({
  prospects, radarType, size = 620, selectedId, onSelect, onStageChange,
}: Props) {
  const cx = size / 2, cy = size / 2
  const scale = (size / 2) / 415

  const rings = radarType === 'etapa' ? RING_DEFS :
                radarType === 'temperatura' ? TEMP_RINGS : VALUE_RINGS

  const nodes = layoutProspects(prospects, radarType, size)

  // Drag & drop
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const [hoveredRing, setHoveredRing] = useState<string | null>(null)
  const [stageModal, setStageModal] = useState<{ prospectId: string; newStage: Stage } | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const getRingAtPos = useCallback((x: number, y: number): string | null => {
    const dx = x - cx, dy = y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    const sorted = [...rings].sort((a, b) => a.r - b.r)
    for (const ring of sorted) {
      if (dist <= ring.r * scale) return ring.id
    }
    return null
  }, [cx, cy, rings, scale])

  const handleMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault()
    setDraggingId(id)
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) setDragPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [])

  useEffect(() => {
    if (!draggingId) return
    const handleMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left, y = e.clientY - rect.top
      setDragPos({ x, y })
      setHoveredRing(getRingAtPos(x, y))
    }
    const handleUp = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        const x = e.clientX - rect.left, y = e.clientY - rect.top
        const targetRing = getRingAtPos(x, y)
        const dragging = prospects.find(p => p.id === draggingId)
        if (targetRing && dragging && targetRing !== dragging.stage && radarType === 'etapa') {
          setStageModal({ prospectId: draggingId, newStage: targetRing as Stage })
        }
      }
      setDraggingId(null)
      setDragPos(null)
      setHoveredRing(null)
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [draggingId, getRingAtPos, prospects, radarType])

  return (
    <div ref={containerRef} className="relative select-none" style={{ width: size, height: size }}>
      {/* SVG rings */}
      <svg width={size} height={size} className="absolute inset-0">
        {[...rings].reverse().map(ring => {
          const isHovered = hoveredRing === ring.id && draggingId
          return (
            <circle
              key={ring.id}
              cx={cx} cy={cy}
              r={ring.r * scale}
              fill={ring.fill}
              stroke={isHovered ? ring.textColor : ring.border}
              strokeWidth={isHovered ? 2.5 : 1}
              style={{ transition: 'stroke 0.15s' }}
            />
          )
        })}
        {/* Cierre inner glow */}
        <circle cx={cx} cy={cy} r={36 * scale} fill="#22c55e" opacity="0.18" />
      </svg>

      {/* Ring labels */}
      {rings.map(ring => {
        if (ring.id === 'cierre' && radarType === 'etapa') return null
        const top = cy - ring.r * scale + 16
        const count = nodes.filter(n => n.ring === ring.id).length
        return (
          <div key={ring.id} className="absolute flex flex-col items-center gap-1.5 z-[2] pointer-events-none"
            style={{ left: cx, top, transform: 'translate(-50%, -50%)' }}>
            <span className="text-[11px] font-extrabold tracking-[1.6px]"
              style={{ color: ring.textColor }}>{ring.label}</span>
            <span className="text-[10px] font-bold text-white px-2.5 py-px rounded-full"
              style={{ background: ring.textColor, fontFamily: 'var(--font-mono)' }}>
              {count}
            </span>
          </div>
        )
      })}

      {/* Cierre label (etapa mode) */}
      {radarType === 'etapa' && (
        <div className="absolute flex flex-col items-center gap-1 z-[2] pointer-events-none"
          style={{ left: cx, top: cy - 56 * scale, transform: 'translateX(-50%)' }}>
          <span className="text-[11px] font-extrabold tracking-[1.6px]" style={{ color: '#16a34a' }}>CIERRE</span>
          <span className="text-[10px] font-bold text-white px-2.5 py-px rounded-full"
            style={{ background: '#16a34a', fontFamily: 'var(--font-mono)' }}>
            {nodes.filter(n => n.ring === 'cierre').length}
          </span>
        </div>
      )}

      {/* Ghost source buttons */}
      {GHOSTS.map((g, i) => {
        const Icon = g.icon
        return (
          <div key={i} className="absolute flex flex-col items-center gap-1.5 pointer-events-none"
            style={{ left: cx + g.x * scale, top: cy + g.y * scale, transform: 'translate(-50%, -50%)' }}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ border: '1.5px dashed #94A1BD', background: 'rgba(255,255,255,0.6)', color: T.fgDim }}>
              <Icon size={18} />
            </div>
            <div className="text-[11px] text-center max-w-[80px]" style={{ color: T.fgDim }}>{g.label}</div>
          </div>
        )
      })}

      {/* Prospect nodes */}
      {nodes.map(node => {
        const isSelected = node.id === selectedId
        const isDragging = node.id === draggingId
        const isHovered = node.id === hoveredId
        const tempColor = TEMP_COLORS[node.temperature] ?? '#9ca3af'
        const stageC = STAGE_COLORS[node.stage as keyof typeof STAGE_COLORS]
        const x = isDragging && dragPos ? dragPos.x : node.x
        const y = isDragging && dragPos ? dragPos.y : node.y

        return (
          <div
            key={node.id}
            className="absolute flex flex-col items-center cursor-pointer"
            style={{
              left: x, top: y,
              transform: 'translate(-50%, -50%)',
              zIndex: isSelected ? 30 : isDragging ? 40 : isHovered ? 20 : 5,
              transition: isDragging ? 'none' : 'left 0.3s ease, top 0.3s ease',
            }}
            onMouseEnter={() => setHoveredId(node.id)}
            onMouseLeave={() => setHoveredId(null)}
            onMouseDown={e => handleMouseDown(e, node.id)}
            onClick={() => !isDragging && onSelect(isSelected ? null : node.id)}>

            {/* Avatar circle */}
            <div
              className="w-[50px] h-[50px] rounded-full flex items-center justify-center font-bold text-sm text-white"
              style={{
                background: 'linear-gradient(135deg,#475569,#334155)',
                border: `3px solid ${tempColor}`,
                boxShadow: isSelected
                  ? `0 0 0 6px ${tempColor}33, 0 4px 12px rgba(11,27,61,0.18)`
                  : `0 2px 8px rgba(11,27,61,0.18)`,
                fontFamily: 'var(--font-display)',
              }}>
              {node.initials}
            </div>

            {/* Vencido badge */}
            {node.temperature === 'urgente' || node.temperature === 'riesgo' ? (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center"
                style={{ background: tempColor, fontSize: 8, color: '#fff', fontWeight: 700 }}>!</div>
            ) : null}

            {/* Name */}
            <div className="mt-1 text-[11px] font-bold text-center max-w-[72px] truncate"
              style={{ color: T.fgHi }}>{node.name.split(' ')[0]}</div>

            {/* Value */}
            <div className="text-[10px]" style={{ color: T.fgDim, fontFamily: 'var(--font-mono)' }}>
              {node.potential_value ? fmtMoneyShort(node.potential_value) : '—'}
            </div>

            {/* Hover mini-card */}
            {isHovered && !isDragging && (
              <div
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 rounded-xl p-3 z-50 pointer-events-none"
                style={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 8px 24px rgba(11,27,61,0.15)',
                }}>
                <div className="font-bold text-sm" style={{ color: T.fgHi }}>{node.name}</div>
                <div className="text-[11px] mt-0.5" style={{ color: T.fgDim }}>{node.company}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: stageC?.ring, color: stageC?.label }}>
                    {node.stage}
                  </span>
                  <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-mono)', color: T.fgHi }}>
                    {node.potential_value ? fmtMoneyShort(node.potential_value) : '—'}
                  </span>
                </div>
                {node.next_action_type && (
                  <div className="text-[11px] mt-1.5" style={{ color: T.fgDim }}>
                    Próx: {node.next_action_type.replace('_', ' ')}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Stage change modal */}
      {stageModal && (
        <StageChangeModal
          prospectId={stageModal.prospectId}
          newStage={stageModal.newStage}
          prospectName={prospects.find(p => p.id === stageModal.prospectId)?.name ?? ''}
          onConfirm={async (action) => {
            await onStageChange(stageModal.prospectId, stageModal.newStage)
            setStageModal(null)
            void action
          }}
          onCancel={() => setStageModal(null)}
        />
      )}
    </div>
  )
}
