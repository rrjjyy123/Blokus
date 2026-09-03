import { rankSeats, scoreSeats } from '../game/scoring'
import { formatClock } from './TurnBanner'
import type { GameState } from '../game/types'

interface Props {
  state: GameState
  onRestart: () => void
  onNewSetup: () => void
}

export function GameOverModal({ state, onRestart, onNewSetup }: Props) {
  const ranked = rankSeats(scoreSeats(state))
  const topScore = ranked[0]?.score.total
  const winners = ranked.filter((r) => r.score.total === topScore)

  return (
    <div className="overlay">
      <div className="modal">
        <h2>{state.endedEarly ? '여기까지!' : '게임 끝!'}</h2>
        {state.endedEarly ? (
          <p style={{ marginTop: 0 }}>
            끝까지 가지 않고 중간에 정산했습니다. 지금 보드에 놓인 조각만으로 계산한 점수입니다.
          </p>
        ) : null}
        <p>
          {winners.length > 1
            ? `${winners.map((w) => w.score.seat.name).join(', ')} 공동 우승 (${topScore}점)`
            : `${winners[0]?.score.seat.name} 우승 (${topScore}점)`}
        </p>

        <table className="result-table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>순위 · 이름</th>
              <th>남은 칸</th>
              <th>완주 +15</th>
              <th>1칸 +5</th>
              <th>합계</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map(({ score, rank }) => {
              const remaining = score.perColor.reduce((s, e) => s + e.score.remainingSquares, 0)
              const allPlaced = score.perColor.reduce((s, e) => s + e.score.allPlacedBonus, 0)
              const mono = score.perColor.reduce((s, e) => s + e.score.monominoBonus, 0)
              return (
                <tr key={score.seat.index} className={rank === 1 ? 'is-winner' : undefined}>
                  <td>
                    <span style={{ color: 'var(--ink-faint)', marginRight: 6 }}>{rank}위</span>
                    {score.seat.colors.map((color) => (
                      <span
                        key={color}
                        className={`chip c-${color}`}
                        style={{ display: 'inline-block', width: 12, height: 12, marginRight: 4, verticalAlign: -1 }}
                      />
                    ))}
                    {score.seat.name}
                  </td>
                  <td>−{remaining}</td>
                  <td>{allPlaced ? `+${allPlaced}` : '—'}</td>
                  <td>{mono ? `+${mono}` : '—'}</td>
                  <td>{score.total}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <p style={{ marginTop: 12, fontSize: 12.5 }}>
          총 {state.moves.length}수 · 플레이 시간{' '}
          {formatClock(state.elapsedBySeat.reduce((a, b) => a + b, 0))}
        </p>

        <div className="modal-actions">
          <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={onRestart}>
            같은 설정으로 다시
          </button>
          <button type="button" className="btn" style={{ flex: 1 }} onClick={onNewSetup}>
            설정 바꾸기
          </button>
        </div>
      </div>
    </div>
  )
}
