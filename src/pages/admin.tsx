import { useState, type FormEvent, type ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Alert, Badge, Button, Card, EmptyState, Modal, SectionHeading, Skeleton, StatCard, TextField, TextArea } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../contexts/ToastContext'
import {
  adminStats, adminReport, adminSaveCategory, adminSaveDailyWord, adminSaveEvent, adminSaveGroup,
  adminSaveQuestion, adminSaveTrack, adminSetBlocked, adminSetRole, listFrom, adminDeleteContent,
} from '../services/data'

const TABS = [
  ['dashboard', 'Visão geral'], ['usuarios', 'Usuários'], ['perguntas', 'Perguntas'],
  ['categorias', 'Categorias'], ['trilhas', 'Trilhas'], ['ciclos', 'Ciclos'],
  ['grupos', 'Grupos'], ['eventos', 'Eventos'], ['palavra', 'Palavra do Dia'],
  ['relatorios', 'Relatórios'], ['auditoria', 'Auditoria'],
] as const

export function AdminLayout() {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-gold-600">Administração</p>
      <h1 className="mt-1 text-2xl font-bold text-brand-950">Painel administrativo</h1>
      <nav className="mt-5 flex gap-2 overflow-x-auto pb-2" aria-label="Seções administrativas">
        {TABS.map(([slug, label]) => (
          <NavLink key={slug} to={`/admin/${slug}`} className={({ isActive }) => `whitespace-nowrap rounded-full px-4 py-2 text-sm ${isActive ? 'bg-brand-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>{label}</NavLink>
        ))}
      </nav>
      <div className="mt-6"><Outlet /></div>
    </div>
  )
}

export function AdminDashboard() {
  const stats = useAsync(() => adminStats(), [])
  return (
    <>
      <SectionHeading eyebrow="Indicadores" title="Visão geral" />
      {stats.loading ? <Skeleton className="h-32" /> : stats.error ? <Alert tone="error">{stats.error}</Alert> : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Usuários" value={stats.data?.users ?? 0} />
          <StatCard label="Ativos" value={stats.data?.active_users ?? 0} />
          <StatCard label="Estudos" value={stats.data?.studies ?? 0} />
          <StatCard label="Perguntas" value={stats.data?.answers ?? 0} />
          <StatCard label="Acerto" value={`${stats.data?.accuracy ?? 0}%`} />
          <StatCard label="Pendentes" value={stats.data?.pending_content ?? 0} />
          <StatCard label="Grupos" value={stats.data?.groups ?? 0} />
          <StatCard label="Eventos" value={stats.data?.events ?? 0} />
        </div>
      )}
    </>
  )
}

function useList(table: string) {
  const rows = useAsync(() => listFrom(table), [table])
  const { notify } = useToast()
  const [busy, setBusy] = useState(false)
  async function remove(id: string) {
    setBusy(true)
    try { await adminDeleteContent(table, id); rows.reload(); notify('Removido.', 'success') }
    catch (err) { notify(err instanceof Error ? err.message : 'Falha.', 'error') }
    finally { setBusy(false) }
  }
  return { ...rows, busy, remove }
}

function ListShell({ title, table, emptyText, children }: { title: string; table: string; emptyText: string; children: (rows: Record<string, unknown>[], remove: (id: string) => void, busy: boolean) => ReactNode }) {
  const { loading, error, data, reload, busy, remove } = useList(table)
  return (
    <>
      <SectionHeading eyebrow="Conteúdo" title={title} action={<Button variant="secondary" onClick={reload}>Atualizar</Button>} />
      {loading ? <Skeleton className="h-40" /> : error ? <Alert tone="error">{error}</Alert> : !data?.length ? <EmptyState title="Nada por aqui" description={emptyText} /> : (
        <div className="space-y-2">{children((data ?? []) as Record<string, unknown>[], remove, busy)}</div>
      )}
    </>
  )
}

function RowCard({ title, meta, children }: { title: string; meta?: string; children?: ReactNode }) {
  return <Card className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-brand-950">{title}</p>{meta && <p className="text-xs text-slate-500">{meta}</p>}</div><div className="flex gap-2">{children}</div></Card>
}

export function AdminUsers() {
  const users = useAsync(() => listFrom('profiles'), [])
  const { notify } = useToast()
  const [busy, setBusy] = useState('')
  async function act(fn: () => Promise<void>) {
    setBusy('x'); try { await fn(); users.reload(); notify('Atualizado.', 'success') } catch (err) { notify(err instanceof Error ? err.message : 'Falha.', 'error') } finally { setBusy('') }
  }
  return (
    <>
      <SectionHeading eyebrow="Administração" title="Usuários" />
      {users.loading ? <Skeleton className="h-40" /> : users.error ? <Alert tone="error">{users.error}</Alert> : !users.data?.length ? <EmptyState title="Nenhum usuário" description="Usuários aparecerão após o primeiro cadastro." /> : (
        <div className="space-y-2">{(users.data as Record<string, unknown>[]).map((u) => (
          <RowCard key={String(u.id)} title={String(u.display_name ?? 'Sem nome')} meta={`${String(u.id).slice(0, 8)}… · ${u.blocked ? 'bloqueado' : 'ativo'}`}>
            <Button variant="secondary" loading={busy === 'x'} onClick={() => void act(() => adminSetRole(String(u.id), 'ADMIN', true))}>Dar admin</Button>
            <Button variant="ghost" onClick={() => void act(() => adminSetRole(String(u.id), 'ADMIN', false))}>Remover admin</Button>
            <Button variant="danger" onClick={() => void act(() => adminSetBlocked(String(u.id), !u.blocked))}>{u.blocked ? 'Desbloquear' : 'Bloquear'}</Button>
          </RowCard>
        ))}</div>
      )}
    </>
  )
}

const QUESTION_STATUS = ['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED']

export function AdminQuestions() {
  const { notify } = useToast()
  const cat = useAsync(() => listFrom('categories'), [])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ statement: '', reference: '', explanation: '', difficulty: 'facil', category_id: '', status: 'DRAFT', options: ['', '', '', ''], correct: 0 })
  const [busy, setBusy] = useState(false)

  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await adminSaveQuestion({
        statement: form.statement, reference: form.reference, explanation: form.explanation,
        difficulty: form.difficulty, category_id: form.category_id, status: form.status,
        options: form.options.map((text, i) => ({ text, correct: i === form.correct, position: i + 1 })),
      })
      notify('Pergunta salva.', 'success'); setOpen(false); window.location.reload()
    } catch (err) { notify(err instanceof Error ? err.message : 'Falha.', 'error') }
    finally { setBusy(false) }
  }

  return (
    <>
      <SectionHeading eyebrow="Conteúdo" title="Perguntas" action={<Button onClick={() => setOpen(true)}>Nova pergunta</Button>} />
      <ListShell title="Questões" table="questions" emptyText="Cadastre a primeira pergunta.">
        {(rows, remove, busyRemove) => rows.map((q) => (
          <RowCard key={String(q.id)} title={String(q.statement)} meta={`${String(q.reference)} · ${String(q.status)} · ${String(q.difficulty)}`}>
            {q.status === 'REVIEW' && <Badge tone="gold">Revisar</Badge>}
            <Button variant="danger" loading={busyRemove} onClick={() => remove(String(q.id))}>Excluir</Button>
          </RowCard>
        ))}
      </ListShell>
      <Modal open={open} onClose={() => setOpen(false)} title="Nova pergunta">
        <form onSubmit={save} className="max-h-[70vh] space-y-3 overflow-y-auto">
          <TextField label="Pergunta" name="statement" value={form.statement} onChange={(e) => setForm({ ...form, statement: e.target.value })} />
          <TextField label="Referência bíblica" name="reference" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          <TextArea label="Explicação" name="explanation" value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
          <label className="block text-sm">Categoria<select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3"><option value="">—</option>{((cat.data ?? []) as Record<string, unknown>[]).map((c) => <option key={String(c.id)} value={String(c.id)}>{String(c.name)}</option>)}</select></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">Dificuldade<select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3"><option value="facil">Fácil</option><option value="medio">Médio</option><option value="dificil">Difícil</option></select></label>
            <label className="text-sm">Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3">{QUESTION_STATUS.map((s) => <option key={s}>{s}</option>)}</select></label>
          </div>
          <p className="text-sm font-semibold">Alternativas (marque a correta)</p>
          {form.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="correct" checked={form.correct === i} onChange={() => setForm({ ...form, correct: i })} aria-label={`Alternativa ${i + 1} correta`} />
              <input value={opt} onChange={(e) => setForm({ ...form, options: form.options.map((o, j) => j === i ? e.target.value : o) })} placeholder={`Alternativa ${i + 1}`} className="min-h-11 w-full rounded-xl border border-slate-200 px-3" />
            </div>
          ))}
          <Button type="submit" loading={busy} className="w-full">Salvar</Button>
        </form>
      </Modal>
    </>
  )
}

function SimpleCreator({ table, title, fields, save }: { table: string; title: string; fields: { key: string; label: string; type?: string }[]; save: (p: Record<string, string>) => Promise<void> }) {
  const { notify } = useToast()
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true)
    try { await save(values); notify('Salvo.', 'success'); setOpen(false); setValues({}); window.location.reload() }
    catch (err) { notify(err instanceof Error ? err.message : 'Falha.', 'error') }
    finally { setBusy(false) }
  }
  return (
    <>
      <SectionHeading eyebrow="Conteúdo" title={title} action={<Button onClick={() => setOpen(true)}>Novo</Button>} />
      <ListShell title={title} table={table} emptyText="Nenhum registro.">
        {(rows, remove, busyRemove) => rows.map((r) => (
          <RowCard key={String(r.id ?? r.day)} title={String(r.title ?? r.name ?? r.reference ?? r.day)} meta={String(r.description ?? r.status ?? r.starts_at ?? '')}>
            <Button variant="danger" loading={busyRemove} onClick={() => remove(String(r.id))}>Excluir</Button>
          </RowCard>
        ))}
      </ListShell>
      <Modal open={open} onClose={() => setOpen(false)} title={`Novo — ${title}`}>
        <form onSubmit={submit} className="space-y-3">
          {fields.map((f) => <TextField key={f.key} label={f.label} name={f.key} type={f.type} value={values[f.key] ?? ''} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />)}
          <Button type="submit" loading={busy} className="w-full">Salvar</Button>
        </form>
      </Modal>
    </>
  )
}

export function AdminCategories() { return <SimpleCreator table="categories" title="Categorias" fields={[{ key: 'name', label: 'Nome' }, { key: 'description', label: 'Descrição' }]} save={(p) => adminSaveCategory(p.name, p.description ?? '')} /> }
export function AdminTracks() { return <SimpleCreator table="study_tracks" title="Trilhas" fields={[{ key: 'title', label: 'Título' }, { key: 'description', label: 'Descrição' }, { key: 'status', label: 'Status (DRAFT/PUBLISHED)' }]} save={(p) => adminSaveTrack({ ...p, status: p.status || 'DRAFT' })} /> }
export function AdminGroups() { return <SimpleCreator table="groups" title="Grupos" fields={[{ key: 'name', label: 'Nome' }, { key: 'description', label: 'Descrição' }]} save={(p) => adminSaveGroup(p)} /> }
export function AdminEventsPage() { return <SimpleCreator table="events" title="Eventos" fields={[{ key: 'title', label: 'Título' }, { key: 'starts_at', label: 'Data (YYYY-MM-DDTHH:mm)', type: 'datetime-local' }, { key: 'location', label: 'Local' }]} save={(p) => adminSaveEvent({ ...p, starts_at: new Date(p.starts_at).toISOString(), status: 'OPEN' })} /> }
export function AdminDailyWord() { return <SimpleCreator table="daily_word" title="Palavra do Dia" fields={[{ key: 'day', label: 'Data (YYYY-MM-DD)' }, { key: 'reference', label: 'Referência' }, { key: 'reflection', label: 'Reflexão' }, { key: 'context', label: 'Contexto' }, { key: 'status', label: 'Status' }]} save={(p) => adminSaveDailyWord({ ...p, status: p.status || 'PUBLISHED' })} /> }
export function AdminCycles() { return <ListShell title="Ciclos" table="cycles" emptyText="Nenhum ciclo cadastrado.">{(rows) => rows.map((r) => <RowCard key={String(r.id)} title={String(r.title)} meta={String(r.status)} />)}</ListShell> }

export function AdminReports() {
  const [kind, setKind] = useState('content')
  const report = useAsync(() => adminReport(kind), [kind])
  return (
    <>
      <SectionHeading eyebrow="Gestão" title="Relatórios" action={<select value={kind} onChange={(e) => setKind(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="content">Conteúdo</option><option value="growth">Crescimento</option><option value="overview">Geral</option></select>} />
      {report.loading ? <Skeleton className="h-40" /> : report.error ? <Alert tone="error">{report.error}</Alert> : <Card><pre className="overflow-x-auto whitespace-pre-wrap text-xs text-slate-600">{JSON.stringify(report.data, null, 2)}</pre></Card>}
    </>
  )
}

export function AdminAudit() {
  return <ListShell title="Auditoria" table="audit_logs" emptyText="Nenhuma ação registrada.">{(rows) => rows.map((r) => <RowCard key={String(r.id)} title={String(r.action)} meta={`${String(r.target ?? '')} · ${new Date(String(r.created_at)).toLocaleString('pt-BR')}`} />)}</ListShell>
}
