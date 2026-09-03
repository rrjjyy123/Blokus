import type { Cell, Color, GameConfig, PlayerCount, Seat } from './types'

export const BOARD_SIZE = 20

/** 턴 순서. 실물 게임과 같은 시계방향 순환 */
export const TURN_ORDER: Color[] = ['blue', 'yellow', 'red', 'green']

/** 각 색의 시작 코너 */
export const CORNERS: Record<Color, Cell> = {
  blue: { row: 0, col: 0 },
  yellow: { row: 0, col: BOARD_SIZE - 1 },
  red: { row: BOARD_SIZE - 1, col: BOARD_SIZE - 1 },
  green: { row: BOARD_SIZE - 1, col: 0 },
}

export const COLOR_LABELS: Record<Color, string> = {
  blue: '파랑',
  yellow: '노랑',
  red: '빨강',
  green: '초록',
}

/**
 * 보드를 몇 도 돌려야 그 색의 코너가 화면 왼쪽 아래(= 플레이어 앞)로 오는가.
 * CSS rotate는 시계방향이므로 좌상단은 90도마다 TL→TR→BR→BL 로 이동한다.
 */
const COLOR_ROTATION: Record<Color, number> = {
  blue: 270,
  yellow: 180,
  red: 90,
  green: 0,
}

/** 인원수별로 실제 사용하는 색 */
export function colorsForPlayerCount(count: PlayerCount): Color[] {
  if (count === 4) return [...TURN_ORDER]
  // 3인: 초록을 아예 쓰지 않는다
  if (count === 3) return ['blue', 'yellow', 'red']
  // 2인: 네 색을 모두 쓰되 한 사람이 대각 두 색을 맡는다
  return [...TURN_ORDER]
}

export function defaultSeatNames(count: PlayerCount): string[] {
  if (count === 2) return ['플레이어 1', '플레이어 2']
  return colorsForPlayerCount(count).map((c) => COLOR_LABELS[c])
}

/**
 * 좌석 구성.
 * 4인·3인은 한 사람이 한 색, 2인은 한 사람이 대각 두 색(파랑+빨강 / 노랑+초록)을 맡는다.
 */
export function createSeats(config: GameConfig): Seat[] {
  const { playerCount, seatNames } = config

  if (playerCount === 2) {
    // 마주 보고 앉으므로 두 좌석의 회전은 180도 차이
    return [
      { index: 0, name: seatNames[0], colors: ['blue', 'red'], rotation: 0 },
      { index: 1, name: seatNames[1], colors: ['yellow', 'green'], rotation: 180 },
    ]
  }

  return colorsForPlayerCount(playerCount).map((color, index) => ({
    index,
    name: seatNames[index],
    colors: [color],
    rotation: COLOR_ROTATION[color],
  }))
}

/** 색 → 좌석 인덱스 */
export function seatIndexOfColor(seats: Seat[], color: Color): number {
  return seats.findIndex((seat) => seat.colors.includes(color))
}
