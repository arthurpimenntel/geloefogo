'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AEProduct {
  id: string
  nameEn: string
  sku: string
  bigImage: string
  sellPrice: string
  nowPrice: string | null
  oneCategoryName: string | null
  twoCategoryName: string | null
  threeCategoryName: string | null
  warehouseInventoryNum: number
  totalVerifiedInventory: number
  supplierName: string
  listedNum: number
  detail_url: string | null
}

const SUGESTOES = [
  'hookah', 'shisha', 'grinder', 'rolling tray', 'herb grinder',
  'smoking pipe', 'water pipe', 'rolling paper', 'lighter', 'ashtray',
  'dab rig', 'bong', 'vaporizer', 'cigarette case', 'tobacco pipe',
]

export default function AliExpressImportPage() {
  const supabase = createClient()

  const [keyword,    setKeyword]    = useState('')
  const [minPrice,   setMinPrice]   = useState('')
  const [maxPrice,   setMaxPrice]   = useState('')
  const [markup,     setMarkup]     = useState('100')
  const [page,       setPage]       = useState(1)

  const [products,   setProducts]   = useState<AEProduct[]>([])
  const [total,      setTotal]      = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const [importing,  setImporting]  = useState<string | null>(null)
  const [imported,   setImported]   = useState<Set<string>>(new Set())
  const [supplierId, setSupplierId] = useState<string | null>(null)

  const getSupplierId = useCallback(async () => {
    if (supplierId) return supplierId
    const { data } = await supabase
      .from('suppliers')
      .select('id')
      .ilike('name', '%ali%express%')
      .single()
    if (data?.id) setSupplierId(data.id)
    return data?.id || null
  }, [supplierId, supabase])

  async function search(p = 1) {
    if (!keyword.trim()) return
    setLoading(true); setError(null); setPage(p)
    try {
      const params = new URLSearchParams({
        action: 'search',
        keyword: keyword.trim(),
        page: String(p),
        size: '20',
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
      })
      const res  = await fetch(`/api/aliexpress?${params}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (!data.result) throw new Error(data.message || 'Erro ao buscar produtos')
      const list = data.data?.list ?? []
      setProducts(list)
      setTotal(data.data?.totalRecords || 0)
      setTotalPages(Math.ceil((data.data?.totalRecords || 0) / 20))
    } catch (err: any) {
      setError(err.message); setProducts([])
    } finally {
      setLoading(false)
    }
  }

  async function importProduct(product: AEProduct) {
    setImporting(product.id)
    try {
      const sid = await getSupplierId()
      const res  = await fetch('/api/aliexpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, markup_pct: parseFloat(markup) || 100, supplier_id: sid }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Erro ao importar')
      setImported(prev => new Set([...prev, product.id]))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setImporting(null)
    }
  }

  function calcSalePrice(product: AEProduct) {
    const cost = parseFloat(product.sellPrice || product.nowPrice || '0')
    return (cost * (1 + (parseFloat(markup) || 100) / 100)).toFixed(2)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-playfair text-2xl text-[#1C1008]">Importar via AliExpress</h1>
        <p className="text-[#8C6D3F] text-sm mt-1">
          Busque produtos via AliExpress Affiliate e importe com um clique
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-[#E8DCC8] rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search(1)}
            placeholder="Buscar produto... ex: hookah, grinder, rolling tray"
            className="flex-1 bg-white border border-[#E8DCC8] rounded-xl text-[#1C1008] px-4 py-2.5
              text-sm focus:outline-none focus:border-[#C08D3A] transition-colors placeholder:text-[#B0916A]"
          />
          <button
            onClick={() => search(1)}
            disabled={loading || !keyword.trim()}
            className="px-6 py-2.5 bg-[#C08D3A] hover:bg-[#8C4A10] disabled:opacity-40
              text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {/* Sugestões */}
        <div className="flex flex-wrap gap-2 mb-4">
          {SUGESTOES.map(s => (
            <button
              key={s}
              onClick={() => { setKeyword(s); setTimeout(() => search(1), 50) }}
              className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-lg
                border border-[#D9C9A8] text-[#6B4F2A] hover:border-[#C08D3A]
                hover:bg-[#F5EFE6] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Filtros avançados */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[#8C6D3F] text-[10px] uppercase tracking-widest block mb-1">Preço mín (USD)</label>
            <input
              type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="0.00"
              className="w-full bg-white border border-[#E8DCC8] rounded-xl text-[#1C1008]
                px-3 py-2 text-sm focus:outline-none focus:border-[#C08D3A] transition-colors placeholder:text-[#B0916A]"
            />
          </div>
          <div>
            <label className="text-[#8C6D3F] text-[10px] uppercase tracking-widest block mb-1">Preço máx (USD)</label>
            <input
              type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="999.00"
              className="w-full bg-white border border-[#E8DCC8] rounded-xl text-[#1C1008]
                px-3 py-2 text-sm focus:outline-none focus:border-[#C08D3A] transition-colors placeholder:text-[#B0916A]"
            />
          </div>
          <div>
            <label className="text-[#8C6D3F] text-[10px] uppercase tracking-widest block mb-1">Markup (%)</label>
            <input
              type="number" value={markup} onChange={e => setMarkup(e.target.value)} placeholder="100"
              className="w-full bg-white border border-[#E8DCC8] rounded-xl text-[#1C1008]
                px-3 py-2 text-sm focus:outline-none focus:border-[#C08D3A] transition-colors placeholder:text-[#B0916A]"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-600 text-sm">
          ❌ {error}
          {error.includes('não autorizado') || error.includes('access_token') ? (
            <a href="/api/aliexpress/oauth?action=connect"
              className="ml-3 underline text-[#C08D3A] hover:text-[#8C4A10]">
              → Conectar AliExpress
            </a>
          ) : null}
        </div>
      )}

      {products.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[#8C6D3F] text-xs uppercase tracking-widest">
              {total.toLocaleString()} produtos encontrados · página {page} de {totalPages}
            </p>
            <p className="text-[#B0916A] text-[11px]">
              Markup atual: <span className="text-[#C08D3A] font-medium">{markup}%</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {products.map(product => {
              const cost        = parseFloat(product.sellPrice || product.nowPrice || '0')
              const salePrice   = calcSalePrice(product)
              const isImported  = imported.has(product.id)
              const isImporting = importing === product.id

              return (
                <div
                  key={product.id}
                  className={`bg-white border rounded-2xl shadow-sm transition-all flex flex-col overflow-hidden ${
                    isImported
                      ? 'border-green-300'
                      : 'border-[#E8DCC8] hover:border-[#C08D3A] hover:shadow-md'
                  }`}
                >
                  <div className="aspect-square relative bg-[#FAF7F2] overflow-hidden">
                    {product.bigImage ? (
                      <img
                        src={product.bigImage}
                        alt={product.nameEn}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#D9C9A8] text-3xl">📦</div>
                    )}
                    {isImported && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <span className="text-green-600 text-3xl">✓</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex flex-col flex-1">
                    <p className="text-[#1C1008] text-xs font-medium leading-tight mb-1 line-clamp-2">
                      {product.nameEn}
                    </p>
                    <p className="text-[#B0916A] text-[10px] mb-2 line-clamp-1">
                      {product.twoCategoryName || product.oneCategoryName || 'AliExpress'}
                    </p>

                    {product.detail_url && (
                      <a
                        href={product.detail_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-[#C08D3A] hover:text-[#8C4A10] text-[10px] mb-2 underline"
                      >
                        Ver no AliExpress ↗
                      </a>
                    )}

                    <div className="mt-auto space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#8C6D3F]">Custo AE:</span>
                        <span className="text-[#6B4F2A]">US$ {cost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#8C6D3F]">Venda (+{markup}%):</span>
                        <span className="text-[#8C4A10] font-semibold">US$ {salePrice}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#8C6D3F]">Vendas:</span>
                        <span className="text-[#6B4F2A]">{(product.listedNum ?? 0).toLocaleString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => importProduct(product)}
                      disabled={isImporting || isImported}
                      className={`mt-3 w-full py-2 text-[10px] font-bold uppercase tracking-widest
                        rounded-xl transition-colors ${
                          isImported
                            ? 'bg-green-50 text-green-600 border border-green-200 cursor-default'
                            : isImporting
                            ? 'bg-[#F5EFE6] text-[#B0916A] cursor-wait'
                            : 'bg-[#1C1008] hover:bg-[#3D2010] text-white'
                        }`}
                    >
                      {isImported ? '✓ Importado' : isImporting ? 'Importando...' : '+ Importar'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => search(page - 1)}
              disabled={page <= 1 || loading}
              className="px-4 py-2 border border-[#D9C9A8] rounded-xl text-[#6B4F2A] hover:border-[#C08D3A]
                hover:bg-[#F5EFE6] disabled:opacity-30 text-xs uppercase tracking-widest transition-colors"
            >
              ← Anterior
            </button>
            <span className="text-[#8C6D3F] text-xs px-4">{page} / {totalPages}</span>
            <button
              onClick={() => search(page + 1)}
              disabled={page >= totalPages || loading}
              className="px-4 py-2 border border-[#D9C9A8] rounded-xl text-[#6B4F2A] hover:border-[#C08D3A]
                hover:bg-[#F5EFE6] disabled:opacity-30 text-xs uppercase tracking-widest transition-colors"
            >
              Próxima →
            </button>
          </div>
        </>
      )}

      {!loading && products.length === 0 && !error && (
        <div className="text-center py-20 text-[#B0916A]">
          <p className="text-4xl mb-4">🛍️</p>
          <p className="text-sm uppercase tracking-widest">Busque um produto para começar a importar</p>
          <p className="text-xs mt-2">Tente: hookah, grinder, rolling tray, shisha...</p>
        </div>
      )}
    </div>
  )
}