import type { GameState } from '../game/types'

const KEY = 'blokus:game:v2'

/**
 * 진행 중인 판을 브라우저에 저장한다.
 * 태블릿에서 실수로 새로고침하거나 앱이 뒤로 밀려도 판이 날아가지 않게 하는 용도.
 */
export function saveGame(state: GameState): void {
  try {
    if (state.phase !== 'playing') return
    // 선택 중인 조각과 미리보기는 저장하지 않는다 — 다시 열면 깨끗한 차례부터 시작
    const snapshot = { ...state, selectedPieceId: null, orientationIndex: 0, ghost: null }
    localStorage.setItem(KEY, JSON.stringify(snapshot))
  } catch {
    // 사생활 보호 모드 등 저장이 막힌 환경에서는 조용히 넘어간다
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as GameState
    if (parsed?.phase !== 'playing' || !Array.isArray(parsed.board)) return null
    if (parsed.board.length !== parsed.boardSize * parsed.boardSize) return null
    return parsed
  } catch {
    return null
  }
}

export function clearGame(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // 무시
  }
}
