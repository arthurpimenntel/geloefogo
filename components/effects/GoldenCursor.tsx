'use client'
import { useEffect, useRef } from 'react'

interface Particle {
  x: number; y: number; life: number; size: number; vx: number; vy: number
}

export function GoldenCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let particles: Particle[] = []
    let animId: number
    let mx = 0, my = 0

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY
      for (let i = 0; i < 3; i++) {
        particles.push({
          x: mx, y: my,
          life: 40 + Math.random() * 20,
          size: 1.5 + Math.random() * 2.5,
          vx: (Math.random() - 0.5) * 1.2,
          vy: -Math.random() * 1.5 - 0.5
        })
      }
      if (particles.length > 200) particles.splice(0, 50)
    }
    window.addEventListener('mousemove', onMove)

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles = particles.filter(p => p.life > 0)
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.life--
        ctx.globalAlpha = p.life / 60
        ctx.fillStyle = '#C9963A'
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
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

  return <canvas ref={canvasRef}
    style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }} />
}