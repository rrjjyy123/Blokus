/** 보드 좌표. row = 위에서부터, col = 왼쪽부터 (모두 0-기반) */
export interface Cell {
  row: number
  col: number
}

export type Color = 'blue' | 'yellow' | 'red' | 'green'

/** 조각 식별자. 표준 폴리오미노 표기를 그대로 쓴다. */
export type PieceId =
  | 'I1'
  | 'I2'
  | 'I3'
  | 'V3'
  | 'I4'
  | 'L4'
  | 'S4'
  | 'T4'
  | 'O4'
  | 'F'
  | 'I5'
  | 'L5'
  | 'N'
  | 'P'
  | 'T5'
  | 'U'
  | 'V5'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z'

/** 하나의 방향(회전·반전 적용 후). 좌표는 (0,0)을 좌상단으로 정규화되어 있다. */
export interface Orientation {
  cells: Cell[]
  width: number
  height: number
}

export interface Piece {
  id: PieceId
  /** 칸 수 (1~5) */
  size: number
  /** 회전·반전으로 만들 수 있는 서로 다른 모양들 */
  orientations: Orientation[]
}

/** 보드에 놓인 한 수 */
export interface PlacedMove {
  color: Color
  pieceId: PieceId
  orientationIndex: number
  /** 방향의 (0,0)이 놓인 보드 좌표 */
  origin: Cell
  cells: Cell[]
}

/** 보드는 (row * size + col) 인덱스의 1차원 배열. 빈 칸은 null. */
export type Board = (Color | null)[]

/** 배치 시도의 판정 결과 */
export type PlacementError =
  | 'out-of-board'
  | 'occupied'
  | 'first-move-needs-corner'
  | 'same-color-edge-contact'
  | 'needs-corner-contact'

export interface PlacementResult {
  ok: boolean
  error?: PlacementError
}

export type PlayerCount = 2 | 3 | 4

/** 좌석. 2인 모드에서는 한 좌석이 두 색을 갖는다. */
export interface Seat {
  index: number
  name: string
  colors: Color[]
  /** 보드 자동 회전에 쓰는 각도 (0 | 90 | 180 | 270) */
  rotation: number
}

export type TimerSetting = 0 | 30 | 60 | 90

export interface GameConfig {
  playerCount: PlayerCount
  seatNames: string[]
  turnSeconds: TimerSetting
  autoRotate: boolean
}

/** 색 하나의 진행 상태 */
export interface ColorState {
  color: Color
  seatIndex: number
  /** 아직 손에 남아 있는 조각 */
  remaining: PieceId[]
  /** 놓은 순서대로의 조각 id */
  played: PieceId[]
  /** 더 이상 놓을 수 없어 탈락했는가 */
  finished: boolean
}

export interface Ghost {
  pieceId: PieceId
  orientationIndex: number
  /** 사용자가 탭한 칸. 회전해도 이 칸을 중심으로 제자리에서 돈다 */
  anchor: Cell
  /** 방향의 (0,0)이 놓인 보드 좌표 */
  origin: Cell
  cells: Cell[]
  result: PlacementResult
}

export type Phase = 'setup' | 'playing' | 'over'

export interface GameState {
  phase: Phase
  config: GameConfig
  boardSize: number
  board: Board
  seats: Seat[]
  colorOrder: Color[]
  colors: Record<string, ColorState>
  /** colorOrder 상의 현재 인덱스 */
  turnIndex: number
  moves: PlacedMove[]
  selectedPieceId: PieceId | null
  orientationIndex: number
  ghost: Ghost | null
  /** 현재 턴에 남은 초. turnSeconds가 0이면 사용하지 않는다 */
  turnRemaining: number
  /** 좌석별 누적 사용 시간(초) */
  elapsedBySeat: number[]
  /** 방금 자동 패스된 색들 — 안내 배너용 */
  lastPassed: Color[]
  /** 끝까지 가지 않고 중간에 정산하고 끝냈는가 */
  endedEarly: boolean
}
