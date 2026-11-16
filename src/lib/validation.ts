import { z } from 'zod'

export const nameSchema = z.string().trim().min(3, 'Informe seu nome completo.').max(120)

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Informe um e-mail válido.')

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres.')
  .regex(/[A-Z]/, 'Inclua uma letra maiúscula.')
  .regex(/[a-z]/, 'Inclua uma letra minúscula.')
  .regex(/[0-9]/, 'Inclua um número.')

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1) })
export const recoverSchema = z.object({ email: emailSchema })
export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

export const profileSchema = z.object({
  displayName: nameSchema,
  bio: z.string().trim().max(500).optional().default(''),
})

export const questionSchema = z.object({
  statement: z.string().trim().min(8),
  reference: z.string().trim().min(3),
  explanation: z.string().trim().min(10),
  options: z
    .array(z.object({ text: z.string().trim().min(1), correct: z.boolean() }))
    .min(2)
    .refine((o) => o.filter((x) => x.correct).length === 1, 'Deve haver exatamente uma resposta correta.'),
})

export type FieldErrors = Record<string, string>

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!result[key]) result[key] = issue.message
  }
  return result
}
