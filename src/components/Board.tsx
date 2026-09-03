import { useMemo } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import { idx } from '../game/rules'
import { CORNERS } from '../game/variants'
import type { Cell, Color, GameState } from '../game/types'

interface Props {
  state: GameState
  /** 보드를 몇 도 돌려서 보여줄지 (0 | 90 | 180 | 270) */
  rotation: number
  onCellTap: (cell: Cell) => void
  /** 이 칸에서 드래그가 시작될 때 */
  onCellPointerDown: (cell: Cell, event: ReactPointerEvent) => void
  boardRef?: RefObject<HTMLDivElement | null>
}

/**
 * 20×20 보드.
 * 회전은 래퍼에 transform만 걸고 좌표 역변환은 하지 않는다 —
 * 각 칸이 자기 좌표를 들고 있어서 몇 도로 돌아가 있든 탭 결과가 정확하다.
 */
export function Board({ state, rotation, onCellTap, onCellPointerDown, boardRef }: Props) {
  const size = state.boardSize

  const ghostCells = useMemo(() => {
    if (!state.ghost) return new Map<number, boolean>()
    const ok = state.ghost.result.ok
    const map = new Map<number, boolean>()
    for (const c of state.ghost.cells) {
      if (c.row < 0 || c.col < 0 || c.row >= size || c.col >= size) continue
      map.set(idx(c.row, c.col, size), ok)
    }
    return map
  }, [state.ghost, size])

  const startCells = useMemo(() => {
    const map = new Map<number, Color>()
    for (const color of state.colorOrder) {
      const corner = CORNERS[color]
      map.set(idx(corner.row, corner.col, size), color)
    }
    return map
  }, [state.colorOrder, size])

  const ghostColor = state.colorOrder[state.turnIndex]

  return (
    <div className="board-wrap">
      <div className="board-rotor" style={{ transform: `rotate(${rotation}deg)` }}>
        <div
          ref={boardRef}
          className="board"
          style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
        >
          {Array.from({ length: size * size }, (_, i) => {
            const row = Math.floor(i / size)
            const col = i % size
            const filled = state.board[i]
            const ghost = ghostCells.get(i)
            const start = startCells.get(i)

            const classes = ['cell']
            let colorClass = ''

            if (filled) {
              classes.push('is-filled')
              colorClass = `c-${filled}`
            } else if (ghost !== undefined) {
              classes.push(ghost ? 'is-ghost-ok' : 'is-ghost-bad')
              colorClass = `c-${ghostColor}`
            } else if (start) {
              classes.push('is-start')
              colorClass = `c-${start}`
            }

            return (
              <button
                key={i}
                type="button"
                className={`${classes.join(' ')} ${colorClass}`}
                aria-label={`${row + 1}행 ${col + 1}열`}
                data-row={row}
                data-col={col}
                onPointerDown={(e) => onCellPointerDown({ row, col }, e)}
                onClick={() => onCellTap({ row, col })}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
