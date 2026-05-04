'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ProspectForm from './ProspectForm'
import type { ProspectView } from '@/types'

interface Props {
  userId: string
  prospect?: ProspectView
  mode?: 'button' | 'icon'
}

export default function ProspectFormWrapper({ userId, prospect, mode = 'button' }: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleSaved = () => {
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      {mode === 'button' ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--color-ocean)' }}>
          <Plus size={15} />
          Nuevo prospecto
        </button>
      ) : (
        <button onClick={() => setOpen(true)} className="p-2 rounded-lg"
          style={{ color: 'var(--color-ocean)' }}>
          <Plus size={18} />
        </button>
      )}

      {open && (
        <ProspectForm
          userId={userId}
          prospect={prospect}
          onClose={() => setOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
