import { useMemo, useState, useEffect } from 'react'
import { useSpring, animated } from '@react-spring/web'
import type { GameState } from '../../types/game'
import { LudoEngine } from '../../lib/gameLogic/ludoEngine'
import { SoundManager } from '../../lib/sounds'
import { RealisticDice } from '../RealisticDice/RealisticDice'
import { RealisticPiece } from '../RealisticPiece/RealisticPiece'

type RealisticLudoBoardProps = {
  gameState: GameState
  movablePieceIds: string[]
  selectedPieceId: string | null
  onSelectPiece?: (pieceId: string) => void
  onMovePiece?: (pieceId: string, targetPosition: number) => void
  currentPlayerIndex: number
}

// Board layout configuration matching Ludo King
const BOARD_LAYOUT = {
  // Corner home bases positions (relative to board center)
  corners: {
    red: { x: -6, y: -6, rotation: 0 },
    green: { x: 6, y: -6, rotation: 90 },
    yellow: { x: 6, y: 6, rotation: 180 },
    blue: { x: -6, y: 6, rotation: 270 },
  },
  // Safe cell positions
  safeCells: [0, 8, 13, 21, 26, 34, 39, 47],
}

export function RealisticLudoBoard({
  gameState,
  movablePieceIds,
  selectedPieceId,
  onSelectPiece,
  onMovePiece,
  currentPlayerIndex,
}: RealisticLudoBoardProps) {
  const [diceRolling, setDiceRolling] = useState(false)
  const validPositions = useMemo(() => {
    if (!selectedPieceId) return []
    return LudoEngine.getValidMovePositions(gameState, selectedPieceId)
  }, [gameState, selectedPieceId])

  const handleCellClick = (cellIndex: number) => {
    if (selectedPieceId && validPositions.includes(cellIndex) && onMovePiece) {
      SoundManager.playPieceMove()
      onMovePiece(selectedPieceId, cellIndex)
    }
  }

  const getCellPosition = (index: number) => {
    // Ludo board has 52 cells arranged in a cross pattern
    // Convert linear index to board coordinates (0-51)
    const totalCells = 52
    const cellsPerSide = 13
    
    // Map index to approximate position on the board
    // This is a simplified mapping - adjust based on actual board layout
    let x = 0
    let z = 0
    
    if (index < cellsPerSide) {
      // Top horizontal path (left to right)
      x = (index / cellsPerSide) * 6 - 3
      z = -3
    } else if (index < cellsPerSide * 2) {
      // Right vertical path (top to bottom)
      x = 3
      z = ((index - cellsPerSide) / cellsPerSide) * 6 - 3
    } else if (index < cellsPerSide * 3) {
      // Bottom horizontal path (right to left)
      x = 3 - ((index - cellsPerSide * 2) / cellsPerSide) * 6
      z = 3
    } else {
      // Left vertical path (bottom to top)
      x = -3
      z = 3 - ((index - cellsPerSide * 3) / cellsPerSide) * 6
    }
    
    return { x, z }
  }

  return (
    <div className="realistic-ludo-board">
      {/* Player turn indicators */}
      <div className="turn-indicators">
        {gameState.players.map((player, idx) => {
          const isActive = idx === currentPlayerIndex
          const playerDice = idx === currentPlayerIndex ? gameState.diceValue : null
          
          return (
            <div
              key={player.id}
              className={`turn-indicator ${player.color} ${isActive ? 'active' : ''}`}
              style={{
                [idx === 0 ? 'top' : idx === 1 ? 'right' : idx === 2 ? 'bottom' : 'left']: '20px',
              }}
            >
              <div className="indicator-content">
                <div className={`player-marker ${player.color}`}></div>
                {playerDice && <RealisticDice value={playerDice} size="small" />}
                <span className="player-name">{player.name}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main board */}
      <div className="board-container">
        <svg className="board-svg" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
          {/* Board background */}
          <defs>
            <pattern id="boardPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1" fill="#cbd5e1" opacity="0.3" />
            </pattern>
            <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
            <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>
            <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
          </defs>

          {/* Corner home bases */}
          <g className="corner-bases">
            {/* Red corner (top-left) */}
            <g transform="translate(50, 50)">
              <rect x="0" y="0" width="80" height="80" fill="url(#redGradient)" rx="8" />
              <rect x="20" y="20" width="40" height="40" fill="#fff" rx="4" />
              <circle cx="35" cy="35" r="4" fill="#ef4444" />
              <circle cx="65" cy="35" r="4" fill="#ef4444" />
              <circle cx="35" cy="65" r="4" fill="#ef4444" />
              <circle cx="65" cy="65" r="4" fill="#ef4444" />
            </g>

            {/* Green corner (top-right) */}
            <g transform="translate(270, 50)">
              <rect x="0" y="0" width="80" height="80" fill="url(#greenGradient)" rx="8" />
              <rect x="20" y="20" width="40" height="40" fill="#fff" rx="4" />
              <circle cx="35" cy="35" r="4" fill="#22c55e" />
              <circle cx="65" cy="35" r="4" fill="#22c55e" />
              <circle cx="35" cy="65" r="4" fill="#22c55e" />
              <circle cx="65" cy="65" r="4" fill="#22c55e" />
            </g>

            {/* Yellow corner (bottom-right) */}
            <g transform="translate(270, 270)">
              <rect x="0" y="0" width="80" height="80" fill="url(#yellowGradient)" rx="8" />
              <rect x="20" y="20" width="40" height="40" fill="#fff" rx="4" />
              <circle cx="35" cy="35" r="4" fill="#facc15" />
              <circle cx="65" cy="35" r="4" fill="#facc15" />
              <circle cx="35" cy="65" r="4" fill="#facc15" />
              <circle cx="65" cy="65" r="4" fill="#facc15" />
            </g>

            {/* Blue corner (bottom-left) */}
            <g transform="translate(50, 270)">
              <rect x="0" y="0" width="80" height="80" fill="url(#blueGradient)" rx="8" />
              <rect x="20" y="20" width="40" height="40" fill="#fff" rx="4" />
              <circle cx="35" cy="35" r="4" fill="#3b82f6" />
              <circle cx="65" cy="35" r="4" fill="#3b82f6" />
              <circle cx="35" cy="65" r="4" fill="#3b82f6" />
              <circle cx="65" cy="65" r="4" fill="#3b82f6" />
            </g>
          </g>

          {/* Main path */}
          <g className="main-path">
            {/* Horizontal path */}
            <rect x="130" y="170" width="140" height="60" fill="#fff" rx="4" stroke="#cbd5e1" strokeWidth="2" />
            {/* Vertical path */}
            <rect x="170" y="130" width="60" height="140" fill="#fff" rx="4" stroke="#cbd5e1" strokeWidth="2" />
          </g>

          {/* Colored start paths */}
          <g className="start-paths">
            {/* Red path (right from red corner) */}
            <rect x="130" y="170" width="40" height="60" fill="#fee2e2" rx="4" />
            {/* Green path (down from green corner) */}
            <rect x="170" y="130" width="60" height="40" fill="#dcfce7" rx="4" />
            {/* Yellow path (left from yellow corner) */}
            <rect x="230" y="170" width="40" height="60" fill="#fef9c3" rx="4" />
            {/* Blue path (up from blue corner) */}
            <rect x="170" y="230" width="60" height="40" fill="#dbeafe" rx="4" />
          </g>

          {/* Safe zones (stars) */}
          <g className="safe-zones">
            {[0, 8, 13, 21, 26, 34, 39, 47].map((cellIndex, idx) => {
              const pos = getCellPosition(cellIndex)
              const x = (pos.x + 7.5) * 20 + 200
              const y = (pos.z + 7.5) * 20 + 200
              return (
                <g key={idx} transform={`translate(${x}, ${y})`}>
                  <polygon
                    points="0,-8 2,-2 8,-2 3,1 5,7 0,4 -5,7 -3,1 -8,-2 -2,-2"
                    fill="#fbbf24"
                    stroke="#f59e0b"
                    strokeWidth="1"
                  />
                </g>
              )
            })}
          </g>

          {/* Central home area (diamond) */}
          <g className="center-home" transform="translate(200, 200)">
            <polygon
              points="0,-30 30,0 0,30 -30,0"
              fill="#fef3c7"
              stroke="#fbbf24"
              strokeWidth="3"
            />
            <polygon points="0,-30 15,0 0,30 -15,0" fill="#ef4444" opacity="0.3" />
            <polygon points="15,0 30,0 0,30 0,15" fill="#22c55e" opacity="0.3" />
            <polygon points="0,15 0,30 -15,0 -30,0" fill="#3b82f6" opacity="0.3" />
            <polygon points="-15,0 0,-30 0,-15 -30,0" fill="#facc15" opacity="0.3" />
          </g>
        </svg>

        {/* Game pieces */}
        <div className="pieces-layer">
          {gameState.board.map((cell) => {
            if (cell.tokens.length === 0) return null
            
            const pos = getCellPosition(cell.index)
            const isValidTarget = validPositions.includes(cell.index)
            
            // Convert board coordinates to percentage
            const leftPercent = 50 + (pos.x / 6) * 20
            const topPercent = 50 + (pos.z / 6) * 20
            
            return (
              <div
                key={cell.index}
                className={`cell-area ${cell.isSafe ? 'safe' : ''} ${isValidTarget ? 'valid-move' : ''}`}
                style={{
                  left: `${Math.max(5, Math.min(95, leftPercent))}%`,
                  top: `${Math.max(5, Math.min(95, topPercent))}%`,
                }}
                onClick={() => handleCellClick(cell.index)}
              >
                {cell.tokens.map((token, tokenIdx) => {
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
        
        {/* Home base pieces */}
        {gameState.players.map((player) => {
          const homePieces = player.pieces.filter((p) => p.position === null && !p.isFinished)
          if (homePieces.length === 0) return null
          
          const corner = BOARD_LAYOUT.corners[player.color]
          const baseX = corner.x > 0 ? 85 : 15
          const baseY = corner.y > 0 ? 85 : 15
          
          return (
            <div
              key={player.id}
              className="home-base-pieces"
              style={{
                position: 'absolute',
                left: `${baseX}%`,
                top: `${baseY}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {homePieces.map((piece, idx) => {
                const movable = movablePieceIds.includes(piece.id)
                const isSelected = selectedPieceId === piece.id
                const offsetX = (idx % 2) * 15 - 7.5
                const offsetY = Math.floor(idx / 2) * 15 - 7.5
                
                return (
                  <div
                    key={piece.id}
                    style={{
                      position: 'absolute',
                      left: `${50 + offsetX}%`,
                      top: `${50 + offsetY}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <RealisticPiece
                      color={player.color}
                      isMovable={movable}
                      isSelected={isSelected}
                      onClick={() => onSelectPiece?.(piece.id)}
                      index={idx}
                    />
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

