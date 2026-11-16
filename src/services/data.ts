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

// -------------------------------------------------------------- notificações
export interface Notification {
  id: string
  kind: string
  title: string
  body: string | null
  read: boolean
  created_at: string
}

export async function myNotifications(): Promise<Notification[]> {
  const { data, error } = await requireSupabase().rpc('my_notifications')
  if (error) throw error
  return (data ?? []) as Notification[]
}
export async function markNotificationRead(id: string) {
  const { error } = await requireSupabase().rpc('mark_notification_read', { p_id: id })
  if (error) throw error
}
export async function markAllNotificationsRead() {
  const { error } = await requireSupabase().rpc('mark_all_notifications_read')
  if (error) throw error
}
export async function exportMyData(): Promise<unknown> {
  const { data, error } = await requireSupabase().rpc('export_my_data')
  if (error) throw error
  return data
}

// --------------------------------------------------------------- comunidade
export async function communityHighlights() {
  const { data, error } = await requireSupabase().from('community_highlights').select('*').limit(10)
  if (error) throw error
  return data ?? []
}
export async function myMemberships(): Promise<{ groups: string[]; cycles: string[] }> {
  const { data, error } = await requireSupabase().rpc('my_memberships')
  if (error) throw error
  return (data ?? { groups: [], cycles: [] }) as { groups: string[]; cycles: string[] }
}
export async function joinGroup(id: string) {
  const { error } = await requireSupabase().rpc('join_group', { p_group: id })
  if (error) throw error
}
export async function leaveGroup(id: string) {
  const { error } = await requireSupabase().rpc('leave_group', { p_group: id })
  if (error) throw error
}
export async function joinCycle(id: string) {
  const { error } = await requireSupabase().rpc('join_cycle', { p_cycle: id })
  if (error) throw error
}

// ------------------------------------------------------------------- estudos
export async function categories() {
  const { data, error } = await requireSupabase().from('categories').select('id,name').order('name')
  if (error) throw error
  return data ?? []
}
export async function tracks() {
  const { data, error } = await requireSupabase().from('study_tracks').select('*').order('title')
  if (error) throw error
  return data ?? []
}
export async function questionsByTrack(trackId: string): Promise<Question[]> {
  const { data, error } = await requireSupabase()
    .from('questions')
    .select('id,statement,reference,book,chapter,verse,difficulty,category_id,explanation,translation,status,question_options(id,option_text,is_correct,position),study_track_items!inner(track_id)')
    .eq('study_track_items.track_id', trackId)
    .eq('status', 'PUBLISHED')
    .limit(20)
  if (error) throw error
  return (data ?? []) as Question[]
}
export async function publishedQuestionsFiltered(filters: { categoryId?: string; difficulty?: string; limit?: number }): Promise<Question[]> {
  let q = requireSupabase()
    .from('questions')
    .select('id,statement,reference,book,chapter,verse,difficulty,category_id,explanation,translation,status,question_options(id,option_text,is_correct,position)')
    .eq('status', 'PUBLISHED')
    .limit(filters.limit ?? 10)
  if (filters.categoryId) q = q.eq('category_id', filters.categoryId)
  if (filters.difficulty) q = q.eq('difficulty', filters.difficulty)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as Question[]
}
export async function reviewQuestions(): Promise<Question[]> {
  const { data, error } = await requireSupabase()
    .from('review_items')
    .select('question:questions(id,statement,reference,book,chapter,verse,difficulty,category_id,explanation,translation,status,question_options(id,option_text,is_correct,position))')
    .order('due_at')
    .limit(15)
  if (error) throw error
  return ((data ?? []) as unknown as { question: Question | null }[])
    .map((r) => r.question)
    .filter((q): q is Question => !!q)
}
export async function reviewItems() {
  const { data, error } = await requireSupabase().from('review_items').select('*').order('due_at')
  if (error) throw error
  return data ?? []
}

// --------------------------------------------------------------------- admin
export async function adminSaveQuestion(payload: Record<string, unknown>) {
  const { error } = await requireSupabase().rpc('admin_save_question', { p: payload })
  if (error) throw error
}
export async function adminSaveEvent(payload: Record<string, unknown>) {
  const { error } = await requireSupabase().rpc('admin_save_event', { p: payload })
  if (error) throw error
}
export async function adminSaveGroup(payload: Record<string, unknown>) {
  const { error } = await requireSupabase().rpc('admin_save_group', { p: payload })
  if (error) throw error
}
export async function adminSaveTrack(payload: Record<string, unknown>) {
  const { error } = await requireSupabase().rpc('admin_save_track', { p: payload })
  if (error) throw error
}
export async function adminSaveDailyWord(payload: Record<string, unknown>) {
  const { error } = await requireSupabase().rpc('admin_save_daily_word', { p: payload })
  if (error) throw error
}
export async function adminSaveCategory(name: string, description: string) {
  const { error } = await requireSupabase().rpc('admin_save_category', { p_name: name, p_description: description })
  if (error) throw error
}
export async function adminSetRole(userId: string, role: string, grant: boolean) {
  const { error } = await requireSupabase().rpc('admin_set_role', { p_user: userId, p_role: role, p_grant: grant })
  if (error) throw error
}
export async function adminSetBlocked(userId: string, blocked: boolean) {
  const { error } = await requireSupabase().rpc('admin_set_blocked', { p_user: userId, p_blocked: blocked })
  if (error) throw error
}
export async function adminDeleteContent(table: string, id: string) {
  const { error } = await requireSupabase().rpc('admin_delete_content', { p_table: table, p_id: id })
  if (error) throw error
}
export async function adminReport(kind: string) {
  const { data, error } = await requireSupabase().rpc('admin_report', { p_kind: kind })
  if (error) throw error
  return data as unknown
}
export async function createEventCode(eventId: string, hours: number) {
  const { data, error } = await requireSupabase().rpc('create_event_code', { p_event: eventId, p_hours: hours })
  if (error) throw error
  return data as string
}
export async function eventCheckins(eventId: string) {
  const { data, error } = await requireSupabase().rpc('event_checkins', { p_event: eventId })
  if (error) throw error
  return (data ?? []) as { user_id: string; name: string; at: string }[]
}
