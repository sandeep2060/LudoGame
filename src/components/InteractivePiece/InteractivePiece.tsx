import { useState, useRef, useEffect } from 'react'
import type { BoardToken } from '../../types/game'

type InteractivePieceProps = {
  token: BoardToken
  isMovable: boolean
  isSelected: boolean
  onSelect: (pieceId: string) => void
  onMove: (pieceId: string, targetPosition: number) => void
  validPositions: number[]
  currentPosition: number
}

export function InteractivePiece({
  token,
  isMovable,
  isSelected,
  onSelect,
  onMove,
  validPositions,
  currentPosition,
}: InteractivePieceProps) {
  const [isDragging, setIsDragging] = useState(false)
  const pieceRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isDragging) return

    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Visual feedback during drag is handled by CSS
      if (pieceRef.current) {
        const rect = pieceRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        
        // Update cursor position for visual feedback
        document.body.style.cursor = 'grabbing'
      }
    }

    const handleGlobalMouseUp = (e: MouseEvent) => {
      setIsDragging(false)
      document.body.style.cursor = ''

      // Find the cell under the cursor
      const elementBelow = document.elementFromPoint(e.clientX, e.clientY)
      const cellElement = elementBelow?.closest('.board-cell')
      
      if (cellElement && isSelected) {
        const cellIndex = parseInt(cellElement.getAttribute('data-cell-index') || '-1', 10)
        if (cellIndex >= 0 && validPositions.includes(cellIndex)) {
          onMove(token.pieceId, cellIndex)
        }
      }
    }

    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.body.style.cursor = ''
    }
  }, [isDragging, isSelected, validPositions, token.pieceId, onMove])

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isMovable) return
    e.preventDefault()
    setIsDragging(true)
    onSelect(token.pieceId)
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isMovable) return
    
    // If piece is already selected and clicked again, deselect it
    if (isSelected) {
      // Allow clicking on valid cells to move
      return
    }
    
    // Otherwise, select the piece
    onSelect(token.pieceId)
  }

  return (
    <button
      ref={pieceRef}
      type="button"
      className={`token ${token.color} ${isMovable ? 'movable' : ''} ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      disabled={!isMovable}
      aria-label={`Piece ${token.pieceId} belonging to ${token.color}${isSelected ? ' - selected' : ''}${isMovable ? ' - click to select or drag to move' : ''}`}
    />
  )
}

