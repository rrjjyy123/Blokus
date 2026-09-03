import { squaresOf } from './pieces'
import type { ColorState, GameState, Seat } from './types'

export interface ColorScore {
  remainingSquares: number
  allPlacedBonus: number
  monominoBonus: number
  total: number
}

/**
 * 남은 칸 수만큼 −1점.
 * 21개를 전부 놓았으면 +15, 그 마지막 조각이 모노미노(I1)였다면 추가 +5.
 */
export function scoreColor(state: ColorState): ColorScore {
  const remainingSquares = squaresOf(state.remaining)
  const allPlaced = state.remaining.length === 0
  const allPlacedBonus = allPlaced ? 15 : 0
  const monominoBonus = allPlaced && state.played[state.played.length - 1] === 'I1' ? 5 : 0

  return {
    remainingSquares,
    allPlacedBonus,
    monominoBonus,
    total: -remainingSquares + allPlacedBonus + monominoBonus,
  }
}

export interface SeatScore {
  seat: Seat
  perColor: { color: string; score: ColorScore }[]
  total: number
}

/** 좌석 점수. 2인 모드에서는 맡은 두 색을 합산한다. */
export function scoreSeats(state: GameState): SeatScore[] {
  return state.seats.map((seat) => {
    const perColor = seat.colors.map((color) => ({
      color,
      score: scoreColor(state.colors[color]),
    }))
    return {
      seat,
      perColor,
      total: perColor.reduce((sum, entry) => sum + entry.score.total, 0),
    }
  })
}

/** 점수 내림차순 순위. 동점이면 같은 등수를 준다. */
export function rankSeats(scores: SeatScore[]): { score: SeatScore; rank: number }[] {
  const sorted = [...scores].sort((a, b) => b.total - a.total)
  let lastTotal = Number.NaN
  let lastRank = 0
  return sorted.map((score, i) => {
    const rank = score.total === lastTotal ? lastRank : i + 1
    lastTotal = score.total
    lastRank = rank
    return { score, rank }
  })
}
