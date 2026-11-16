import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Bell, BookOpen, CalendarDays, Compass, Home, LogOut, Menu, Route, Users, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui'

const NAV = [
  { to: '/app', label: 'Início', icon: Home, end: true },
  { to: '/estudar', label: 'Estudar', icon: BookOpen },
  { to: '/jornada', label: 'Jornada', icon: Route },
  { to: '/comunidade', label: 'Comunidade', icon: Users },
  { to: '/eventos', label: 'Eventos', icon: CalendarDays },
]

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to} to={to} end={end} onClick={onNavigate}
          className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            isActive ? 'bg-brand-100 text-brand-900' : 'text-slate-600 hover:bg-cream-100'}`}
        >
          <Icon size={19} aria-hidden />
          {label}
        </NavLink>
      ))}
    </>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-900 text-gold-500" aria-hidden>
        <Compass size={20} />
      </div>
      <div>
        <p className="text-sm font-bold leading-tight text-brand-950">Jornada da Palavra</p>
        <p className="text-[10px] uppercase tracking-widest text-gold-600">Palavra • Crescimento • Comunhão</p>
      </div>
    </div>
  )
}

export function AppLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-cream-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-cream-100 bg-white p-4 lg:flex">
        <Brand />
        <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Navegação principal"><NavItems /></nav>
        <div className="space-y-1 border-t border-cream-100 pt-4">
          <NavLink to="/perfil" className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-brand-100 text-brand-900' : 'text-slate-600 hover:bg-cream-100'}`}>
            <Users size={19} /> Perfil
          </NavLink>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-cream-100">
            <LogOut size={19} /> Sair
          </button>
          <p className="px-3 pt-2 text-xs text-slate-400">{profile?.display_name ?? 'Visitante'}</p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-cream-100 bg-white/95 px-4 py-3 backdrop-blur lg:px-8">
          <button className="rounded-lg p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu /></button>
          <div className="hidden sm:block"><Brand /></div>
          <div className="flex items-center gap-2">
            <NavLink to="/notificacoes" aria-label="Notificações" className="rounded-lg p-2 text-brand-900 hover:bg-cream-100"><Bell size={20} /></NavLink>
            <Button variant="ghost" onClick={handleLogout} className="hidden sm:inline-flex" aria-label="Sair"><LogOut size={18} /> Sair</Button>
          </div>
        </header>

        {open && (
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)}>
            <div className="h-full w-72 bg-white p-4" onClick={(e) => e.stopPropagation()}>
              <div className="mb-6 flex justify-end"><button onClick={() => setOpen(false)} aria-label="Fechar menu"><X /></button></div>
              <nav className="flex flex-col gap-1" aria-label="Navegação mobile"><NavItems onNavigate={() => setOpen(false)} /></nav>
            </div>
          </div>
        )}

        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-cream-100 bg-white px-1 pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Navegação inferior">
        {NAV.slice(0, 5).map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex min-w-[64px] flex-col items-center gap-1 py-2 text-[11px] ${isActive ? 'text-brand-900' : 'text-slate-500'}`}>
            <Icon size={20} aria-hidden />{label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-cream-50">
      <header className="border-b border-cream-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Brand />
          <nav className="flex items-center gap-2">
            <NavLink to="/login" className="rounded-xl px-4 py-2 text-sm font-semibold text-brand-900 hover:bg-cream-100">Entrar</NavLink>
            <NavLink to="/cadastro" className="rounded-xl bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Começar</NavLink>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-xs text-slate-500">
        Jornada da Palavra — Conheça a Palavra. Cresça na fé. Caminhe com a comunidade.
        <div className="mt-3 flex justify-center gap-4">
          <NavLink to="/privacidade" className="underline">Privacidade</NavLink>
          <NavLink to="/termos" className="underline">Termos de Uso</NavLink>
        </div>
      </footer>
    </div>
  )
}
