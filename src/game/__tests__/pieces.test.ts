import { describe, expect, it } from 'vitest'
import { PIECES, PIECE_ORDER, TOTAL_SQUARES, squaresOf } from '../pieces'
import type { PieceId } from '../types'

describe('조각 구성', () => {
  it('21종이다', () => {
    expect(PIECE_ORDER).toHaveLength(21)
    expect(new Set(PIECE_ORDER).size).toBe(21)
  })

  it('칸 수별 개수가 실물과 같다 (1/1/2/5/12)', () => {
    const bySize = new Map<number, number>()
    for (const id of PIECE_ORDER) {
      bySize.set(PIECES[id].size, (bySize.get(PIECES[id].size) ?? 0) + 1)
    }
    expect(bySize.get(1)).toBe(1)
    expect(bySize.get(2)).toBe(1)
    expect(bySize.get(3)).toBe(2)
    expect(bySize.get(4)).toBe(5)
    expect(bySize.get(5)).toBe(12)
  })

  it('색당 총 89칸이다', () => {
    expect(TOTAL_SQUARES).toBe(89)
    expect(squaresOf(PIECE_ORDER)).toBe(89)
  })

  it('조각별 방향 수가 기대치와 같고 총합이 91이다', () => {
    const expected: Record<PieceId, number> = {
      I1: 1, I2: 2, I3: 2, V3: 4,
      I4: 2, L4: 8, S4: 4, T4: 4, O4: 1,
      F: 8, I5: 2, L5: 8, N: 8, P: 8, T5: 4,
      U: 4, V5: 4, W: 4, X: 1, Y: 8, Z: 4,
    }
    for (const id of PIECE_ORDER) {
      expect(`${id}:${PIECES[id].orientations.length}`).toBe(`${id}:${expected[id]}`)
    }
    const total = PIECE_ORDER.reduce((sum, id) => sum + PIECES[id].orientations.length, 0)
    expect(total).toBe(91)
  })

  it('모든 방향이 (0,0) 기준으로 정규화되어 있고 칸 수가 보존된다', () => {
    for (const id of PIECE_ORDER) {
      for (const o of PIECES[id].orientations) {
        expect(o.cells).toHaveLength(PIECES[id].size)
        expect(Math.min(...o.cells.map((c) => c.row))).toBe(0)
        expect(Math.min(...o.cells.map((c) => c.col))).toBe(0)
        expect(o.height).toBe(Math.max(...o.cells.map((c) => c.row)) + 1)
        expect(o.width).toBe(Math.max(...o.cells.map((c) => c.col)) + 1)
      }
    }
  })

  it('모든 조각이 상하좌우로 이어진 한 덩어리다', () => {
    for (const id of PIECE_ORDER) {
      for (const o of PIECES[id].orientations) {
        const keys = new Set(o.cells.map((c) => `${c.row},${c.col}`))
        const stack = [o.cells[0]]
        const seen = new Set<string>([`${o.cells[0].row},${o.cells[0].col}`])
        while (stack.length) {
          const cur = stack.pop()!
          for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const key = `${cur.row + dr},${cur.col + dc}`
            if (keys.has(key) && !seen.has(key)) {
              seen.add(key)
              const [row, col] = key.split(',').map(Number)
              stack.push({ row, col })
            }
          }
        }
        expect(seen.size).toBe(o.cells.length)
      }
    }
  })
})
