// components/storefront/BrazilMapSVG.tsx
'use client'
import { useRef, useCallback } from 'react'
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
  norte:      { label: 'Norte',        prazo: '25–55 dias úteis' },
  nordeste:   { label: 'Nordeste',     prazo: '22–45 dias úteis' },
  centroeste: { label: 'Centro-Oeste', prazo: '20–40 dias úteis' },
  sudeste:    { label: 'Sudeste',      prazo: '15–35 dias úteis' },
  sul:        { label: 'Sul',          prazo: '18–38 dias úteis' },
}

const REGION_COLORS: Record<string, string> = {
  norte:      '#D9CEBD',
  nordeste:   '#8B7355',
  centroeste: '#6B5A42',
  sudeste:    '#C9A96E',
  sul:        '#B8944F',
}

export function BrazilMapSVG() {
  const infoRef   = useRef<HTMLDivElement>(null)
  const labelRef  = useRef<HTMLParagraphElement>(null)
  // Tracks the currently hovered region (not state — region)
  const activeRef = useRef<string | null>(null)
  const pathsRef  = useRef<Map<string, SVGPathElement[]>>(new Map())

  // Resets all regions to their default colors
  const resetAll = useCallback(() => {
    pathsRef.current.forEach((paths, reg) => {
      paths.forEach(path => {
        path.style.fill        = REGION_COLORS[reg] ?? '#D9CEBD'
        path.style.stroke      = '#F5EFE6'
        path.style.strokeWidth = '0.5'
      })
    })
  }, [])

  // Highlights all paths for a given region
  const highlightRegion = useCallback((region: string) => {
    const paths = pathsRef.current.get(region) ?? []
    paths.forEach(path => {
      path.style.fill        = '#1C1C1C'
      path.style.stroke      = '#C9A96E'
      path.style.strokeWidth = '1.2'
    })
  }, [])

  const showInfo = useCallback((region: string | null) => {
    if (!infoRef.current || !labelRef.current) return
    if (region && REGION_INFO[region]) {
      const info = REGION_INFO[region]
      infoRef.current.innerHTML = `
        <div class="bg-white/70 backdrop-blur-sm border border-[#D4B896]/40 rounded-2xl px-8 py-4 shadow-sm">
          <p class="text-[#1C1C1C] font-serif font-bold text-base">${info.label}</p>
          <p class="text-[#8B7355] text-sm mt-0.5 tracking-wide">${info.prazo}</p>
        </div>
      `
      infoRef.current.style.opacity  = '1'
      labelRef.current.style.opacity = '0'
    } else {
      infoRef.current.style.opacity  = '0'
      labelRef.current.style.opacity = '1'
    }
  }, [])

  const handleEnter = useCallback((region: string) => {
    // Always reset first so previous highlighted region is fully cleared,
    // then highlight the new one — even if it's the same region (different state)
    resetAll()
    highlightRegion(region)
    activeRef.current = region
    showInfo(region)
  }, [resetAll, highlightRegion, showInfo])

  const handleLeave = useCallback(() => {
    resetAll()
    activeRef.current = null
    showInfo(null)
  }, [resetAll, showInfo])

  const registerPath = useCallback((region: string, el: SVGPathElement | null) => {
    if (!el) return
    if (!pathsRef.current.has(region)) {
      pathsRef.current.set(region, [])
    }
    const list = pathsRef.current.get(region)!
    if (!list.includes(el)) list.push(el)
  }, [])

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
                const uf     = geo.properties.sigla ?? geo.properties.UF_05 ?? geo.properties.SIGLA ?? ''
                const region = REGION_MAP[uf] ?? 'norte'

                return (
                  <Geography
                    key={geo.rsmKey ?? geo.id ?? geo.properties?.name}
                    geography={geo}
                    ref={(el: SVGPathElement | null) => registerPath(region, el)}
                    onMouseEnter={() => handleEnter(region)}
                    onMouseLeave={() => handleLeave()}
                    style={{
                      default: {
                        fill: REGION_COLORS[region],
                        stroke: '#F5EFE6',
                        strokeWidth: 0.5,
                        strokeOpacity: 0.6,
                        outline: 'none',
                        cursor: 'pointer',
                        transition: 'fill 0.12s ease-out, stroke 0.12s ease-out',
                      },
                      hover:   { outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                  />
                )
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      {/* Info panel — atualizado via DOM, sem re-render */}
      <div className="text-center min-h-[70px] flex items-center justify-center">
        {/* FIX: ambos ficam no mesmo flow (sem absolute), a visibilidade é controlada por opacity */}
        <div style={{ position: 'relative', minHeight: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            ref={infoRef}
            style={{ opacity: 0, transition: 'opacity 0.15s ease', position: 'absolute' }}
          />
          <p
            ref={labelRef}
            className="text-[#8B7355] text-xs tracking-[0.25em] uppercase"
            style={{ opacity: 1, transition: 'opacity 0.15s ease' }}
          >
            Passe o mouse sobre sua região
          </p>
        </div>
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