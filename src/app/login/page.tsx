import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from './LoginForm'
import RadarLogoMark from '@/components/ui/RadarLogoMark'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/radar')

  const rings = [
    { r: 400, fill: '#EAF1F8' },
    { r: 320, fill: '#DCE7F3' },
    { r: 240, fill: '#C7DDF0' },
    { r: 160, fill: '#FFF1CF' },
    { r: 80,  fill: '#D8F0DC' },
  ]

  return (
    <div className="min-h-screen flex relative overflow-hidden"
      style={{ background: 'var(--color-bg)' }}>

      {/* Decorative radar background (right) */}
      <div className="absolute -right-40 -top-20 w-[900px] h-[900px] opacity-50 pointer-events-none">
        <svg viewBox="0 0 800 800" width="100%" height="100%">
          {rings.map((ring, i) => (
            <circle key={i} cx="400" cy="400" r={ring.r}
              fill={ring.fill + '80'} stroke="#CFE0EE" strokeWidth="1" />
          ))}
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center px-24 max-w-2xl">
        {/* Logo */}
        <div className="flex items-center gap-4 mb-14">
          <RadarLogoMark size={44} />
          <span className="text-3xl font-bold tracking-tight"
            style={{ color: 'var(--color-navy-deep)' }}>
            RadarS
          </span>
        </div>

        {/* Headline */}
        <div className="mb-10 max-w-md">
          <h1 className="text-5xl font-bold tracking-tighter leading-[1.05] m-0"
            style={{ color: 'var(--color-navy-deep)' }}>
            Bienvenido de vuelta.{' '}
            <span style={{ color: 'var(--color-ocean)' }}>
              ¿A quién atiendes hoy?
            </span>
          </h1>
          <p className="mt-5 text-base leading-relaxed"
            style={{ color: 'var(--color-fg-dim)' }}>
            Tu radar te dice exactamente dónde están las oportunidades.
            Sin ruido, sin formularios eternos.
          </p>
        </div>

        {/* Card */}
        <div className="w-[440px] p-8 rounded-2xl"
          style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 12px 40px -10px rgba(11,27,61,0.10)',
          }}>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
