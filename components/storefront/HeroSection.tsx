// components/HeroSection.tsx
'use client'
import { useRef, useCallback } from 'react'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import type { SmokeBackgroundHandle } from '@/components/effects/SmokeBackground'
import { MarqueeBand } from './MarqueeBand'
import { useCountUp } from '@/hooks/useCountUp'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Garante que o Canvas só renderiza no cliente
const CigarSceneDynamic = dynamic(
  () => import('./CigarScene').then(m => m.CigarScene),
  { ssr: false }
)

// SmokeBackground usa canvas + forwardRef — precisa de dynamic igual ao CigarScene
const SmokeBackgroundDynamic = dynamic(
  () => import('@/components/effects/SmokeBackground').then(m => m.SmokeBackground),
  { ssr: false }
)

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const smokeRef     = useRef<SmokeBackgroundHandle>(null)

  const mouseX = useRef(0)
  const mouseY = useRef(0)

  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const x = useSpring(rawX, { stiffness: 60, damping: 20 })
  const y = useSpring(rawY, { stiffness: 60, damping: 20 })

  const bgX  = useTransform(x, v => v * 0.015)
  const bgY  = useTransform(y, v => v * 0.015)
  const fgX  = useTransform(x, v => v * 0.08)
  const fgY  = useTransform(y, v => v * 0.08)

  const onMove = useCallback((e: React.MouseEvent) => {
    const r = containerRef.current!.getBoundingClientRect()
    const nx = (e.clientX - r.left) / r.width  - 0.5
    const ny = (e.clientY - r.top)  / r.height - 0.5
    mouseX.current = nx
    mouseY.current = -ny

    rawX.set((nx) * r.width)
    rawY.set((ny) * r.height)
  }, [rawX, rawY])

  const handleCigarLand = useCallback((index: number) => {
    if (!smokeRef.current?.addVelocity) return
    const uPositions = [0.35, 0.5, 0.65]
    const u = uPositions[index] ?? 0.5
    smokeRef.current.addVelocity(u, 0.85, 120, -80)
  }, [])

  const { value: memberCount, ref: cRef } = useCountUp(4827)

  return (
    <section
      ref={containerRef}
      onMouseMove={onMove}
      onMouseLeave={() => { rawX.set(0); rawY.set(0) }}
      className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-[#0D0805]"
      style={{ perspective: '1200px' }}
    >
      {/* Camada 0 — Textura de fundo com parallax suave */}
      <motion.div
        className="absolute inset-0 bg-[url('/texture/mogno.jpg')] bg-cover opacity-20"
        style={{ x: bgX, y: bgY }}
      />

      {/* Camada 1 — Fluido de fumaça */}
      <SmokeBackgroundDynamic
        ref={smokeRef}
        className="absolute inset-0 pointer-events-none opacity-70"
      />

      {/* Camada 2 — Cena 3D dos charutos (transparente) */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <CigarSceneDynamic
          mouseX={mouseX}
          mouseY={mouseY}
          onCigarLand={handleCigarLand}
        />
      </div>

      {/* Camada 3 — Conteúdo textual com parallax */}
      <motion.div
        className="relative z-20 max-w-5xl mx-auto px-6 py-24"
        style={{ x: fgX, y: fgY }}
      >
        <p className="text-amber-600 text-xs uppercase tracking-[0.25em] mb-4">
          Tabacaria Premium 
        </p>
        <h1 className="font-playfair text-6xl md:text-8xl text-amber-100 leading-tight">
          O prazer da<br />
          <span className="text-amber-400">qualidade</span><br />
          em cada tragada.
        </h1>
        <div className="flex gap-4 mt-10">
          <Link
            href="/catalogo"
            className="px-8 py-3 bg-amber-600 text-[#0D0805] font-semibold text-sm uppercase tracking-widest"
          >
            Ver Catálogo
          </Link>
        </div>
        <div className="mt-16 flex gap-12">
          <div>
            <span ref={cRef as any} className="font-playfair text-4xl text-amber-400">
              {memberCount.toLocaleString('pt-BR')}+
            </span>
            <p className="text-amber-700 text-xs uppercase tracking-widest mt-1">Clientes</p>
          </div>
          <div>
            <span className="font-playfair text-4xl text-amber-400">380+</span>
            <p className="text-amber-700 text-xs uppercase tracking-widest mt-1">Produtos</p>
          </div>
          <div>
            <span className="font-playfair text-4xl text-amber-400">27</span>
            <p className="text-amber-700 text-xs uppercase tracking-widest mt-1">Origens</p>
          </div>
        </div>
      </motion.div>

      {/* Camada 4 — MarqueeBand fixa na base */}
      <div className="absolute bottom-0 left-0 right-0 z-30">
        <MarqueeBand />
      </div>
    </section>
  )
}