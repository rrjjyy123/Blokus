import { getPiece } from './pieces'
import { CORNERS } from './variants'
import type {
  Board,
  Cell,
  Color,
  Orientation,
  PieceId,
  PlacementResult,
} from './types'

const EDGE_NEIGHBORS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const

const DIAGONAL_NEIGHBORS = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
] as const

export function idx(row: number, col: number, size: number): number {
  return row * size + col
}

export function createBoard(size: number): Board {
  return new Array(size * size).fill(null)
}

export function cellAt(board: Board, size: number, row: number, col: number): Color | null {
  if (row < 0 || col < 0 || row >= size || col >= size) return null
  return board[idx(row, col, size)]
}

/** 방향의 좌표를 보드 좌표로 옮긴다 */
export function placementCells(orientation: Orientation, origin: Cell): Cell[] {
  return orientation.cells.map((c) => ({ row: origin.row + c.row, col: origin.col + c.col }))
}

/**
 * 배치 가능 여부. 실패 사유를 함께 돌려주어 화면에서 이유를 안내할 수 있게 한다.
 * isFirstMove가 true면 그 색의 코너 칸을 반드시 덮어야 한다.
 */
export function checkPlacement(
  board: Board,
  size: number,
  color: Color,
  cells: Cell[],
  isFirstMove: boolean,
): PlacementResult {
  for (const { row, col } of cells) {
    if (row < 0 || col < 0 || row >= size || col >= size) {
      return { ok: false, error: 'out-of-board' }
    }
    if (board[idx(row, col, size)] !== null) {
      return { ok: false, error: 'occupied' }
    }
  }

  if (isFirstMove) {
    const corner = CORNERS[color]
    const covers = cells.some((c) => c.row === corner.row && c.col === corner.col)
    return covers ? { ok: true } : { ok: false, error: 'first-move-needs-corner' }
  }

  let touchesCorner = false
  for (const { row, col } of cells) {
    for (const [dr, dc] of EDGE_NEIGHBORS) {
      if (cellAt(board, size, row + dr, col + dc) === color) {
        return { ok: false, error: 'same-color-edge-contact' }
      }
    }
    if (!touchesCorner) {
      for (const [dr, dc] of DIAGONAL_NEIGHBORS) {
        if (cellAt(board, size, row + dr, col + dc) === color) {
          touchesCorner = true
          break
        }
      }
    }
  }

  return touchesCorner ? { ok: true } : { ok: false, error: 'needs-corner-contact' }
}

/**
 * 합법수가 반드시 덮게 되는 후보 칸들.
 * 첫 수는 코너 한 칸, 그 뒤로는 "자기 색 칸의 대각 이웃 중 빈 칸"이다.
 * 합법수는 정의상 자기 색과 대각으로 닿아야 하므로 이 집합 밖에서는 나올 수 없다.
 */
export function anchorCells(board: Board, size: number, color: Color, isFirstMove: boolean): Cell[] {
  if (isFirstMove) {
    const corner = CORNERS[color]
    return board[idx(corner.row, corner.col, size)] === null ? [corner] : []
  }

  const seen = new Set<number>()
  const anchors: Cell[] = []
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[idx(row, col, size)] !== color) continue
      for (const [dr, dc] of DIAGONAL_NEIGHBORS) {
        const r = row + dr
        const c = col + dc
        if (r < 0 || c < 0 || r >= size || c >= size) continue
        const key = idx(r, c, size)
        if (board[key] !== null || seen.has(key)) continue
        seen.add(key)
        anchors.push({ row: r, col: c })
      }
    }
  }
  return anchors
}

/**
 * 이 색이 남은 조각으로 놓을 수 있는 수가 하나라도 있는가.
 * 앵커 칸만 훑기 때문에 매 턴 호출해도 부담이 없다.
 */
export function hasAnyLegalMove(
  board: Board,
  size: number,
  color: Color,
  remaining: PieceId[],
  isFirstMove: boolean,
): boolean {
  const anchors = anchorCells(board, size, color, isFirstMove)
  if (anchors.length === 0) return false

  for (const anchor of anchors) {
    for (const pieceId of remaining) {
      for (const orientation of getPiece(pieceId).orientations) {
        for (const cell of orientation.cells) {
          const origin = { row: anchor.row - cell.row, col: anchor.col - cell.col }
          const cells = placementCells(orientation, origin)
          if (checkPlacement(board, size, color, cells, isFirstMove).ok) return true
        }
      }
    }
  }
  return false
}

/** 실패 사유를 한국어 안내 문구로 */
export const PLACEMENT_MESSAGES: Record<string, string> = {
  'out-of-board': '보드 밖으로 나갔어요.',
  occupied: '이미 조각이 놓인 자리예요.',
  'first-move-needs-corner': '첫 조각은 내 색 코너 칸을 덮어야 해요.',
  'same-color-edge-contact': '같은 색끼리 변이 닿으면 안 돼요.',
  'needs-corner-contact': '같은 색 조각과 꼭짓점이 닿아야 해요.',
}
