import { PIECE_ORDER, getOrientation, transformOrientation } from '../game/pieces'
import type { Transform } from '../game/pieces'
import { checkPlacement, createBoard, hasAnyLegalMove, idx, placementCells } from '../game/rules'
import { BOARD_SIZE, colorsForPlayerCount, createSeats, seatIndexOfColor } from '../game/variants'
import type {
  Cell,
  Color,
  ColorState,
  GameConfig,
  GameState,
  Ghost,
  PieceId,
} from '../game/types'

export type GameAction =
  | { type: 'NEW_GAME'; config: GameConfig }
  | { type: 'RESTART' }
  | { type: 'SELECT_PIECE'; pieceId: PieceId }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'TRANSFORM'; transform: Transform }
  | { type: 'AIM'; cell: Cell }
  | { type: 'NUDGE'; dRow: number; dCol: number }
  | { type: 'PLACE' }
  | { type: 'END_NOW' }

export const EMPTY_STATE: GameState = {
  phase: 'setup',
  config: { playerCount: 4, seatNames: [], autoRotate: true },
  boardSize: BOARD_SIZE,
  board: [],
  seats: [],
  colorOrder: [],
  colors: {},
  turnIndex: 0,
  moves: [],
  selectedPieceId: null,
  orientationIndex: 0,
  ghost: null,
  startedAt: 0,
  endedAt: null,
  lastPassed: [],
  endedEarly: false,
}

export function createGame(config: GameConfig): GameState {
  const seats = createSeats(config)
  const colorOrder = colorsForPlayerCount(config.playerCount)

  const colors: Record<string, ColorState> = {}
  for (const color of colorOrder) {
    colors[color] = {
      color,
      seatIndex: seatIndexOfColor(seats, color),
      remaining: [...PIECE_ORDER],
      played: [],
      finished: false,
    }
  }

  return {
    phase: 'playing',
    config,
    boardSize: BOARD_SIZE,
    board: createBoard(BOARD_SIZE),
    seats,
    colorOrder,
    colors,
    turnIndex: 0,
    moves: [],
    selectedPieceId: null,
    orientationIndex: 0,
    ghost: null,
    startedAt: Date.now(),
    endedAt: null,
    lastPassed: [],
    endedEarly: false,
  }
}

export function currentColor(state: GameState): Color {
  return state.colorOrder[state.turnIndex]
}

export function currentColorState(state: GameState): ColorState {
  return state.colors[currentColor(state)]
}

export function currentSeat(state: GameState) {
  return state.seats[currentColorState(state).seatIndex]
}

export function isFirstMoveOf(state: GameState, color: Color): boolean {
  return state.colors[color].played.length === 0
}

/** 조각 바운딩박스의 중앙이 탭한 칸에 오도록 원점을 잡는다 */
function originFor(anchor: Cell, pieceId: PieceId, orientationIndex: number): Cell {
  const o = getOrientation(pieceId, orientationIndex)
  return {
    row: anchor.row - Math.floor((o.height - 1) / 2),
    col: anchor.col - Math.floor((o.width - 1) / 2),
  }
}

function buildGhost(
  state: GameState,
  pieceId: PieceId,
  orientationIndex: number,
  anchor: Cell,
): Ghost {
  const origin = originFor(anchor, pieceId, orientationIndex)
  const cells = placementCells(getOrientation(pieceId, orientationIndex), origin)
  const color = currentColor(state)
  return {
    pieceId,
    orientationIndex,
    anchor,
    origin,
    cells,
    result: checkPlacement(state.board, state.boardSize, color, cells, isFirstMoveOf(state, color)),
  }
}

/**
 * 다음 차례로 넘긴다. 넘어가는 길에 놓을 수가 없는 색은 그 자리에서 탈락 처리한다.
 * 한 바퀴를 다 돌아도 둘 수 있는 색이 없으면 게임 종료.
 */
