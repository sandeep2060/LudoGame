import { useMemo } from 'react'
import type { GameState } from '../../types/game'
import { Dice } from '../Dice/Dice'
import { InteractivePiece } from '../InteractivePiece/InteractivePiece'
import { LudoEngine } from '../../lib/gameLogic/ludoEngine'

type LudoBoardProps = {
  gameState: GameState
  movablePieceIds: string[]
  selectedPieceId: string | null
  onSelectPiece?: (pieceId: string) => void
  onMovePiece?: (pieceId: string, targetPosition: number) => void
}

export function LudoBoard({
  gameState,
  movablePieceIds,
  selectedPieceId,
  onSelectPiece,
  onMovePiece,
}: LudoBoardProps) {
  const validPositions = useMemo(() => {
    if (!selectedPieceId) return []
    return LudoEngine.getValidMovePositions(gameState, selectedPieceId)
  }, [gameState, selectedPieceId])

  const handleMove = (pieceId: string, targetPosition: number) => {
    if (onMovePiece) {
      onMovePiece(pieceId, targetPosition)
    } else if (onSelectPiece) {
      // Fallback to click-to-move if drag/drop not available
      onSelectPiece(pieceId)
    }
  }

  return (
    <div className="ludo-board">
      <header className="board-header">
        <div>
          <p className="board-eyebrow">Arena status</p>
          <h2>{gameState.gameStatus === 'finished' ? 'Victory lap!' : 'Battle in progress'}</h2>
        </div>
        <Dice value={gameState.diceValue} />
      </header>

      <div className="board-grid">
        {gameState.board.map((cell) => {
          const isValidTarget = validPositions.includes(cell.index)
          const handleCellClick = () => {
            if (selectedPieceId && isValidTarget && onMovePiece) {
              onMovePiece(selectedPieceId, cell.index)
            }
          }
          return (
            <div
              key={cell.index}
              data-cell-index={cell.index}
              className={`board-cell ${cell.isSafe ? 'safe' : ''} ${isValidTarget ? 'valid-move' : ''}`}
              onClick={handleCellClick}
              role={isValidTarget && selectedPieceId ? 'button' : undefined}
              tabIndex={isValidTarget && selectedPieceId ? 0 : undefined}
              onKeyDown={(e) => {
                if (isValidTarget && selectedPieceId && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  if (onMovePiece) {
                    onMovePiece(selectedPieceId, cell.index)
                  }
                }
              }}
              aria-label={isValidTarget && selectedPieceId ? `Move piece to position ${cell.index + 1}` : undefined}
            >
              <span className="cell-index">{cell.index + 1}</span>
              <div className="token-stack">
                {cell.tokens.length === 0 && <span className="token ghost">•</span>}
                {cell.tokens.map((token) => {
                  const movable = movablePieceIds.includes(token.pieceId)
                  const isSelected = selectedPieceId === token.pieceId
                  return (
                    <InteractivePiece
                      key={token.pieceId}
                      token={token}
                      isMovable={movable}
                      isSelected={isSelected}
                      onSelect={onSelectPiece || (() => {})}
                      onMove={handleMove}
                      validPositions={validPositions}
                      currentPosition={cell.index}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

