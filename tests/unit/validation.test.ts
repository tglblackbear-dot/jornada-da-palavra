import { describe, expect, it } from 'vitest'
import { questionSchema, registerSchema, toFieldErrors } from '../../src/lib/validation'

const validUser = {
  name: 'Maria da Silva',
  email: 'maria@example.com',
  password: 'Senha@123',
  confirmPassword: 'Senha@123',
}

describe('cadastro', () => {
  it('aceita dados válidos', () => {
    expect(registerSchema.safeParse(validUser).success).toBe(true)
  })
  it('rejeita senha fraca', () => {
    const r = registerSchema.safeParse({ ...validUser, password: '123', confirmPassword: '123' })
    expect(r.success).toBe(false)
  })
  it('rejeita senhas divergentes', () => {
    const r = registerSchema.safeParse({ ...validUser, confirmPassword: 'Outra@123' })
    expect(r.success).toBe(false)
    if (!r.success) expect(toFieldErrors(r.error).confirmPassword).toBeDefined()
  })
  it('rejeita e-mail inválido', () => {
    expect(registerSchema.safeParse({ ...validUser, email: 'x' }).success).toBe(false)
  })
})

describe('questões', () => {
  const base = {
    statement: 'Qual é o primeiro livro da Bíblia?',
    reference: 'Gênesis 1:1',
    explanation: 'Consulte a referência bíblica.',
  }
  it('exige exatamente uma alternativa correta', () => {
    expect(questionSchema.safeParse({ ...base, options: [{ text: 'Gênesis', correct: true }, { text: 'Êxodo', correct: false }] }).success).toBe(true)
    expect(questionSchema.safeParse({ ...base, options: [{ text: 'A', correct: true }, { text: 'B', correct: true }] }).success).toBe(false)
  })
})
