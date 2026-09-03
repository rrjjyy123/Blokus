import type { Cell, Orientation, Piece, PieceId } from './types'

/**
 * 21종 조각의 기본 모양. 좌표는 (row, col).
 * 회전·반전은 여기서 하드코딩하지 않고 런타임에 생성한다 —
 * 손으로 91개 방향을 적으면 반드시 어딘가 틀린다.
 */
const BASE_SHAPES: Record<PieceId, [number, number][]> = {
  // 1칸
  I1: [[0, 0]],
  // 2칸
  I2: [[0, 0], [0, 1]],
  // 3칸
  I3: [[0, 0], [0, 1], [0, 2]],
  V3: [[0, 0], [1, 0], [1, 1]],
  // 4칸
  I4: [[0, 0], [0, 1], [0, 2], [0, 3]],
  L4: [[0, 0], [1, 0], [2, 0], [2, 1]],
  S4: [[0, 1], [0, 2], [1, 0], [1, 1]],
  T4: [[0, 0], [0, 1], [0, 2], [1, 1]],
  O4: [[0, 0], [0, 1], [1, 0], [1, 1]],
  // 5칸 (펜토미노 12종)
  F: [[0, 1], [0, 2], [1, 0], [1, 1], [2, 1]],
  I5: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
  L5: [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]],
  N: [[0, 1], [1, 1], [2, 0], [2, 1], [3, 0]],
  P: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]],
  T5: [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1]],
  U: [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]],
  V5: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]],
  W: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]],
  X: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]],
  Y: [[0, 1], [1, 0], [1, 1], [2, 1], [3, 1]],
  Z: [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2]],
}

/** 트레이에 보여줄 순서: 작은 조각부터 */
export const PIECE_ORDER: PieceId[] = [
  'I1',
  'I2',
  'I3',
  'V3',
  'I4',
  'L4',
  'S4',
  'T4',
  'O4',
  'F',
  'I5',
  'L5',
  'N',
  'P',
  'T5',
  'U',
  'V5',
  'W',
  'X',
  'Y',
  'Z',
]

/** 좌표를 좌상단 (0,0) 기준으로 옮기고 정렬한다 */
function normalize(cells: Cell[]): Cell[] {
  const minRow = Math.min(...cells.map((c) => c.row))
  const minCol = Math.min(...cells.map((c) => c.col))
  return cells
    .map((c) => ({ row: c.row - minRow, col: c.col - minCol }))
    .sort((a, b) => a.row - b.row || a.col - b.col)
}

function keyOf(cells: Cell[]): string {
  return cells.map((c) => `${c.row},${c.col}`).join('|')
}

/** 시계방향 90도 회전 */
function rotate(cells: Cell[]): Cell[] {
  return normalize(cells.map((c) => ({ row: c.col, col: -c.row })))
}

/** 좌우 반전 */
function flip(cells: Cell[]): Cell[] {
  return normalize(cells.map((c) => ({ row: c.row, col: -c.col })))
}

function toOrientation(cells: Cell[]): Orientation {
  return {
    cells,
    height: Math.max(...cells.map((c) => c.row)) + 1,
    width: Math.max(...cells.map((c) => c.col)) + 1,
  }
}

/** 회전 4 × 반전 2 = 8가지를 만들고 같은 모양은 하나로 합친다 */
function buildOrientations(base: [number, number][]): Orientation[] {
  const start = normalize(base.map(([row, col]) => ({ row, col })))
  const seen = new Map<string, Cell[]>()

  for (const mirrored of [start, flip(start)]) {
    let current = mirrored
    for (let i = 0; i < 4; i++) {
      const key = keyOf(current)
      if (!seen.has(key)) seen.set(key, current)
      current = rotate(current)
    }
  }

  return [...seen.values()].map(toOrientation)
}

export const PIECES: Record<PieceId, Piece> = Object.fromEntries(
  PIECE_ORDER.map((id) => {
    const orientations = buildOrientations(BASE_SHAPES[id])
    return [id, { id, size: BASE_SHAPES[id].length, orientations } satisfies Piece]
  }),
) as Record<PieceId, Piece>

/** 방향 모양 → 그 조각 안에서의 방향 인덱스 */
const ORIENTATION_INDEX: Record<PieceId, Map<string, number>> = Object.fromEntries(
  PIECE_ORDER.map((id) => [
    id,
    new Map(PIECES[id].orientations.map((o, i) => [keyOf(o.cells), i])),
  ]),
) as Record<PieceId, Map<string, number>>

export type Transform = 'rotate-cw' | 'rotate-ccw' | 'flip'

/**
 * 현재 방향에 회전·반전을 적용했을 때의 새 방향 인덱스.
 * 방향 목록은 중복이 제거되어 있어 인덱스를 단순히 +1 하는 방식으로는 안 된다 —
 * 실제로 좌표를 변환한 뒤 되찾아온다.
 */
export function transformOrientation(id: PieceId, index: number, transform: Transform): number {
  const cells = getOrientation(id, index).cells
  let next: Cell[]
  if (transform === 'flip') next = flip(cells)
  else if (transform === 'rotate-cw') next = rotate(cells)
  else next = rotate(rotate(rotate(cells)))
  return ORIENTATION_INDEX[id].get(keyOf(next)) ?? index
}

export function getPiece(id: PieceId): Piece {
  return PIECES[id]
}

export function getOrientation(id: PieceId, index: number): Orientation {
  const piece = PIECES[id]
  return piece.orientations[index % piece.orientations.length]
}

/** 한 색이 가진 조각 전체의 칸 수 합 (= 89) */
export const TOTAL_SQUARES = PIECE_ORDER.reduce((sum, id) => sum + PIECES[id].size, 0)

/** 조각들의 남은 칸 수 합 */
export function squaresOf(ids: PieceId[]): number {
  return ids.reduce((sum, id) => sum + PIECES[id].size, 0)
}
