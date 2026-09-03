import { describe, expect, it } from 'vitest'
import { checkPlacement, createBoard, hasAnyLegalMove, idx, placementCells } from '../rules'
import { getPiece } from '../pieces'
import { BOARD_SIZE, CORNERS } from '../variants'
import type { Board, Cell, Color, PieceId } from '../types'

const SIZE = BOARD_SIZE

function put(board: Board, color: Color, cells: [number, number][]) {
  for (const [row, col] of cells) board[idx(row, col, SIZE)] = color
}

function tryPlace(
  board: Board,
  color: Color,
  pieceId: PieceId,
  orientationIndex: number,
  origin: Cell,
  isFirstMove: boolean,
) {
  const o = getPiece(pieceId).orientations[orientationIndex]
  return checkPlacement(board, SIZE, color, placementCells(o, origin), isFirstMove)
}

describe('첫 수 규칙', () => {
  it('코너를 덮으면 허용된다', () => {
    const board = createBoard(SIZE)
    expect(tryPlace(board, 'blue', 'I1', 0, CORNERS.blue, true).ok).toBe(true)
  })

  it('코너를 벗어나면 거부된다', () => {
    const board = createBoard(SIZE)
    const result = tryPlace(board, 'blue', 'I1', 0, { row: 1, col: 1 }, true)
    expect(result.ok).toBe(false)
    expect(result.error).toBe('first-move-needs-corner')
  })

  it('네 색이 각자의 코너를 쓴다', () => {
    const board = createBoard(SIZE)
    for (const color of ['blue', 'yellow', 'red', 'green'] as Color[]) {
      expect(tryPlace(board, color, 'I1', 0, CORNERS[color], true).ok).toBe(true)
      const other = color === 'blue' ? CORNERS.red : CORNERS.blue
      expect(tryPlace(board, color, 'I1', 0, other, true).ok).toBe(false)
    }
  })
})

describe('두 번째 수 이후 규칙', () => {
  it('같은 색과 변이 닿으면 거부된다', () => {
    const board = createBoard(SIZE)
    put(board, 'blue', [[0, 0]])
    const result = tryPlace(board, 'blue', 'I1', 0, { row: 0, col: 1 }, false)
    expect(result.ok).toBe(false)
    expect(result.error).toBe('same-color-edge-contact')
  })

  it('꼭짓점만 닿으면 허용된다', () => {
    const board = createBoard(SIZE)
    put(board, 'blue', [[0, 0]])
    expect(tryPlace(board, 'blue', 'I1', 0, { row: 1, col: 1 }, false).ok).toBe(true)
  })

  it('아무 데도 닿지 않으면 거부된다', () => {
    const board = createBoard(SIZE)
    put(board, 'blue', [[0, 0]])
    const result = tryPlace(board, 'blue', 'I1', 0, { row: 5, col: 5 }, false)
    expect(result.ok).toBe(false)
    expect(result.error).toBe('needs-corner-contact')
  })

  it('다른 색과는 변이 닿아도 된다', () => {
    const board = createBoard(SIZE)
    put(board, 'blue', [[0, 0]])
    put(board, 'red', [[1, 2]])
    expect(tryPlace(board, 'blue', 'I1', 0, { row: 1, col: 1 }, false).ok).toBe(true)
  })

  it('이미 채워진 칸에는 놓을 수 없다', () => {
    const board = createBoard(SIZE)
    put(board, 'red', [[1, 1]])
    put(board, 'blue', [[0, 0]])
    const result = tryPlace(board, 'blue', 'I1', 0, { row: 1, col: 1 }, false)
    expect(result.ok).toBe(false)
    expect(result.error).toBe('occupied')
  })

  it('보드 밖으로 나가면 거부된다', () => {
    const board = createBoard(SIZE)
    const result = tryPlace(board, 'blue', 'I5', 0, { row: 0, col: SIZE - 2 }, true)
    expect(result.ok).toBe(false)
    expect(result.error).toBe('out-of-board')
  })

  it('한 조각 안의 여러 칸이 서로 변으로 붙은 것은 문제가 되지 않는다', () => {
    const board = createBoard(SIZE)
    expect(tryPlace(board, 'blue', 'O4', 0, { row: 0, col: 0 }, true).ok).toBe(true)
  })
})

describe('합법수 탐색', () => {
  it('빈 보드에서는 첫 수를 둘 수 있다', () => {
    const board = createBoard(SIZE)
    expect(hasAnyLegalMove(board, SIZE, 'blue', ['I1'], true)).toBe(true)
  })

  it('코너가 다른 색에 막히면 첫 수를 둘 수 없다', () => {
    const board = createBoard(SIZE)
    put(board, 'red', [[0, 0]])
    expect(hasAnyLegalMove(board, SIZE, 'blue', ['I1'], true)).toBe(false)
  })

  it('대각 자리가 모두 막히면 더 둘 수 없다', () => {
    const board = createBoard(SIZE)
    put(board, 'blue', [[0, 0]])
    put(board, 'red', [[1, 1]])
    expect(hasAnyLegalMove(board, SIZE, 'blue', ['I1'], false)).toBe(false)
  })

  it('대각 자리가 하나라도 열려 있으면 둘 수 있다', () => {
    const board = createBoard(SIZE)
    put(board, 'blue', [[0, 0]])
    expect(hasAnyLegalMove(board, SIZE, 'blue', ['I1'], false)).toBe(true)
  })

  it('큰 조각은 못 놓아도 작은 조각은 놓을 수 있는 경우를 구분한다', () => {
    const board = createBoard(SIZE)
    put(board, 'blue', [[0, 0]])
    put(board, 'red', [[0, 2], [1, 2], [2, 2], [2, 1], [2, 0], [1, 0]])
    expect(hasAnyLegalMove(board, SIZE, 'blue', ['I1'], false)).toBe(true)
    expect(hasAnyLegalMove(board, SIZE, 'blue', ['O4'], false)).toBe(false)
  })
})
