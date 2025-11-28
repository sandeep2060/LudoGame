import type { Player } from '../../types/game'

type PlayerAreaProps = {
  player: Player
  isActive: boolean
  movablePieceIds: string[]
  selectedPieceId: string | null
  onSelectPiece: (pieceId: string) => void
  onMovePiece?: (pieceId: string, targetPosition?: number) => void
  diceValue: number | null
}

export function PlayerArea({
  player,
  isActive,
  movablePieceIds,
  selectedPieceId,
  onSelectPiece,
  onMovePiece,
  diceValue,
}: PlayerAreaProps) {
  return (
    <div className={`player-area ${player.color} ${isActive ? 'active' : ''}`}>
      <div className="player-header">
        <p className="player-name">{player.name}</p>
        <p className="player-meta">
          Pieces home: {player.pieces.filter((piece) => piece.isFinished).length}/{player.pieces.length}
        </p>
      </div>

      <div className="piece-grid">
        {player.pieces.map((piece) => {
          const canMove = isActive && movablePieceIds.includes(piece.id)
          const isSelected = selectedPieceId === piece.id
          const statusLabel = piece.isFinished
            ? '🏁 Finished'
            : piece.position === null
              ? '🏠 Base'
              : `Tile ${piece.position + 1}`

          return (
            <button
              key={piece.id}
              type="button"
              className={`piece-chip ${canMove ? 'can-move' : ''} ${isSelected ? 'selected' : ''}`}
              disabled={!canMove}
              onClick={() => {
                if (isSelected && onMovePiece) {
                  // If already selected and clicked again, move it (for pieces in base)
                  onMovePiece(piece.id)
                } else {
                  onSelectPiece(piece.id)
                }
              }}
            >
              <span className="piece-id">#{piece.id.split('-')[1]}</span>
              <span className="piece-status">{statusLabel}</span>
            </button>
          )
        })}
      </div>

      {isActive && diceValue && movablePieceIds.length === 0 && (
        <p className="no-move-hint">No available moves for a roll of {diceValue}.</p>
      )}
    </div>
  )
}

