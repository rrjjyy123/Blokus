import { scoreSeats } from '../game/scoring'
import type { GameState } from '../game/types'

interface Props {
  state: GameState
}

/** 진행 중 잠정 점수. 보너스는 21개를 다 놓은 순간부터 반영된다. */
export function ScorePanel({ state }: Props) {
  const scores = scoreSeats(state)
  const turnSeatIndex = state.colors[state.colorOrder[state.turnIndex]]?.seatIndex

  return (
    <div className="panel">
      <div className="tray-head">
        <h3>점수</h3>
        <span className="tray-count">남은 칸 = 감점</span>
      </div>
      <div className="score-list">
        {scores.map(({ seat, perColor, total }) => {
          const allOut = perColor.every(({ color }) => state.colors[color].finished)
          const remainingSquares = perColor.reduce((s, e) => s + e.score.remainingSquares, 0)
          const classes = ['score-row']
          if (state.phase === 'playing' && seat.index === turnSeatIndex) classes.push('is-turn')
          if (allOut) classes.push('is-out')

          return (
            <div key={seat.index} className={classes.join(' ')}>
              <div className="chips">
                {seat.colors.map((color) => (
                  <span key={color} className={`chip c-${color}`} />
                ))}
              </div>
              <div className="score-main">
                <div className="score-name">{seat.name}</div>
                <div className="score-meta">
                  남은 {remainingSquares}칸{allOut ? ' · 종료' : ''}
                </div>
              </div>
              <div className="score-value">{total}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
