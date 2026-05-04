import { Bell, Users, ChevronDown } from 'lucide-react'

interface Props {
  greeting: string
  sub?: React.ReactNode
  userInitials?: string
  actions?: React.ReactNode
}

export default function TopBar({ greeting, sub, userInitials = 'AL', actions }: Props) {
  return (
    <header
      className="flex items-center justify-between px-8 py-6 flex-shrink-0"
      style={{ background: 'var(--color-bg)' }}>
      <div>
        <div className="text-[26px] font-bold tracking-tight leading-none"
          style={{ color: 'var(--color-fg-hi)' }}>
          {greeting}
        </div>
        {sub && (
          <div className="text-sm mt-1" style={{ color: 'var(--color-fg-dim)' }}>{sub}</div>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        {actions}

        {/* Team selector */}
        <div
          className="flex items-center gap-2 px-3.5 h-10 rounded-xl text-sm font-medium"
          style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-fg)',
          }}>
          <Users size={14} style={{ color: 'var(--color-fg-dim)' }} />
          Todos los equipos
          <ChevronDown size={14} style={{ color: 'var(--color-fg-dim)' }} />
        </div>

        {/* Bell */}
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center relative"
          style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-fg)',
          }}>
          <Bell size={16} />
          <span
            className="absolute top-2 right-2.5 w-[7px] h-[7px] rounded-full"
            style={{ background: 'var(--color-orange)' }} />
        </button>

        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-[13px] relative"
          style={{ background: 'linear-gradient(135deg,#0a6ea0,#04C4D9)' }}>
          {userInitials}
          <span
            className="absolute bottom-0 right-0 w-[11px] h-[11px] rounded-full"
            style={{
              background: 'var(--color-temp-activo)',
              border: '2px solid var(--color-bg)',
            }} />
        </div>
      </div>
    </header>
  )
}
