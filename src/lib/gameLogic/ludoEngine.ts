import { BOARD_SIZE, FINAL_STEP, PLAYER_CONFIG, SAFE_CELLS, PIECES_PER_PLAYER } from './constants'
import type { GameState, Player, Piece, BoardPosition } from '../../types/game'

const clonePlayers = (players: Player[]): Player[] =>
  players.map((player) => ({
    ...player,
    pieces: player.pieces.map((piece) => ({ ...piece })),
  }))

const buildBoard = (players: Player[]): BoardPosition[] => {
  const board: BoardPosition[] = Array.from({ length: BOARD_SIZE }, (_, index) => ({
    index,
    tokens: [],
    isSafe: SAFE_CELLS.includes(index),
  }))

  players.forEach((player) => {
    player.pieces.forEach((piece) => {
      if (piece.position === null || piece.isFinished) {
        return
      }
      board[piece.position].tokens.push({
        playerId: player.id,
        pieceId: piece.id,
        color: player.color,
      })
    })
  })

  return board
}

const generatePieces = (playerId: number): Piece[] =>
  Array.from({ length: PIECES_PER_PLAYER }, (_, index) => ({
    id: `${playerId}-${index}`,
    position: null,
    steps: 0,
    isFinished: false,
  }))

export const createInitialGameState = (): GameState => {
  const players: Player[] = PLAYER_CONFIG.map((config) => ({
    ...config,
    pieces: generatePieces(config.id),
  }))

  return {
    players,
    currentPlayer: 0,
    diceValue: null,
    board: buildBoard(players),
    gameStatus: 'waiting',
    turnCount: 1,
    winner: null,
  }
}

const findPiece = (players: Player[], pieceId: string): { player: Player; piece: Piece } | null => {
  for (const player of players) {
    const piece = player.pieces.find((token) => token.id === pieceId)
    if (piece) {
      return { player, piece }
    }
  }
  return null
}

const handleCaptures = (players: Player[], movingPlayer: Player, landingPosition: number) => {
  if (SAFE_CELLS.includes(landingPosition)) {
    return
  }

  players.forEach((player) => {
    if (player.id === movingPlayer.id) {
      return
    }

    player.pieces.forEach((piece) => {
      if (piece.position === landingPosition && !piece.isFinished) {
        piece.position = null
        piece.steps = 0
      }
    })
  })
}

const allPiecesFinished = (player: Player): boolean => player.pieces.every((piece) => piece.isFinished)

const nextPlayerIndex = (current: number): number => (current + 1) % PLAYER_CONFIG.length

export class LudoEngine {
  static rollDice(): number {
    return Math.floor(Math.random() * 6) + 1
  }

  static canMovePiece(player: Player, piece: Piece, diceRoll: number | null): boolean {
    if (!diceRoll) {
      return false
    }

    if (piece.isFinished) {
      return false
    }

    if (piece.position === null && diceRoll !== 6) {
      return false
    }

    if (piece.position !== null && piece.steps + diceRoll > FINAL_STEP) {
      return false
    }

    return true
  }

  static getMovablePieces(gameState: GameState, playerIndex: number): string[] {
    const player = gameState.players[playerIndex]
    if (!player) {
      return []
    }
    return player.pieces
      .filter((piece) => LudoEngine.canMovePiece(player, piece, gameState.diceValue))
      .map((piece) => piece.id)
  }

  static movePiece(gameState: GameState, pieceId: string): GameState {
    if (!gameState.diceValue || gameState.gameStatus === 'finished') {
      return gameState
    }

    const players = clonePlayers(gameState.players)
    const found = findPiece(players, pieceId)

    if (!found) {
      return gameState
    }

    const { player, piece } = found

    if (player.id !== gameState.currentPlayer) {
      return gameState
    }

    const diceRoll = gameState.diceValue

    if (!LudoEngine.canMovePiece(player, piece, diceRoll)) {
      return gameState
    }

    const nextState: GameState = {
      ...gameState,
      players,
    }

    if (piece.position === null) {
      // leave the yard
      piece.position = player.startIndex
      piece.steps = 1
    } else {
      piece.steps += diceRoll
      if (piece.steps >= FINAL_STEP) {
        piece.isFinished = true
        piece.position = null
      } else {
        piece.position = (piece.position + diceRoll) % BOARD_SIZE
      }
    }

    if (piece.steps === FINAL_STEP) {
      piece.isFinished = true
      piece.position = null
    }

    if (!piece.isFinished && piece.position !== null) {
      handleCaptures(players, player, piece.position)
    }

    nextState.board = buildBoard(players)

    let winner = gameState.winner
    if (allPiecesFinished(player)) {
      winner = player.id
      nextState.gameStatus = 'finished'
    }

    const earnedExtraTurn = diceRoll === 6 && !piece.isFinished

    nextState.diceValue = null
    nextState.turnCount = gameState.turnCount + 1
    nextState.currentPlayer = earnedExtraTurn ? player.id : nextPlayerIndex(player.id)
    nextState.winner = winner

    return nextState
  }

  static advanceTurn(gameState: GameState): GameState {
    const players = clonePlayers(gameState.players)
    return {
      ...gameState,
      players,
      currentPlayer: nextPlayerIndex(gameState.currentPlayer),
      diceValue: null,
      board: buildBoard(players),
      turnCount: gameState.turnCount + 1,
    }
  }

  static getValidMovePositions(gameState: GameState, pieceId: string): number[] {
    if (!gameState.diceValue) {
      return []
    }

    const found = findPiece(gameState.players, pieceId)
    if (!found) {
      return []
    }

    const { player, piece } = found

    if (player.id !== gameState.currentPlayer) {
      return []
    }

    if (!LudoEngine.canMovePiece(player, piece, gameState.diceValue)) {
      return []
    }

    const diceRoll = gameState.diceValue
    const validPositions: number[] = []

    if (piece.position === null) {
      // Can move from yard to start position
      validPositions.push(player.startIndex)
    } else {
      // Calculate next position after move
      const nextSteps = piece.steps + diceRoll
      if (nextSteps <= FINAL_STEP) {
        const nextPosition = (piece.position + diceRoll) % BOARD_SIZE
        validPositions.push(nextPosition)
      }
    }

    return validPositions
  }
}

