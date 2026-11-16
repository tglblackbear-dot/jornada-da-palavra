import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from './env'

/** Cliente único. Quando não configurado, permanece null e a UI mostra estado explícito. */
export const supabase: SupabaseClient | null = env.supabase.configured
  ? createClient(env.supabase.url, env.supabase.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED')
  return supabase
}
