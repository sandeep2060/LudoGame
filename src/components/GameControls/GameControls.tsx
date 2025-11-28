import type { Player } from '../../types/game'

type GameControlsProps = {
  currentPlayer: Player
  diceValue: number | null
  onRollDice: () => void
  canRoll: boolean
  onReset: () => void
  statusText: string
  isFinished: boolean
}

export function GameControls({
  currentPlayer,
  diceValue,
  onRollDice,
  canRoll,
  onReset,
  statusText,
  isFinished,
}: GameControlsProps) {
  return (
    <div className="game-controls">
      <p className="status-text">{statusText}</p>
      <div className="control-row">
        <button type="button" className="ghost-btn" onClick={onReset}>
          Reset match
        </button>
      </div>
      <div className="turn-chip">
        <span className="turn-label">Current commander</span>
        <span className={`turn-player ${currentPlayer.color}`}>{currentPlayer.name}</span>
      </div>
      {isFinished && (
        <div className="banner success">🏆 {currentPlayer.name} has conquered the board. Play again?</div>
      )}
    </div>
  )
}

