import type { PlayerColor } from '../../types/game'

export const BOARD_SIZE = 52
export const FINAL_STEP = BOARD_SIZE
export const PIECES_PER_PLAYER = 4

export const PLAYER_CONFIG: Array<{ id: number; name: string; color: PlayerColor; startIndex: number }> = [
  { id: 0, name: 'Crimson Captain', color: 'red', startIndex: 0 },
  { id: 1, name: 'Emerald Enforcer', color: 'green', startIndex: 13 },
  { id: 2, name: 'Solar Sprinter', color: 'yellow', startIndex: 26 },
  { id: 3, name: 'Cobalt Challenger', color: 'blue', startIndex: 39 },
]

export const SAFE_CELLS = [0, 8, 13, 21, 26, 34, 39, 47]

