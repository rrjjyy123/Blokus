import type { PointerEvent as ReactPointerEvent } from 'react'
import { PIECE_ORDER, squaresOf } from '../game/pieces'
import { PieceThumb } from './PieceThumb'
import type { Color, ColorState, PieceId } from '../game/types'

interface Props {
  color: Color
  colorState: ColorState
  selectedPieceId: PieceId | null
  orientationIndex: number
  onSelect: (pieceId: PieceId) => void
  /** 조각을 집어 드래그를 시작할 때 */
  onPickUp: (pieceId: PieceId, event: ReactPointerEvent) => void
}

/** 현재 차례인 색이 아직 들고 있는 조각들 */
export function PieceTray({
  color,
  colorState,
  selectedPieceId,
  orientationIndex,
  onSelect,
  onPickUp,
}: Props) {
  const remaining = new Set(colorState.remaining)

  return (
    <div className="panel">
      <div className="tray-head">
        <h3>내 조각</h3>
        <span className="tray-count">
          {colorState.remaining.length}개 · {squaresOf(colorState.remaining)}칸
        </span>
      </div>
      <div className="tray">
        {PIECE_ORDER.map((pieceId) => {
          const available = remaining.has(pieceId)
          const selected = selectedPieceId === pieceId
          return (
            <button
              key={pieceId}
              type="button"
              className="tray-item"
              aria-pressed={selected}
              aria-label={pieceId}
              disabled={!available}
              onPointerDown={(e) => available && onPickUp(pieceId, e)}
              onClick={() => onSelect(pieceId)}
            >
              <PieceThumb
                pieceId={pieceId}
                orientationIndex={selected ? orientationIndex : 0}
                color={color}
                cellSize={7}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
