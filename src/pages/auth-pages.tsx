import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, Button, Card, TextField } from '../components/ui'
import { PublicLayout } from '../components/layout'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { loginSchema, recoverSchema, registerSchema, resetPasswordSchema, toFieldErrors, type FieldErrors } from '../lib/validation'
import { isDuplicateEmail, requestPasswordReset, resendConfirmation, updatePassword } from '../services/auth'
import { CONFIG_HINT } from '../lib/env'

function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-12">
        <Card>
          <h1 className="text-2xl font-bold text-brand-950">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 border-t border-cream-100 pt-5 text-center text-sm text-slate-600">{footer}</div>}
        </Card>
      </div>
    </PublicLayout>
  )
}

export function LoginPage() {
  const { configured, signIn } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setMessage('')
    const parsed = loginSchema.safeParse(values)
    if (!parsed.success) return setErrors(toFieldErrors(parsed.error))
    setErrors({})
    setBusy(true)
    try {
      await signIn(parsed.data.email, parsed.data.password)
      notify('Bem-vindo de volta!', 'success')
      navigate('/app', { replace: true })
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Não foi possível entrar.'
      setMessage(/invalid login credentials/i.test(text) ? 'E-mail ou senha incorretos.' : text)
    } finally { setBusy(false) }
  }

  return (
    <AuthShell title="Entrar" subtitle="Continue sua jornada de estudo." footer={<>Ainda não tem conta? <Link className="font-semibold text-brand-900 underline" to="/cadastro">Cadastre-se</Link></>}>
      {!configured && <Alert>{CONFIG_HINT}</Alert>}
      {message && <div className="mb-4"><Alert tone="error">{message}</Alert></div>}
      <form onSubmit={submit} className="space-y-4" noValidate>
        <TextField label="E-mail" name="email" type="email" autoComplete="email" required value={values.email} error={errors.email} onChange={(e) => setValues({ ...values, email: e.target.value })} />
        <TextField label="Senha" name="password" type="password" autoComplete="current-password" required value={values.password} error={errors.password} onChange={(e) => setValues({ ...values, password: e.target.value })} />
        <div className="text-right"><Link to="/recuperar-senha" className="text-sm font-semibold text-brand-900 underline">Esqueci minha senha</Link></div>
        <Button type="submit" loading={busy} className="w-full">Entrar</Button>
      </form>
    </AuthShell>
  )
}

export function RegisterPage() {
  const { configured, signUp } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setErrors({})
    const parsed = registerSchema.safeParse(values)
    if (!parsed.success) return setErrors(toFieldErrors(parsed.error))
    setBusy(true)
    try {
      const needsConfirmation = await signUp(parsed.data.name, parsed.data.email, parsed.data.password)
      setSuccess(true)
      notify(needsConfirmation ? 'Confirme seu e-mail para continuar.' : 'Conta criada com sucesso.', 'success')
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Não foi possível cadastrar.'
      setErrors({ form: isDuplicateEmail(text) ? 'Este e-mail já está cadastrado.' : text })
    } finally { setBusy(false) }
  }

  return (
    <AuthShell title="Criar conta" subtitle="Comece gratuitamente sua jornada." footer={<>Já tem conta? <Link className="font-semibold text-brand-900 underline" to="/login">Entrar</Link></>}>
      {!configured && <Alert>{CONFIG_HINT}</Alert>}
      {success ? (
        <div className="space-y-4">
          <Alert tone="success">Cadastro realizado. Enviamos um link de confirmação para o e-mail informado. Abra o link para ativar sua conta.</Alert>
          <Button className="w-full" onClick={() => navigate('/login')}>Ir para Entrar</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          {errors.form && <Alert tone="error">{errors.form}</Alert>}
          <TextField label="Nome completo" name="name" autoComplete="name" value={values.name} error={errors.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
          <TextField label="E-mail" name="email" type="email" autoComplete="email" value={values.email} error={errors.email} onChange={(e) => setValues({ ...values, email: e.target.value })} />
          <TextField label="Senha" name="password" type="password" autoComplete="new-password" hint="Mínimo 8 caracteres, com maiúscula, minúscula e número." value={values.password} error={errors.password} onChange={(e) => setValues({ ...values, password: e.target.value })} />
          <TextField label="Confirmar senha" name="confirmPassword" type="password" autoComplete="new-password" value={values.confirmPassword} error={errors.confirmPassword} onChange={(e) => setValues({ ...values, confirmPassword: e.target.value })} />
          <Button type="submit" loading={busy} className="w-full">Criar conta</Button>
          <p className="text-center text-xs text-slate-500">Ao continuar, você concorda com a Política de Privacidade e os Termos de Uso.</p>
        </form>
      )}
    </AuthShell>
  )
}

export function RecoverPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const parsed = recoverSchema.safeParse({ email })
    if (!parsed.success) return setError(toFieldErrors(parsed.error).email ?? 'E-mail inválido.')
    setBusy(true)
    try {
      await requestPasswordReset(parsed.data.email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível solicitar a recuperação.')
    } finally { setBusy(false) }
  }

  return (
    <AuthShell title="Recuperar senha" subtitle="Enviaremos um link seguro para o seu e-mail." footer={<Link className="font-semibold text-brand-900 underline" to="/login">Voltar para Entrar</Link>}>
      {sent ? (
        <div className="space-y-4">
          <Alert tone="success">Solicitação registrada pelo Supabase Auth. Verifique sua caixa de entrada e o spam.</Alert>
          <Button variant="secondary" className="w-full" onClick={async () => { try { await resendConfirmation(email) } catch { /* silencioso: reenvio é melhor esforço */ } }}>Reenviar</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          {error && <Alert tone="error">{error}</Alert>}
          <TextField label="E-mail" name="email" type="email" autoComplete="email" value={email} error={error} onChange={(e) => { setEmail(e.target.value); setError('') }} />
          <Button type="submit" loading={busy} className="w-full">Enviar link</Button>
        </form>
      )}
    </AuthShell>
  )
}

export function ResetPasswordPage() {
  const { session } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [values, setValues] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const parsed = resetPasswordSchema.safeParse(values)
    if (!parsed.success) return setErrors(toFieldErrors(parsed.error))
    setBusy(true)
    try {
      await updatePassword(parsed.data.password)
      notify('Senha atualizada.', 'success')
      navigate('/login', { replace: true })
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Não foi possível atualizar.'
      setErrors({ form: /expired|invalid|weak/i.test(text) ? 'Link expirado ou inválido. Solicite um novo link.' : text })
    } finally { setBusy(false) }
  }

  if (!session) {
    return (
      <AuthShell title="Nova senha" subtitle="Link de recuperação." footer={<Link className="font-semibold text-brand-900 underline" to="/recuperar-senha">Solicitar novo link</Link>}>
        <Alert tone="error">Este link é inválido ou expirou. Solicite um novo link de recuperação.</Alert>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Definir nova senha" subtitle="Escolha uma senha segura para sua conta.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {errors.form && <Alert tone="error">{errors.form}</Alert>}
        <TextField label="Nova senha" name="password" type="password" autoComplete="new-password" value={values.password} error={errors.password} onChange={(e) => setValues({ ...values, password: e.target.value })} />
        <TextField label="Confirmar nova senha" name="confirmPassword" type="password" autoComplete="new-password" value={values.confirmPassword} error={errors.confirmPassword} onChange={(e) => setValues({ ...values, confirmPassword: e.target.value })} />
        <Button type="submit" loading={busy} className="w-full">Salvar nova senha</Button>
      </form>
    </AuthShell>
  )
}
