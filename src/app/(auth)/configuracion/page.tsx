import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TopBar from '@/components/ui/TopBar'
import SettingsForm from './SettingsForm'
import { signOut } from '@/app/login/actions'

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('radar_settings').select('*').eq('user_id', user.id).single(),
  ])

  const initials = (profile?.name ?? 'AL').split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar greeting="Configuración" sub="Ajustes de tu cuenta y preferencias del radar." userInitials={initials} />
      <div className="flex-1 overflow-y-auto px-7 pb-7 pt-1">
        <div className="grid gap-7 max-w-5xl" style={{ gridTemplateColumns: '220px 1fr' }}>
          {/* Settings sidebar */}
          <SettingsSidebar />

          {/* Main */}
          <div className="flex flex-col gap-5">
            <SettingsForm
              profile={profile}
              settings={settings}
              userId={user.id}
            />

            {/* Sign out */}
            <form action={signOut}>
              <button type="submit"
                className="h-10 px-5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: '#FEF2F2', color: '#ef4444', border: '1px solid #FECACA' }}>
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

const SETTINGS_NAV = [
  { id: 'account', label: 'Mi cuenta',              active: true },
  { id: 'radar',   label: 'Preferencias del radar', active: false },
  { id: 'notif',   label: 'Notificaciones',         soon: true },
  { id: 'team',    label: 'Equipo',                 soon: true },
  { id: 'integ',   label: 'Integraciones',          soon: true },
  { id: 'billing', label: 'Plan y facturación',     soon: true },
]

function SettingsSidebar() {
  return (
    <div className="flex flex-col gap-1 pt-2">
      {SETTINGS_NAV.map(n => (
        <div key={n.id}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium"
          style={{
            background: n.active ? 'var(--color-card)' : 'transparent',
            color: n.active ? 'var(--color-ocean)' : n.soon ? 'var(--color-fg-muted)' : 'var(--color-fg)',
            border: n.active ? '1px solid var(--color-border)' : '1px solid transparent',
            cursor: n.soon ? 'default' : 'pointer',
          }}>
          <span className="flex-1">{n.label}</span>
          {n.soon && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: 'var(--color-bg-2)', color: 'var(--color-fg-muted)' }}>SOON</span>
          )}
        </div>
      ))}
    </div>
  )
}
