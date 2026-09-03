import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Cell, PieceId } from '../game/types'
import type { GameAction } from './gameReducer'

/** 이만큼 움직여야 탭이 아니라 드래그로 본다 */
const DRAG_THRESHOLD = 6

export interface DragPreview {
  pieceId: PieceId
  x: number
  y: number
}

interface Drag {
  pieceId: PieceId
  pointerId: number
  startX: number
  startY: number
  moved: boolean
}

/**
 * 포인터 아래에 있는 보드 칸을 찾는다.
 * 칸마다 data-row / data-col을 심어 두었기 때문에 보드가 90·180·270도로 돌아가 있어도
 * 좌표를 역변환할 필요 없이 정확한 칸이 나온다.
 */
function cellFromPoint(x: number, y: number): Cell | null {
  const el = document.elementFromPoint(x, y) as HTMLElement | null
  const cellEl = el?.closest<HTMLElement>('[data-row]')
  if (!cellEl?.dataset.row || !cellEl.dataset.col) return null
  return { row: Number(cellEl.dataset.row), col: Number(cellEl.dataset.col) }
}

/**
 * 조각을 끌어다 놓는 조작.
 *
 * 마우스와 터치를 함께 다루려고 포인터 이벤트를 쓴다. 손을 뗀 자리에 미리보기를 남길 뿐
 * 바로 놓지는 않는다 — 확정은 언제나 「여기에 놓기」 한 번을 거친다. 손이 미끄러져 엉뚱한 곳에
 * 놓이는 사고를 막기 위해서다. 놓기 전이면 얼마든지 다시 끌거나 회전해 고칠 수 있다.
 *
 * 리스너는 useEffect가 아니라 잡는 순간 바로 붙인다 — 효과가 커밋될 때까지 기다리면
 * 빠르게 튕기듯 끄는 동작에서 첫 pointermove들을 놓친다.
 */
export function useDragPlacement(dispatch: (action: GameAction) => void, enabled: boolean) {
  const dragRef = useRef<Drag | null>(null)
  const detachRef = useRef<(() => void) | null>(null)
  const [preview, setPreview] = useState<DragPreview | null>(null)

  const endDrag = useCallback(() => {
    dragRef.current = null
    detachRef.current?.()
    detachRef.current = null
    setPreview(null)
  }, [])

  const beginDrag = useCallback(
    (pieceId: PieceId, event: ReactPointerEvent) => {
      if (!enabled) return
      event.preventDefault()
      endDrag()

      dragRef.current = {
        pieceId,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
      }

      function onMove(e: PointerEvent) {
        const drag = dragRef.current
        if (!drag || e.pointerId !== drag.pointerId) return

        if (!drag.moved) {
          if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < DRAG_THRESHOLD) return
          drag.moved = true
        }

        setPreview({ pieceId: drag.pieceId, x: e.clientX, y: e.clientY })
        const cell = cellFromPoint(e.clientX, e.clientY)
        if (cell) dispatch({ type: 'AIM', cell })
      }

      function onUp(e: PointerEvent) {
        const drag = dragRef.current
        if (!drag || e.pointerId !== drag.pointerId) return
        const moved = drag.moved
        endDrag()
        if (!moved) return

        // 보드 밖에서 손을 떼면 마지막으로 조준했던 자리를 그대로 둔다
        const cell = cellFromPoint(e.clientX, e.clientY)
        if (cell) dispatch({ type: 'AIM', cell })
      }

      function onCancel(e: PointerEvent) {
        if (dragRef.current && e.pointerId !== dragRef.current.pointerId) return
        endDrag()
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onCancel)
      detachRef.current = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onCancel)
      }
    },
    [dispatch, enabled, endDrag],
  )

  useEffect(() => endDrag, [endDrag])

  return { preview, beginDrag }
}
