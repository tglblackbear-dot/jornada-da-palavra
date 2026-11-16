import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Badge, Button, Card, EmptyState, Modal, ProgressBar, SectionHeading, Skeleton, StatCard, TextField, TextArea } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useAsync } from '../hooks/useAsync'
import { currentStreak, reachedMilestones } from '../lib/domain'
import { profileSchema, toFieldErrors, type FieldErrors } from '../lib/validation'
import { requireSupabase } from '../lib/supabase'
import { avatarUrl, dashboardSummary, listFrom, publishedQuestions, completeStudy, removeAvatar, updateProfile, uploadAvatar, type Question } from '../services/data'

function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className="mb-6">
      <p className="text-xs font-bold uppercase tracking-widest text-gold-600">{eyebrow}</p>
      <h1 className="mt-1 text-2xl font-bold text-brand-950 sm:text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </header>
  )
}

function LoadState({ loading, error, reload, emptyTitle, emptyText, children, isEmpty }: {
  loading: boolean; error: string | null; reload: () => void; emptyTitle: string; emptyText: string; children: React.ReactNode; isEmpty?: boolean
}) {
  if (loading) return <div className="space-y-3"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
  if (error) return <div className="space-y-3"><Alert tone="error">Não foi possível carregar. {error}</Alert><Button variant="secondary" onClick={reload}>Tentar novamente</Button></div>
  if (isEmpty) return <EmptyState title={emptyTitle} description={emptyText} />
  return <>{children}</>
}

export function DashboardPage() {
  const { user, profile } = useAuth()
  const summary = useAsync(() => dashboardSummary(user!.id), [user?.id])
  const first = profile?.display_name?.split(' ')[0] ?? 'irmão'

  return (
    <>
      <PageHeader eyebrow="Minha Jornada" title={`Bom dia, ${first}.`} description="Um passo de cada vez na Palavra." />
      <Card className="mb-6 border-gold-500/30 bg-gradient-to-br from-white to-gold-100/40">
        <p className="text-xs font-bold uppercase tracking-widest text-gold-600">Palavra do Dia</p>
        <h2 className="mt-2 text-lg font-semibold text-brand-950">Aguardando revisão humana</h2>
        <p className="mt-2 text-sm text-slate-600">
          Nenhum texto bíblico é publicado automaticamente. A Palavra do Dia aparecerá aqui somente
          após aprovação de um revisor autorizado.
        </p>
      </Card>
      <div className="mb-6">
        <Link to="/estudar"><Button className="w-full sm:w-auto">Estudar Agora</Button></Link>
      </div>
      <SectionHeading eyebrow="Resumo" title="Seu progresso" />
      <LoadState loading={summary.loading} error={summary.error} reload={summary.reload}
        emptyTitle="Sem dados ainda" emptyText="Seus números aparecerão após o primeiro estudo concluído.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Estudos" value={summary.data?.studies ?? 0} />
          <StatCard label="Acertos" value={`${summary.data?.accuracy ?? 0}%`} />
          <StatCard label="Constância" value={`${summary.data?.streak ?? 0}d`} />
          <StatCard label="Pontos" value={summary.data?.points ?? 0} />
        </div>
      </LoadState>
      <div className="mt-8">
        <SectionHeading eyebrow="Comunhão" title="Destaques da Comunidade" />
        <EmptyState title="Em breve" description="Os destaques respeitam a privacidade de cada participante e serão exibidos após configuração pelo administrador." />
      </div>
    </>
  )
}

