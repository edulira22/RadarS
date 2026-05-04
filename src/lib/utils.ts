import { type Stage, type Temperature } from '@/types'
import { STAGE_COLORS, TEMP_COLORS, TEMP_LABELS, STAGE_LABELS } from './tokens'

// ─── Money formatting ──────────────────────────────────────────────
export function fmtMoney(n: number): string {
  return '$' + n.toLocaleString('es-MX')
}

export function fmtMoneyShort(n: number): string {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'k'
  return '$' + n
}

// ─── Initials ─────────────────────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

// ─── Temperature calculation ──────────────────────────────────────
export function calcTemperature(
  nextActionDate: string | null,
  lastContactDate: string | null,
  status: string,
): Temperature {
  if (status === 'dormido') return 'dormido'

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (lastContactDate) {
    const last = new Date(lastContactDate)
    const daysSinceLast = Math.floor((today.getTime() - last.getTime()) / 86_400_000)
    if (daysSinceLast > 30) return 'dormido'
  }

  if (!nextActionDate) return 'activo'

  const next = new Date(nextActionDate)
  const nextDay = new Date(next.getFullYear(), next.getMonth(), next.getDate())
  const diff = Math.floor((nextDay.getTime() - today.getTime()) / 86_400_000)

  if (diff < -7) return 'riesgo'
  if (diff < 0)  return 'urgente'
  if (diff === 0) return 'atencion'
  return 'activo'
}

// ─── Stage helpers ────────────────────────────────────────────────
export function stageColor(stage: Stage) {
  return STAGE_COLORS[stage as keyof typeof STAGE_COLORS] ?? STAGE_COLORS.base
}
export function stageLabel(stage: Stage) { return STAGE_LABELS[stage] ?? stage }
export function tempColor(temp: Temperature) { return TEMP_COLORS[temp] ?? TEMP_COLORS.activo }
export function tempLabel(temp: Temperature) { return TEMP_LABELS[temp] ?? temp }

// ─── Date formatting ──────────────────────────────────────────────
export function relativeDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffD = Math.floor(diffMs / 86_400_000)
  if (diffD === 0) return 'hoy'
  if (diffD === 1) return 'ayer'
  if (diffD < 7) return `hace ${diffD} d`
  if (diffD < 30) return `hace ${Math.floor(diffD / 7)} sem`
  return `hace ${Math.floor(diffD / 30)} mes`
}

export function fmtDateTime(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const day = d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
  const time = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  return `${day} · ${time}`
}

// ─── Polar coordinates for radar nodes ────────────────────────────
export function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg - 90) * Math.PI / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

// ─── Class name concatenation ─────────────────────────────────────
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
