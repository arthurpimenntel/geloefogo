'use client'
import { useEffect, useState } from 'react'

export function EmberLoader({ onDone }: { onDone?: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(timer)
          setTimeout(() => onDone?.(), 200)
          return 100
        }
        return p + 2
      })
    }, 40)
    return () => clearInterval(timer)
  }, [onDone])

  // Cor da brasa: cinza → laranja → vermelho conforme progresso
  const emberColor = progress < 40
    ? `rgb(${Math.round(80 + progress * 2)}, ${Math.round(60 + progress)}, ${Math.round(50 + progress)})`
    : progress < 70
    ? `rgb(${Math.round(200 + progress)}, ${Math.round(80 + progress * 0.8)}, 20)`
    : `rgb(240, ${Math.round(120 - (progress - 70) * 2)}, 10)`

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0D0805] flex flex-col items-center justify-center">
      <svg width="80" height="200" viewBox="0 0 80 200">
        {/* Corpo do charuto */}
        <rect x="30" y="40" width="20" height="130" rx="2" fill="#3D2010" />
        {/* Anel dourado */}
        <rect x="28" y="80" width="24" height="6" rx="1" fill="#C9963A" />
        {/* Ponta */}
        <path d="M35 40 Q40 20 45 40" fill="#2C1810" />
        {/* Brasa — cor animada */}
        <circle cx="40" cy="170" r="8" fill={emberColor} style={{ filter: 'blur(2px)' }} />
        <circle cx="40" cy="170" r="4" fill={emberColor} opacity="0.9" />

        {/* Faísca 1 */}
        {progress > 30 && (
          <circle cx="35" cy={160 - (progress - 30) * 1.5} r="1.5"
            fill="#FF8C00" opacity={1 - (progress - 30) / 70} />
        )}
        {/* Faísca 2 */}
        {progress > 45 && (
          <circle cx="46" cy={158 - (progress - 45) * 1.8} r="1"
            fill="#FFA500" opacity={1 - (progress - 45) / 55} />
        )}
      </svg>

      <p className="text-amber-700 text-xs uppercase tracking-[0.3em] mt-8 animate-pulse">
        Carregando
      </p>

      {/* Barra de progresso */}
      <div className="w-40 h-px bg-amber-900/30 mt-6 overflow-hidden">
        <div
          className="h-full bg-amber-600 transition-all duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
