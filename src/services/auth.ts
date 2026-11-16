import type { Session, User } from '@supabase/supabase-js'
import { requireSupabase } from '../lib/supabase'
import { env } from '../lib/env'

export interface AuthResult {
  user: User | null
  needsConfirmation: boolean
}

export function isDuplicateEmail(message: string): boolean {
  return /already registered|already exists|user_already_exists/i.test(message)
}

export async function signUp(name: string, email: string, password: string): Promise<AuthResult> {
  const sb = requireSupabase()
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name },
      emailRedirectTo: `${env.siteUrl}/app`,
    },
  })
  if (error) throw error
  return { user: data.user, needsConfirmation: !data.session }
}

export async function signIn(email: string, password: string): Promise<Session> {
  const sb = requireSupabase()
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error) throw error
  if (!data.session) throw new Error('Sessão não foi estabelecida.')
  return data.session
}

export async function signOut(): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb.auth.signOut()
  if (error) throw error
}

export async function requestPasswordReset(email: string): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.siteUrl}/reset-password`,
  })
  if (error) throw error
}

export async function updatePassword(password: string): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb.auth.updateUser({ password })
  if (error) throw error
}

export async function resendConfirmation(email: string): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb.auth.resend({ type: 'signup', email })
  if (error) throw error
}

export async function currentSession(): Promise<Session | null> {
  const sb = requireSupabase()
  const { data } = await sb.auth.getSession()
  return data.session
}

export function isRecoverySession(session: Session | null): boolean {
  return session?.user?.app_metadata?.provider === 'email' &&
    session.user.aud === 'authenticated' &&
    session.user.user_metadata?.recovery === true
}
