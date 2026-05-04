'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Crosshair, Users, Activity, Calendar, BarChart2,
  Briefcase, Settings,
} from 'lucide-react'

const NAV = [
  { id: 'radar',         label: 'Radar',        icon: Crosshair, href: '/radar' },
  { id: 'prospectos',    label: 'Clientes',      icon: Users,     href: '/prospectos' },
  { id: 'actividades',   label: 'Actividades',   icon: Activity,  href: '/actividades' },
  { id: 'calendario',    label: 'Calendario',    icon: Calendar,  href: '#', soon: true },
  { id: 'reportes',      label: 'Reportes',      icon: BarChart2, href: '#', soon: true },
  { id: 'equipo',        label: 'Equipo',        icon: Briefcase, href: '#', soon: true },
  { id: 'configuracion', label: 'Configuración', icon: Settings,  href: '/configuracion' },
]

export default function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 px-3.5 flex-1">
      {NAV.map(n => {
        const Icon = n.icon
        const isActive = pathname.startsWith(n.href) && n.href !== '#'
        const isSoon = n.soon
        return (
          <Link
            key={n.id}
            href={n.href}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{
              background: isActive ? 'var(--color-ocean)' : 'transparent',
              color: isActive ? '#fff' : isSoon ? 'rgba(255,255,255,0.35)' : 'var(--color-fg-on-dark-dim)',
              pointerEvents: isSoon ? 'none' : undefined,
            }}
            onClick={isSoon ? (e) => e.preventDefault() : undefined}>
            <Icon size={17} />
            <span className="flex-1">{n.label}</span>
            {isSoon && (
              <span className="text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                SOON
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
