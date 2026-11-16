import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, requireSupabase } from '../lib/supabase'
import { env } from '../lib/env'
import { getProfile, type Profile } from '../services/data'
import * as auth from '../services/auth'

export type Role = 'USER' | 'MODERATOR' | 'CONTENT_ADMIN' | 'GROUP_ADMIN' | 'ADMIN' | 'SUPER_ADMIN'

interface AuthContextValue {
  configured: boolean
  loading: boolean
  session: Session | null
  user: User | null
  profile: Profile | null
  roles: Role[]
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const Ctx = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [roles, setRoles] = useState<Role[]>(['USER'])

  const configured = env.supabase.configured

  const loadPrivate = useCallback(async (current: Session | null) => {
    if (!current || !supabase) {
      setProfile(null)
      setRoles(['USER'])
      return
    }
    const [prof, roleRes] = await Promise.all([
      getProfile(current.user.id).catch(() => null),
      supabase.rpc('my_roles'),
    ])
    setProfile(prof)
    if (!roleRes.error && Array.isArray(roleRes.data)) setRoles(roleRes.data as Role[])
  }, [])

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    let active = true
    requireSupabase().auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      await loadPrivate(data.session)
      setLoading(false)
    }).catch(() => active && setLoading(false))

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      if (!active) return
      setSession(next)
      await loadPrivate(next)
      setLoading(false)
    })
    return () => { active = false; sub.subscription.unsubscribe() }
  }, [loadPrivate])

  const refresh = useCallback(async () => { await loadPrivate(session) }, [loadPrivate, session])

  const value = useMemo<AuthContextValue>(() => ({
    configured,
    loading,
    session,
    user: session?.user ?? null,
    profile,
    roles,
    isAdmin: roles.some((r) => r === 'ADMIN' || r === 'SUPER_ADMIN'),
    signIn: async (email, password) => { await auth.signIn(email, password) },
    signUp: async (name, email, password) => {
      const r = await auth.signUp(name, email, password)
      return r.needsConfirmation
    },
    signOut: auth.signOut,
    refresh,
  }), [configured, loading, session, profile, roles, refresh])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
