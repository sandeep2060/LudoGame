import { useState, useEffect } from 'react'
import { useSpring, animated } from '@react-spring/web'

type RealisticDiceProps = {
  value: number | null
  size?: 'small' | 'medium' | 'large'
  rolling?: boolean
}

const dotPositions: Record<number, Array<[number, number]>> = {
  1: [[0, 0]],
  2: [[-0.3, -0.3], [0.3, 0.3]],
  3: [[-0.3, -0.3], [0, 0], [0.3, 0.3]],
  4: [[-0.3, -0.3], [-0.3, 0.3], [0.3, -0.3], [0.3, 0.3]],
  5: [[-0.3, -0.3], [-0.3, 0.3], [0, 0], [0.3, -0.3], [0.3, 0.3]],
  6: [[-0.3, -0.3], [-0.3, 0], [-0.3, 0.3], [0.3, -0.3], [0.3, 0], [0.3, 0.3]],
}

export function RealisticDice({ value, size = 'medium', rolling = false }: RealisticDiceProps) {
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    if (rolling) {
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1)
      }, 100)
      return () => clearInterval(interval)
    } else {
      setDisplayValue(value)
    }
  }, [value, rolling])

  const sizeMap = {
    small: { width: 40, height: 40, dotSize: 4 },
    medium: { width: 60, height: 60, dotSize: 6 },
    large: { width: 80, height: 80, dotSize: 8 },
  }

  const { rotateX, rotateY, scale } = useSpring({
    rotateX: rolling ? 360 : 0,
    rotateY: rolling ? 360 : 0,
    scale: rolling ? 1.2 : 1,
    config: { tension: 200, friction: 20 },
  })

  const dots = displayValue ? dotPositions[displayValue] || [] : []

  return (
    <animated.div
      className={`realistic-dice ${size} ${rolling ? 'rolling' : ''}`}
      style={{
        width: sizeMap[size].width,
        height: sizeMap[size].height,
        transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`,
      }}
    >
      <div className="dice-face">
        {dots.map(([x, y], idx) => (
          <div
            key={idx}
            className="dice-dot"
            style={{
              left: `${50 + x * 100}%`,
              top: `${50 + y * 100}%`,
              width: sizeMap[size].dotSize,
              height: sizeMap[size].dotSize,
            }}
          />
        ))}
      </div>
    </animated.div>
  )
}

