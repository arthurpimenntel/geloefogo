'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface CJProduct {
  id: string
  nameEn: string
  sku: string
  spu: string
  bigImage: string
  sellPrice: string
  nowPrice: string
  oneCategoryName: string
  twoCategoryName: string
  threeCategoryName: string
  warehouseInventoryNum: number
  totalVerifiedInventory: number
  supplierName: string
  listedNum: number
}

const SUGESTOES = [
  'hookah', 'shisha', 'grinder', 'rolling tray', 'herb grinder',
  'smoking pipe', 'water pipe', 'rolling paper', 'lighter', 'ashtray',
  'dab rig', 'bong', 'vaporizer', 'cigarette case', 'tobacco pipe',
]

export default function CJImportPage() {
  const supabase = createClient()

  const [keyword,    setKeyword]    = useState('')
  const [minPrice,   setMinPrice]   = useState('')
  const [maxPrice,   setMaxPrice]   = useState('')
  const [markup,     setMarkup]     = useState('100')
  const [page,       setPage]       = useState(1)

  const [products,   setProducts]   = useState<CJProduct[]>([])
  const [total,      setTotal]      = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const [importing,  setImporting]  = useState<string | null>(null) // product id sendo importado
  const [imported,   setImported]   = useState<Set<string>>(new Set())
  const [supplierId, setSupplierId] = useState<string | null>(null)

  // Busca o supplier_id do CJ no banco
  const getSupplierId = useCallback(async () => {
    if (supplierId) return supplierId
    const { data } = await supabase
      .from('suppliers')
      .select('id')
      .ilike('name', '%cj%')
      .single()
    if (data?.id) setSupplierId(data.id)
    return data?.id || null
  }, [supplierId, supabase])

  async function search(p = 1) {
    if (!keyword.trim()) return
    setLoading(true)
    setError(null)
    setPage(p)

    try {
      const params = new URLSearchParams({
        action: 'search',
        keyword: keyword.trim(),
        page: String(p),
        size: '20',
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
      })
      const res  = await fetch(`/api/cj?${params}`)
      const data = await res.json()

      if (!data.result) throw new Error(data.message || 'Erro ao buscar produtos no CJ')

      const content = data.data?.content?.[0]?.productList || data.data?.list || []
      setProducts(content)
      setTotal(data.data?.totalRecords || 0)
      setTotalPages(data.data?.totalPages || 1)
    } catch (err: any) {
      setError(err.message)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  async function importProduct(product: CJProduct) {
    setImporting(product.id)
    try {
      const sid = await getSupplierId()
      const res = await fetch('/api/cj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product,
          markup_pct: parseFloat(markup) || 100,
          supplier_id: sid,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao importar')
      setImported(prev => new Set([...prev, product.id]))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setImporting(null)
    }
  }

  function calcSalePrice(product: CJProduct) {
    const cost = parseFloat(product.sellPrice || product.nowPrice || '0')
    return (cost * (1 + (parseFloat(markup) || 100) / 100)).toFixed(2)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-playfair text-2xl text-amber-100">Importar via CJDropshipping</h1>
        <p className="text-amber-700 text-sm mt-1">
          Busque produtos e importe com um clique para o catálogo
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-[#1A0F08] border border-amber-900/20 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search(1)}
            placeholder="Buscar produto... ex: hookah, grinder, rolling tray"
            className="flex-1 bg-[#0D0805] border border-amber-900/40 text-amber-100 px-4 py-2.5
              text-sm focus:outline-none focus:border-amber-600 placeholder:text-amber-900"
          />
          <button
            onClick={() => search(1)}
            disabled={loading || !keyword.trim()}
            className="px-6 py-2.5 bg-amber-700 hover:bg-amber-600 disabled:opacity-40
              text-[#0D0805] text-xs font-bold uppercase tracking-widest transition-colors"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {/* Sugestões rápidas */}
        <div className="flex flex-wrap gap-2 mb-4">
          {SUGESTOES.map(s => (
            <button
              key={s}
              onClick={() => { setKeyword(s); setTimeout(() => search(1), 50) }}
              className="text-[10px] uppercase tracking-widest px-2.5 py-1
                border border-amber-900/30 text-amber-700 hover:border-amber-600
                hover:text-amber-400 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Filtros avançados */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-amber-800 text-[10px] uppercase tracking-widest block mb-1">
              Preço mín (USD)
            </label>
            <input
              type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#0D0805] border border-amber-900/40 text-amber-100
                px-3 py-2 text-sm focus:outline-none focus:border-amber-600 placeholder:text-amber-900"
            />
          </div>
          <div>
            <label className="text-amber-800 text-[10px] uppercase tracking-widest block mb-1">
              Preço máx (USD)
            </label>
            <input
              type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
              placeholder="999.00"
              className="w-full bg-[#0D0805] border border-amber-900/40 text-amber-100
                px-3 py-2 text-sm focus:outline-none focus:border-amber-600 placeholder:text-amber-900"
            />
          </div>
          <div>
            <label className="text-amber-800 text-[10px] uppercase tracking-widest block mb-1">
              Markup (%)
            </label>
            <input
              type="number" value={markup} onChange={e => setMarkup(e.target.value)}
              placeholder="100"
              className="w-full bg-[#0D0805] border border-amber-900/40 text-amber-100
                px-3 py-2 text-sm focus:outline-none focus:border-amber-600 placeholder:text-amber-900"
            />
          </div>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="mb-4 bg-red-900/20 border border-red-800/40 px-4 py-3 text-red-300 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Resultados */}
      {products.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-amber-700 text-xs uppercase tracking-widest">
              {total.toLocaleString()} produtos encontrados · página {page} de {totalPages}
            </p>
            <p className="text-amber-800 text-[11px]">
              Markup atual: <span className="text-amber-500">{markup}%</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {products.map(product => {
              const cost      = parseFloat(product.sellPrice || product.nowPrice || '0')
              const salePrice = calcSalePrice(product)
              const isImported = imported.has(product.id)
              const isImporting = importing === product.id

              return (
                <div
                  key={product.id}
                  className={`bg-[#1A0F08] border transition-colors flex flex-col ${
                    isImported ? 'border-green-700/50' : 'border-amber-900/20 hover:border-amber-800/40'
                  }`}
                >
                  {/* Imagem */}
                  <div className="aspect-square relative bg-[#0D0805] overflow-hidden">
                    {product.bigImage ? (
                      <img
                        src={product.bigImage}
                        alt={product.nameEn}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-amber-900 text-3xl">
                        📦
                      </div>
                    )}
                    {isImported && (
                      <div className="absolute inset-0 bg-green-900/60 flex items-center justify-center">
                        <span className="text-green-300 text-2xl">✓</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 flex flex-col flex-1">
                    <p className="text-amber-200 text-xs font-medium leading-tight mb-1 line-clamp-2">
                      {product.nameEn}
                    </p>
                    <p className="text-amber-800 text-[10px] mb-2 line-clamp-1">
                      {product.threeCategoryName || product.twoCategoryName}
                    </p>

                    <div className="mt-auto space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-amber-800">Custo CJ:</span>
                        <span className="text-amber-600">US$ {cost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-amber-800">Venda (+{markup}%):</span>
                        <span className="text-amber-400 font-medium">US$ {salePrice}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-amber-800">Estoque:</span>
                        <span className={product.totalVerifiedInventory > 0 ? 'text-green-500' : 'text-red-500'}>
                          {product.totalVerifiedInventory ?? product.warehouseInventoryNum ?? '?'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => importProduct(product)}
                      disabled={isImporting || isImported}
                      className={`mt-3 w-full py-2 text-[10px] font-bold uppercase tracking-widest
                        transition-colors ${
                          isImported
                            ? 'bg-green-900/30 text-green-600 cursor-default'
                            : isImporting
                            ? 'bg-amber-900/40 text-amber-700 cursor-wait'
                            : 'bg-amber-700 hover:bg-amber-600 text-[#0D0805]'
                        }`}
                    >
                      {isImported ? '✓ Importado' : isImporting ? 'Importando...' : '+ Importar'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => search(page - 1)}
              disabled={page <= 1 || loading}
              className="px-4 py-2 border border-amber-900/30 text-amber-700 hover:border-amber-600
                disabled:opacity-30 text-xs uppercase tracking-widest transition-colors"
            >
              ← Anterior
            </button>
            <span className="text-amber-700 text-xs px-4">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => search(page + 1)}
              disabled={page >= totalPages || loading}
              className="px-4 py-2 border border-amber-900/30 text-amber-700 hover:border-amber-600
                disabled:opacity-30 text-xs uppercase tracking-widest transition-colors"
            >
              Próxima →
            </button>
          </div>
        </>
      )}

      {/* Estado vazio */}
      {!loading && products.length === 0 && !error && (
        <div className="text-center py-20 text-amber-900">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-sm uppercase tracking-widest">
            Busque um produto para começar a importar
          </p>
          <p className="text-xs mt-2">
            Tente: hookah, grinder, rolling tray, shisha...
          </p>
        </div>
      )}
    </div>
  )
}
