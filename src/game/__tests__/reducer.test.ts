import { describe, expect, it } from 'vitest'
import { createGame, currentColor, gameReducer } from '../../state/gameReducer'
import type { GameAction } from '../../state/gameReducer'
import { scoreSeats } from '../scoring'
import { idx } from '../rules'
import { BOARD_SIZE, CORNERS } from '../variants'
import type { GameConfig, GameState } from '../types'

function config(playerCount: 2 | 3 | 4, seatNames: string[]): GameConfig {
  return { playerCount, seatNames, autoRotate: true }
}

function run(state: GameState, actions: GameAction[]): GameState {
  return actions.reduce(gameReducer, state)
}

describe('인원별 구성', () => {
  it('4인은 네 색을 모두 쓰고 좌석이 넷이다', () => {
    const game = createGame(config(4, ['A', 'B', 'C', 'D']))
    expect(game.colorOrder).toEqual(['blue', 'yellow', 'red', 'green'])
    expect(game.seats).toHaveLength(4)
    expect(game.seats.map((s) => s.colors)).toEqual([['blue'], ['yellow'], ['red'], ['green']])
  })

  it('3인은 초록을 아예 쓰지 않는다', () => {
    const game = createGame(config(3, ['A', 'B', 'C']))
    expect(game.colorOrder).toEqual(['blue', 'yellow', 'red'])
    expect(game.colors.green).toBeUndefined()
    expect(game.seats.flatMap((s) => s.colors)).not.toContain('green')
  })

  it('2인은 한 사람이 대각 두 색을 맡는다', () => {
    const game = createGame(config(2, ['A', 'B']))
    expect(game.seats).toHaveLength(2)
    expect(game.seats[0].colors).toEqual(['blue', 'red'])
    expect(game.seats[1].colors).toEqual(['yellow', 'green'])
    // 턴 순서는 4인과 같이 색 기준으로 돈다
    expect(game.colorOrder).toEqual(['blue', 'yellow', 'red', 'green'])
    // 마주 보고 앉으므로 회전은 180도 차이
    expect(game.seats[1].rotation - game.seats[0].rotation).toBe(180)
  })

  it('모든 색이 21조각을 들고 시작한다', () => {
    const game = createGame(config(4, ['A', 'B', 'C', 'D']))
    for (const color of game.colorOrder) {
      expect(game.colors[color].remaining).toHaveLength(21)
      expect(game.colors[color].played).toHaveLength(0)
    }
  })
})

