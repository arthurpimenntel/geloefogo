'use client'
import { useRef, useEffect, useState } from 'react'

/**
 * ParallaxStoreBackground
 *
 * Técnica correta para simular background-attachment:fixed em iOS/Vercel:
 * - A imagem fica position:fixed (realmente pregada na viewport)
 * - Um clipPath via JS recorta a imagem para mostrar apenas a área da section
 * - Resultado: a imagem parece estática atrás de uma janela que se move
 */

export function ParallaxStoreBackground() {
  const imgDesktopRef = useRef<HTMLImageElement>(null)
  const imgMobileRef  = useRef<HTMLImageElement>(null)
  const overlayRef    = useRef<HTMLDivElement>(null)
  const sectionRef    = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile]   = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const update = () => {
      const rect = section.getBoundingClientRect()
      const { top, bottom, left, right } = rect

      // Clip em coordenadas de viewport — recorta a imagem fixed para a área da section
      const clip = `inset(${Math.max(0, top)}px ${window.innerWidth - right}px ${Math.max(0, window.innerHeight - bottom)}px ${left}px)`

      const img = isMobile ? imgMobileRef.current : imgDesktopRef.current
      if (img)        img.style.clipPath = clip

      if (overlayRef.current) overlayRef.current.style.clipPath = clip
    }

    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    update()

    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [isMobile])

  const fixedImgStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
    opacity: 0.35,
    pointerEvents: 'none',
    zIndex: 0,
    willChange: 'clip-path',
  }

  return (
    <>
      <style>{`
        #store-bg-desktop { display: block; }
        #store-bg-mobile  { display: none;  }
        @media (max-width: 767px) {
          #store-bg-desktop { display: none;  }
          #store-bg-mobile  { display: block; }
        }
      `}</style>

      {/* Referência da section */}
      <div
        ref={sectionRef}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}
      />

      {/* Imagem desktop — fixed na viewport, clipada para a section */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        id="store-bg-desktop"
        ref={imgDesktopRef}
        src="/images/fotodesktop.jpg"
        alt=""
        aria-hidden="true"
        style={fixedImgStyle}
      />

      {/* Imagem mobile — fixed na viewport, clipada para a section */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        id="store-bg-mobile"
        ref={imgMobileRef}
        src="/images/fotomobile.jpg"
        alt=""
        aria-hidden="true"
        style={{ ...fixedImgStyle, display: 'none' }}
      />

      {/* Overlay de contraste — também fixed e clipado */}
      <div
        ref={overlayRef}
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom, rgba(13,8,5,0.75) 0%, rgba(13,8,5,0.45) 50%, rgba(13,8,5,0.75) 100%)',
          pointerEvents: 'none',
          zIndex: 1,
          willChange: 'clip-path',
        }}
      />
    </>
  )
}