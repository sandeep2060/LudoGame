import { useMemo } from 'react'
import type { GameState } from '../../types/game'
import { LudoEngine } from '../../lib/gameLogic/ludoEngine'
import { getCellPosition } from '../../lib/gameLogic/boardLayout'
import { RealisticDice } from '../RealisticDice/RealisticDice'
import { RealisticPiece } from '../RealisticPiece/RealisticPiece'

type ClassicLudoBoardProps = {
  gameState: GameState
  movablePieceIds: string[]
  selectedPieceId: string | null
  onSelectPiece?: (pieceId: string) => void
  onMovePiece?: (pieceId: string, targetPosition: number) => void
  currentPlayerIndex: number
  onRollDice: () => void
  diceValue: number | null
  isRolling: boolean
}

export function ClassicLudoBoard({
  gameState,
  movablePieceIds,
  selectedPieceId,
  onSelectPiece,
  onMovePiece,
  currentPlayerIndex,
  onRollDice,
  diceValue,
  isRolling,
}: ClassicLudoBoardProps) {
  const validPositions = useMemo(() => {
    if (!selectedPieceId) return []
    return LudoEngine.getValidMovePositions(gameState, selectedPieceId)
  }, [gameState, selectedPieceId])

  const getPiecesInHome = (color: string) => {
    const player = gameState.players.find((p) => p.color === color)
    if (!player) return []
    return player.pieces.filter((p) => p.position === null && !p.isFinished)
  }

  const getPiecesOnCell = (cellIndex: number) => {
    const cell = gameState.board[cellIndex]
    return cell ? cell.tokens : []
  }

  const handleCellClick = (cellIndex: number) => {
    if (selectedPieceId && validPositions.includes(cellIndex) && onMovePiece) {
      onMovePiece(selectedPieceId, cellIndex)
    }
  }

  const canRoll = !isRolling && diceValue === null

  return (
    <div className="classic-ludo-container">
      {/* Dice Roll Area */}
      <div className="dice-roll-area">
        <button
          type="button"
          className="roll-dice-btn"
          onClick={onRollDice}
          disabled={!canRoll}
        >
          <RealisticDice value={diceValue} size="large" rolling={isRolling} />
          <span className="roll-text">
            {isRolling ? 'Rolling...' : diceValue ? `Rolled: ${diceValue}` : 'Roll Dice'}
          </span>
        </button>
      </div>

      <div className="outer">
        {/* Top Row */}
        <div className="box_row">
          {/* Red Home */}
          <div className="box red-home">
            {getPiecesInHome('red').map((piece, idx) => {
              const movable = movablePieceIds.includes(piece.id)
              const isSelected = selectedPieceId === piece.id
              const offsetX = (idx % 2) * 60 - 30
              const offsetY = Math.floor(idx / 2) * 60 - 30
              return (
                <div
                  key={piece.id}
                  className="home-piece"
                  style={{ left: `calc(50% + ${offsetX}px)`, top: `calc(50% + ${offsetY}px)` }}
                >
                  <RealisticPiece
                    color="red"
                    isMovable={movable}
                    isSelected={isSelected}
                    onClick={() => onSelectPiece?.(piece.id)}
                    index={idx}
                  />
                </div>
              )
            })}
          </div>

          {/* Green Vertical Path */}
          <div className="v_lad">
            {[0, 1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="v_lad_row">
                {[0, 1, 2].map((col) => {
                  // Green path: indices 6-11 (right side, top to bottom)
                  const cellIndex = col === 1 && row < 6 ? (6 + row) : -1
                  const cell = cellIndex >= 0 ? gameState.board[cellIndex] : null
                  const isValidTarget = cellIndex >= 0 && validPositions.includes(cellIndex)
                  const isSafe = cell?.isSafe
                  const tokens = cell?.tokens || []
                  
                  if (cellIndex < 0) {
                    return <div key={col} className="v_lad_cell"></div>
                  }
                  
                  return (
                    <div
                      key={col}
                      className={`v_lad_cell ${col === 1 ? 'green' : ''} ${isSafe ? 'safe' : ''} ${isValidTarget ? 'valid-move' : ''}`}
                      onClick={() => handleCellClick(cellIndex)}
                    >
                      {isSafe && <span className="star">★</span>}
                      {tokens.map((token, tokenIdx) => {
                        const movable = movablePieceIds.includes(token.pieceId)
                        const isSelected = selectedPieceId === token.pieceId
                        return (
                          <RealisticPiece
                            key={token.pieceId}
                            color={token.color}
                            isMovable={movable}
                            isSelected={isSelected}
                            onClick={() => onSelectPiece?.(token.pieceId)}
                            index={tokenIdx}
                          />
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Green Home */}
          <div className="box green-home">
            {getPiecesInHome('green').map((piece, idx) => {
              const movable = movablePieceIds.includes(piece.id)
              const isSelected = selectedPieceId === piece.id
              const offsetX = (idx % 2) * 60 - 30
              const offsetY = Math.floor(idx / 2) * 60 - 30
              return (
                <div
                  key={piece.id}
                  className="home-piece"
                  style={{ left: `calc(50% + ${offsetX}px)`, top: `calc(50% + ${offsetY}px)` }}
                >
                  <RealisticPiece
                    color="green"
                    isMovable={movable}
                    isSelected={isSelected}
                    onClick={() => onSelectPiece?.(piece.id)}
                    index={idx}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Middle Row */}
        <div className="middle_row">
          {/* Red Horizontal Path */}
          <div className="h_lad">
            {[0, 1, 2].map((row) => (
              <div key={row} className="h_lad_row">
                {[0, 1, 2, 3, 4, 5].map((col) => {
                  // Red path: indices 0-5 (top horizontal, left to right)
                  const cellIndex = row === 1 && col > 0 && col < 6 ? (col - 1) : -1
                  const cell = cellIndex >= 0 ? gameState.board[cellIndex] : null
                  const isValidTarget = cellIndex >= 0 && validPositions.includes(cellIndex)
                  const isSafe = cell?.isSafe
                  const tokens = cell?.tokens || []
                  
                  if (cellIndex < 0) {
                    return <div key={col} className="h_lad_cell"></div>
                  }
                  
                  return (
                    <div
                      key={col}
                      className={`h_lad_cell ${row === 1 && col > 0 ? 'red' : ''} ${isSafe ? 'safe' : ''} ${isValidTarget ? 'valid-move' : ''}`}
                      onClick={() => handleCellClick(cellIndex)}
                    >
                      {isSafe && <span className="star">★</span>}
                      {tokens.map((token, tokenIdx) => {
                        const movable = movablePieceIds.includes(token.pieceId)
                        const isSelected = selectedPieceId === token.pieceId
                        return (
                          <RealisticPiece
                            key={token.pieceId}
                            color={token.color}
                            isMovable={movable}
                            isSelected={isSelected}
                            onClick={() => onSelectPiece?.(token.pieceId)}
                            index={tokenIdx}
                          />
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Center Home (Diamond) */}
          <div className="ludo_home">
            {/* Center finish area - pieces that are finished */}
            {gameState.players.map((player) => {
              const finishedPieces = player.pieces.filter((p) => p.isFinished)
              return finishedPieces.map((piece, idx) => {
                const angle = (player.id * 90 + idx * 20) * (Math.PI / 180)
                const radius = 30 + idx * 10
                const x = Math.cos(angle) * radius
                const y = Math.sin(angle) * radius
                return (
                  <div
                    key={piece.id}
                    className="finished-piece"
                    style={{
                      position: 'absolute',
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <RealisticPiece
                      color={player.color}
                      isMovable={false}
                      isSelected={false}
                      onClick={() => {}}
                      index={idx}
                    />
                  </div>
                )
              })
            })}
          </div>

          {/* Yellow Horizontal Path */}
          <div className="h_lad">
            {[0, 1, 2].map((row) => (
              <div key={row} className="h_lad_row">
                {[0, 1, 2, 3, 4, 5].map((col) => {
                  // Yellow path: indices 12-17 (bottom horizontal, right to left)
                  const cellIndex = row === 1 && col < 5 ? (12 + (4 - col)) : -1
                  const cell = cellIndex >= 0 ? gameState.board[cellIndex] : null
                  const isValidTarget = cellIndex >= 0 && validPositions.includes(cellIndex)
                  const isSafe = cell?.isSafe
                  const tokens = cell?.tokens || []
                  
                  if (cellIndex < 0) {
                    return <div key={col} className="h_lad_cell"></div>
                  }
                  
                  return (
                    <div
                      key={col}
                      className={`h_lad_cell ${row === 1 && col < 5 ? 'yellow' : ''} ${isSafe ? 'safe' : ''} ${isValidTarget ? 'valid-move' : ''}`}
                      onClick={() => handleCellClick(cellIndex)}
                    >
                      {isSafe && <span className="star">★</span>}
                      {tokens.map((token, tokenIdx) => {
                        const movable = movablePieceIds.includes(token.pieceId)
                        const isSelected = selectedPieceId === token.pieceId
                        return (
                          <RealisticPiece
                            key={token.pieceId}
                            color={token.color}
                            isMovable={movable}
                            isSelected={isSelected}
                            onClick={() => onSelectPiece?.(token.pieceId)}
                            index={tokenIdx}
                          />
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="box_row">
          {/* Blue Home */}
          <div className="box blue-home">
            {getPiecesInHome('blue').map((piece, idx) => {
              const movable = movablePieceIds.includes(piece.id)
              const isSelected = selectedPieceId === piece.id
              const offsetX = (idx % 2) * 60 - 30
              const offsetY = Math.floor(idx / 2) * 60 - 30
              return (
                <div
                  key={piece.id}
                  className="home-piece"
                  style={{ left: `calc(50% + ${offsetX}px)`, top: `calc(50% + ${offsetY}px)` }}
                >
                  <RealisticPiece
                    color="blue"
                    isMovable={movable}
                    isSelected={isSelected}
                    onClick={() => onSelectPiece?.(piece.id)}
                    index={idx}
                  />
                </div>
              )
            })}
          </div>

          {/* Blue Vertical Path */}
          <div className="v_lad">
            {[0, 1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="v_lad_row">
                {[0, 1, 2].map((col) => {
                  // Map to actual board cells - Blue path starts at index 39
                  const pathOffset = row === 0 ? 0 : row === 5 ? 5 : row
                  const cellIndex = col === 1 ? (39 + pathOffset) % 52 : -1 // Only middle column is path
                  const cell = cellIndex >= 0 ? gameState.board[cellIndex] : null
                  const isValidTarget = cellIndex >= 0 && validPositions.includes(cellIndex)
                  const isSafe = cell?.isSafe
                  const tokens = cell?.tokens || []
                  
                  if (cellIndex < 0) {
                    return <div key={col} className="v_lad_cell"></div>
                  }
                  
                  return (
                    <div
                      key={col}
                      className={`v_lad_cell ${col === 1 ? 'blue' : ''} ${isSafe ? 'safe' : ''} ${isValidTarget ? 'valid-move' : ''}`}
                      onClick={() => handleCellClick(cellIndex)}
                    >
                      {isSafe && <span className="star">★</span>}
                      {tokens.map((token, tokenIdx) => {
                        const movable = movablePieceIds.includes(token.pieceId)
                        const isSelected = selectedPieceId === token.pieceId
                        return (
                          <RealisticPiece
                            key={token.pieceId}
                            color={token.color}
                            isMovable={movable}
                            isSelected={isSelected}
                            onClick={() => onSelectPiece?.(token.pieceId)}
                            index={tokenIdx}
                          />
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Yellow Home */}
          <div className="box yellow-home">
            {getPiecesInHome('yellow').map((piece, idx) => {
              const movable = movablePieceIds.includes(piece.id)
              const isSelected = selectedPieceId === piece.id
              const offsetX = (idx % 2) * 60 - 30
              const offsetY = Math.floor(idx / 2) * 60 - 30
              return (
                <div
                  key={piece.id}
                  className="home-piece"
                  style={{ left: `calc(50% + ${offsetX}px)`, top: `calc(50% + ${offsetY}px)` }}
                >
                  <RealisticPiece
                    color="yellow"
                    isMovable={movable}
                    isSelected={isSelected}
                    onClick={() => onSelectPiece?.(piece.id)}
                    index={idx}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

