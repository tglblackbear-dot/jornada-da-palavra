import { X } from 'lucide-react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

export function Button({ variant = 'primary', loading, className = '', children, disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  const styles: Record<Variant, string> = {
    primary: 'bg-brand-900 text-white hover:bg-brand-800',
    secondary: 'bg-white text-brand-900 border border-brand-100 hover:bg-cream-50',
    ghost: 'bg-transparent text-brand-900 hover:bg-cream-100',
    danger: 'bg-red-700 text-white hover:bg-red-800',
  }
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
      {children}
    </button>
  )
}

export function TextField({ label, error, hint, id, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const fieldId = id ?? props.name ?? label
  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block text-sm font-medium text-brand-950">{label}</label>
      <input
        id={fieldId}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...props}
        className={`min-h-12 w-full rounded-xl border bg-white px-4 text-base outline-none placeholder:text-slate-400 focus:border-brand-700 ${error ? 'border-red-600' : 'border-slate-200'}`}
      />
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p id={`${fieldId}-error`} className="text-sm text-red-700">{error}</p>}
    </div>
  )
}

export function TextArea({ label, error, id, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }) {
  const fieldId = id ?? props.name ?? label
  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block text-sm font-medium text-brand-950">{label}</label>
      <textarea id={fieldId} {...props} className={`min-h-28 w-full rounded-xl border bg-white px-4 py-3 outline-none ${error ? 'border-red-600' : 'border-slate-200'}`} />
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`surface p-5 shadow-sm sm:p-6 ${className}`}>{children}</section>
}

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-widest text-gold-600">{eyebrow}</p>}
        <h2 className="text-xl font-bold text-brand-950 sm:text-2xl">{title}</h2>
      </div>
      {action}
    </div>
  )
}

export function Badge({ children, tone = 'brand' }: { children: ReactNode; tone?: 'brand' | 'gold' | 'olive' | 'muted' }) {
  const tones = { brand: 'bg-brand-100 text-brand-900', gold: 'bg-gold-100 text-gold-600', olive: 'bg-olive-500/15 text-olive-700', muted: 'bg-slate-100 text-slate-600' }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>
}

export function Skeleton({ className = 'h-5 w-full' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} aria-hidden />
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="surface flex flex-col items-center gap-3 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-900" aria-hidden>✦</div>
      <h3 className="font-semibold text-brand-950">{title}</h3>
      <p className="max-w-md text-sm text-slate-600">{description}</p>
      {action}
    </div>
  )
}

export function Alert({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'error' | 'success' }) {
  const tones = { info: 'border-brand-100 bg-brand-100/40 text-brand-950', error: 'border-red-200 bg-red-50 text-red-800', success: 'border-olive-500/30 bg-olive-500/10 text-olive-700' }
  return <div role="alert" className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div>
      {label && <div className="mb-1 flex justify-between text-xs text-slate-600"><span>{label}</span><span>{pct}%</span></div>}
      <div className="h-2 w-full overflow-hidden rounded-full bg-cream-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? 'Progresso'}>
        <div className="h-full rounded-full bg-brand-800" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="surface p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-brand-950">{value}</p>
    </div>
  )
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-brand-950">{title}</h2>
          <button onClick={onClose} aria-label="Fechar" className="rounded-lg p-2 hover:bg-cream-100"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
