// components/storefront/CigarScene.tsx
'use client'
import { useRef, useEffect, useState, memo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Physics, useBox, usePlane } from '@react-three/cannon'
import * as THREE from 'three'

// ─── Plano de colisão do chão ──────────────────────────────────────────────
const CollisionFloor = memo(() => {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -1.8, 0],
    restitution: 0.4,
  }))
  return <mesh ref={ref} visible={false} />
})
CollisionFloor.displayName = 'CollisionFloor'

// ─── CHARUTO OTIMIZADO COM INTERAÇÃO INDIVIDUAL ────────────────────────────
const RealisticCigar = memo(({ 
  position, 
  delay, 
  onLand, 
  index,
  mouseX,
  mouseY
}: { 
  position: [number, number, number], 
  delay: number,
  onLand: (index: number) => void,
  index: number,
  mouseX: React.MutableRefObject<number>,
  mouseY: React.MutableRefObject<number>
}) => {
  const hasLanded = useRef(false)
  const groupRef = useRef<THREE.Group>(null)
  const [landed, setLanded] = useState(false)
  
  // Direção aleatória para queda
  const velocityRef = useRef({
    x: (Math.random() - 0.5) * 4,
    z: (Math.random() - 0.5) * 4
  })

  const [ref, api] = useBox(() => ({
    mass: 1,
    position,
    rotation: [0, Math.random() * Math.PI * 2, 0],
    args: [1.2, 5.5, 1.2],
    linearDamping: 0.25,
    angularDamping: 0.3,
    onCollide: () => {
      if (!hasLanded.current) {
        hasLanded.current = true
        setLanded(true)
        onLand(index)
      }
    },
  }))

  const isNearThisCigar = useRef(false)
  const targetRotationZ = useRef(0)
  const targetRotationX = useRef(0)

  // Efeito de rolagem individual - APENAS este charuto se move
  useFrame(() => {
    if (!groupRef.current || !landed) return
    
    const mouseWorldX = mouseX.current * 7
    const mouseWorldZ = mouseY.current * 6
    const cigarPos = groupRef.current.position
    
    const distance = Math.hypot(mouseWorldX - cigarPos.x, mouseWorldZ - cigarPos.z)
    const isNear = distance < 2.0
    
    isNearThisCigar.current = isNear
    
    if (isNear) {
      const angleToMouse = Math.atan2(mouseWorldZ - cigarPos.z, mouseWorldX - cigarPos.x)
      targetRotationZ.current = Math.sin(angleToMouse) * 0.3
      targetRotationX.current = Math.cos(angleToMouse) * 0.2
    } else {
      targetRotationZ.current *= 0.96
      targetRotationX.current *= 0.96
    }
    
    groupRef.current.rotation.z += (targetRotationZ.current - groupRef.current.rotation.z) * 0.12
    groupRef.current.rotation.x += (targetRotationX.current - groupRef.current.rotation.x) * 0.12
  })

  useEffect(() => {
    api.sleep()
    const timer = setTimeout(() => {
      api.wakeUp()
      api.applyForce([velocityRef.current.x, 0.5, velocityRef.current.z], [0, 0.7, 0])
    }, delay)
    return () => clearTimeout(timer)
  }, [api, delay])

  return (
    <group ref={ref as any}>
      <group ref={groupRef}>
        {/* Corpo principal */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.30, 0.31, 3.0, 16]} />  // [raio inferior, raio superior, altura, segmentos]
          <meshStandardMaterial 
            color={isNearThisCigar.current ? "#c88a4a" : "#7a4a2a"} 
            roughness={isNearThisCigar.current ? 0.2 : 0.5} 
          />
        </mesh>
        
        {/* Ponta acesa */}
        <mesh castShadow position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.30, 0.1, 0.1, 16]} />
          <meshStandardMaterial 
            color="#ff5500" 
            emissive="#ff3300" 
            emissiveIntensity={isNearThisCigar.current ? 0.8 : 0.4} 
          />
        </mesh>
        
        {/* Anilha dourada 1 */}
        <mesh castShadow position={[0, 0.2, 0]}>
          <torusGeometry args={[0.32, 0.045, 12, 32]} />  // [raio, espessura, ...]
          <meshStandardMaterial color={isNearThisCigar.current ? "#ffcc66" : "#c9a03d"} metalness={0.9} roughness={0.15} />
        </mesh>
        
        {/* Anilha dourada 2 */}
        <mesh castShadow position={[0, -0.2, 0]}>
          <torusGeometry args={[0.32, 0.045, 12, 32]} />
          <meshStandardMaterial color={isNearThisCigar.current ? "#ffcc66" : "#c9a03d"} metalness={0.9} roughness={0.15} />
        </mesh>
      </group>
    </group>
  )
})
RealisticCigar.displayName = 'RealisticCigar'

