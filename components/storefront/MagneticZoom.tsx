'use client'
import { useRef } from 'react'

export function MagneticZoom({ src, alt }: { src: string; alt: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef       = useRef<HTMLImageElement>(null)

  const onMove = (e: React.MouseEvent) => {
    const rect = containerRef.current!.getBoundingClientRect()
    const xPct = ((e.clientX - rect.left) / rect.width)  * 100
    const yPct = ((e.clientY - rect.top)  / rect.height) * 100
    const img  = imgRef.current!
    img.style.transformOrigin = `${xPct}% ${yPct}%`
    img.style.transform       = 'scale(2.4)'
  }

  const onLeave = () => {
    imgRef.current!.style.transform = 'scale(1)'
  }

  return (
    <div ref={containerRef}
      style={{ overflow:'hidden', cursor:'crosshair', borderRadius:0 }}
      onMouseMove={onMove} onMouseLeave={onLeave}>
      <img ref={imgRef} src={src} alt={alt}
        style={{ width:'100%', display:'block', transition:'transform 0.15s ease' }} />
    </div>
  )
}