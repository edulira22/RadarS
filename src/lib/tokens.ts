// RadarS design tokens — single source of truth for non-Tailwind usage (SVG, inline styles)

export const T = {
  navyDeep:    '#0B1B3D',
  navy800:     '#11265A',
  ocean:       '#2563EB',
  oceanDark:   '#1D4ED8',
  cyan:        '#04C4D9',
  gold:        '#F2B705',
  orange:      '#F25C05',
  green:       '#22c55e',
  red:         '#ef4444',
  gray:        '#9ca3af',
  bg:          '#F4F6FA',
  bg2:         '#EEF2F8',
  card:        '#FFFFFF',
  cardSoft:    '#F8FAFD',
  border:      '#E4E9F2',
  borderSoft:  '#EEF1F7',
  fgHi:        '#0B1B3D',
  fg:          '#1F2A47',
  fgDim:       '#6B7793',
  fgMuted:     '#94A1BD',
  fgOnDark:    '#F4F8FF',
  fgOnDarkDim: '#9FB0D0',
} as const

export const STAGE_COLORS = {
  base:        { ring: '#EAF1F8', border: '#CFE0EE', label: '#6B8FB5',  strong: '#5C7CA5' },
  prospeccion: { ring: '#DCE7F3', border: '#B7CDE6', label: '#3E78C2',  strong: '#2563EB' },
  interes:     { ring: '#C7DDF0', border: '#9DC4E5', label: '#F25C05',  strong: '#F25C05' },
  decision:    { ring: '#FFF1CF', border: '#F2D277', label: '#B5870A',  strong: '#F2B705' },
  cierre:      { ring: '#D8F0DC', border: '#88D29C', label: '#16a34a',  strong: '#22c55e' },
} as const

export const TEMP_COLORS: Record<string, string> = {
  activo:   '#22c55e',
  atencion: '#F2B705',
  urgente:  '#F25C05',
  riesgo:   '#ef4444',
  dormido:  '#9ca3af',
}

export const TEMP_LABELS: Record<string, string> = {
  activo:   'Activo',
  atencion: 'Atención',
  urgente:  'Urgente',
  riesgo:   'Riesgo',
  dormido:  'Dormido',
}

export const STAGE_LABELS: Record<string, string> = {
  base:        'Base de datos',
  prospeccion: 'Prospección',
  interes:     'Interés real',
  decision:    'Decisión',
  cierre:      'Cierre',
  ganado:      'Ganado',
  perdido:     'Perdido',
  dormido:     'Dormido',
}

export const ACTION_LABELS: Record<string, string> = {
  llamar:            'Llamar',
  enviar_propuesta:  'Enviar propuesta',
  agendar_reunion:   'Agendar reunión',
  dar_seguimiento:   'Dar seguimiento',
  cerrar:            'Cerrar',
  recuperar:         'Recuperar',
  otro:              'Otro',
}

export const SOURCE_LABELS: Record<string, string> = {
  referido:       'Referido',
  networking:     'Networking',
  redes_sociales: 'Redes sociales',
  publicidad:     'Publicidad',
  otro:           'Otro',
}

export const ACTIVITY_LABELS: Record<string, string> = {
  nota:               'Nota',
  llamada:            'Llamada',
  whatsapp:           'WhatsApp',
  correo:             'Correo',
  reunion:            'Reunión',
  propuesta_enviada:  'Propuesta enviada',
  seguimiento:        'Seguimiento',
  cambio_etapa:       'Cambio de etapa',
}

// Ring definitions for the radar SVG — ordered innermost to outermost
export const RING_DEFS = [
  { id: 'cierre',      label: 'CIERRE',        fill: '#D8F0DC', border: '#88D29C', textColor: '#16a34a', r: 75 },
  { id: 'decision',    label: 'DECISIÓN',      fill: '#FFF1CF', border: '#F2D277', textColor: '#B5870A', r: 150 },
  { id: 'interes',     label: 'INTERÉS REAL',  fill: '#C7DDF0', border: '#9DC4E5', textColor: '#F25C05', r: 230 },
  { id: 'prospeccion', label: 'PROSPECCIÓN',   fill: '#DCE7F3', border: '#B7CDE6', textColor: '#3E78C2', r: 310 },
  { id: 'base',        label: 'BASE DE DATOS', fill: '#EAF1F8', border: '#CFE0EE', textColor: '#6B8FB5', r: 390 },
] as const

export type StageId = 'base' | 'prospeccion' | 'interes' | 'decision' | 'cierre'
