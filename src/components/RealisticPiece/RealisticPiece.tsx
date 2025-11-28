import { useState } from 'react'
import { useSpring, animated } from '@react-spring/web'

type RealisticPieceProps = {
  color: 'red' | 'green' | 'yellow' | 'blue'
  isMovable: boolean
  isSelected: boolean
  onClick: () => void
  index: number
}

const colorMap = {
  red: { base: '#ef4444', top: '#fee2e2', shadow: '#dc2626' },
  green: { base: '#22c55e', top: '#dcfce7', shadow: '#16a34a' },
  yellow: { base: '#facc15', top: '#fef9c3', shadow: '#eab308' },
  blue: { base: '#3b82f6', top: '#dbeafe', shadow: '#2563eb' },
}

export function RealisticPiece({ color, isMovable, isSelected, onClick }: RealisticPieceProps) {
  const [hovered, setHovered] = useState(false)
  const colors = colorMap[color]

  const { scale, y, shadow } = useSpring({
    scale: hovered && isMovable ? 1.3 : isSelected ? 1.2 : 1,
    y: isSelected ? -8 : hovered && isMovable ? -4 : 0,
    shadow: isSelected ? 20 : hovered && isMovable ? 12 : 4,
    config: { tension: 300, friction: 25 },
  })

  return (
    <animated.div
      className={`realistic-piece ${color} ${isMovable ? 'movable' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={isMovable ? onClick : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: `translateY(${y}px) scale(${scale})`,
        boxShadow: `0 ${shadow}px ${shadow * 1.5}px rgba(0, 0, 0, 0.3)`,
        cursor: isMovable ? 'pointer' : 'default',
      }}
    >
      {/* Pin base */}
      <div className="piece-base" style={{ background: colors.base }}></div>
      {/* Pin top */}
      <div className="piece-top" style={{ background: colors.top }}>
        <div className="piece-dot" style={{ background: colors.base }}></div>
      </div>
      {/* Highlight ring for movable pieces */}
      {isMovable && <div className="movable-ring"></div>}
      {/* Selected glow */}
      {isSelected && <div className="selected-glow"></div>}
    </animated.div>
  )
}

