// components/storefront/BrazilMapSVG.tsx
'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { ComposableMap, Geographies, Geography } from '@vnedyalk0v/react19-simple-maps'
import geoData from '@/lib/brazil-states.json'

const REGION_MAP: Record<string, string> = {
  AC: 'norte', AM: 'norte', AP: 'norte', PA: 'norte',
  RO: 'norte', RR: 'norte', TO: 'norte',
  AL: 'nordeste', BA: 'nordeste', CE: 'nordeste', MA: 'nordeste',
  PB: 'nordeste', PE: 'nordeste', PI: 'nordeste', RN: 'nordeste', SE: 'nordeste',
  DF: 'centroeste', GO: 'centroeste', MS: 'centroeste', MT: 'centroeste',
  ES: 'sudeste', MG: 'sudeste', RJ: 'sudeste', SP: 'sudeste',
  PR: 'sul', RS: 'sul', SC: 'sul',
}

const REGION_INFO: Record<string, { label: string; prazo: string }> = {
  norte:      { label: 'Norte',        prazo: '7–12 dias úteis' },
  nordeste:   { label: 'Nordeste',     prazo: '5–8 dias úteis'  },
  centroeste: { label: 'Centro-Oeste', prazo: '4–6 dias úteis'  },
  sudeste:    { label: 'Sudeste',      prazo: '2–4 dias úteis'  },
  sul:        { label: 'Sul',          prazo: '3–5 dias úteis'  },
}

const REGION_COLORS: Record<string, string> = {
  norte:      '#D9CEBD',
  nordeste:   '#8B7355',
  centroeste: '#6B5A42',
  sudeste:    '#C9A96E',
  sul:        '#B8944F',
}

export function BrazilMapSVG() {
  const [hovered, setHovered] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = useCallback((region: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setHovered(region)
  }, [])

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setHovered(null), 50)
  }, [])

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [])

  const info = hovered ? REGION_INFO[hovered] : null

  return (
    <div className="flex flex-col items-center gap-4 w-full h-full">
      <div style={{ width: '100%', maxWidth: '600px', height: 'auto' }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 750, center: [-52, -14] }}
          width={600}
          height={560}
          style={{ width: '100%', height: 'auto' }}
        >
          <Geographies geography={geoData}>
            {({ geographies }) =>
              geographies.map(geo => {
                const uf = geo.properties.sigla ?? geo.properties.UF_05 ?? geo.properties.SIGLA ?? ''
                const region = REGION_MAP[uf] ?? 'norte'
                const isHovered = hovered === region

                return (
                  <Geography
                    key={geo.rsmKey ?? geo.id ?? geo.properties?.name}
                    geography={geo}
                    onMouseEnter={() => handleMouseEnter(region)}
                    onMouseLeave={handleMouseLeave}
                    style={{
                      default: {
                        fill: isHovered ? '#1C1C1C' : REGION_COLORS[region],
                        stroke: '#F5EFE6',
                        strokeWidth: isHovered ? 1.2 : 0.5,
                        strokeOpacity: isHovered ? 1 : 0.6,
                        outline: 'none',
                        cursor: 'pointer',
                        transition: 'fill 0.15s ease-out, stroke-width 0.1s ease-out',
                      },
                      hover: {
                        fill: '#1C1C1C',
                        stroke: '#C9A96E',
                        strokeWidth: 1.2,
                        outline: 'none',
                        cursor: 'pointer',
                      },
                      pressed: { outline: 'none' },
                    }}
                  />
                )
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      {/* Info de região */}
      <div className="text-center min-h-[70px] flex flex-col items-center justify-center">
        <div className={`transition-opacity duration-200 ${info ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {info && (
            <div className="bg-white/70 backdrop-blur-sm border border-[#D4B896]/40 rounded-2xl px-8 py-4 shadow-sm">
              <p className="text-[#1C1C1C] font-serif font-bold text-base">{info.label}</p>
              <p className="text-[#8B7355] text-sm mt-0.5 tracking-wide">{info.prazo}</p>
            </div>
          )}
        </div>
        {!info && (
          <p className="text-[#8B7355] text-xs tracking-[0.25em] uppercase">
            Passe o mouse sobre sua região
          </p>
        )}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap justify-center gap-5 mt-2">
        {Object.entries(REGION_INFO).map(([key, { label }]) => (
          <div key={key} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: REGION_COLORS[key] }} />
            <span className="text-sm text-[#8B7355] tracking-wide">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BrazilMapSVG