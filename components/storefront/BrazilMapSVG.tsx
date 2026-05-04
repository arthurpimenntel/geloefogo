// components/storefront/BrazilMapSVG.tsx
'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'

const GEO_URL = 'https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/brazil-states.geojson'

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
  norte:      '#4a2010',
  nordeste:   '#3d1a0c',
  centroeste: '#452008',
  sudeste:    '#4a1c0a',
  sul:        '#401e0a',
}

export function BrazilMapSVG() {
  const [hovered, setHovered] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
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
      {/* Container ocupa 100% da largura do pai sem maxWidth restritivo */}
      <div style={{ width: '100%', height: '100%', minHeight: '600px' }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 850, center: [-52, -16] }}
          width={700}
          height={680}
          style={{ width: '100%', height: '100%' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => {
                const uf = geo.properties.sigla ?? geo.properties.UF_05 ?? geo.properties.SIGLA ?? ''
                const region = REGION_MAP[uf] ?? 'norte'
                const isHovered = hovered === region
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => handleMouseEnter(region)}
                    onMouseLeave={handleMouseLeave}
                    style={{
                      default: {
                        fill: isHovered ? '#C9963A' : REGION_COLORS[region],
                        stroke: '#C9963A',
                        strokeWidth: isHovered ? 1.2 : 0.5,
                        strokeOpacity: isHovered ? 0.9 : 0.4,
                        outline: 'none',
                        cursor: 'pointer',
                        transition: 'fill 0.15s ease-out, stroke-width 0.1s ease-out',
                      },
                      hover: {
                        fill: '#C9963A',
                        stroke: '#C9963A',
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

      <div className="text-center min-h-[70px] flex flex-col items-center justify-center">
        <div className={`transition-opacity duration-200 ${info ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {info && (
            <>
              <p className="text-amber-300 font-medium text-base">{info.label}</p>
              <p className="text-amber-600 text-sm mt-0.5">{info.prazo}</p>
            </>
          )}
        </div>
        {!info && (
          <p className="text-amber-800 text-xs tracking-widest uppercase">
            Passe o mouse sobre sua região
          </p>
        )}
      </div>
    </div>
  )
}