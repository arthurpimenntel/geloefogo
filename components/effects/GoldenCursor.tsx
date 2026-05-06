'use client'
import { useEffect, useRef } from 'react'

interface Ember {
  x: number; y: number; vx: number; vy: number
  life: number; maxLife: number; size: number
  r: number; g: number; b: number
}

interface Smoke {
  x: number; y: number; vx: number; vy: number
  life: number; maxLife: number
  size: number; startSize: number
  turbulence: number; angle: number
}

export function GoldenCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!

    // Detecta dispositivo fraco (mobile ou hardware concurrency baixo)
    const isLowEnd =
      navigator.hardwareConcurrency <= 4 ||
      /Mobi|Android/i.test(navigator.userAgent)

    if (isLowEnd) return // cursor normal, sem efeito

    let embers: Ember[] = []
    let smokes: Smoke[] = []
    let animId: number
    let mx = -999, my = -999
    let lastX = -999, lastY = -999
    let frame = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const onMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY

      const dx = mx - lastX
      const dy = my - lastY
      const speed = Math.sqrt(dx * dx + dy * dy)
      const spawnCount = Math.min(Math.floor(speed * 0.3) + 1, 4)

      // Emite brasas
      for (let i = 0; i < spawnCount; i++) {
        const heat = Math.random()
        embers.push({
          x: mx + (Math.random() - 0.5) * 4,
          y: my + (Math.random() - 0.5) * 4,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -Math.random() * 1.2 - 0.4,
          life: 30 + Math.random() * 25,
          maxLife: 55,
          size: 1.2 + Math.random() * 1.6,
          r: 255,
          g: Math.floor(80 + heat * 120), // laranja → amarelo
          b: Math.floor(heat * 40),
        })
      }

      // Emite fumaça com delay simulado (nasce onde a brasa está)
      if (frame % 3 === 0) {
        smokes.push({
          x: mx + (Math.random() - 0.5) * 6,
          y: my - 4,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.6 - Math.random() * 0.5,
          life: 80 + Math.random() * 60,
          maxLife: 140,
          size: 2 + Math.random() * 2,
          startSize: 2 + Math.random() * 2,
          turbulence: (Math.random() - 0.5) * 0.05,
          angle: Math.random() * Math.PI * 2,
        })
      }

      lastX = mx; lastY = my
    }
    window.addEventListener('mousemove', onMove)

    const loop = () => {
      frame++
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // --- Fumaça ---
      smokes = smokes.filter(s => s.life > 0)
      for (const s of smokes) {
        const t = 1 - s.life / s.maxLife
        s.x += s.vx + Math.sin(s.angle + t * 4) * 0.3
        s.y += s.vy
        s.vy *= 0.995          // desacelera levemente
        s.vx += s.turbulence   // deriva lateral orgânica
        s.angle += 0.03
        s.size = s.startSize + t * 18   // expande muito
        s.life--

        // Fumaça: começa invisível, fica visível, some
        const fadeIn  = Math.min(t * 6, 1)
        const fadeOut = s.life / s.maxLife
        const alpha   = fadeIn * fadeOut * 0.18

        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size)
        grad.addColorStop(0,   `rgba(160,140,130,${alpha})`)
        grad.addColorStop(0.5, `rgba(120,110,105,${alpha * 0.6})`)
        grad.addColorStop(1,   `rgba(80,75,70,0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
        ctx.fill()
      }

      // --- Brasas ---
      embers = embers.filter(p => p.life > 0)
      for (const p of embers) {
        p.x += p.vx
        p.y += p.vy
        p.vy -= 0.02      // sobe (calor)
        p.vx *= 0.98      // atrito lateral
        p.life--

        const t = p.life / p.maxLife
        // esfria: amarelo → laranja → vermelho → apaga
        const alpha = t * t
        const rr = p.r
        const gg = Math.floor(p.g * t)
        const bb = p.b

        // brilho central
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2)
        grad.addColorStop(0,   `rgba(${rr},${gg < 20 ? 20 : gg},${bb},${alpha})`)
        grad.addColorStop(0.4, `rgba(${rr},${Math.floor(gg * 0.4)},0,${alpha * 0.6})`)
        grad.addColorStop(1,   `rgba(80,0,0,0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalAlpha = 1
      animId = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}
    />
  )
}