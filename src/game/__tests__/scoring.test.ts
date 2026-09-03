import { describe, expect, it } from 'vitest'
import { rankSeats, scoreColor, scoreSeats } from '../scoring'
import { PIECE_ORDER } from '../pieces'
import type { ColorState, GameState, PieceId, Seat } from '../types'

function colorState(remaining: PieceId[], played: PieceId[]): ColorState {
  return { color: 'blue', seatIndex: 0, remaining, played, finished: false }
}

describe('점수 계산', () => {
  it('남은 칸 수만큼 감점된다', () => {
    const score = scoreColor(colorState(['I5', 'O4'], []))
    expect(score.remainingSquares).toBe(9)
    expect(score.total).toBe(-9)
  })

  it('아무것도 못 놓으면 −89점이다', () => {
    expect(scoreColor(colorState([...PIECE_ORDER], [])).total).toBe(-89)
  })

  it('21개를 전부 놓으면 +15점이다', () => {
    const score = scoreColor(colorState([], ['I1', 'I2']))
    expect(score.allPlacedBonus).toBe(15)
    expect(score.monominoBonus).toBe(0)
    expect(score.total).toBe(15)
  })

  it('마지막 조각이 모노미노면 +20점이다', () => {
    const score = scoreColor(colorState([], ['I2', 'I1']))
    expect(score.allPlacedBonus).toBe(15)
    expect(score.monominoBonus).toBe(5)
    expect(score.total).toBe(20)
  })

  it('조각이 남아 있으면 마지막이 모노미노여도 보너스가 없다', () => {
    const score = scoreColor(colorState(['I2'], ['I1']))
    expect(score.allPlacedBonus).toBe(0)
    expect(score.monominoBonus).toBe(0)
    expect(score.total).toBe(-2)
  })
})

describe('좌석 점수', () => {
  const seats: Seat[] = [
    { index: 0, name: 'P1', colors: ['blue', 'red'], rotation: 0 },
    { index: 1, name: 'P2', colors: ['yellow', 'green'], rotation: 180 },
  ]

  const state = {
    seats,
    colors: {
      blue: colorState(['I1'], []),
      red: colorState(['I5'], []),
      yellow: colorState([], ['I1']),
      green: colorState(['O4'], []),
    },
  } as unknown as GameState

  it('2인 모드에서 두 색을 합산한다', () => {
    const scores = scoreSeats(state)
    expect(scores[0].total).toBe(-6)
    expect(scores[1].total).toBe(16)
  })

  it('점수 내림차순으로 등수를 매기고 동점은 같은 등수다', () => {
    const ranked = rankSeats(scoreSeats(state))
    expect(ranked[0].score.seat.name).toBe('P2')
    expect(ranked[0].rank).toBe(1)
    expect(ranked[1].rank).toBe(2)

    const tie = rankSeats([
      { seat: seats[0], perColor: [], total: 5 },
      { seat: seats[1], perColor: [], total: 5 },
    ])
    expect(tie.map((t) => t.rank)).toEqual([1, 1])
  })
})
