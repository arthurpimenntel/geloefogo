'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'

const CATEGORIES = [
  { label: 'Charutos',    slug: 'charutos' },
  { label: 'Cigarrilhas', slug: 'cigarrilhas' },
  { label: 'Cachimbos',   slug: 'cachimbos' },
  { label: 'Narguilés',   slug: 'narguiles' },
  { label: 'Acessórios',  slug: 'acessorios' },
  { label: 'Isqueiros',   slug: 'isqueiros' },
  { label: 'Kits',        slug: 'kits-presente' },
]

const INTENSITIES = [
  { label: 'Suave',      value: 'suave' },
  { label: 'Médio',      value: 'medio' },
  { label: 'Forte',      value: 'forte' },
  { label: 'Muito Forte',value: 'muito_forte' },
]

interface Props { mobile?: boolean }

export function CatalogFilters({ mobile }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)

  const currentCategory  = searchParams.get('categoria') ?? ''
  const currentIntensity = searchParams.get('intensidade') ?? ''
  const currentMin       = searchParams.get('preco_min') ?? ''
  const currentMax       = searchParams.get('preco_max') ?? ''

  const update = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (!value) params.delete(key)
    else params.set(key, value)
    params.delete('cursor')
    router.push(`/catalogo?${params.toString()}`)
  }, [router, searchParams])

  function clearAll() {
    router.push('/catalogo')
    setMobileOpen(false)
  }

  const activeCount = [currentCategory, currentIntensity, currentMin, currentMax].filter(Boolean).length

  const FiltersContent = () => (
    <div className="space-y-6">
      {activeCount > 0 && (
        <button onClick={clearAll}
          className="text-[11px] text-red-500 hover:text-red-300 uppercase tracking-widest transition-colors">
          ✕ Limpar filtros ({activeCount})
        </button>
      )}

      {/* Search */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-amber-600 mb-3">Busca</p>
        <input
          type="search"
          defaultValue={searchParams.get('q') ?? ''}
          placeholder="Buscar produto..."
          onKeyDown={e => {
            if (e.key === 'Enter') {
              update('q', (e.target as HTMLInputElement).value || null)
            }
          }}
          className="w-full bg-[#1A0F08] border border-amber-900/30 text-amber-200
            px-3 py-2 text-xs focus:outline-none focus:border-amber-600 transition-colors
            placeholder:text-amber-900"
        />
      </div>

      {/* Categories */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-amber-600 mb-3">Categoria</p>
        <div className="space-y-1">
          {CATEGORIES.map(c => (
            <button
              key={c.slug}
              onClick={() => update('categoria', currentCategory === c.slug ? null : c.slug)}
              className={`block w-full text-left px-3 py-2 text-xs uppercase tracking-widest
                transition-colors ${currentCategory === c.slug
                  ? 'text-amber-300 bg-amber-900/20 border-l-2 border-amber-600'
                  : 'text-amber-700 hover:text-amber-400 border-l-2 border-transparent'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Intensity */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-amber-600 mb-3">Intensidade</p>
        <div className="space-y-1">
          {INTENSITIES.map(i => (
            <button
              key={i.value}
              onClick={() => update('intensidade', currentIntensity === i.value ? null : i.value)}
              className={`block w-full text-left px-3 py-2 text-xs uppercase tracking-widest
                transition-colors ${currentIntensity === i.value
                  ? 'text-amber-300 bg-amber-900/20 border-l-2 border-amber-600'
                  : 'text-amber-700 hover:text-amber-400 border-l-2 border-transparent'}`}
            >
              {i.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-amber-600 mb-3">Preço (R$)</p>
        <div className="flex gap-2 items-center">
          <input type="number" min="0" placeholder="Min"
            defaultValue={currentMin}
            onBlur={e => update('preco_min', e.target.value || null)}
            className="w-full bg-[#1A0F08] border border-amber-900/30 text-amber-200
              px-3 py-2 text-xs focus:outline-none focus:border-amber-600 transition-colors
              placeholder:text-amber-900"
          />
          <span className="text-amber-800">—</span>
          <input type="number" min="0" placeholder="Máx"
            defaultValue={currentMax}
            onBlur={e => update('preco_max', e.target.value || null)}
            className="w-full bg-[#1A0F08] border border-amber-900/30 text-amber-200
              px-3 py-2 text-xs focus:outline-none focus:border-amber-600 transition-colors
              placeholder:text-amber-900"
          />
        </div>
      </div>
    </div>
  )

  // Mobile version: button + slide-in panel
  if (mobile) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(true)}
          className={`flex items-center gap-2 px-4 py-2 border text-xs uppercase tracking-widest
            transition-colors ${activeCount > 0
              ? 'border-amber-600 text-amber-400'
              : 'border-amber-900/40 text-amber-700 hover:border-amber-700'}`}
        >
          ⚙ Filtros{activeCount > 0 && ` (${activeCount})`}
        </button>

        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
              <motion.div
                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.28 }}
                className="fixed top-0 left-0 bottom-0 w-72 bg-[#0D0805] border-r border-amber-900/20 z-50 overflow-y-auto p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <p className="font-playfair text-amber-200">Filtros</p>
                  <button onClick={() => setMobileOpen(false)} className="text-amber-700 hover:text-amber-300 text-lg">✕</button>
                </div>
                <FiltersContent />
                <button onClick={() => setMobileOpen(false)}
                  className="mt-8 w-full py-3 bg-amber-700 hover:bg-amber-600 text-[#0D0805]
                    text-xs font-bold uppercase tracking-widest transition-colors">
                  Ver Resultados
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    )
  }

  // Desktop inline
  return <FiltersContent />
}
