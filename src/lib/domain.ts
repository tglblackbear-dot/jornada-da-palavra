/** Regras de negócio puras — sem acesso a rede, testáveis isoladamente. */

export const SCORE_RULES = {
  correctAnswer: 10,
  studyCompleted: 20,
  trackCompleted: 100,
  reviewCompleted: 10,
} as const

export const STREAK_MILESTONES = [3, 5, 7, 14, 30] as const

export interface AnswerResult {
  correct: boolean
}

export interface StudyOutcome {
  total: number
  correct: number
  wrong: number
  accuracy: number
  points: number
}

export function calculateStudyOutcome(answers: AnswerResult[]): StudyOutcome {
  const total = answers.length
  const correct = answers.filter((a) => a.correct).length
  const wrong = total - correct
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100)
  const points =
    (correct * SCORE_RULES.correctAnswer) + (total > 0 ? SCORE_RULES.studyCompleted : 0)
  return { total, correct, wrong, accuracy, points }
}

export type ReviewGrade = 'errou' | 'errou_novamente' | 'acertou' | 'bom_dominio' | 'dominio_consolidado'

export const REVIEW_INTERVALS: Record<ReviewGrade, number> = {
  errou: 1,
  errou_novamente: 2,
  acertou: 7,
  bom_dominio: 14,
  dominio_consolidado: 30,
}

export function nextReviewDate(grade: ReviewGrade, from = new Date()): Date {
  const d = new Date(from)
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + REVIEW_INTERVALS[grade])
  return d
}

export function gradeFromAttempts(previousMisses: number, isCorrect: boolean, correctStreak: number): ReviewGrade {
  if (!isCorrect) return previousMisses >= 1 ? 'errou_novamente' : 'errou'
  if (correctStreak >= 3) return 'dominio_consolidado'
  if (correctStreak >= 2) return 'bom_dominio'
  return 'acertou'
}

/** Dias consecutivos até hoje, usando datas locais (YYYY-MM-DD). */
export function currentStreak(dates: string[], today = new Date()): number {
  const unique = new Set(dates.map((d) => d.slice(0, 10)))
  const cursor = new Date(today)
  let streak = 0

  while (unique.has(localDate(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function localDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function reachedMilestones(streak: number): number[] {
  return STREAK_MILESTONES.filter((m) => streak >= m)
}

export function privacyLabel(publicProfile: boolean): string {
  return publicProfile ? 'Perfil visível para a comunidade' : 'Perfil privado'
}
