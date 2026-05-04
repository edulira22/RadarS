'use client'

import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, ChevronDown, ArrowRight, MessageCircle, Phone, Mail, Users } from 'lucide-react'
import { prospectSchema, type ProspectFormData } from '@/lib/schemas/prospect'
import { STAGE_COLORS, STAGE_LABELS, ACTION_LABELS, SOURCE_LABELS } from '@/lib/tokens'
import type { ProspectView } from '@/types'

const STAGES = ['base', 'prospeccion', 'interes', 'decision', 'cierre'] as const
const ACTIONS = ['llamar', 'enviar_propuesta', 'agendar_reunion', 'dar_seguimiento', 'otro'] as const
const MEDIUMS = [
  { id: 'whatsapp',   label: 'WhatsApp',   icon: MessageCircle, color: '#22c55e' },
  { id: 'llamada',    label: 'Llamada',    icon: Phone,         color: '#2563EB' },
  { id: 'email',      label: 'Email',      icon: Mail,          color: '#04C4D9' },
  { id: 'presencial', label: 'Presencial', icon: Users,         color: '#a855f7' },
] as const

interface Props {
  userId: string
  prospect?: ProspectView
  defaultSource?: string
  onClose: () => void
  onSaved: () => void
}

export default function ProspectForm({ userId, prospect, defaultSource, onClose, onSaved }: Props) {
  const isEdit = !!prospect
  const [showExtra, setShowExtra] = useState(!!defaultSource)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProspectFormData>({
    resolver: zodResolver(prospectSchema) as unknown as Resolver<ProspectFormData>,
    defaultValues: {
      name: prospect?.name ?? '',
      stage: (prospect?.stage as typeof STAGES[number]) ?? 'prospeccion',
      next_action_type: prospect?.next_action_type as typeof ACTIONS[number] ?? 'llamar',
      next_action_date: prospect?.next_action_date?.slice(0, 16) ?? '',
      contact_medium: prospect?.contact_medium as 'whatsapp' | 'llamada' | 'email' | 'presencial' ?? 'whatsapp',
      company: prospect?.company ?? '',
      phone: prospect?.phone ?? '',
      email: prospect?.email ?? '',
      potential_value: prospect?.potential_value ?? undefined,
      probability: prospect?.probability ?? undefined,
      source: (prospect?.source ?? defaultSource ?? '') as ProspectFormData['source'],
    },
  })

  const selectedStage = watch('stage')
  const selectedMedium = watch('contact_medium')
  const nextActionDate = watch('next_action_date')

  const onSubmit = async (data: ProspectFormData) => {
    setSaving(true)
    setError(null)
    try {
      const { createClient } = await import('@/lib/supabase/browser')
      const supabase = createClient()

      const payload = {
        user_id: userId,
        name: data.name,
        stage: data.stage,
        next_action_type: data.next_action_type,
        next_action_date: data.next_action_date,
        contact_medium: data.contact_medium,
        company: data.company || null,
        phone: data.phone || null,
        email: data.email || null,
        potential_value: data.potential_value ?? null,
        probability: data.probability ?? null,
        source: (data as { source?: string }).source || null,
        temperature: 'activo',
        status: 'active',
      }

      if (isEdit) {
        const { error: err } = await supabase.from('prospects').update(payload).eq('id', prospect.id)
        if (err) throw err
      } else {
        const { data: created, error: err } = await supabase.from('prospects').insert(payload).select().single()
        if (err) throw err
        // Add key notes as a prospect_note
        if (data.key_notes && created) {
          await supabase.from('prospect_notes').insert({
            prospect_id: created.id,
            content: data.key_notes,
          })
        }
      }

      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const inp = {
    className: 'w-full h-11 px-3.5 rounded-xl text-sm outline-none transition-all',
    style: {
      background: 'var(--color-card-soft)',
      border: '1px solid var(--color-border)',
      color: 'var(--color-fg-hi)',
    } as React.CSSProperties,
  }

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ background: 'rgba(11,27,61,0.25)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}>
      <div
        className="absolute right-0 top-0 bottom-0 w-[720px] flex flex-col"
        style={{ background: 'var(--color-card)', boxShadow: '-30px 0 80px -20px rgba(11,27,61,0.20)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-7 py-6 flex items-center justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <div className="text-[11px] font-extrabold tracking-widest" style={{ color: 'var(--color-ocean)' }}>
              {isEdit ? 'EDITAR PROSPECTO' : 'NUEVO PROSPECTO'}
            </div>
            <div className="text-[22px] font-bold mt-1" style={{ color: 'var(--color-fg-hi)' }}>
              {isEdit ? prospect.name : 'Agrega a tu radar'}
            </div>
            {!isEdit && (
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-fg-dim)' }}>Solo lo esencial. ~30 segundos.</div>
            )}
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-6">
            {error && (
              <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#FEF2F2', color: '#ef4444' }}>
                {error}
              </div>
            )}

            {/* Datos esenciales */}
            <Section label="Datos esenciales" badge="OBLIGATORIO" badgeColor="var(--color-ocean)">
              <Field label="Nombre completo" required error={errors.name?.message}>
                <input {...register('name')} placeholder="Nombre completo" {...inp} />
              </Field>

              {/* Stage selector */}
              <Field label="Etapa inicial" required error={errors.stage?.message}>
                <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
                  {STAGES.map(s => {
                    const sc = STAGE_COLORS[s as keyof typeof STAGE_COLORS]
                    const active = selectedStage === s
                    return (
                      <button type="button" key={s}
                        onClick={() => setValue('stage', s)}
                        className="flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl text-center transition-all"
                        style={{
                          background: active ? sc.ring : 'var(--color-card-soft)',
                          border: `1.5px solid ${active ? sc.border : 'var(--color-border)'}`,
                          color: active ? sc.label : 'var(--color-fg)',
                        }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: sc.strong }} />
                        <span className="text-[11px] font-semibold">{STAGE_LABELS[s]?.split(' ')[0]}</span>
                      </button>
                    )
                  })}
                </div>
              </Field>

              {/* Action + Date */}
              <div className="grid grid-cols-2 gap-3.5">
                <Field label="Próxima acción" required error={errors.next_action_type?.message}>
                  <div className="relative">
                    <select {...register('next_action_type')} {...inp}
                      style={{ ...inp.style, paddingRight: '2rem', appearance: 'none', cursor: 'pointer' }}>
                      {ACTIONS.map(a => <option key={a} value={a}>{ACTION_LABELS[a]}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--color-fg-dim)' }} />
                  </div>
                </Field>
                <Field label="Fecha y hora" required error={errors.next_action_date?.message}>
                  <DateTimePicker
                    value={nextActionDate}
                    onChange={(v) => setValue('next_action_date', v, { shouldValidate: true })}
                  />
                </Field>
              </div>

              {/* Contact medium */}
              <Field label="Medio preferido" required error={errors.contact_medium?.message}>
                <div className="grid grid-cols-4 gap-2">
                  {MEDIUMS.map(m => {
                    const Icon = m.icon
                    const active = selectedMedium === m.id
                    return (
                      <button type="button" key={m.id}
                        onClick={() => setValue('contact_medium', m.id)}
                        className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
                        style={{
                          background: active ? m.color + '14' : 'var(--color-card-soft)',
                          border: `1.5px solid ${active ? m.color : 'var(--color-border)'}`,
                          color: active ? m.color : 'var(--color-fg)',
                        }}>
                        <Icon size={18} />
                        <span className="text-[11px] font-semibold">{m.label}</span>
                      </button>
                    )
                  })}
                </div>
              </Field>
            </Section>

            {/* Optional section */}
            <Section
              label="Información adicional"
              badge="OPCIONAL"
              badgeColor="var(--color-fg-muted)"
              expandable
              expanded={showExtra}
              onToggle={() => setShowExtra(v => !v)}>
              {showExtra && (
                <>
                  <div className="grid grid-cols-2 gap-3.5">
                    <Field label="Empresa"><input {...register('company')} placeholder="Empresa S.A." {...inp} /></Field>
                    <Field label="Teléfono">
                      <input {...register('phone')} placeholder="+52 55 ..." {...inp}
                        style={{ ...inp.style, fontFamily: 'var(--font-mono)' }} />
                    </Field>
                    <Field label="Correo" error={errors.email?.message}>
                      <input {...register('email')} type="email" placeholder="correo@empresa.mx" {...inp} />
                    </Field>
                    <Field label="Fuente">
                      <div className="relative">
                        <select {...register('source' as keyof ProspectFormData)} {...inp}
                          style={{ ...inp.style, paddingRight: '2rem', appearance: 'none', cursor: 'pointer' }}>
                          <option value="">— seleccionar</option>
                          {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                          style={{ color: 'var(--color-fg-dim)' }} />
                      </div>
                    </Field>
                    <Field label="Valor potencial ($)" error={errors.potential_value?.message}>
                      <input {...register('potential_value')} type="number" placeholder="0"
                        {...inp} style={{ ...inp.style, fontFamily: 'var(--font-mono)', color: 'var(--color-ocean)' }} />
                    </Field>
                    <Field label="Probabilidad (%)" error={errors.probability?.message}>
                      <input {...register('probability')} type="number" min="0" max="100" placeholder="50"
                        {...inp} style={{ ...inp.style, fontFamily: 'var(--font-mono)' }} />
                    </Field>
                  </div>
                  <Field label="Puntos clave">
                    <textarea {...register('key_notes')}
                      placeholder="Notas importantes sobre este prospecto…"
                      className="w-full px-3.5 py-3 rounded-xl text-sm outline-none resize-y min-h-[80px]"
                      style={{
                        background: 'var(--color-card-soft)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-fg-hi)',
                        lineHeight: 1.6,
                      }} />
                  </Field>
                </>
              )}
            </Section>
          </div>

          {/* Footer */}
          <div className="px-7 py-4 flex justify-end gap-2.5 flex-shrink-0"
            style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-card-soft)' }}>
            <button type="button" onClick={onClose}
              className="h-10 px-5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-fg-hi)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="h-10 px-5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition-opacity disabled:opacity-60"
              style={{ background: 'var(--color-ocean)' }}>
              {saving ? 'Guardando…' : <>{isEdit ? 'Guardar cambios' : 'Crear prospecto'} <ArrowRight size={14} /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────

function Section({
  label, badge, badgeColor, children, expandable, expanded, onToggle,
}: {
  label: string
  badge?: string
  badgeColor?: string
  children: React.ReactNode
  expandable?: boolean
  expanded?: boolean
  onToggle?: () => void
}) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-2.5 pb-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <span className="text-[13px] font-bold" style={{ color: 'var(--color-fg-hi)' }}>{label}</span>
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: badgeColor + '20', color: badgeColor, border: `1px solid ${badgeColor}40` }}>
            {badge}
          </span>
        )}
        {expandable && (
          <button type="button" onClick={onToggle}
            className="ml-auto text-xs font-semibold flex items-center gap-1"
            style={{ color: 'var(--color-ocean)' }}>
            <ChevronDown size={12} style={{ transform: expanded ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
            {expanded ? 'Ocultar' : 'Agregar más datos'}
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function Field({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-[0.4px] mb-1.5"
        style={{ color: 'var(--color-fg-dim)' }}>
        {label} {required && <span style={{ color: 'var(--color-orange)' }}>*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] mt-1" style={{ color: '#ef4444' }}>{error}</p>}
    </div>
  )
}

function DateTimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  const add = (d: Date, days: number) => new Date(d.getTime() + days * 86400000)
  const today = new Date()

  const presets = [
    { label: 'Hoy',        date: fmt(today),        time: '10:00' },
    { label: 'Mañana',     date: fmt(add(today, 1)), time: '10:00' },
    { label: 'En 3 días',  date: fmt(add(today, 3)), time: '10:00' },
    { label: 'En 1 semana',date: fmt(add(today, 7)), time: '10:00' },
  ]

  const currentDate = value?.slice(0, 10) ?? ''
  const currentTime = value?.slice(11, 16) ?? ''

  const update = (d: string, t: string) => {
    if (d) onChange(`${d}T${t || '10:00'}`)
  }

  const baseStyle: React.CSSProperties = {
    background: 'var(--color-card-soft)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-fg-hi)',
    fontFamily: 'var(--font-mono)',
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Quick presets */}
      <div className="flex gap-1.5 flex-wrap">
        {presets.map(p => {
          const isActive = currentDate === p.date
          return (
            <button type="button" key={p.label}
              onClick={() => update(p.date, p.time)}
              className="px-3 py-1 rounded-lg text-[11px] font-semibold transition-all"
              style={{
                background: isActive ? 'var(--color-ocean)' : 'var(--color-bg)',
                color: isActive ? '#fff' : 'var(--color-fg-dim)',
                border: `1px solid ${isActive ? 'var(--color-ocean)' : 'var(--color-border)'}`,
              }}>
              {p.label}
            </button>
          )
        })}
      </div>

      {/* Date + Time selectors */}
      <div className="flex gap-2">
        <input type="date" value={currentDate}
          onChange={e => update(e.target.value, currentTime)}
          className="flex-1 h-10 px-3 rounded-xl text-sm outline-none"
          style={baseStyle}
        />
        <select value={currentTime}
          onChange={e => update(currentDate, e.target.value)}
          className="h-10 px-3 rounded-xl text-sm outline-none"
          style={{ ...baseStyle, cursor: 'pointer' }}>
          <option value="">— hora</option>
          {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