describe('배치 흐름', () => {
  const base = createGame(config(4, ['A', 'B', 'C', 'D']))

  it('조각을 고르고 코너를 조준하면 놓을 수 있다', () => {
    const aimed = run(base, [
      { type: 'SELECT_PIECE', pieceId: 'I1' },
      { type: 'AIM', cell: CORNERS.blue },
    ])
    expect(aimed.ghost?.result.ok).toBe(true)

    const placed = gameReducer(aimed, { type: 'PLACE' })
    expect(placed.board[idx(0, 0, BOARD_SIZE)]).toBe('blue')
    expect(placed.colors.blue.remaining).toHaveLength(20)
    expect(placed.colors.blue.played).toEqual(['I1'])
    expect(currentColor(placed)).toBe('yellow')
    expect(placed.ghost).toBeNull()
    expect(placed.selectedPieceId).toBeNull()
  })

  it('첫 수를 코너 밖에 조준하면 무효로 표시되고 놓이지 않는다', () => {
    const aimed = run(base, [
      { type: 'SELECT_PIECE', pieceId: 'I1' },
      { type: 'AIM', cell: { row: 5, col: 5 } },
    ])
    expect(aimed.ghost?.result.ok).toBe(false)
    expect(aimed.ghost?.result.error).toBe('first-move-needs-corner')

    const attempted = gameReducer(aimed, { type: 'PLACE' })
    expect(attempted.moves).toHaveLength(0)
    expect(currentColor(attempted)).toBe('blue')
  })

  it('회전해도 조준한 칸을 중심으로 제자리에서 돈다', () => {
    const aimed = run(base, [
      { type: 'SELECT_PIECE', pieceId: 'L5' },
      { type: 'AIM', cell: { row: 8, col: 8 } },
    ])
    const rotated = gameReducer(aimed, { type: 'TRANSFORM', transform: 'rotate-cw' })
    expect(rotated.ghost?.anchor).toEqual({ row: 8, col: 8 })
    expect(rotated.orientationIndex).not.toBe(aimed.orientationIndex)
    expect(rotated.ghost?.cells).toHaveLength(5)
  })

  it('네 번 회전하면 원래 방향으로 돌아온다', () => {
    let state = gameReducer(base, { type: 'SELECT_PIECE', pieceId: 'F' })
    for (let i = 0; i < 4; i++) {
      state = gameReducer(state, { type: 'TRANSFORM', transform: 'rotate-cw' })
    }
    expect(state.orientationIndex).toBe(0)
  })

  it('두 번 뒤집으면 원래 방향으로 돌아온다', () => {
    let state = gameReducer(base, { type: 'SELECT_PIECE', pieceId: 'Y' })
    state = gameReducer(state, { type: 'TRANSFORM', transform: 'flip' })
    expect(state.orientationIndex).not.toBe(0)
    state = gameReducer(state, { type: 'TRANSFORM', transform: 'flip' })
    expect(state.orientationIndex).toBe(0)
  })

  it('가진 조각만 고를 수 있다', () => {
    const placed = run(base, [
      { type: 'SELECT_PIECE', pieceId: 'I1' },
      { type: 'AIM', cell: CORNERS.blue },
      { type: 'PLACE' },
      { type: 'SELECT_PIECE', pieceId: 'I1' },
    ])
    // 노랑은 아직 I1을 갖고 있으므로 선택된다
    expect(placed.selectedPieceId).toBe('I1')
  })
})

describe('자동 패스와 종료', () => {
  it('놓을 수 없는 색은 차례를 건너뛰고 탈락 처리된다', () => {
    const game = createGame(config(4, ['A', 'B', 'C', 'D']))
    // 노랑 코너를 미리 막아 첫 수를 둘 수 없게 만든다
    game.board[idx(CORNERS.yellow.row, CORNERS.yellow.col, BOARD_SIZE)] = 'red'

    const placed = run(game, [
      { type: 'SELECT_PIECE', pieceId: 'I1' },
      { type: 'AIM', cell: CORNERS.blue },
      { type: 'PLACE' },
    ])

    expect(placed.colors.yellow.finished).toBe(true)
    expect(placed.lastPassed).toEqual(['yellow'])
    expect(currentColor(placed)).toBe('red')
  })

  it('아무도 둘 수 없으면 게임이 끝난다', () => {
    const game = createGame(config(4, ['A', 'B', 'C', 'D']))
    for (const color of ['yellow', 'red', 'green'] as const) {
      game.board[idx(CORNERS[color].row, CORNERS[color].col, BOARD_SIZE)] = 'blue'
    }
    // 파랑은 이 한 수가 마지막 조각
    game.colors.blue.remaining = ['I1']

    const placed = run(game, [
      { type: 'SELECT_PIECE', pieceId: 'I1' },
      { type: 'AIM', cell: CORNERS.blue },
      { type: 'PLACE' },
    ])

    expect(placed.phase).toBe('over')
    expect(placed.colors.blue.remaining).toHaveLength(0)
  })
})

