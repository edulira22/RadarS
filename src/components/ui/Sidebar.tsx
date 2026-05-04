import RadarLogoMark from './RadarLogoMark'
import SidebarNav from './SidebarNav'
import { fmtMoney } from '@/lib/utils'
import type { DailySummary } from '@/types'

interface Props { summary: DailySummary }

export default function Sidebar({ summary }: Props) {
  return (
    <aside
      className="w-[220px] flex-shrink-0 flex flex-col h-full"
      style={{ background: 'var(--color-navy-deep)', color: 'var(--color-fg-on-dark)' }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <RadarLogoMark size={30} color="#fff" />
        <span className="text-xl font-bold tracking-tight text-white">RadarS</span>
      </div>

      <SidebarNav />

      {/* Daily summary widget */}
      <div className="m-3.5 p-4 rounded-xl shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="text-xs font-bold text-white mb-3">Resumen hoy</div>
        {[
          { l: 'Dinero en Decisión', v: fmtMoney(summary.moneyInDecision), hi: true },
          { l: 'Oportunidades',      v: String(summary.totalOpportunities) },
          { l: 'Reuniones hoy',      v: String(summary.meetingsToday) },
          { l: 'Cierres este mes',   v: String(summary.closingsThisMonth) },
        ].map((r, i) => (
          <div key={i} className={i < 3 ? 'mb-3' : ''}>
            <div className="text-[11px]" style={{ color: 'var(--color-fg-on-dark-dim)' }}>{r.l}</div>
            <span
              className="text-[13px] font-bold"
              style={{
                fontFamily: 'var(--font-mono)',
                color: r.hi ? 'var(--color-cyan)' : '#fff',
              }}>
              {r.v}
            </span>
          </div>
        ))}
        <svg viewBox="0 0 120 30" width="100%" height="30" className="mt-1">
          <path
            d="M0 22 L18 18 L34 24 L52 14 L70 18 L88 8 L106 12 L120 4"
            stroke="var(--color-cyan)" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
    </aside>
  )
}
