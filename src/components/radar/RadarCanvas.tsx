'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Plus, Upload, Users, UserPlus } from 'lucide-react'
import { RING_DEFS, STAGE_COLORS, TEMP_COLORS, T } from '@/lib/tokens'
import { polar, fmtMoneyShort } from '@/lib/utils'
import type { ProspectView, Stage, RadarType } from '@/types'
import StageChangeModal from './StageChangeModal'

const RING_RADII: Record<string, number> = {
  cierre:      75,
  decision:    150,
  interes:     230,
  prospeccion: 310,
  base:        390,
}

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

// Ghost source buttons — positioned by angle offset from center
const GHOSTS = [
  { label: 'Nuevo lead',        icon: Plus,     x: -260, y: 0,   source: 'nuevo'       },
  { label: 'Importar contacto', icon: Upload,   x: 280,  y: -40, source: 'otro'        },
  { label: 'Networking',        icon: Users,    x: 235,  y: 175, source: 'evento'      },
  { label: 'Referido',          icon: Users,    x: -130, y: 235, source: 'referido'    },
  { label: 'Contacto',          icon: UserPlus, x: -250, y: 155, source: 'prospectado' },
]

interface Props {
  prospects: ProspectView[]
  radarType: RadarType
  size?: number
  selectedId?: string | null
  onSelect: (id: string | null) => void
  onStageChange: (prospectId: string, newStage: Stage) => Promise<void>
  onGhostClick?: (source: string) => void
}

