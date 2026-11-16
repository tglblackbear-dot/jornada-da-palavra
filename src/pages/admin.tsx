import { Link, NavLink, Outlet } from 'react-router-dom'
import { Alert, Button, Card, EmptyState, SectionHeading, Skeleton, StatCard } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import { adminStats, listFrom } from '../services/data'
import { requireSupabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'

const TABS = [
  { to: '/admin/dashboard', label: 'Visão geral' },
  { to: '/admin/usuarios', label: 'Usuários' },
  { to: '/admin/perguntas', label: 'Perguntas' },
  { to: '/admin/grupos', label: 'Grupos' },
  { to: '/admin/eventos', label: 'Eventos' },
  { to: '/admin/relatorios', label: 'Relatórios' },
  { to: '/admin/auditoria', label: 'Auditoria' },
]

export function AdminLayout() {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-gold-600">Administração</p>
      <h1 className="mt-1 text-2xl font-bold text-brand-950">Painel administrativo</h1>
      <nav className="mt-5 flex gap-2 overflow-x-auto pb-2" aria-label=" Seções administrativas">
        {TABS.map((t) => <NavLink key={t.to} to={t.to} className={({ isActive }) => `whitespace-nowrap rounded-full px-4 py-2 text-sm ${isActive ? 'bg-brand-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>{t.label}</NavLink>)}
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
      {stats.loading ? <Skeleton className="h-32" /> : stats.error ? <Alert tone="error">Não foi possível carregar os indicadores: {stats.error}</Alert> : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Usuários" value={stats.data?.users ?? 0} />
          <StatCard label="Ativos" value={stats.data?.active_users ?? 0} />
          <StatCard label="Estudos" value={stats.data?.studies ?? 0} />
          <StatCard label="Perguntas" value={stats.data?.answers ?? 0} />
          <StatCard label="Taxa de acerto" value={`${stats.data?.accuracy ?? 0}%`} />
          <StatCard label="Pendentes" value={stats.data?.pending_content ?? 0} />
          <StatCard label="Grupos" value={stats.data?.groups ?? 0} />
          <StatCard label="Eventos" value={stats.data?.events ?? 0} />
        </div>
      )}
      <Card className="mt-6"><p className="text-sm text-slate-600">Edite conteúdos, usuários e eventos pelas abas acima. Toda alteração é registrada em auditoria.</p></Card>
    </>
  )
}

function GenericList({ table, emptyText }: { table: string; emptyText: string }) {
  const rows = useAsync(() => listFrom(table), [table])
  if (rows.loading) return <Skeleton className="h-40" />
  if (rows.error) return <Alert tone="error">{rows.error}</Alert>
  if (!rows.data?.length) return <EmptyState title="Nada por aqui" description={emptyText} />
  return (
    <div className="space-y-2">
      {rows.data.map((row) => {
        const r = row as Record<string, unknown>
        return (
          <Card key={String(r.id)} className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="font-semibold text-brand-950">{String(r.title ?? r.display_name ?? r.statement ?? r.id)}</p><p className="text-xs text-slate-500">{String(r.status ?? r.email ?? r.created_at ?? '')}</p></div>
            {r.status === 'REVIEW' && <ReviewButtons id={String(r.id)} />}
          </Card>
        )
      })}
    </div>
  )
}

function ReviewButtons({ id }: { id: string }) {
  const { notify } = useToast()
  async function act(action: 'approve' | 'publish') {
    try {
      await requireSupabase().rpc(action === 'approve' ? 'approve_content' : 'publish_content', { p_id: id })
      notify('Conteúdo atualizado.', 'success')
    } catch (err) { notify(err instanceof Error ? err.message : 'Falha na operação.', 'error') }
  }
  return <div className="flex gap-2"><Button variant="secondary" onClick={() => void act('approve')}>Aprovar</Button><Button onClick={() => void act('publish')}>Publicar</Button></div>
}

export function AdminUsers() { return <GenericList table="profiles" emptyText="Nenhum usuário encontrado." /> }
export function AdminQuestions() { return <GenericList table="questions" emptyText="Nenhuma pergunta cadastrada." /> }
export function AdminGroups() { return <GenericList table="groups" emptyText="Nenhum grupo cadastrado." /> }
export function AdminEvents() { return <GenericList table="events" emptyText="Nenhum evento cadastrado." /> }
export function AdminReports() { return <Card><p className="text-sm text-slate-600">Relatórios são gerados por funções de backend com auditoria. A exportação será habilitada após a configuração do Supabase.</p><Link to="/admin/dashboard" className="mt-3 inline-block text-sm font-semibold text-brand-900 underline">Voltar</Link></Card> }
export function AdminAudit() { return <GenericList table="audit_logs" emptyText="Nenhuma ação registrada ainda." /> }
