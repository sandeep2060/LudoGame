export type GameStatus = 'waiting' | 'playing' | 'finished'

export interface Piece {
  id: string
  position: number | null
  steps: number
  isFinished: boolean
}

export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue'

export interface Player {
  id: number
  name: string
  color: PlayerColor
  startIndex: number
  pieces: Piece[]
}

export interface BoardToken {
  playerId: number
  pieceId: string
  color: PlayerColor
}

export interface BoardPosition {
  index: number
  tokens: BoardToken[]
  isSafe: boolean
}

export interface GameState {
  players: Player[]
  currentPlayer: number
  diceValue: number | null
  board: BoardPosition[]
  gameStatus: GameStatus
  turnCount: number
  winner: number | null
}

