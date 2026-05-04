'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Crosshair, Flame, BarChart2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser'
import type { RadarType, ResolutionLevel } from '@/types'

const RADAR_TYPES = [
  { id: 'etapa'       as RadarType, label: 'Etapa comercial',  sub: 'Por dónde van',      icon: Crosshair },
  { id: 'temperatura' as RadarType, label: 'Temperatura',       sub: 'Qué tan calientes',  icon: Flame     },
  { id: 'valor'       as RadarType, label: 'Valor potencial',   sub: 'Tamaño',             icon: BarChart2 },
]

const RESOLUTIONS = ['baja', 'media', 'alta'] as const

interface Props {
  userId: string
  profile: { name: string; role?: string } | null
  settings: { default_radar_type: string; resolution_level: string } | null
}

export default function SettingsForm({ userId, profile, settings }: Props) {
  const router = useRouter()
  const [name, setName] = useState(profile?.name ?? '')
  const [radarType, setRadarType] = useState<RadarType>((settings?.default_radar_type as RadarType) ?? 'etapa')
  const [resolution, setResolution] = useState<ResolutionLevel>((settings?.resolution_level as ResolutionLevel) ?? 'media')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    await Promise.all([
      supabase.from('profiles').update({ name }).eq('id', userId),
      supabase.from('radar_settings').upsert({
        user_id: userId,
        default_radar_type: radarType,
        resolution_level: resolution,
      }),
    ])
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Mi cuenta */}
      <Block title="Mi cuenta" sub="Información básica de tu usuario.">
        <div className="flex items-center gap-5 p-5 rounded-xl"
          style={{ background: 'var(--color-card-soft)', border: '1px solid var(--color-border-soft)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl text-white"
            style={{ background: 'linear-gradient(135deg,#0a6ea0,#04C4D9)' }}>
            {name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')}
          </div>
          <div className="flex-1">
            <div className="text-lg font-bold" style={{ color: 'var(--color-fg-hi)' }}>{name || '—'}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-fg-dim)', fontFamily: 'var(--font-mono)' }}>
              Plan Operador · MVP
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3.5 mt-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.4px] mb-1.5"
              style={{ color: 'var(--color-fg-dim)' }}>Nombre</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--color-card-soft)', border: '1px solid var(--color-border)', color: 'var(--color-fg-hi)' }} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.4px] mb-1.5"
              style={{ color: 'var(--color-fg-dim)' }}>Correo</label>
            <input disabled defaultValue={profile?.name ?? ''}
              className="w-full h-11 px-3.5 rounded-xl text-sm"
              style={{
                background: 'var(--color-card-soft)', border: '1px solid var(--color-border)',
                color: 'var(--color-fg-muted)', fontFamily: 'var(--font-mono)', cursor: 'not-allowed',
              }} />
          </div>
        </div>
      </Block>

      {/* Radar prefs */}
      <Block title="Preferencias del radar" sub="Cómo quieres que se vea tu radar al iniciar.">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.4px] mb-3"
            style={{ color: 'var(--color-fg-dim)' }}>Tipo de radar predeterminado</label>
          <div className="grid grid-cols-3 gap-2.5">
            {RADAR_TYPES.map(rt => {
              const Icon = rt.icon
              const active = radarType === rt.id
              return (
                <button key={rt.id} type="button" onClick={() => setRadarType(rt.id)}
                  className="p-3.5 rounded-xl text-left transition-all"
                  style={{
                    background: active ? '#EEF4FF' : 'var(--color-card-soft)',
                    border: `1.5px solid ${active ? 'var(--color-ocean)' : 'var(--color-border)'}`,
                  }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon size={17} style={{ color: active ? 'var(--color-ocean)' : 'var(--color-fg)' }} />
                    <span className="text-[13px] font-semibold"
                      style={{ color: active ? 'var(--color-ocean)' : 'var(--color-fg-hi)' }}>{rt.label}</span>
                    {active && <Check size={13} style={{ color: 'var(--color-ocean)', marginLeft: 'auto' }} />}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--color-fg-dim)' }}>{rt.sub}</div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.4px] mb-2"
            style={{ color: 'var(--color-fg-dim)' }}>Resolución predeterminada</label>
          <div className="inline-flex p-1 rounded-xl"
            style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
            {RESOLUTIONS.map(r => (
              <button key={r} type="button" onClick={() => setResolution(r)}
                className="px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
                style={{
                  background: resolution === r ? 'var(--color-card)' : 'transparent',
                  color: resolution === r ? 'var(--color-ocean)' : 'var(--color-fg-dim)',
                  boxShadow: resolution === r ? '0 1px 3px rgba(11,27,61,0.10)' : 'none',
                }}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Block>

      {/* Coming soon */}
      <Block title="Próximamente" sub="Funciones en construcción." faded>
        <div className="grid grid-cols-2 gap-3">
          {[
            { t: 'Personalización de etapas', d: 'Define tu propio embudo.' },
            { t: 'Colores de etiquetas',      d: 'Crea categorías visuales.' },
            { t: 'Integraciones',             d: 'WhatsApp Business, Google Calendar, HubSpot.' },
            { t: 'Automatizaciones',          d: 'Mueve nodos al detectar señales.' },
          ].map(f => (
            <div key={f.t} className="p-3.5 rounded-xl opacity-80"
              style={{ background: 'var(--color-card-soft)', border: '1px dashed var(--color-border)' }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-semibold" style={{ color: 'var(--color-fg-hi)' }}>{f.t}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--color-bg-2)', color: 'var(--color-fg-muted)' }}>PRÓXIMAMENTE</span>
              </div>
              <div className="text-xs leading-snug" style={{ color: 'var(--color-fg-dim)' }}>{f.d}</div>
            </div>
          ))}
        </div>
      </Block>

      {/* Save button */}
      <div>
        <button onClick={handleSave} disabled={saving}
          className="h-11 px-6 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition-opacity disabled:opacity-60"
          style={{ background: 'var(--color-ocean)' }}>
          {saving ? 'Guardando…' : saved ? <><Check size={15} /> Guardado</> : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

function Block({ title, sub, faded, children }: {
  title: string; sub: string; faded?: boolean; children: React.ReactNode
}) {
  return (
    <div className="p-6 rounded-2xl flex flex-col gap-4"
      style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        opacity: faded ? 0.95 : 1,
      }}>
      <div>
        <div className="text-base font-bold tracking-tight" style={{ color: 'var(--color-fg-hi)' }}>{title}</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--color-fg-dim)' }}>{sub}</div>
      </div>
      {children}
    </div>
  )
}
