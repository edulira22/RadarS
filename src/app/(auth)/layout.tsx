import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDailySummary } from '@/lib/data/daily-summary'
import Sidebar from '@/components/ui/Sidebar'

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<Record<string, string>>
}) {
  void params // not used here but satisfies Next.js 16 signature

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const summary = await getDailySummary(user.id)

  // Derive active nav item from pathname — passed via URL segment
  // We use a client wrapper for this; Sidebar receives it as a prop.
  // For now default to 'radar' — individual pages override via their own layout.
  return (
    <div className="flex h-full min-h-screen">
      <Sidebar summary={summary} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
