import { Link } from 'react-router-dom'
import { BookOpen, HeartHandshake, Route as RouteIcon, ShieldCheck } from 'lucide-react'
import { PublicLayout } from '../components/layout'
import { Button, Card } from '../components/ui'

const PILLARS = [
  { icon: BookOpen, title: 'Estudar', text: 'Trilhas, perguntas e explicações com revisão humana.' },
  { icon: RouteIcon, title: 'Crescer', text: 'Minha Jornada, constância e Pontos de Aprendizagem.' },
  { icon: HeartHandshake, title: 'Comunhão', text: 'Grupos, ciclos e eventos com a sua comunidade.' },
]

export function LandingPage() {
  return (
    <PublicLayout>
      <section className="surface-dark relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-gold-500">Palavra • Crescimento • Comunhão</p>
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
              Conheça a Palavra.<br />Cresça na fé.<br /><span className="text-gold-500">Caminhe com a comunidade.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-brand-100">
              Uma plataforma cristã para estudar a Bíblia com seriedade, acompanhar sua evolução
              e viver a comunhão — sem distrações, sem competição vazia.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/cadastro"><Button className="bg-gold-500 text-brand-950 hover:bg-gold-600">Começar minha jornada</Button></Link>
              <Link to="/login"><Button variant="outlineLight">Já tenho conta</Button></Link>
            </div>
          </div>
          <div className="relative hidden justify-center lg:flex" aria-hidden>
            <div className="absolute h-72 w-72 rounded-full border border-gold-500/20" />
            <div className="absolute h-96 w-96 rounded-full border border-white/10" />
            <div className="relative flex h-56 w-56 items-center justify-center rounded-3xl bg-white/5 text-7xl text-gold-500 shadow-2xl">✦</div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-brand-950 sm:text-3xl">Uma jornada, três compromissos</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, text }) => (
            <Card key={title}>
              <Icon className="text-gold-600" size={28} aria-hidden />
              <h3 className="mt-4 text-lg font-bold text-brand-950">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <ShieldCheck className="shrink-0 text-olive-700" size={32} aria-hidden />
          <div>
            <h2 className="font-bold text-brand-950">Conteúdo confiável e privacidade respeitada</h2>
            <p className="mt-1 text-sm text-slate-600">
              Todo conteúdo bíblico passa por revisão humana antes da publicação. Seus dados seguem a LGPD:
              mínimo necessário, finalidade clara e controle do titular.
            </p>
          </div>
        </Card>
      </section>
    </PublicLayout>
  )
}
