// RadarS — domain model types

export type Stage =
  | 'base'
  | 'prospeccion'
  | 'interes'
  | 'decision'
  | 'cierre'
  | 'ganado'
  | 'perdido'
  | 'dormido'

export type Temperature = 'activo' | 'atencion' | 'urgente' | 'riesgo' | 'dormido'

export type Source = 'referido' | 'networking' | 'redes_sociales' | 'publicidad' | 'otro'

export type ContactMedium = 'whatsapp' | 'llamada' | 'email' | 'presencial'

export type NextActionType =
  | 'llamar'
  | 'enviar_propuesta'
  | 'agendar_reunion'
  | 'dar_seguimiento'
  | 'cerrar'
  | 'recuperar'
  | 'otro'

export type ActivityType =
  | 'nota'
  | 'llamada'
  | 'whatsapp'
  | 'correo'
  | 'reunion'
  | 'propuesta_enviada'
  | 'seguimiento'
  | 'cambio_etapa'

export type RadarType = 'etapa' | 'temperatura' | 'valor'
export type ResolutionLevel = 'baja' | 'media' | 'alta'

// ─── DB row types ──────────────────────────────────────────────────

export interface Profile {
  id: string
  name: string
  role: string
  created_at: string
}

export interface Prospect {
  id: string
  user_id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  stage: Stage
  temperature: Temperature
  source: Source | null
  contact_medium: ContactMedium | null
  potential_value: number | null
  probability: number | null
  next_action_type: NextActionType | null
  next_action_date: string | null
  last_contact_date: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface ProspectNote {
  id: string
  prospect_id: string
  content: string
  created_at: string
}

export interface Activity {
  id: string
  prospect_id: string
  user_id: string
  type: ActivityType
  title: string
  description: string | null
  activity_date: string
  created_at: string
  profiles?: { name: string }
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
}

export interface ProspectTag {
  prospect_id: string
  tag_id: string
  tags?: Tag
}

export interface RadarSettings {
  id: string
  user_id: string
  default_radar_type: RadarType
  resolution_level: ResolutionLevel
  created_at: string
  updated_at: string
}

// ─── View / computed types ──────────────────────────────────────────

// Prospect enriched with computed temperature and tags
export interface ProspectView extends Prospect {
  tags?: Tag[]
  initials: string
}

// Summary metrics for the bottom bar
export interface RadarMetrics {
  base:        { count: number; value: number }
  prospeccion: { count: number; value: number }
  interes:     { count: number; value: number }
  decision:    { count: number; value: number }
  cierre:      { count: number; value: number }
  total:       { count: number; value: number }
}

// Daily summary for sidebar
export interface DailySummary {
  moneyInDecision: number
  totalOpportunities: number
  meetingsToday: number
  closingsThisMonth: number
}
