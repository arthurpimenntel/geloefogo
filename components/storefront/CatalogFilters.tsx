'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'

interface Props { mobile?: boolean }

export function CatalogFilters({ mobile }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)

  const currentMin = searchParams.get('preco_min') ?? ''
  const currentMax = searchParams.get('preco_max') ?? ''
  const currentQ   = searchParams.get('q') ?? ''

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

  const activeCount = [currentQ, currentMin, currentMax].filter(Boolean).length

  const FiltersContent = () => (
    <div className="space-y-7">
      {activeCount > 0 && (
        <button
          onClick={clearAll}
          className="text-[11px] text-[#1C1C1C] hover:text-[#C9A96E] uppercase tracking-widest transition-colors"
        >
          ✕ Limpar filtros ({activeCount})
        </button>
      )}

      {/* Busca */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#8B7355] mb-3">Busca</p>
        <input
          type="search"
          defaultValue={currentQ}
          placeholder="Buscar produto..."
          onKeyDown={e => {
            if (e.key === 'Enter')
              update('q', (e.target as HTMLInputElement).value || null)
          }}
          className="w-full bg-[#F5EFE6] border border-[#D4B896]/60 text-[#1C1C1C] px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] transition placeholder:text-[#B8A898]"
        />
      </div>

      {/* Preço */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#8B7355] mb-3">Preço (R$)</p>
        <div className="flex gap-2 items-center">
          <input
            type="number" min="0" placeholder="Min"
            defaultValue={currentMin}
            onBlur={e => update('preco_min', e.target.value || null)}
            className="w-full bg-[#F5EFE6] border border-[#D4B896]/60 text-[#1C1C1C] px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] placeholder:text-[#B8A898]"
          />
          <span className="text-[#B8A898] text-xs">—</span>
          <input
            type="number" min="0" placeholder="Máx"
            defaultValue={currentMax}
            onBlur={e => update('preco_max', e.target.value || null)}
            className="w-full bg-[#F5EFE6] border border-[#D4B896]/60 text-[#1C1C1C] px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] placeholder:text-[#B8A898]"
          />
        </div>
      </div>
    </div>
  )

  if (mobile) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(true)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-full text-xs uppercase tracking-widest transition-colors ${
            activeCount > 0
              ? 'border-[#C9A96E] text-[#1C1C1C]'
              : 'border-[#D4B896] text-[#8B7355] hover:border-[#8B7355]'
          }`}
        >
          ⚙ Filtros{activeCount > 0 && ` (${activeCount})`}
        </button>

        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.28 }}
                className="fixed top-0 left-0 bottom-0 w-72 bg-[#F5EFE6] border-r border-[#D4B896]/40 z-50 overflow-y-auto p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <p className="font-serif font-bold text-[#1C1C1C]">Filtros</p>
                  <button onClick={() => setMobileOpen(false)} className="text-[#8B7355] hover:text-[#1C1C1C] text-lg">✕</button>
                </div>
                <FiltersContent />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="mt-8 w-full py-3 bg-[#1C1C1C] text-[#F5EFE6] text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#2D2D2D] transition-colors"
                >
                  Ver Resultados
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    )
  }

  return <FiltersContent />
}