describe('중간에 끝내기', () => {
  it('진행 중인 판을 즉시 종료하고 지금까지의 점수로 정산한다', () => {
    const game = createGame(config(4, ['A', 'B', 'C', 'D']))
    const placed = run(game, [
      { type: 'SELECT_PIECE', pieceId: 'I5' },
      // I5는 바운딩박스 중앙이 조준 칸에 오므로, 코너를 덮으려면 (0,2)를 조준한다
      { type: 'AIM', cell: { row: 0, col: 2 } },
      { type: 'PLACE' },
      { type: 'END_NOW' },
    ])

    expect(placed.phase).toBe('over')
    expect(placed.endedEarly).toBe(true)
    // 보드에 놓인 것은 그대로 남는다
    expect(placed.colors.blue.played).toEqual(['I5'])
    expect(placed.colors.blue.remaining).toHaveLength(20)
    // 선택·미리보기는 정리된다
    expect(placed.selectedPieceId).toBeNull()
    expect(placed.ghost).toBeNull()
  })

  it('중간 종료 점수는 남은 칸 감점만 반영하고 완주 보너스는 주지 않는다', () => {
    const game = createGame(config(4, ['A', 'B', 'C', 'D']))
    const ended = run(game, [
      { type: 'SELECT_PIECE', pieceId: 'I5' },
      // I5는 바운딩박스 중앙이 조준 칸에 오므로, 코너를 덮으려면 (0,2)를 조준한다
      { type: 'AIM', cell: { row: 0, col: 2 } },
      { type: 'PLACE' },
      { type: 'END_NOW' },
    ])

    const scores = scoreSeats(ended)
    // 파랑은 5칸을 놓았으니 89 − 5 = 84칸이 남는다
    expect(scores[0].total).toBe(-84)
    expect(scores[0].perColor[0].score.allPlacedBonus).toBe(0)
    // 한 수도 못 둔 나머지는 −89
    expect(scores[1].total).toBe(-89)
  })

  it('이미 끝난 판에는 아무 영향이 없다', () => {
    const game = createGame(config(4, ['A', 'B', 'C', 'D']))
    const over = { ...game, phase: 'over' as const }
    expect(gameReducer(over, { type: 'END_NOW' })).toBe(over)
  })
})

describe('조각 선택', () => {
  it('고른 조각을 다시 집어도 선택이 풀리지 않고 방향이 유지된다', () => {
    const game = createGame(config(4, ['A', 'B', 'C', 'D']))
    const rotated = run(game, [
      { type: 'SELECT_PIECE', pieceId: 'L5' },
      { type: 'TRANSFORM', transform: 'rotate-cw' },
    ])
    expect(rotated.orientationIndex).not.toBe(0)

    // 드래그로 다시 집는 상황
    const again = gameReducer(rotated, { type: 'SELECT_PIECE', pieceId: 'L5' })
    expect(again.selectedPieceId).toBe('L5')
    expect(again.orientationIndex).toBe(rotated.orientationIndex)
  })

  it('다른 조각을 고르면 방향이 초기화된다', () => {
    const game = createGame(config(4, ['A', 'B', 'C', 'D']))
    const switched = run(game, [
      { type: 'SELECT_PIECE', pieceId: 'L5' },
      { type: 'TRANSFORM', transform: 'rotate-cw' },
      { type: 'SELECT_PIECE', pieceId: 'F' },
    ])
    expect(switched.selectedPieceId).toBe('F')
    expect(switched.orientationIndex).toBe(0)
  })
})

describe('판 소요 시간', () => {
  it('시작 시각을 기록하고 끝나기 전에는 종료 시각이 비어 있다', () => {
    const before = Date.now()
    const game = createGame(config(4, ['A', 'B', 'C', 'D']))
    expect(game.startedAt).toBeGreaterThanOrEqual(before)
    expect(game.endedAt).toBeNull()
  })

  it('중간 정산으로 끝내면 종료 시각이 찍힌다', () => {
    const game = createGame(config(4, ['A', 'B', 'C', 'D']))
    const ended = gameReducer(game, { type: 'END_NOW' })
    expect(ended.endedAt).not.toBeNull()
    expect(ended.endedAt!).toBeGreaterThanOrEqual(ended.startedAt)
  })

  it('전원이 막혀 끝나도 종료 시각이 찍힌다', () => {
    const game = createGame(config(4, ['A', 'B', 'C', 'D']))
    for (const color of ['yellow', 'red', 'green'] as const) {
      game.board[idx(CORNERS[color].row, CORNERS[color].col, BOARD_SIZE)] = 'blue'
    }
    game.colors.blue.remaining = ['I1']

    const over = run(game, [
      { type: 'SELECT_PIECE', pieceId: 'I1' },
      { type: 'AIM', cell: CORNERS.blue },
      { type: 'PLACE' },
    ])
    expect(over.phase).toBe('over')
    expect(over.endedAt).not.toBeNull()
  })
})
