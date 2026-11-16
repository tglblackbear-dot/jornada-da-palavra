import { describe, expect, it } from 'vitest'
import {
  calculateStudyOutcome, currentStreak, gradeFromAttempts, localDate,
  nextReviewDate, reachedMilestones, REVIEW_INTERVALS, SCORE_RULES,
} from '../../src/lib/domain'

describe('pontuação de estudo', () => {
  it('conta acertos e pontos uma única vez por estudo', () => {
    const r = calculateStudyOutcome([{ correct: true }, { correct: false }, { correct: true }])
    expect(r.correct).toBe(2)
    expect(r.wrong).toBe(1)
    expect(r.accuracy).toBe(67)
    expect(r.points).toBe(2 * SCORE_RULES.correctAnswer + SCORE_RULES.studyCompleted)
  })

  it('não pontua estudo vazio', () => {
    expect(calculateStudyOutcome([]).points).toBe(0)
  })
})

describe('revisão espaçada', () => {
  it('usa intervalos configuráveis', () => {
    expect(REVIEW_INTERVALS.errou).toBe(1)
    expect(REVIEW_INTERVALS.dominio_consolidado).toBe(30)
    const d = nextReviewDate('acertou', new Date('2026-01-01T20:00:00Z'))
    expect(d.getDate()).toBeGreaterThanOrEqual(8)
  })

  it('classifica o grau conforme o histórico', () => {
    expect(gradeFromAttempts(0, false, 0)).toBe('errou')
    expect(gradeFromAttempts(1, false, 0)).toBe('errou_novamente')
    expect(gradeFromAttempts(0, true, 0)).toBe('acertou')
    expect(gradeFromAttempts(0, true, 2)).toBe('bom_dominio')
    expect(gradeFromAttempts(0, true, 3)).toBe('dominio_consolidado')
  })
})

describe('constância', () => {
  it('conta dias consecutivos até hoje', () => {
    const today = new Date(2026, 0, 10)
    const dates = [localDate(today), localDate(new Date(2026, 0, 9)), localDate(new Date(2026, 0, 8)), '2026-01-01']
    expect(currentStreak(dates, today)).toBe(3)
  })

  it('marcos corretos', () => {
    expect(reachedMilestones(7)).toEqual([3, 5, 7])
  })
})
