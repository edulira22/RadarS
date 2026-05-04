'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type SignInState = { error?: string }

export async function signIn(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Credenciales incorrectas. Verifica tu correo y contraseña.' }
  }

  redirect('/radar')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
