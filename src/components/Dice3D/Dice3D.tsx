import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

type Dice3DProps = {
  value: number | null
  position?: [number, number, number]
  rolling?: boolean
}

// Dice face dots positions (relative to center)
const dotPositions: Record<number, number[][]> = {
  1: [[0, 0]],
  2: [[-0.3, -0.3], [0.3, 0.3]],
  3: [[-0.3, -0.3], [0, 0], [0.3, 0.3]],
  4: [[-0.3, -0.3], [-0.3, 0.3], [0.3, -0.3], [0.3, 0.3]],
  5: [[-0.3, -0.3], [-0.3, 0.3], [0, 0], [0.3, -0.3], [0.3, 0.3]],
  6: [[-0.3, -0.3], [-0.3, 0], [-0.3, 0.3], [0.3, -0.3], [0.3, 0], [0.3, 0.3]],
}

function DiceFace({ dots, rotation, position }: any) {
  return (
    <group rotation={rotation} position={position}>
      {/* Face base */}
      <mesh>
        <boxGeometry args={[0.9, 0.9, 0.01]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Dots */}
      {dots.map((dot: number[], idx: number) => (
        <mesh key={idx} position={[dot[0], dot[1], 0.006]}>
          <cylinderGeometry args={[0.08, 0.08, 0.01, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
      ))}
    </group>
  )
}

export function Dice3D({ value, position = [0, 2, 0], rolling = false }: Dice3DProps) {
  const meshRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (meshRef.current) {
      if (rolling) {
        meshRef.current.rotation.x += 0.1
        meshRef.current.rotation.y += 0.1
        meshRef.current.rotation.z += 0.1
      } else {
        // Gentle floating animation
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1
      }
    }
  })

  const dots = value ? dotPositions[value] || [] : []

  return (
    <group ref={meshRef} position={position}>
      {/* Dice body */}
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#0f172a" metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Dice faces with dots */}
      {value && (
        <>
          {/* Top face */}
          <DiceFace dots={dots} rotation={[0, 0, 0]} position={[0, 0.51, 0]} />
          {/* Bottom face (opposite) */}
          <DiceFace dots={dots} rotation={[Math.PI, 0, 0]} position={[0, -0.51, 0]} />
          {/* Front face */}
          <DiceFace dots={dots} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.51]} />
          {/* Back face */}
          <DiceFace dots={dots} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.51]} />
          {/* Right face */}
          <DiceFace dots={dots} rotation={[0, Math.PI / 2, 0]} position={[0.51, 0, 0]} />
          {/* Left face */}
          <DiceFace dots={dots} rotation={[0, -Math.PI / 2, 0]} position={[-0.51, 0, 0]} />
        </>
      )}

      {/* Edges highlight */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
        <lineBasicMaterial color="#ffffff" opacity={0.3} transparent />
      </lineSegments>
    </group>
  )
}

