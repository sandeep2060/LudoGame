import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { createInitialGameState, LudoEngine } from '../../lib/gameLogic/ludoEngine'
import type { GameState } from '../../types/game'
import type { GameRoom, RoomPlayer } from '../../types/room'
import { LudoBoard3D } from '../LudoBoard3D/LudoBoard3D'
import { LudoBoard } from '../LudoBoard/LudoBoard'
import { PlayerArea } from '../PlayerArea/PlayerArea'
import { GameControls } from '../GameControls/GameControls'
import { Chat } from '../Chat/Chat'
import type { UserProfile } from '../../types/user'

type MultiplayerGameProps = {
  currentUser: UserProfile
  room: GameRoom
  onLeaveGame: () => void
}

export function MultiplayerGame({ currentUser, room, onLeaveGame }: MultiplayerGameProps) {
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState())
  const [statusText, setStatusText] = useState('Waiting for game to start...')
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null)
  const [view3D, setView3D] = useState(true)
  const [players, setPlayers] = useState<RoomPlayer[]>([])

  useEffect(() => {
    loadGameState()
    subscribeToGameState()
    loadPlayers()
  }, [room.id])

  const loadGameState = async () => {
    if (!supabase || !room.game_state) return
    try {
      const state = JSON.parse(room.game_state) as GameState
      setGameState(state)
    } catch (error) {
      console.error('Error loading game state:', error)
    }
  }

  const loadPlayers = async () => {
    if (!supabase) return
    try {
      const { data } = await supabase
        .from('room_players')
        .select('*, user:user_profiles(*)')
        .eq('room_id', room.id)
        .order('player_index', { ascending: true })

      if (data) {
        setPlayers(data)
      }
    } catch (error) {
      console.error('Error loading players:', error)
    }
  }

  const subscribeToGameState = () => {
    if (!supabase) return

    const channel = supabase
      .channel(`game-state:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          const updatedRoom = payload.new as GameRoom
          if (updatedRoom.game_state) {
            try {
              const state = JSON.parse(updatedRoom.game_state) as GameState
              setGameState(state)
            } catch (error) {
              console.error('Error parsing game state:', error)
            }
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const updateGameState = async (newState: GameState) => {
    if (!supabase) return
    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({ game_state: JSON.stringify(newState) })
        .eq('id', room.id)

      if (error) throw error
    } catch (error) {
      console.error('Error updating game state:', error)
    }
  }

  const handleRollDice = async () => {
    let nextStatus = ''
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
        updateGameState(advanced)
        return advanced
      }

      nextStatus = `${previous.players[previous.currentPlayer].name} rolled a ${dice}. Pick a highlighted piece.`
      updateGameState(updated)
      return updated
    })

    if (nextStatus) {
      setStatusText(nextStatus)
    }
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

  const handleMovePiece = async (pieceId: string, targetPosition?: number) => {
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

      const updated = LudoEngine.movePiece(previous, pieceId)
      setSelectedPieceId(null)

      if (updated.gameStatus === 'finished' && updated.winner !== null) {
        const winner = updated.players.find((player) => player.id === updated.winner)
        nextStatus = winner ? `${winner.name} wins the match!` : 'Match completed.'
      } else if (updated.currentPlayer === previous.currentPlayer) {
        nextStatus = `${updated.players[updated.currentPlayer].name} earned an extra turn. Roll again!`
      } else {
        nextStatus = `${updated.players[updated.currentPlayer].name}, roll the dice.`
      }

      updateGameState(updated)
      return updated
    })

    if (nextStatus) {
      setStatusText(nextStatus)
    }
  }

  const handleReset = async () => {
    const newState = createInitialGameState()
    setGameState(newState)
    setSelectedPieceId(null)
    setStatusText('New match ready. Roll to start!')
    await updateGameState(newState)
  }

  const movablePieceIds = useMemo(
    () => LudoEngine.getMovablePieces(gameState, gameState.currentPlayer),
    [gameState],
  )

  const currentPlayer = gameState.players[gameState.currentPlayer]
  const canRoll = gameState.gameStatus !== 'finished' && gameState.diceValue === null
  const isMyTurn = currentPlayer.id === players.find((p) => p.user_id === currentUser.id)?.player_index

  return (
    <div className="multiplayer-game">
      <div className="game-header">
        <h2>🎮 {room.name}</h2>
        <div className="game-info">
          <span>Turn: {currentPlayer.name}</span>
          {isMyTurn && <span className="your-turn">Your Turn!</span>}
        </div>
        <button type="button" className="ghost-btn" onClick={onLeaveGame}>
          Leave Game
        </button>
      </div>

      <div className="ludo-layout">
        <div className="view-toggle">
          <button
            type="button"
            className={`toggle-btn ${!view3D ? 'active' : ''}`}
            onClick={() => setView3D(false)}
          >
            2D View
          </button>
          <button
            type="button"
            className={`toggle-btn ${view3D ? 'active' : ''}`}
            onClick={() => setView3D(true)}
          >
            3D View
          </button>
        </div>

        {view3D ? (
          <LudoBoard3D
            gameState={gameState}
            movablePieceIds={movablePieceIds}
            selectedPieceId={selectedPieceId}
            onSelectPiece={handleSelectPiece}
            onMovePiece={handleMovePiece}
          />
        ) : (
          <LudoBoard
            gameState={gameState}
            movablePieceIds={movablePieceIds}
            selectedPieceId={selectedPieceId}
            onSelectPiece={handleSelectPiece}
            onMovePiece={handleMovePiece}
          />
        )}

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
            diceValue={gameState.diceValue}
            onRollDice={handleRollDice}
            canRoll={canRoll && isMyTurn}
            onReset={handleReset}
            statusText={statusText}
            isFinished={gameState.gameStatus === 'finished'}
          />
        </aside>
      </div>

      <Chat currentUser={currentUser} type="game" roomId={room.id} />
    </div>
  )
}

