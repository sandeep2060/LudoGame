import { useMemo, useState } from 'react'
import type { GameState } from '../../types/game'
import { createInitialGameState, LudoEngine } from '../../lib/gameLogic/ludoEngine'
import { ClassicLudoBoard } from '../ClassicLudoBoard/ClassicLudoBoard'
import { PlayerArea } from '../PlayerArea/PlayerArea'
import { GameControls } from '../GameControls/GameControls'
import { Betting } from '../Betting/Betting'
import { SoundManager } from '../../lib/sounds'
import type { UserProfile, GameBet } from '../../types/user'

type LudoGameProps = {
  currentUser?: UserProfile
}

export function LudoGame({ currentUser }: LudoGameProps) {
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState())
  const [statusText, setStatusText] = useState('Roll the dice to begin the match.')
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null)
  const [gameBets, setGameBets] = useState<GameBet[]>([])
  const [isDiceRolling, setIsDiceRolling] = useState(false)
  const gameId = useMemo(() => `game-${Date.now()}`, [])

  const movablePieceIds = useMemo(
    () => LudoEngine.getMovablePieces(gameState, gameState.currentPlayer),
    [gameState],
  )

  const handleRollDice = () => {
    if (isDiceRolling) return
    setIsDiceRolling(true)
    SoundManager.playDiceRoll()
    
    // Simulate dice rolling animation
    setTimeout(() => {
      let nextStatus = ''
      setSelectedPieceId(null) // Clear selection when rolling dice
      setGameState((previous) => {
      if (previous.gameStatus === 'finished') {
        nextStatus = 'Match finished. Reset to play another round.'
        return previous
      }

      if (previous.diceValue) {
        nextStatus = 'Select a piece to move.'
        return previous
      }

      const dice = LudoEngine.rollDice()
      const updated: GameState = { ...previous, diceValue: dice, gameStatus: 'playing' }
      const movable = LudoEngine.getMovablePieces(updated, updated.currentPlayer)

      if (movable.length === 0) {
        nextStatus = `${previous.players[previous.currentPlayer].name} rolled a ${dice} but has no valid moves. Passing turn.`
        const advanced = LudoEngine.advanceTurn({ ...updated, diceValue: null })
        nextStatus += ` ${advanced.players[advanced.currentPlayer].name}, you're up!`
        return advanced
      }

      nextStatus = `${previous.players[previous.currentPlayer].name} rolled a ${dice}. Pick a highlighted piece.`
      return updated
    })

    if (nextStatus) {
      setStatusText(nextStatus)
    }
    setIsDiceRolling(false)
    }, 1000) // 1 second rolling animation
  }

  const handleSelectPiece = (pieceId: string) => {
    if (!gameState.diceValue) {
      setStatusText('Roll the dice first.')
      return
    }

    const movable = LudoEngine.getMovablePieces(gameState, gameState.currentPlayer)
    if (!movable.includes(pieceId)) {
      setStatusText('Choose a highlighted piece.')
      return
    }

    // Toggle selection - if already selected, deselect
    if (selectedPieceId === pieceId) {
      setSelectedPieceId(null)
      setStatusText(`${gameState.players[gameState.currentPlayer].name}, select a piece to move.`)
      return
    }

    setSelectedPieceId(pieceId)
    const validPositions = LudoEngine.getValidMovePositions(gameState, pieceId)
    if (validPositions.length > 0) {
      setStatusText('Click on a highlighted cell to move, or click the piece again to cancel.')
    }
  }

  const handleMovePiece = (pieceId: string, targetPosition?: number) => {
    let nextStatus = ''
    setGameState((previous) => {
      if (!previous.diceValue) {
        nextStatus = 'Roll the dice first.'
        return previous
      }

      const movable = LudoEngine.getMovablePieces(previous, previous.currentPlayer)
      if (!movable.includes(pieceId)) {
        nextStatus = 'Choose a highlighted piece.'
        return previous
      }

      // If targetPosition is provided and valid, verify it matches the move
      if (targetPosition !== undefined) {
        const validPositions = LudoEngine.getValidMovePositions(previous, pieceId)
        if (!validPositions.includes(targetPosition)) {
          nextStatus = 'Invalid move position.'
          return previous
        }
      }

      const updated = LudoEngine.movePiece(previous, pieceId)
      setSelectedPieceId(null) // Clear selection after move

      // Check for capture
      const captured = updated.board.some((cell) => 
        cell.tokens.some((token) => 
          token.playerId !== previous.currentPlayer && 
          cell.tokens.length > 1
        )
      )
      if (captured) {
        SoundManager.playCapture()
      } else {
        SoundManager.playPieceMove()
      }

      if (updated.gameStatus === 'finished' && updated.winner !== null) {
        const winner = updated.players.find((player) => player.id === updated.winner)
        SoundManager.playWin()
        nextStatus = winner ? `${winner.name} wins the match!` : 'Match completed.'
      } else if (updated.currentPlayer === previous.currentPlayer) {
        nextStatus = `${updated.players[updated.currentPlayer].name} earned an extra turn. Roll again!`
      } else {
        nextStatus = `${updated.players[updated.currentPlayer].name}, roll the dice.`
      }

      return updated
    })

    if (nextStatus) {
      setStatusText(nextStatus)
    }
  }

  const handleReset = () => {
    setGameState(createInitialGameState())
    setSelectedPieceId(null)
    setStatusText('New match ready. Roll to start!')
  }

  const handleBetPlaced = (bet: GameBet) => {
    setGameBets([...gameBets, bet])
  }

  const currentPlayer = gameState.players[gameState.currentPlayer]
  const canRoll = gameState.gameStatus !== 'finished' && gameState.diceValue === null

  const playersForBetting = gameState.players.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
  }))

  return (
    <div className="ludo-layout">
      {currentUser && gameState.gameStatus === 'waiting' && (
        <Betting
          currentUser={currentUser}
          gameId={gameId}
          players={playersForBetting}
          onBetPlaced={handleBetPlaced}
        />
      )}
      <ClassicLudoBoard
        gameState={gameState}
        movablePieceIds={movablePieceIds}
        selectedPieceId={selectedPieceId}
        onSelectPiece={handleSelectPiece}
        onMovePiece={handleMovePiece}
        currentPlayerIndex={gameState.currentPlayer}
        onRollDice={handleRollDice}
        diceValue={gameState.diceValue}
        isRolling={isDiceRolling}
      />

        <aside className="ludo-sidebar">
          <div className="players-column">
            {gameState.players.map((player) => (
              <PlayerArea
                key={player.id}
                player={player}
                isActive={player.id === gameState.currentPlayer}
                movablePieceIds={movablePieceIds}
                selectedPieceId={selectedPieceId}
                onSelectPiece={handleSelectPiece}
                onMovePiece={handleMovePiece}
                diceValue={gameState.diceValue}
              />
            ))}
          </div>

          <GameControls
            currentPlayer={currentPlayer}
            diceValue={null}
            onRollDice={() => {}}
            canRoll={false}
            onReset={handleReset}
            statusText={statusText}
            isFinished={gameState.gameStatus === 'finished'}
          />
        </aside>
    </div>
  )
}
