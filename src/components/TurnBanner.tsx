import { PLACEMENT_MESSAGES } from '../game/rules'
import { COLOR_LABELS } from '../game/variants'
import type { Color, GameState, Seat } from '../game/types'

interface Props {
  state: GameState
  color: Color
  seat: Seat
}

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function hintFor(state: GameState): { text: string; isError: boolean } {
  if (state.ghost && !state.ghost.result.ok) {
    return { text: PLACEMENT_MESSAGES[state.ghost.result.error ?? ''] ?? '놓을 수 없어요.', isError: true }
  }
  if (state.ghost?.result.ok) {
    return { text: '좋아요 — 「여기에 놓기」를 누르세요.', isError: false }
  }
  if (state.selectedPieceId) {
    return { text: '보드를 눌러 자리를 정하세요. 회전·뒤집기로 방향을 맞출 수 있어요.', isError: false }
  }
  const isFirst = state.colors[state.colorOrder[state.turnIndex]].played.length === 0
  return {
    text: isFirst ? '첫 조각은 내 색 코너 칸을 덮어야 해요.' : '아래에서 놓을 조각을 고르세요.',
    isError: false,
  }
}

export function TurnBanner({ state, color, seat }: Props) {
  const hint = hintFor(state)
  const useTimer = state.config.turnSeconds > 0
  const remaining = state.turnRemaining

  const timerClass = ['timer']
  if (remaining === 0) timerClass.push('is-out')
  else if (remaining <= 10) timerClass.push('is-low')

  return (
    <div className={`turn-banner c-${color}`}>
      <div className="turn-who">
        <div className="turn-name">
          <span className={`chip c-${color}`} />
          {seat.name}
          {seat.colors.length > 1 ? (
            <span style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 500 }}>
              {COLOR_LABELS[color]} 차례
            </span>
          ) : null}
        </div>
        <div className={`turn-hint${hint.isError ? ' is-error' : ''}`}>{hint.text}</div>
      </div>
      {useTimer ? <div className={timerClass.join(' ')}>{formatClock(remaining)}</div> : null}
    </div>
  )
}