// ─── LUZ QUE SEGUE O MOUSE ────────────────────────────────────────────────
const MouseLight = memo(({ mouseX, mouseY }: { mouseX: React.MutableRefObject<number>, mouseY: React.MutableRefObject<number> }) => {
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame(() => {
    if (!lightRef.current) return
    lightRef.current.position.x = mouseX.current * 7
    lightRef.current.position.y = mouseY.current * 2.5 + 1.5
    lightRef.current.position.z = 8
  })

  return <pointLight ref={lightRef} intensity={4} distance={18} color="#ffaa66" />
})
MouseLight.displayName = 'MouseLight'

interface CigarSceneProps {
  mouseX: React.MutableRefObject<number>
  mouseY: React.MutableRefObject<number>
  onCigarLand: (index: number) => void
}

// ─── 15 CHARUTOS MUITO ESPALHADOS (PONTA A PONTA) ─────────────────────────
// X: -4.0 a 4.0 | Z: -2.5 a 2.5 (tela inteira)
const CIGAR_POSITIONS: [number, number, number][] = [
  // CANTO ESQUERDO (X negativo)
  [-3.8, 4.5, -2.0], [-3.5, 4.8, -1.0], [-3.2, 5.0, 0], [-3.5, 4.7, 1.0], [-3.8, 4.4, 2.0],
  
  // CENTRO
  [-1.5, 5.2, -2.0], [-0.5, 5.5, -1.0], [0, 5.8, 0], [0.5, 5.5, 1.0], [1.5, 5.2, 2.0],
  
  // CANTO DIREITO (X positivo)
  [3.8, 4.5, -2.0], [3.5, 4.8, -1.0], [3.2, 5.0, 0], [3.5, 4.7, 1.0], [3.8, 4.4, 2.0],
]

// Delays escalonados
const DELAYS = [0, 80, 160, 240, 320, 400, 480, 560, 640, 720, 800, 860, 920, 980, 1040]

export function CigarScene({ mouseX, mouseY, onCigarLand }: CigarSceneProps) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 4, 18], fov: 55 }}
        style={{ background: 'transparent' }}
        shadows
        performance={{ min: 0.5 }}
      >
        {/* Luzes otimizadas */}
        <ambientLight intensity={0.45} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
        <pointLight position={[0, 5, 3]} intensity={0.6} color="#ffaa66" />
        <pointLight position={[-4, 3, -2]} intensity={0.4} color="#6688ff" />
        <pointLight position={[4, 3, -2]} intensity={0.4} color="#ff8866" />
        
        {/* Luz do mouse */}
        <MouseLight mouseX={mouseX} mouseY={mouseY} />
        
        {/* Física - 15 charutos muito espalhados */}
        <Physics gravity={[0, -14, 0]}>
          <CollisionFloor />
          
          {CIGAR_POSITIONS.map((pos, i) => (
            <RealisticCigar
              key={i}
              position={pos}
              delay={DELAYS[i]}
              onLand={onCigarLand}
              index={i}
              mouseX={mouseX}
              mouseY={mouseY}
            />
          ))}
        </Physics>
      </Canvas>
    </div>
  )
}