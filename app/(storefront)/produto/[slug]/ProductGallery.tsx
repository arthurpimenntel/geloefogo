'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  images: string[]
  productName: string
}

// ─── Lupa de Zoom ─────────────────────────────────────────────────
function LensZoom({ src, alt, active }: { src: string; alt: string; active: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [lens, setLens] = useState<{ x: number; y: number; show: boolean }>({ x: 0, y: 0, show: false })

  const LENS_SIZE = 150
  const ZOOM = 3

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setLens({ x: e.clientX - rect.left, y: e.clientY - rect.top, show: true })
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full cursor-crosshair select-none"
      onMouseMove={onMouseMove}
      onMouseLeave={() => setLens(l => ({ ...l, show: false }))}
    >
      <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />

      <AnimatePresence>
        {active && lens.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.12 }}
            className="absolute pointer-events-none rounded-full overflow-hidden border-2 border-[#C08D3A]/80 shadow-2xl shadow-black/40"
            style={{
              width: LENS_SIZE,
              height: LENS_SIZE,
              left: lens.x - LENS_SIZE / 2,
              top: lens.y - LENS_SIZE / 2,
              zIndex: 20,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundImage: `url(${src})`,
                backgroundSize: `${ZOOM * 100}%`,
                backgroundPosition: `${(lens.x / (containerRef.current?.offsetWidth ?? 1)) * 100}% ${(lens.y / (containerRef.current?.offsetHeight ?? 1)) * 100}%`,
                backgroundRepeat: 'no-repeat',
              }}
            />
            <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-[#C08D3A]/20" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!lens.show && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full pointer-events-none border border-[#E8DCC8]"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C08D3A" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            <span className="text-[#8C6D3F] text-[10px] uppercase tracking-widest">Zoom</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Lightbox (tela cheia) ─────────────────────────────────────────
function Lightbox({ images, index, onClose, onChange }: {
  images: string[]; index: number; onClose: () => void; onChange: (i: number) => void
}) {
  const touchStart = useRef<number | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onChange((index + 1) % images.length)
      if (e.key === 'ArrowLeft') onChange((index - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, images.length, onClose, onChange])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/96 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white/40 text-xs uppercase tracking-[0.3em]">
        {index + 1} / {images.length}
      </div>

      <button onClick={onClose}
        className="absolute top-5 right-6 text-white/50 hover:text-white transition-colors text-2xl z-10">✕</button>

      {images.length > 1 && (
        <button
          className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/20 bg-black/60 text-white/60 hover:border-white/50 hover:text-white flex items-center justify-center transition-all z-10 hover:scale-110"
          onClick={e => { e.stopPropagation(); onChange((index - 1 + images.length) % images.length) }}
        >←</button>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.96, x: 30 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.96, x: -30 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="relative w-[88vw] h-[80vh] max-w-4xl"
          onClick={e => e.stopPropagation()}
          onTouchStart={e => { touchStart.current = e.touches[0].clientX }}
          onTouchEnd={e => {
            if (touchStart.current === null) return
            const diff = touchStart.current - e.changedTouches[0].clientX
            if (Math.abs(diff) > 50) onChange(diff > 0 ? (index + 1) % images.length : (index - 1 + images.length) % images.length)
            touchStart.current = null
          }}
        >
          <Image src={images[index]} alt={`Imagem ${index + 1}`} fill className="object-contain" sizes="88vw" />
        </motion.div>
      </AnimatePresence>

      {images.length > 1 && (
        <button
          className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/20 bg-black/60 text-white/60 hover:border-white/50 hover:text-white flex items-center justify-center transition-all z-10 hover:scale-110"
          onClick={e => { e.stopPropagation(); onChange((index + 1) % images.length) }}
        >→</button>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[80vw] pb-1">
          {images.map((src, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); onChange(i) }}
              className={`flex-shrink-0 w-14 h-14 overflow-hidden rounded-lg transition-all duration-200 ${
                i === index ? 'ring-2 ring-[#C08D3A] ring-offset-2 ring-offset-black opacity-100' : 'opacity-35 hover:opacity-65'
              }`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ─── Galeria Principal ─────────────────────────────────────────────
export function ProductGallery({ images, productName }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const touchStart = useRef<number | null>(null)
  const imgs = images?.length ? images : []

  const prev = useCallback(() => setActiveIndex(i => (i - 1 + imgs.length) % imgs.length), [imgs.length])
  const next = useCallback(() => setActiveIndex(i => (i + 1) % imgs.length), [imgs.length])

  useEffect(() => {
    if (lightbox) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, next, prev])

  if (!imgs.length) {
    return (
      <div className="aspect-square bg-[#FAF7F2] border border-[#E8DCC8] rounded-2xl flex items-center justify-center text-[#C4A97A] text-6xl">◆</div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {/* Imagem principal */}
        <div
          className="relative aspect-square bg-white border border-[#E8DCC8] rounded-2xl overflow-hidden group shadow-sm"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={e => { touchStart.current = e.touches[0].clientX }}
          onTouchEnd={e => {
            if (touchStart.current === null) return
            const diff = touchStart.current - e.changedTouches[0].clientX
            if (Math.abs(diff) > 40) diff > 0 ? next() : prev()
            touchStart.current = null
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0"
            >
              <LensZoom src={imgs[activeIndex]} alt={productName} active={isHovered} />
            </motion.div>
          </AnimatePresence>

          {/* Botão expandir */}
          <button
            onClick={() => setLightbox(true)}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm border border-[#E8DCC8] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:border-[#C08D3A]/40 z-10 shadow-sm"
            title="Ver em tela cheia"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8C4A10" strokeWidth="2">
              <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>

          {/* Setas laterais */}
          {imgs.length > 1 && (
            <>
              <button onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-[#E8DCC8] bg-white/80 backdrop-blur-sm text-[#8C4A10] hover:border-[#C08D3A]/50 hover:text-[#1C1008] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10 shadow-sm">←</button>
              <button onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-[#E8DCC8] bg-white/80 backdrop-blur-sm text-[#8C4A10] hover:border-[#C08D3A]/50 hover:text-[#1C1008] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10 shadow-sm">→</button>
            </>
          )}

          {/* Dots */}
          {imgs.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {imgs.map((_, i) => (
                <button key={i} onClick={() => setActiveIndex(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === activeIndex ? 'w-5 h-1.5 bg-[#C08D3A]' : 'w-1.5 h-1.5 bg-[#D9C9A8] hover:bg-[#C08D3A]/60'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Contador */}
          {imgs.length > 1 && (
            <div className="absolute bottom-4 right-4 text-[#8C6D3F] text-[10px] tracking-widest bg-white/70 backdrop-blur-sm px-2 py-0.5 rounded-full z-10 border border-[#E8DCC8]">
              {activeIndex + 1}/{imgs.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {imgs.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {imgs.map((src, i) => (
              <motion.button
                key={i}
                onClick={() => setActiveIndex(i)}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.96 }}
                className={`flex-shrink-0 w-16 h-16 overflow-hidden rounded-xl transition-all duration-200 ${
                  i === activeIndex
                    ? 'ring-2 ring-[#C08D3A] ring-offset-2 ring-offset-white opacity-100'
                    : 'border border-[#E8DCC8] opacity-50 hover:opacity-80'
                }`}
              >
                <img src={src} alt={`${productName} – ${i + 1}`} className="w-full h-full object-cover" />
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightbox && (
          <Lightbox images={imgs} index={activeIndex} onClose={() => setLightbox(false)} onChange={setActiveIndex} />
        )}
      </AnimatePresence>
    </>
  )
}