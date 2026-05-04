'use client'

import { useActionState } from 'react'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { signIn } from './actions'

type SignInState = { error?: string }
const initialState: SignInState = {}

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(signIn, initialState)
  const [showPw, setShowPw] = useState(false)

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state?.error && (
        <div className="px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: '#FEF2F2', color: '#ef4444', border: '1px solid #FECACA' }}>
          {state.error}
        </div>
      )}

      {/* Email */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] mb-2"
          style={{ color: 'var(--color-fg-dim)' }}>
          Correo
        </label>
        <div className="flex items-center gap-3 px-4 h-12 rounded-xl"
          style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
          <Mail size={16} style={{ color: 'var(--color-fg-dim)', flexShrink: 0 }} />
          <input
            name="email"
            type="email"
            placeholder="tu@correo.com"
            required
            autoComplete="email"
            className="flex-1 bg-transparent border-none outline-none text-sm"
            style={{ color: 'var(--color-fg-hi)' }}
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] mb-2"
          style={{ color: 'var(--color-fg-dim)' }}>
          Contraseña
        </label>
        <div className="flex items-center gap-3 px-4 h-12 rounded-xl"
          style={{
            background: 'var(--color-bg)',
            border: '1.5px solid var(--color-ocean)',
            boxShadow: '0 0 0 3px rgba(37,99,235,0.10)',
          }}>
          <Lock size={16} style={{ color: 'var(--color-fg-dim)', flexShrink: 0 }} />
          <input
            name="password"
            type={showPw ? 'text' : 'password'}
            placeholder="••••••••••"
            required
            autoComplete="current-password"
            className="flex-1 bg-transparent border-none outline-none text-sm tracking-widest"
            style={{ color: 'var(--color-fg-hi)', fontFamily: 'var(--font-mono)' }}
          />
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            className="p-1 rounded"
            style={{ color: 'var(--color-fg-dim)' }}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
        style={{
          background: 'var(--color-ocean)',
          boxShadow: '0 4px 14px -4px rgba(37,99,235,0.5)',
        }}>
        {pending ? 'Entrando…' : <>Entrar <ArrowRight size={16} /></>}
      </button>
    </form>
  )
}
