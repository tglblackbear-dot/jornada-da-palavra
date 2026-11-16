// Edge Function: valida a sessão e delega o cálculo transacional à RPC do Postgres.
// Nenhuma pontuação é aceita do cliente.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }), { status: 405 })
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) return new Response(JSON.stringify({ error: 'UNAUTHENTICATED' }), { status: 401 })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const caller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user }, error: userError } = await caller.auth.getUser()
  if (userError || !user) return new Response(JSON.stringify({ error: 'UNAUTHENTICATED' }), { status: 401 })

  let body: { answers?: unknown; track_id?: string }
  try { body = await req.json() } catch { return new Response(JSON.stringify({ error: 'INVALID_JSON' }), { status: 400 }) }

  if (!Array.isArray(body.answers) || body.answers.length === 0 || body.answers.length > 100) {
    return new Response(JSON.stringify({ error: 'INVALID_ANSWERS' }), { status: 400 })
  }
  for (const a of body.answers) {
    if (!a || typeof a !== 'object' || typeof (a as Record<string, unknown>).question_id !== 'string' || typeof (a as Record<string, unknown>).option_id !== 'string') {
      return new Response(JSON.stringify({ error: 'INVALID_ANSWERS' }), { status: 400 })
    }
  }

  const admin = createClient(supabaseUrl, serviceKey)
  const { data, error } = await admin.rpc('complete_study', {
    p_answers: body.answers,
    p_track_id: body.track_id ?? null,
  })
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
})