export function StudyPage() {
  const { user } = useAuth()
  const { notify } = useToast()
  const questions = useAsync(() => publishedQuestions(10), [])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [answers, setAnswers] = useState<{ question_id: string; option_id: string }[]>([])
  const [result, setResult] = useState<{ correct: number; wrong: number; points: number } | null>(null)
  const [busy, setBusy] = useState(false)

  const list = (questions.data ?? []) as Question[]
  const q = list[index]

  async function finish(finalAnswers: typeof answers) {
    setBusy(true)
    try {
      const r = await completeStudy(finalAnswers)
      setResult(r)
      notify('Estudo concluído com sucesso.', 'success')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Falha ao concluir estudo.', 'error')
    } finally { setBusy(false) }
  }

  function confirm() {
    if (!q || !selected) return
    setConfirmed(true)
    setAnswers((prev) => [...prev, { question_id: q.id, option_id: selected }])
  }

  function next() {
    if (index + 1 >= list.length) {
      void finish([...answers])
    } else {
      setIndex(index + 1); setSelected(null); setConfirmed(false)
    }
  }

  return (
    <>
      <PageHeader eyebrow="Estudo" title="Estudar a Palavra" description="Perguntas revisadas, com referência e explicação." />
      <LoadState loading={questions.loading} error={questions.error} reload={questions.reload}
        emptyTitle="Nenhuma pergunta publicada" emptyText="O conteúdo bíblico entra em revisão antes de ser publicado. Volte em breve ou peça a um administrador para revisar as questões.">
        {result ? (
          <Card className="text-center">
            <Badge tone="olive">Estudo concluído</Badge>
            <h2 className="mt-4 text-2xl font-bold text-brand-950">Acertos: {result.correct} de {result.correct + result.wrong}</h2>
            <p className="mt-2 text-sm text-slate-600">{result.points} Pontos de Aprendizagem registrados no servidor.</p>
            <Button className="mt-6" onClick={() => { setResult(null); setIndex(0); setAnswers([]); setSelected(null); setConfirmed(false); questions.reload() }}>Estudar novamente</Button>
          </Card>
        ) : q ? (
          <Card>
            <div className="mb-4 flex items-center justify-between text-sm text-slate-600">
              <span>Questão {index + 1} de {list.length}</span>
              <span>{q.difficulty}</span>
            </div>
            <ProgressBar value={((index + 1) / list.length) * 100} />
            <h2 className="mt-6 text-lg font-semibold text-brand-950">{q.statement}</h2>
            <div className="mt-5 space-y-2" role="radiogroup" aria-label="Alternativas">
              {[...q.question_options].sort((a, b) => a.position - b.position).map((opt) => {
                const isCorrect = opt.is_correct
                const chosen = selected === opt.id
                const show = confirmed && (isCorrect || chosen)
                return (
                  <button key={opt.id} role="radio" aria-checked={chosen} disabled={confirmed}
                    onClick={() => setSelected(opt.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                      show && isCorrect ? 'border-olive-500 bg-olive-500/10' : show && chosen ? 'border-red-600 bg-red-50' : chosen ? 'border-brand-700 bg-brand-100' : 'border-slate-200 hover:border-brand-100'}`}>
                    <span className="flex-1">{opt.option_text}</span>
                    {show && isCorrect && <Badge tone="olive">Correta</Badge>}
                    {show && chosen && !isCorrect && <Badge tone="muted">Sua resposta</Badge>}
                  </button>
                )
              })}
            </div>
            {confirmed && (
              <div className="mt-5 space-y-2">
                <Alert tone={selected && q.question_options.find((o) => o.id === selected)?.is_correct ? 'success' : 'info'}>
                  <strong>{q.reference}</strong> — {q.explanation}
                </Alert>
                <Button onClick={next} loading={busy} className="w-full">{index + 1 >= list.length ? 'Concluir estudo' : 'Próxima questão'}</Button>
              </div>
            )}
            {!confirmed && <Button onClick={confirm} disabled={!selected} className="mt-6 w-full">Confirmar resposta</Button>}
          </Card>
        ) : null}
        {!user && <Alert>Session indisponível.</Alert>}
      </LoadState>
    </>
  )
}

export function JourneyPage() {
  const { user } = useAuth()
  const summary = useAsync(() => dashboardSummary(user!.id), [user?.id])
  const days = useAsync(() => listFrom('study_days'), [])
  const streak = currentStreak(((days.data ?? []) as { day: string }[]).map((d) => d.day))
  const milestones = reachedMilestones(streak)

  return (
    <>
      <PageHeader eyebrow="Minha Jornada" title="Sua evolução" description="Constância vale mais do que comparação." />
      <LoadState loading={summary.loading} error={summary.error} reload={summary.reload}
        emptyTitle="Jornada começando" emptyText="Conclua um estudo para ver seu progresso.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Perguntas" value={summary.data?.answers ?? 0} />
          <StatCard label="Taxa de acerto" value={`${summary.data?.accuracy ?? 0}%`} />
          <StatCard label="Revisões" value={summary.data?.reviews ?? 0} />
          <StatCard label="Pontos" value={summary.data?.points ?? 0} />
          <StatCard label="Constância" value={`${streak} dias`} />
          <StatCard label="Trilhas" value={summary.data?.tracks ?? 0} />
        </div>
      </LoadState>
      <div className="mt-8">
        <SectionHeading eyebrow="Marcos da Jornada" title="Constância" />
        <div className="flex flex-wrap gap-2">
          {[3, 5, 7, 14, 30].map((m) => <Badge key={m} tone={milestones.includes(m) ? 'olive' : 'muted'}>{m} dias</Badge>)}
        </div>
      </div>
      <div className="mt-8">
        <SectionHeading eyebrow="Caderno" title="Revisões pendentes" />
        <Link to="/caderno-de-estudo"><Button variant="secondary">Abrir meu caderno</Button></Link>
      </div>
    </>
  )
}

export function CommunityPage() {
  const groups = useAsync(() => listFrom('groups'), [])
  return (
    <>
      <PageHeader eyebrow="Comunhão" title="Comunidade" description="Grupos e ciclos de estudo." />
      <LoadState loading={groups.loading} error={groups.error} reload={groups.reload}
        emptyTitle="Nenhum grupo disponível" emptyText="Quando um administrador criar grupos, eles aparecerão aqui.">
        <div className="grid gap-3 sm:grid-cols-2">
          {(groups.data ?? []).map((g) => {
            const item = g as { id: string; name: string; description: string | null; image_url: string | null }
            return <Card key={item.id}><h3 className="font-semibold text-brand-950">{item.name}</h3><p className="mt-1 text-sm text-slate-600">{item.description ?? 'Sem descrição.'}</p></Card>
          })}
        </div>
      </LoadState>
    </>
  )
}

export function MilestonesPage() {
  const achievements = useAsync(() => listFrom('achievements'), [])
  return (
    <>
      <PageHeader eyebrow="Marcos da Jornada" title="Conquistas" description="Reconhecimento discreto do seu crescimento." />
      <LoadState loading={achievements.loading} error={achievements.error} reload={achievements.reload}
        emptyTitle="Marcos em preparação" emptyText="Os marcos são atribuídos pelo servidor após validação.">
        <div className="grid gap-3 sm:grid-cols-2">
          {(achievements.data ?? []).map((a) => {
            const item = a as { id: string; title: string; description: string | null }
            return <Card key={item.id}><Badge tone="gold">Marco</Badge><h3 className="mt-2 font-semibold text-brand-950">{item.title}</h3><p className="text-sm text-slate-600">{item.description}</p></Card>
          })}
        </div>
      </LoadState>
    </>
  )
}

export function NotebookPage() {
  const items = useAsync(() => listFrom('review_items'), [])
  const [filter, setFilter] = useState('todos')
  const rows = (items.data ?? []).filter((i) => {
    const item = i as { difficulty?: string }
    return filter === 'todos' || item.difficulty === filter
  })
  return (
    <>
      <PageHeader eyebrow="Meu Caderno de Estudo" title="Revisões" description="Questões difíceis e referências para revisitar." />
      <div className="mb-4 flex gap-2" role="group" aria-label="Filtros">
        {['todos', 'facil', 'medio', 'dificil'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-sm ${filter === f ? 'bg-brand-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>{f}</button>
        ))}
      </div>
      <LoadState loading={items.loading} error={items.error} reload={items.reload}
        emptyTitle="Caderno vazio" emptyText="Questões erradas ou marcadas aparecerão aqui para revisão espaçada.">
        <div className="space-y-3">{rows.map((i) => {
          const item = i as { id: string; statement?: string; reference?: string; difficulty?: string }
          return <Card key={item.id}><p className="font-medium text-brand-950">{item.statement ?? 'Item de revisão'}</p><p className="text-sm text-gold-600">{item.reference ?? ''}</p></Card>
        })}</div>
      </LoadState>
    </>
  )
}

export function EventsPage() {
  const events = useAsync(() => listFrom('events'), [])
  return (
    <>
      <PageHeader eyebrow="Comunhão" title="Eventos" description="Inscrição e presença validadas no servidor." />
      <LoadState loading={events.loading} error={events.error} reload={events.reload}
        emptyTitle="Nenhum evento agendado" emptyText="Eventos aparecerão aqui quando publicados pela administração.">
        <div className="space-y-3">{(events.data ?? []).map((e) => {
          const item = e as { id: string; title: string; starts_at: string; location: string | null }
          return <Card key={item.id}><h3 className="font-semibold text-brand-950">{item.title}</h3><p className="text-sm text-slate-600">{new Date(item.starts_at).toLocaleString('pt-BR')} · {item.location ?? 'Local a confirmar'}</p></Card>
        })}</div>
      </LoadState>
    </>
  )
}

export function EventCheckInPage() {
  const code = window.location.pathname.split('/').filter(Boolean).pop() ?? ''
  const { notify } = useToast()
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  async function checkIn() {
    setBusy(true)
    try {
      await requireSupabase().rpc('register_event', { p_code: code })
      setDone(true); notify('Presença registrada no servidor.', 'success')
    } catch (err) {
      setFailed(true)
      notify(err instanceof Error ? err.message : 'Código inválido.', 'error')
    } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeader eyebrow="Eventos" title="Confirmar presença" description="A leitura do QR Code só é válida após confirmação no servidor." />
      <Card>
        <p className="text-sm text-slate-600">Código: <strong>{code}</strong></p>
        {done ? <div className="mt-4"><Alert tone="success">Presença confirmada.</Alert></div> : (
          <Button className="mt-5" loading={busy} onClick={() => void checkIn()}>Confirmar presença</Button>
        )}
        {failed && <div className="mt-4"><Alert tone="error">Não foi possível validar este código.</Alert></div>}
      </Card>
    </>
  )
}

export function ProfilePage() {
  const { user, profile, refresh } = useAuth()
  const { notify } = useToast()
  const [form, setForm] = useState({ displayName: '', bio: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [busy, setBusy] = useState(false)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (profile) setForm({ displayName: profile.display_name ?? '', bio: profile.bio ?? '' })
    if (profile?.avatar_path) void avatarUrl(profile.avatar_path).then(setAvatar)
  }, [profile])

  async function save(e: FormEvent) {
    e.preventDefault()
    const parsed = profileSchema.safeParse(form)
    if (!parsed.success) return setErrors(toFieldErrors(parsed.error))
    if (!user) return
    setBusy(true)
    try {
      await updateProfile(user.id, { display_name: parsed.data.displayName, bio: parsed.data.bio })
      await refresh(); notify('Perfil atualizado.', 'success')
    } catch (err) { notify(err instanceof Error ? err.message : 'Falha ao salvar.', 'error') }
    finally { setBusy(false) }
  }

  async function onFile(file: File | undefined) {
    if (!file || !user) return
    setBusy(true)
    try {
      const path = await uploadAvatar(user.id, file)
      setAvatar(await avatarUrl(path))
      await refresh(); notify('Foto atualizada.', 'success')
    } catch (err) { notify(err instanceof Error ? err.message : 'Falha no upload.', 'error') }
    finally { setBusy(false) }
  }

  async function requestDeletion() {
    try {
      await requireSupabase().rpc('request_account_deletion')
      notify('Solicitação de exclusão registrada. Nossa equipe entrará em contato.', 'success')
      setConfirmDelete(false)
    } catch (err) { notify(err instanceof Error ? err.message : 'Falha ao solicitar.', 'error') }
  }

  return (
    <>
      <PageHeader eyebrow="Perfil" title="Meu perfil" description="Você controla os dados que compartilha." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="text-center">
          {avatar ? <img src={avatar} alt="Foto de perfil" className="mx-auto h-28 w-28 rounded-full object-cover" /> : <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-brand-100 text-4xl text-brand-900" aria-hidden>✦</div>}
          <label className="mt-4 block cursor-pointer text-sm font-semibold text-brand-900 underline">
            Trocar foto
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} />
          </label>
          {profile?.avatar_path && <button className="mt-2 block w-full text-sm text-slate-500 underline" onClick={async () => { if (!user) return; await removeAvatar(user.id, profile.avatar_path); setAvatar(null); await refresh() }}>Remover foto</button>}
          <p className="mt-4 text-xs text-slate-500">JPG, PNG ou WEBP · até 2 MB · 512×512</p>
        </Card>
        <Card className="lg:col-span-2">
          <form onSubmit={save} className="space-y-4" noValidate>
            <TextField label="Nome" name="displayName" value={form.displayName} error={errors.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
            <TextArea label="Biografia" name="bio" value={form.bio} maxLength={500} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            <Button type="submit" loading={busy}>Salvar alterações</Button>
          </form>
          <div className="mt-8 border-t border-cream-100 pt-6">
            <h2 className="font-semibold text-brand-950">Privacidade (LGPD)</h2>
            <p className="mt-1 text-sm text-slate-600">Perfil {profile?.public_profile ? 'público' : 'privado'} · membro desde {profile ? new Date(profile.created_at).toLocaleDateString('pt-BR') : '—'}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => notify('Solicitação de exportação registrada.', 'info')}>Exportar meus dados</Button>
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>Solicitar exclusão</Button>
            </div>
          </div>
        </Card>
      </div>
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Excluir conta">
        <Alert tone="error">Esta ação solicita a exclusão dos seus dados pessoais e não pode ser desfeita.</Alert>
        <div className="mt-5 flex gap-2"><Button variant="danger" onClick={() => void requestDeletion()}>Confirmar solicitação</Button><Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancelar</Button></div>
      </Modal>
    </>
  )
}