function advanceTurn(state: GameState): GameState {
  const colors = { ...state.colors }
  const passed: Color[] = []

  for (let step = 1; step <= state.colorOrder.length; step++) {
    const next = (state.turnIndex + step) % state.colorOrder.length
    const color = state.colorOrder[next]
    const cs = colors[color]
    if (cs.finished) continue

    const canPlay = hasAnyLegalMove(
      state.board,
      state.boardSize,
      color,
      cs.remaining,
      cs.played.length === 0,
    )
    if (canPlay) {
      return { ...state, colors, turnIndex: next, lastPassed: passed }
    }

    colors[color] = { ...cs, finished: true }
    // 조각을 다 쓴 색은 "막혀서 넘긴" 것이 아니라 완주한 것이므로 안내에 넣지 않는다
    if (cs.remaining.length > 0) passed.push(color)
  }

  return { ...state, colors, phase: 'over', endedAt: Date.now(), lastPassed: passed }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEW_GAME':
      return createGame(action.config)

    case 'RESTART':
      return createGame(state.config)

    case 'SELECT_PIECE': {
      if (state.phase !== 'playing') return state
      if (!currentColorState(state).remaining.includes(action.pieceId)) return state
      // 이미 고른 조각을 다시 집으면 맞춰 둔 방향을 유지한다.
      // (토글로 선택을 풀면 드래그로 집는 순간 선택이 사라진다)
      if (state.selectedPieceId === action.pieceId) return state
      return { ...state, selectedPieceId: action.pieceId, orientationIndex: 0, ghost: null }
    }

    case 'CLEAR_SELECTION':
      return { ...state, selectedPieceId: null, ghost: null }

    case 'TRANSFORM': {
      if (state.phase !== 'playing' || !state.selectedPieceId) return state
      const orientationIndex = transformOrientation(
        state.selectedPieceId,
        state.orientationIndex,
        action.transform,
      )
      const ghost = state.ghost
        ? buildGhost(state, state.selectedPieceId, orientationIndex, state.ghost.anchor)
        : null
      return { ...state, orientationIndex, ghost }
    }

    case 'AIM': {
      if (state.phase !== 'playing' || !state.selectedPieceId) return state
      return {
        ...state,
        ghost: buildGhost(state, state.selectedPieceId, state.orientationIndex, action.cell),
      }
    }

    case 'NUDGE': {
      if (state.phase !== 'playing' || !state.selectedPieceId || !state.ghost) return state
      const anchor = {
        row: state.ghost.anchor.row + action.dRow,
        col: state.ghost.anchor.col + action.dCol,
      }
      return {
        ...state,
        ghost: buildGhost(state, state.selectedPieceId, state.orientationIndex, anchor),
      }
    }

    case 'PLACE': {
      if (state.phase !== 'playing' || !state.ghost?.result.ok) return state

      const color = currentColor(state)
      const { pieceId, orientationIndex, origin, cells } = state.ghost

      const board = [...state.board]
      for (const { row, col } of cells) board[idx(row, col, state.boardSize)] = color

      const cs = state.colors[color]
      const placed: GameState = {
        ...state,
        board,
        colors: {
          ...state.colors,
          [color]: {
            ...cs,
            remaining: cs.remaining.filter((id) => id !== pieceId),
            played: [...cs.played, pieceId],
          },
        },
        moves: [...state.moves, { color, pieceId, orientationIndex, origin, cells }],
        selectedPieceId: null,
        orientationIndex: 0,
        ghost: null,
      }

      return advanceTurn(placed)
    }

    case 'END_NOW': {
      // 시간이 모자라 중간에 끊는 경우. 지금 보드에 놓인 것만으로 점수를 낸다 —
      // 남은 조각은 그대로 감점이고 완주 보너스는 아무도 받지 못한다.
      if (state.phase !== 'playing') return state
      return {
        ...state,
        phase: 'over',
        endedAt: Date.now(),
        endedEarly: true,
        selectedPieceId: null,
        ghost: null,
        lastPassed: [],
      }
    }

    default:
      return state
  }
}
