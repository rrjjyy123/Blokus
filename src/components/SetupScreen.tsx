import { useState } from 'react'
import { createSeats, defaultSeatNames } from '../game/variants'
import { PieceThumb } from './PieceThumb'
import type { GameConfig, PlayerCount } from '../game/types'

interface Props {
  onStart: (config: GameConfig) => void
  onResume?: () => void
  hasSavedGame: boolean
}

export function SetupScreen({ onStart, onResume, hasSavedGame }: Props) {
  const [playerCount, setPlayerCount] = useState<PlayerCount>(4)
  const [names, setNames] = useState<string[]>(() => defaultSeatNames(4))
  const [autoRotate, setAutoRotate] = useState(true)

  function changeCount(count: PlayerCount) {
    setPlayerCount(count)
    setNames(defaultSeatNames(count))
  }

  const seats = createSeats({ playerCount, seatNames: names, autoRotate })

  return (
    <div className="setup">
      <div className="setup-card">
        <div className="setup-logo">
          <PieceThumb pieceId="V3" color="blue" cellSize={11} />
          <PieceThumb pieceId="P" color="yellow" cellSize={11} />
          <PieceThumb pieceId="Z" color="red" cellSize={11} />
          <PieceThumb pieceId="L4" color="green" cellSize={11} />
        </div>
        <h1 className="setup-title">블로커스</h1>
        <p className="setup-sub">한 대의 기기로 둘러앉아 즐기는 보드게임</p>

        {hasSavedGame && onResume ? (
          <button type="button" className="btn btn-block" style={{ marginBottom: 20 }} onClick={onResume}>
            ▸ 하던 게임 이어서 하기
          </button>
        ) : null}

        <div className="field">
          <span className="field-label">인원</span>
          <div className="choice-row">
            {([2, 3, 4] as PlayerCount[]).map((count) => (
              <button
                key={count}
                type="button"
                className="choice"
                aria-pressed={playerCount === count}
                onClick={() => changeCount(count)}
              >
                {count}명
              </button>
            ))}
          </div>
          <p style={{ margin: '8px 2px 0', fontSize: 12.5, color: 'var(--ink-soft)' }}>
            {playerCount === 4 && '각자 한 색씩 맡습니다.'}
            {playerCount === 3 && '파랑·노랑·빨강 세 색만 쓰고 초록은 사용하지 않습니다.'}
            {playerCount === 2 && '한 사람이 대각선 두 색을 맡고 점수를 합산합니다.'}
          </p>
        </div>

        <div className="field">
          <span className="field-label">이름</span>
          <div className="name-rows">
            {seats.map((seat, i) => (
              <div key={seat.index} className="name-row">
                <div className="chips">
                  {seat.colors.map((color) => (
                    <span key={color} className={`chip c-${color}`} />
                  ))}
                </div>
                <input
                  value={names[i] ?? ''}
                  maxLength={12}
                  aria-label={`${i + 1}번 플레이어 이름`}
                  onChange={(e) => {
                    const next = [...names]
                    next[i] = e.target.value
                    setNames(next)
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="field">
          <div className="toggle-row">
            <div>
              <strong style={{ fontSize: 14 }}>보드 자동 회전</strong>
              <p>차례가 된 사람 쪽이 아래로 오도록 보드를 돌립니다.</p>
            </div>
            <button
              type="button"
              className="switch"
              role="switch"
              aria-checked={autoRotate}
              aria-pressed={autoRotate}
              aria-label="보드 자동 회전"
              onClick={() => setAutoRotate(!autoRotate)}
            />
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() =>
            onStart({
              playerCount,
              seatNames: names.map((n, i) => n.trim() || defaultSeatNames(playerCount)[i]),
              autoRotate,
            })
          }
        >
          게임 시작
        </button>
      </div>
    </div>
  )
}
