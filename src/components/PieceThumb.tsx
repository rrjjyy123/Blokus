import { getOrientation } from '../game/pieces'
import type { Color, PieceId } from '../game/types'

interface Props {
  pieceId: PieceId
  orientationIndex?: number
  color: Color
  /** 한 칸의 픽셀 크기 */
  cellSize?: number
}

/** 조각 하나를 작은 격자로 그린다. 트레이 썸네일과 선택 미리보기에 함께 쓴다. */
export function PieceThumb({ pieceId, orientationIndex = 0, color, cellSize = 9 }: Props) {
  const o = getOrientation(pieceId, orientationIndex)
  const filled = new Set(o.cells.map((c) => `${c.row},${c.col}`))

  return (
    <div
      className={`thumb c-${color}`}
      style={{
        gridTemplateColumns: `repeat(${o.width}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${o.height}, ${cellSize}px)`,
      }}
    >
      {Array.from({ length: o.height * o.width }, (_, i) => {
        const row = Math.floor(i / o.width)
        const col = i % o.width
        return filled.has(`${row},${col}`) ? (
          <div key={i} className="sq" />
        ) : (
          <div key={i} />
        )
      })}
    </div>
  )
}
