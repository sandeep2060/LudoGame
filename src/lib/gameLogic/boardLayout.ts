// Classic Ludo board layout mapping
// Maps cell index (0-51) to visual position on the board

export interface CellPosition {
  row: number // 0-14 (15 rows total)
  col: number // 0-14 (15 cols total)
  type: 'home' | 'path' | 'center'
  color?: 'red' | 'green' | 'blue' | 'yellow'
}

// Classic Ludo board is 15x15 grid
// Top-left corner home: Red (0,0 to 2,2)
// Top-right corner home: Green (0,12 to 2,14)
// Bottom-left corner home: Blue (12,0 to 14,2)
// Bottom-right corner home: Yellow (12,12 to 14,14)
// Center diamond: (6,6 to 8,8)

export function getCellPosition(index: number): CellPosition | null {
  if (index < 0 || index >= 52) return null

  // Red path: indices 0-5 (top horizontal, left to right)
  if (index < 6) {
    return {
      row: 1,
      col: 3 + index,
      type: 'path',
      color: 'red',
    }
  }

  // Green path: indices 6-11 (right vertical, top to bottom)
  if (index < 12) {
    return {
      row: 3 + (index - 6),
      col: 11,
      type: 'path',
      color: 'green',
    }
  }

  // Yellow path: indices 12-17 (bottom horizontal, right to left)
  if (index < 18) {
    return {
      row: 11,
      col: 11 - (index - 12),
      type: 'path',
      color: 'yellow',
    }
  }

  // Blue path: indices 18-23 (left vertical, bottom to top)
  if (index < 24) {
    return {
      row: 11 - (index - 18),
      col: 3,
      type: 'path',
      color: 'blue',
    }
  }

  // Additional cells for full 52-cell board
  // Continue the path pattern
  if (index < 30) {
    return {
      row: 1,
      col: 9 + (index - 24),
      type: 'path',
    }
  }

  if (index < 36) {
    return {
      row: 3 + (index - 30),
      col: 13,
      type: 'path',
    }
  }

  if (index < 42) {
    return {
      row: 11,
      col: 5 - (index - 36),
      type: 'path',
    }
  }

  if (index < 48) {
    return {
      row: 11 - (index - 42),
      col: 1,
      type: 'path',
    }
  }

  // Last 4 cells
  return {
    row: 1,
    col: 1 + (index - 48),
    type: 'path',
  }
}

// Get all cells that should be displayed on the board
export function getAllBoardCells(): Array<{ index: number; position: CellPosition }> {
  const cells: Array<{ index: number; position: CellPosition }> = []
  for (let i = 0; i < 52; i++) {
    const pos = getCellPosition(i)
    if (pos) {
      cells.push({ index: i, position: pos })
    }
  }
  return cells
}

