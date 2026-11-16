import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout'
import { ProtectedRoute, PublicRoute, RoleGuard } from './components/guards'
import { LandingPage } from './pages/public'
import { LoginPage, RecoverPage, RegisterPage, ResetPasswordPage } from './pages/auth-pages'
import { CommunityPage, DashboardPage, EventCheckInPage, EventsPage, JourneyPage, MilestonesPage, NotebookPage, ProfilePage, StudyPage } from './pages/app-pages'
import { AdminAudit, AdminDashboard, AdminEvents, AdminGroups, AdminLayout, AdminQuestions, AdminReports, AdminUsers } from './pages/admin'
import { EmptyState } from './components/ui'

function NotFound() {
  return <div className="mx-auto max-w-xl px-4 py-16"><EmptyState title="Página não encontrada" description="O endereço acessado não existe nesta aplicação." /></div>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
          <Route path="/recuperar-senha" element={<RecoverPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/app" element={<DashboardPage />} />
            <Route path="/estudar" element={<StudyPage />} />
            <Route path="/jornada" element={<JourneyPage />} />
            <Route path="/comunidade" element={<CommunityPage />} />
            <Route path="/marcos" element={<MilestonesPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
            <Route path="/caderno-de-estudo" element={<NotebookPage />} />
            <Route path="/eventos" element={<EventsPage />} />
            <Route path="/evento/:codigo" element={<EventCheckInPage />} />

            <Route element={<RoleGuard allow={['ADMIN', 'SUPER_ADMIN']} />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="usuarios" element={<AdminUsers />} />
                <Route path="perguntas" element={<AdminQuestions />} />
                <Route path="categorias" element={<AdminQuestions />} />
                <Route path="trilhas" element={<AdminQuestions />} />
                <Route path="ciclos" element={<AdminEvents />} />
                <Route path="grupos" element={<AdminGroups />} />
                <Route path="eventos" element={<AdminEvents />} />
                <Route path="relatorios" element={<AdminReports />} />
                <Route path="auditoria" element={<AdminAudit />} />
                <Route path="configuracoes" element={<AdminReports />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
