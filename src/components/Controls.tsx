import { PieceThumb } from './PieceThumb'
import type { Transform } from '../game/pieces'
import type { Color, PieceId } from '../game/types'

interface Props {
  color: Color
  selectedPieceId: PieceId | null
  orientationIndex: number
  canPlace: boolean
  onTransform: (transform: Transform) => void
  onPlace: () => void
  onClear: () => void
}

export function Controls({
  color,
  selectedPieceId,
  orientationIndex,
  canPlace,
  onTransform,
  onPlace,
  onClear,
}: Props) {
  const hasSelection = selectedPieceId !== null

  return (
    <div className="panel">
      <div className="controls">
        <div className="selected-preview">
          {selectedPieceId ? (
            <PieceThumb
              pieceId={selectedPieceId}
              orientationIndex={orientationIndex}
              color={color}
              cellSize={10}
            />
          ) : null}
        </div>

        <button
          type="button"
          className="btn"
          disabled={!hasSelection}
          onClick={() => onTransform('rotate-ccw')}
        >
          ↺ 왼쪽
        </button>
        <button
          type="button"
          className="btn"
          disabled={!hasSelection}
          onClick={() => onTransform('rotate-cw')}
        >
          ↻ 오른쪽
        </button>
        <button
          type="button"
          className="btn"
          disabled={!hasSelection}
          onClick={() => onTransform('flip')}
        >
          ⇋ 뒤집기
        </button>
      </div>

      <div className="controls" style={{ marginTop: 6 }}>
        <button
          type="button"
          className={`btn btn-primary btn-place${canPlace ? ' is-ready' : ''}`}
          disabled={!canPlace}
          onClick={onPlace}
        >
          여기에 놓기
        </button>
        <button type="button" className="btn" disabled={!hasSelection} onClick={onClear}>
          선택 해제
        </button>
      </div>
    </div>
  )
}