export default function RadarCanvas({
  prospects, radarType, size = 620, selectedId, onSelect, onStageChange, onGhostClick,
}: Props) {
  const cx = size / 2, cy = size / 2
  const scale = (size / 2) / 415

  const rings = radarType === 'etapa' ? RING_DEFS :
                radarType === 'temperatura' ? TEMP_RINGS : VALUE_RINGS

  const nodes = layoutProspects(prospects, radarType, size)

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

  // Node size scales with radar size
  const nodeSize = Math.max(38, Math.min(54, size * 0.082))
  const fontSize = Math.max(9, Math.min(12, size * 0.018))

  return (
    <div ref={containerRef} className="relative select-none" style={{ width: size, height: size }}>
      {/* SVG rings */}
      <svg width={size} height={size} className="absolute inset-0">
        {/* Outer glow */}
        <circle cx={cx} cy={cy} r={(size / 2) - 2}
          fill="none" stroke="var(--color-border)" strokeWidth="1" opacity="0.5" />

        {[...rings].reverse().map(ring => {
          const isHovered = hoveredRing === ring.id && draggingId
          return (
            <circle key={ring.id} cx={cx} cy={cy}
              r={ring.r * scale}
              fill={ring.fill}
              stroke={isHovered ? ring.textColor : ring.border}
              strokeWidth={isHovered ? 2.5 : 1.5}
              style={{ transition: 'stroke 0.15s, stroke-width 0.15s' }}
            />
          )
        })}

        {/* Center cierre glow */}
        <circle cx={cx} cy={cy} r={55 * scale} fill="#22c55e" opacity="0.15" />
        <circle cx={cx} cy={cy} r={30 * scale} fill="#22c55e" opacity="0.20" />

        {/* Cross-hair lines (subtle) */}
        <line x1={cx} y1={cy - (size/2 - 8)} x2={cx} y2={cy + (size/2 - 8)}
          stroke="var(--color-border)" strokeWidth="0.5" opacity="0.4" strokeDasharray="4 6" />
        <line x1={cx - (size/2 - 8)} y1={cy} x2={cx + (size/2 - 8)} y2={cy}
          stroke="var(--color-border)" strokeWidth="0.5" opacity="0.4" strokeDasharray="4 6" />
      </svg>

      {/* Ring labels */}
      {rings.map(ring => {
        if (ring.id === 'cierre' && radarType === 'etapa') return null
        const top = cy - ring.r * scale + 14
        const count = nodes.filter(n => n.ring === ring.id).length
        return (
          <div key={ring.id} className="absolute flex flex-col items-center gap-1 z-[2] pointer-events-none"
            style={{ left: cx, top, transform: 'translate(-50%, -50%)' }}>
            <span className="font-extrabold tracking-[1.4px]"
              style={{ color: ring.textColor, fontSize: Math.max(9, fontSize - 1) }}>
              {ring.label}
            </span>
            <span className="font-bold text-white px-2 py-px rounded-full"
              style={{ background: ring.textColor, fontFamily: 'var(--font-mono)', fontSize: Math.max(8, fontSize - 2) }}>
              {count}
            </span>
          </div>
        )
      })}

      {/* Cierre label */}
      {radarType === 'etapa' && (
        <div className="absolute flex flex-col items-center gap-1 z-[2] pointer-events-none"
          style={{ left: cx, top: cy - 52 * scale, transform: 'translateX(-50%)' }}>
          <span className="font-extrabold tracking-[1.4px]"
            style={{ color: '#16a34a', fontSize: Math.max(9, fontSize - 1) }}>CIERRE</span>
          <span className="font-bold text-white px-2 py-px rounded-full"
            style={{ background: '#16a34a', fontFamily: 'var(--font-mono)', fontSize: Math.max(8, fontSize - 2) }}>
            {nodes.filter(n => n.ring === 'cierre').length}
          </span>
        </div>
      )}

      {/* Ghost source buttons — clickable */}
      {GHOSTS.map((g, i) => {
        const Icon = g.icon
        const ghostSize = Math.max(36, Math.min(48, size * 0.075))
        return (
          <div key={i}
            data-ghost-btn="true"
            className="absolute flex flex-col items-center gap-1.5 cursor-pointer group"
            style={{ left: cx + g.x * scale, top: cy + g.y * scale, transform: 'translate(-50%, -50%)', zIndex: 3 }}
            onClick={() => onGhostClick?.(g.source)}>
            <div
              className="rounded-full flex items-center justify-center transition-all group-hover:scale-110"
              style={{
                width: ghostSize, height: ghostSize,
                border: '1.5px dashed #94A1BD',
                background: 'rgba(255,255,255,0.75)',
                color: T.fgDim,
                boxShadow: '0 2px 8px rgba(11,27,61,0.06)',
              }}>
              <Icon size={ghostSize * 0.38} />
            </div>
            <div className="text-center font-medium leading-tight"
              style={{ color: T.fgDim, fontSize: Math.max(9, fontSize - 2), maxWidth: 72 }}>
              {g.label}
            </div>
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
          <div key={node.id}
            data-prospect-node="true"
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

            {/* Avatar */}
            <div
              className="rounded-full flex items-center justify-center font-bold text-white"
              style={{
                width: nodeSize, height: nodeSize,
                fontSize: nodeSize * 0.3,
                background: `linear-gradient(135deg,${tempColor}CC,${tempColor}88)`,
                border: `3px solid ${tempColor}`,
                boxShadow: isSelected
                  ? `0 0 0 5px ${tempColor}33, 0 4px 16px rgba(11,27,61,0.20)`
                  : isDragging
                  ? `0 8px 24px rgba(11,27,61,0.25)`
                  : `0 2px 8px rgba(11,27,61,0.14)`,
                fontFamily: 'var(--font-display)',
              }}>
              {node.initials}
            </div>

            {/* Urgency badge */}
            {(node.temperature === 'urgente' || node.temperature === 'riesgo') && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center"
                style={{ background: tempColor, fontSize: 8, color: '#fff', fontWeight: 700 }}>!</div>
            )}

            {/* Name */}
            <div className="mt-1 font-bold text-center truncate"
              style={{ color: T.fgHi, fontSize, maxWidth: nodeSize + 20 }}>
              {node.name.split(' ')[0]}
            </div>

            {/* Value */}
            {node.potential_value ? (
              <div style={{ color: T.fgDim, fontFamily: 'var(--font-mono)', fontSize: Math.max(8, fontSize - 2) }}>
                {fmtMoneyShort(node.potential_value)}
              </div>
            ) : null}

            {/* Hover card */}
            {isHovered && !isDragging && (
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 rounded-xl p-3 z-50 pointer-events-none"
                style={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  boxShadow: '0 8px 24px rgba(11,27,61,0.15)',
                }}>
                <div className="font-bold text-sm" style={{ color: T.fgHi }}>{node.name}</div>
                {node.company && (
                  <div className="text-[11px] mt-0.5" style={{ color: T.fgDim }}>{node.company}</div>
                )}
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
                    Próx: {node.next_action_type.replace(/_/g, ' ')}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

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
