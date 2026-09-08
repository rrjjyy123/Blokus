import { useEffect, useRef, useState } from 'react'
import { COLOR_LABELS } from '../game/variants'
import { currentColor, currentColorState, currentSeat } from '../state/gameReducer'
import type { GameAction } from '../state/gameReducer'
import { useDragPlacement } from '../state/useDragPlacement'
import { Board } from './Board'
import { Controls } from './Controls'
import { GameOverModal } from './GameOverModal'
import { PieceThumb } from './PieceThumb'
import { PieceTray } from './PieceTray'
import { RulesModal } from './RulesModal'
import { ScorePanel } from './ScorePanel'
import { TurnBanner } from './TurnBanner'
import type { GameState } from '../game/types'

interface Props {
  state: GameState
  dispatch: (action: GameAction) => void
  onNewSetup: () => void
}

export function GameScreen({ state, dispatch, onNewSetup }: Props) {
  const [showRules, setShowRules] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const boardRef = useRef<HTMLDivElement | null>(null)

  const color = currentColor(state)
  const colorState = currentColorState(state)
  const seat = currentSeat(state)
  const rotation = state.config.autoRotate ? seat.rotation : 0

  const { preview, beginDrag } = useDragPlacement(dispatch, state.phase === 'playing')

  // 끌고 다니는 조각을 보드 칸과 같은 크기로 그리기 위해 실제 칸 크기를 잰다
  const boardCellSize = boardRef.current
    ? boardRef.current.getBoundingClientRect().width / state.boardSize
    : 16

  // 키보드 보조: 방향키로 미세 이동, R/F로 회전·뒤집기, Enter로 놓기
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (state.phase !== 'playing') return
      const target = e.target as HTMLElement | null
      if (target?.tagName === 'INPUT') return

      const nudges: Record<string, [number, number]> = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
      }
      if (nudges[e.key]) {
        e.preventDefault()
        dispatch({ type: 'NUDGE', dRow: nudges[e.key][0], dCol: nudges[e.key][1] })
        return
      }
      if (e.key === 'r' || e.key === 'R') dispatch({ type: 'TRANSFORM', transform: 'rotate-cw' })
      if (e.key === 'e' || e.key === 'E') dispatch({ type: 'TRANSFORM', transform: 'rotate-ccw' })
      if (e.key === 'f' || e.key === 'F') dispatch({ type: 'TRANSFORM', transform: 'flip' })
      if (e.key === 'Enter') dispatch({ type: 'PLACE' })
      if (e.key === 'Escape') dispatch({ type: 'CLEAR_SELECTION' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state.phase, dispatch])

  return (
    <div
      className={`game${preview ? ' is-dragging' : ''}${
        state.selectedPieceId ? ' is-armed' : ''
      }`}
    >
      <div className="game-main">
        <TurnBanner state={state} color={color} seat={seat} />

        {state.lastPassed.length > 0 ? (
          <div className="pass-note">
            {state.lastPassed.map((c) => COLOR_LABELS[c]).join(', ')} — 놓을 수 있는 자리가 없어
            차례를 넘겼어요.
          </div>
        ) : null}

        <Board
          state={state}
          rotation={rotation}
          boardRef={boardRef}
          onCellTap={(cell) => dispatch({ type: 'AIM', cell })}
          onCellPointerDown={(cell, event) => {
            if (!state.selectedPieceId) return
            dispatch({ type: 'AIM', cell })
            beginDrag(state.selectedPieceId, event)
          }}
        />
      </div>

      <div className="game-side">
        <div className="side-head">
          <button type="button" className="btn" onClick={() => setShowRules(true)}>
            규칙 보기
          </button>
          <button type="button" className="btn" onClick={onNewSetup}>
            새 게임
          </button>
        </div>

        <Controls
          color={color}
          selectedPieceId={state.selectedPieceId}
          orientationIndex={state.orientationIndex}
          canPlace={Boolean(state.ghost?.result.ok)}
          onTransform={(transform) => dispatch({ type: 'TRANSFORM', transform })}
          onPlace={() => dispatch({ type: 'PLACE' })}
          onClear={() => dispatch({ type: 'CLEAR_SELECTION' })}
        />

        <PieceTray
          color={color}
          colorState={colorState}
          selectedPieceId={state.selectedPieceId}
          orientationIndex={state.orientationIndex}
          onSelect={(pieceId) => dispatch({ type: 'SELECT_PIECE', pieceId })}
          onPickUp={(pieceId, event) => {
            dispatch({ type: 'SELECT_PIECE', pieceId })
            beginDrag(pieceId, event)
          }}
        />

        <ScorePanel state={state} />

        <button type="button" className="btn btn-end" onClick={() => setConfirmEnd(true)}>
          여기까지 하고 점수 내기
        </button>
      </div>

      {/* 끌고 다니는 동안 손끝을 따라다니는 조각. 보드와 같은 각도로 돌려 둔다 */}
      {preview ? (
        <div
          className="drag-preview"
          style={{
            left: preview.x,
            top: preview.y,
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          }}
        >
          <PieceThumb
            pieceId={preview.pieceId}
            orientationIndex={state.orientationIndex}
            color={color}
            cellSize={boardCellSize}
          />
        </div>
      ) : null}

      {showRules ? <RulesModal onClose={() => setShowRules(false)} /> : null}

      {confirmEnd ? (
        <div className="overlay" onClick={() => setConfirmEnd(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <h2>여기까지 하고 끝낼까요?</h2>
            <p>
              지금 보드에 놓인 조각으로 점수를 계산합니다. 손에 남은 조각은 그대로 감점되고, 21개를
              다 놓지 못한 사람은 완주 보너스를 받지 못합니다.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  dispatch({ type: 'END_NOW' })
                  setConfirmEnd(false)
                }}
              >
                끝내고 점수 보기
              </button>
              <button
                type="button"
                className="btn"
                style={{ flex: 1 }}
                onClick={() => setConfirmEnd(false)}
              >
                계속하기
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {state.phase === 'over' ? (
        <GameOverModal
          state={state}
          onRestart={() => dispatch({ type: 'RESTART' })}
          onNewSetup={onNewSetup}
        />
      ) : null}
    </div>
  )
}
