import { requireSupabase } from '../lib/supabase'
import { localDate } from '../lib/domain'

export interface Profile {
  id: string
  display_name: string
  avatar_path: string | null
  bio: string | null
  public_profile: boolean
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  statement: string
  reference: string
  book: string | null
  chapter: number | null
  verse: number | null
  difficulty: 'facil' | 'medio' | 'dificil'
  category_id: string | null
  explanation: string
  translation: string
  status: string
  question_options: { id: string; option_text: string; is_correct: boolean; position: number }[]
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await requireSupabase()
    .from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data as Profile | null
}

export async function updateProfile(userId: string, patch: Partial<Pick<Profile, 'display_name' | 'bio' | 'public_profile' | 'avatar_path'>>) {
  const { error } = await requireSupabase().from('profiles').update(patch).eq('id', userId)
  if (error) throw error
}

const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 2 * 1024 * 1024

export async function resizeAvatar(file: File): Promise<Blob> {
  if (!AVATAR_TYPES.includes(file.type)) throw new Error('Formato inválido. Use JPG, PNG ou WEBP.')
  if (file.size > MAX_BYTES) throw new Error('A imagem deve ter no máximo 2 MB.')

  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não foi possível processar a imagem.')
  const side = Math.min(bitmap.width, bitmap.height)
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 512, 512)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82))
  if (!blob) throw new Error('Falha ao comprimir a imagem.')
  return blob
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const sb = requireSupabase()
  const blob = await resizeAvatar(file)
  const path = `${userId}/profile.webp`
  const { error } = await sb.storage.from('avatars').upload(path, blob, {
    contentType: 'image/webp', upsert: true, cacheControl: '3600',
  })
  if (error) throw error
  await updateProfile(userId, { avatar_path: path })
  return path
}

export async function avatarUrl(path: string | null): Promise<string | null> {
  if (!path) return null
  const { data, error } = await requireSupabase()
    .storage.from('avatars').createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}

export async function removeAvatar(userId: string, path: string | null): Promise<void> {
  if (!path) return
  const { error } = await requireSupabase().storage.from('avatars').remove([path])
  if (error) throw error
  await updateProfile(userId, { avatar_path: null })
}

export async function publishedQuestions(limit = 10): Promise<Question[]> {
  const { data, error } = await requireSupabase()
    .from('questions')
    .select('id,statement,reference,book,chapter,verse,difficulty,category_id,explanation,translation,status,question_options(id,option_text,is_correct,position)')
    .eq('status', 'PUBLISHED')
    .limit(limit)
  if (error) throw error
  return (data ?? []) as Question[]
}

export interface DailyWord {
  day: string
  reference: string
  reflection: string
  context: string | null
}

export async function dailyWord(): Promise<DailyWord | null> {
  const { data, error } = await requireSupabase()
    .from('daily_word')
    .select('day,reference,reflection,context')
    .eq('status', 'PUBLISHED')
    .lte('day', localDate(new Date()))
    .order('day', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data as DailyWord | null
}

export async function dashboardSummary(userId: string) {
  const { data, error } = await requireSupabase().rpc('dashboard_summary', { p_user_id: userId })
  if (error) throw error
  return data as Record<string, number>
}

export async function completeStudy(answers: { question_id: string; option_id: string }[], trackId?: string) {
  const { data, error } = await requireSupabase().rpc('complete_study', {
    p_answers: answers,
    p_track_id: trackId ?? null,
  })
  if (error) throw error
  return data as { correct: number; wrong: number; points: number; session_id: string }
}

export async function listFrom(table: string, orderBy = 'created_at'): Promise<unknown[]> {
  const { data, error } = await requireSupabase().from(table).select('*').order(orderBy, { ascending: false }).limit(50)
  if (error) throw error
  return data ?? []
}

export async function adminStats() {
  const { data, error } = await requireSupabase().rpc('admin_stats')
  if (error) throw error
  return data as Record<string, number>
}
