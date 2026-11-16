import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Badge, Button, Card, EmptyState, SectionHeading, Skeleton } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../contexts/ToastContext'
import { markAllNotificationsRead, markNotificationRead, myNotifications } from '../services/data'
import { PublicLayout } from '../components/layout'

export function NotificationsPage() {
  const items = useAsync(() => myNotifications(), [])
  const { notify } = useToast()
  const [busy, setBusy] = useState(false)

  async function readAll() {
    setBusy(true)
    try { await markAllNotificationsRead(); items.reload(); notify('Notificações marcadas como lidas.', 'success') }
    catch (err) { notify(err instanceof Error ? err.message : 'Falha.', 'error') }
    finally { setBusy(false) }
  }

  async function read(id: string) {
    try { await markNotificationRead(id); items.reload() } catch { /* melhor esforço */ }
  }

  return (
    <>
      <SectionHeading eyebrow="Comunicação" title="Notificações" action={<Button variant="secondary" loading={busy} onClick={() => void readAll()}>Marcar todas como lidas</Button>} />
      {items.loading ? <Skeleton className="h-40" /> : items.error ? <Alert tone="error">{items.error}</Alert> : !items.data?.length ? (
        <EmptyState title="Tudo em dia" description="Você não tem notificações. Novos marcos, ciclos e eventos aparecerão aqui." />
      ) : (
        <div className="space-y-3">
          {items.data.map((n) => (
            <Card key={n.id} className={n.read ? 'opacity-70' : 'border-brand-100'}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2"><Badge tone={n.read ? 'muted' : 'gold'}>{n.kind}</Badge><h3 className="font-semibold text-brand-950">{n.title}</h3></div>
                  {n.body && <p className="mt-2 text-sm text-slate-600">{n.body}</p>}
                  <p className="mt-2 text-xs text-slate-400">{new Date(n.created_at).toLocaleString('pt-BR')}</p>
                </div>
                {!n.read && <Button variant="ghost" onClick={() => void read(n.id)}>Marcar lida</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}

const LEGAL = {
  privacidade: {
    title: 'Política de Privacidade',
    intro: 'A Jornada da Palavra coleta apenas os dados necessários para oferecer o estudo bíblico, o acompanhamento da jornada e a comunhão.',
    sections: [
      ['Dados coletados', 'Nome de exibição, e-mail, biografia opcional, foto de perfil opcional e registros de estudo. Senhas são gerenciadas pelo Supabase Auth e nunca são armazenadas em tabelas da aplicação.'],
      ['Finalidade', 'Personalizar o estudo, registrar progresso e pontos, permitir grupos e eventos e enviar notificações autorizadas.'],
      ['Compartilhamento', 'Perfil é privado por padrão. Destaques da comunidade só aparecem quando o titular habilita o perfil público. Nenhum dado pessoal é exibido em rankings.'],
      ['Seus direitos', 'Você pode exportar seus dados em Meu Perfil e solicitar a exclusão da conta. A exclusão é processada pela administração conforme a LGPD.'],
      ['Contato', 'Use os canais oficiais da comunidade para dúvidas sobre privacidade.'],
    ],
  },
  termos: {
    title: 'Termos de Uso',
    intro: 'Ao usar a plataforma, você concorda com estas regras simples.',
    sections: [
      ['Uso adequado', 'Use a plataforma para estudo, crescimento espiritual e comunhão. É proibido assediar, discriminar, publicar conteúdo ilícito ou tentar alterar pontuações, papéis ou presença.'],
      ['Conteúdo bíblico', 'Referências são bíblicas; reflexões são textos originais e passam por revisão editorial. Não reproduzimos traduções protegidas por direitos autorais.'],
      ['Responsabilidade', 'A plataforma é um instrumento de apoio ao estudo e não substitui a comunidade, a leitura da Bíblia ou a orientação pastoral.'],
      ['Alterações', 'Estes termos podem ser atualizados para refletir mudanças legais ou funcionais.'],
    ],
  },
} as const

export function LegalPage({ kind }: { kind: 'privacidade' | 'termos' }) {
  const data = LEGAL[kind]
  const navigate = useNavigate()
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Card>
          <h1 className="text-2xl font-bold text-brand-950">{data.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{data.intro}</p>
          <div className="mt-6 space-y-5">
            {data.sections.map(([title, body]) => (
              <section key={title}>
                <h2 className="font-semibold text-brand-900">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{body}</p>
              </section>
            ))}
          </div>
          <Button variant="secondary" className="mt-8" onClick={() => navigate('/')}>Voltar ao início</Button>
        </Card>
      </div>
    </PublicLayout>
  )
}

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <PublicLayout>
      <div className="mx-auto max-w-xl px-4 py-16">
        <EmptyState title="Página não encontrada" description="O endereço acessado não existe nesta aplicação." action={<Button onClick={() => navigate('/')}>Ir para o início</Button>} />
      </div>
    </PublicLayout>
  )
}
