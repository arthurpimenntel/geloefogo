'use client'
import { useRef, useCallback } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { MarqueeBand } from './MarqueeBand'
import { useCountUp } from '@/hooks/useCountUp'
import Link from 'next/link'

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const x = useSpring(rawX, { stiffness: 50, damping: 20 })
  const y = useSpring(rawY, { stiffness: 50, damping: 20 })

  const fgX = useTransform(x, v => v * 0.04)
  const fgY = useTransform(y, v => v * 0.04)

  const onMove = useCallback((e: React.MouseEvent) => {
    const r = containerRef.current!.getBoundingClientRect()
    const nx = (e.clientX - r.left) / r.width - 0.5
    const ny = (e.clientY - r.top) / r.height - 0.5
    rawX.set(nx * r.width)
    rawY.set(ny * r.height)
  }, [rawX, rawY])

  const { value: memberCount, ref: cRef } = useCountUp(4827)

  return (
    <section
      ref={containerRef}
      onMouseMove={onMove}
      onMouseLeave={() => { rawX.set(0); rawY.set(0) }}
      className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-[#0D0805]"
    >
      {/* ── Vídeo de fundo — desktop ── */}
      <video
        key="desktop-video"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover hidden md:block"
        style={{ opacity: 0.55 }}
      >
        <source src="/video/videodesktop.mp4" type="video/mp4" />
      </video>

      {/* ── Vídeo de fundo — mobile ── */}
      <video
        key="mobile-video"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover block md:hidden"
        style={{ opacity: 0.55 }}
      >
        <source src="/video/videomobile.mp4" type="video/mp4" />
      </video>

      {/* ── Overlay gradiente para escurecer as bordas e garantir legibilidade ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(to bottom,
              rgba(13,8,5,0.55) 0%,
              rgba(13,8,5,0.1)  35%,
              rgba(13,8,5,0.1)  65%,
              rgba(13,8,5,0.75) 100%
            )
          `,
        }}
      />

      {/* ── Overlay lateral esquerdo para o texto ficar sempre legível ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, rgba(13,8,5,0.7) 0%, rgba(13,8,5,0.2) 55%, transparent 100%)',
        }}
      />

      {/* ── Conteúdo com parallax suave no mouse ── */}
      <motion.div
        className="relative z-20 max-w-5xl mx-auto px-6 py-24 w-full"
        style={{ x: fgX, y: fgY }}
      >
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-amber-600 text-xs uppercase tracking-[0.25em] mb-4"
        >
          Tabacaria Premium
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35 }}
          className="font-playfair text-6xl md:text-8xl text-amber-100 leading-tight"
        >
          O prazer da<br />
          <span className="text-amber-400">qualidade</span><br />
          em cada tragada.
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="flex gap-4 mt-10"
        >
          <Link
            href="/catalogo"
            className="px-8 py-3 bg-amber-600 hover:bg-amber-500 transition-colors
              text-[#0D0805] font-semibold text-sm uppercase tracking-widest"
          >
            Ver Catálogo
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-16 flex gap-12"
        >
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
        </motion.div>
      </motion.div>

      {/* ── MarqueeBand fixa na base ── */}
      <div className="absolute bottom-0 left-0 right-0 z-30">
        <MarqueeBand />
      </div>
    </section>
  )
}