import React, { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import type { GameState } from '../../types/game'
import { Dice3D } from '../Dice3D/Dice3D'

type LudoBoard3DProps = {
  gameState: GameState
  movablePieceIds: string[]
  selectedPieceId: string | null
  onSelectPiece?: (pieceId: string) => void
  onMovePiece?: (pieceId: string, targetPosition: number) => void
}

// 3D Board Cell Component
function BoardCell({ position, index, isSafe, tokens, movablePieceIds, selectedPieceId, onSelectPiece }: any) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  const cellColor = isSafe ? '#d1fae5' : '#f1f5f9'
  const borderColor = isSafe ? '#10b981' : '#cbd5e1'

  return (
    <group position={position}>
      {/* Cell base */}
      <mesh
        ref={meshRef}
        position={[0, 0.01, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.9, 0.02, 0.9]} />
        <meshStandardMaterial color={hovered ? '#e0e7ff' : cellColor} />
      </mesh>
      {/* Cell border */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.92, 0.01, 0.92]} />
        <meshStandardMaterial color={borderColor} />
      </mesh>
      {/* Safe cell indicator */}
      {isSafe && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.3, 32]} />
          <meshStandardMaterial color="#10b981" />
        </mesh>
      )}
      {/* Tokens */}
      {tokens.map((token: any, idx: number) => {
        const isMovable = movablePieceIds.includes(token.pieceId)
        const isSelected = selectedPieceId === token.pieceId
        const offsetX = (idx % 2) * 0.2 - 0.1
        const offsetZ = Math.floor(idx / 2) * 0.2 - 0.1

        return (
          <Token3D
            key={token.pieceId}
            position={[offsetX, 0.15, offsetZ]}
            color={token.color}
            isMovable={isMovable}
            isSelected={isSelected}
            onClick={() => onSelectPiece?.(token.pieceId)}
          />
        )
      })}
    </group>
  )
}

// 3D Token/Piece Component
function Token3D({ position, color, isMovable, isSelected, onClick }: any) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      if (isSelected) {
        meshRef.current.position.y = 0.15 + Math.sin(state.clock.elapsedTime * 3) * 0.05
        meshRef.current.rotation.y += 0.02
      } else {
        meshRef.current.position.y = 0.15
      }
      if (hovered && isMovable) {
        meshRef.current.scale.setScalar(1.2)
      } else {
        meshRef.current.scale.setScalar(1)
      }
    }
  })

  const colorMap: Record<string, string> = {
    red: '#ef4444',
    green: '#22c55e',
    yellow: '#facc15',
    blue: '#3b82f6',
  }

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <cylinderGeometry args={[0.08, 0.08, 0.15, 32]} />
      <meshStandardMaterial
        color={colorMap[color] || '#ffffff'}
        metalness={0.8}
        roughness={0.2}
        emissive={isSelected ? colorMap[color] : '#000000'}
        emissiveIntensity={isSelected ? 0.3 : 0}
      />
      {/* Highlight ring for movable pieces */}
      {isMovable && (
        <mesh position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.1, 0.12, 32]} />
          <meshStandardMaterial color="#3b82f6" transparent opacity={0.6} />
        </mesh>
      )}
    </mesh>
  )
}

// 3D Board Structure
function LudoBoard3DScene({
  gameState,
  movablePieceIds,
  selectedPieceId,
  onSelectPiece,
  onMovePiece,
}: LudoBoard3DProps) {
  const boardSize = 13
  const cellSize = 1
  const startX = -(boardSize * cellSize) / 2
  const startZ = -(boardSize * cellSize) / 2

  // Create board grid
  const cells: React.ReactElement[] = []
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const index = row * boardSize + col
      const cell = gameState.board[index]
      if (cell) {
        const x = startX + col * cellSize + cellSize / 2
        const z = startZ + row * cellSize + cellSize / 2

        cells.push(
          <BoardCell
            key={index}
            position={[x, 0, z]}
            index={index}
            isSafe={cell.isSafe}
            tokens={cell.tokens}
            movablePieceIds={movablePieceIds}
            selectedPieceId={selectedPieceId}
            onSelectPiece={onSelectPiece}
          />
        )
      }
    }
  }

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, 10, -10]} intensity={0.5} />

      {/* Board base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <boxGeometry args={[boardSize * cellSize, boardSize * cellSize, 0.2]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>

      {/* Corner areas with colors */}
      <CornerArea position={[-6, 0, -6]} color="#ef4444" size={3} />
      <CornerArea position={[6, 0, -6]} color="#3b82f6" size={3} />
      <CornerArea position={[-6, 0, 6]} color="#22c55e" size={3} />
      <CornerArea position={[6, 0, 6]} color="#facc15" size={3} />

      {/* Center finish area */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[2, 2, 0.1]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>

      {/* Board cells */}
      {cells}

      {/* 3D Dice */}
      <Dice3D value={gameState.diceValue} position={[7, 1, 7]} rolling={false} />

      {/* Grid lines */}
      <GridLines size={boardSize} cellSize={cellSize} />
    </>
  )
}

// Corner area component
function CornerArea({ position, color, size }: any) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[size, size, 0.1]} />
        <meshStandardMaterial color={color} opacity={0.3} transparent />
      </mesh>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[size - 0.2, size - 0.2, 0.05]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}

// Grid lines component - simplified
function GridLines({ size, cellSize }: any) {
  return null // Grid lines removed for cleaner look
}

// Main 3D Board Component
export function LudoBoard3D({
  gameState,
  movablePieceIds,
  selectedPieceId,
  onSelectPiece,
  onMovePiece,
}: LudoBoard3DProps) {
  return (
    <div className="ludo-board-3d">
      <Canvas
        style={{ width: '100%', height: '600px', background: 'linear-gradient(to bottom, #e0f2fe, #f0f9ff)' }}
        gl={{ antialias: true }}
      >
        <PerspectiveCamera makeDefault position={[0, 15, 15]} fov={50} />
        <OrbitControls
          enablePan={false}
          minDistance={10}
          maxDistance={30}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2.2}
        />
        <LudoBoard3DScene
          gameState={gameState}
          movablePieceIds={movablePieceIds}
          selectedPieceId={selectedPieceId}
          onSelectPiece={onSelectPiece}
          onMovePiece={onMovePiece}
        />
      </Canvas>
    </div>
  )
}

