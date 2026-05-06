'use client'

import { useState, useCallback, useRef } from 'react'
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
  warehouseInventoryNum: number
  listedNum: number
  detail_url: string | null
  supplierName: string
}

const CATEGORIAS = [
  { label: 'Grinders',       keyword: 'herb grinder metal' },
  { label: 'Narguilé',       keyword: 'hookah shisha set' },
  { label: 'Bandejas',       keyword: 'rolling tray smoking' },
  { label: 'Piteiras',       keyword: 'smoking pipe filter tip' },
  { label: 'Cinzeiros',      keyword: 'ashtray creative' },
  { label: 'Isqueiros',      keyword: 'lighter windproof' },
  { label: 'Papéis',         keyword: 'rolling paper cigarette' },
  { label: 'Dab / Wax',      keyword: 'dab rig wax vaporizer' },
  { label: 'Bongs',          keyword: 'glass water pipe bong' },
  { label: 'Estojos',        keyword: 'cigarette case holder' },
]

export default function ImportacaoMassaPage() {
  const supabase = createClient()

  const [keyword,    setKeyword]    = useState('')
  const [minPrice,   setMinPrice]   = useState('')
  const [maxPrice,   setMaxPrice]   = useState('')
  const [markup,     setMarkup]     = useState('100')
  const [page,       setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total,      setTotal]      = useState(0)

  const [products,   setProducts]   = useState<AEProduct[]>([])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const [selected,   setSelected]   = useState<Set<string>>(new Set())
  const [importing,  setImporting]  = useState(false)
  const [results,    setResults]    = useState<{ name: string; status: 'ok' | 'err'; msg?: string }[]>([])
  const [imported,   setImported]   = useState<Set<string>>(new Set())

  const [supplierId, setSupplierId] = useState<string | null>(null)
  const supplierLoaded = useRef(false)

  const getSupplier = useCallback(async () => {
    if (supplierId) return supplierId
    if (supplierLoaded.current) return null
    supplierLoaded.current = true
    const { data } = await supabase
      .from('suppliers')
      .select('id')
      .ilike('name', '%ali%express%')
      .maybeSingle()
    setSupplierId(data?.id ?? null)
    return data?.id ?? null
  }, [supplierId, supabase])

  async function search(p = 1) {
    if (!keyword.trim()) return
    setLoading(true); setError(null); setSelected(new Set()); setResults([])
    try {
      const params = new URLSearchParams({
        action: 'search', keyword: keyword.trim(),
        page: String(p), size: '40',
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
      })
      const res  = await fetch(`/api/aliexpress?${params}`)
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Erro na busca')
      const list = data.data?.list ?? []
      setProducts(list)
      setPage(p)
      setTotal(data.data?.totalRecords ?? 0)
      setTotalPages(Math.ceil((data.data?.totalRecords ?? 0) / 40))
    } catch (e: any) {
      setError(e.message); setProducts([])
    } finally {
      setLoading(false)
    }
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function toggleAll() {
    if (selected.size === products.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(products.map(p => p.id)))
    }
  }

  function selectCategory(kw: string) {
    setKeyword(kw)
    setTimeout(() => search(1), 50)
  }

  function calcSale(p: AEProduct) {
    const cost = parseFloat(p.sellPrice || p.nowPrice || '0')
    return (cost * (1 + (parseFloat(markup) || 100) / 100)).toFixed(2)
  }

  async function importSelected() {
    const toImport = products.filter(p => selected.has(p.id))
    if (!toImport.length) return
    setImporting(true); setResults([])
    const sid     = await getSupplier()
    const newRes: typeof results = []
    const newImported = new Set(imported)

    for (const product of toImport) {
      try {
        const res  = await fetch('/api/aliexpress', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            product,
            markup_pct:  parseFloat(markup) || 100,
            supplier_id: sid,
          }),
        })
        const data = await res.json()
        if (!res.ok || data.error) throw new Error(data.error)
        newRes.push({ name: data.product?.name ?? product.nameEn, status: 'ok' })
        newImported.add(product.id)
      } catch (e: any) {
        newRes.push({ name: product.nameEn, status: 'err', msg: e.message })
      }
    }

    setResults(newRes)
    setImported(newImported)
    setSelected(new Set())
    setImporting(false)
  }

  const okCount  = results.filter(r => r.status === 'ok').length
  const errCount = results.filter(r => r.status === 'err').length

  return (
    <div className="max-w-6xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-playfair text-2xl text-amber-100">Importação em massa — AliExpress</h1>
        <p className="text-amber-700 text-sm mt-1">
          Busque, selecione vários produtos e importe tudo de uma vez
        </p>
      </div>

      {/* Categorias rápidas */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIAS.map(c => (
          <button
            key={c.label}
            onClick={() => selectCategory(c.keyword)}
            className="text-[10px] uppercase tracking-widest px-3 py-1.5
              border border-amber-900/30 text-amber-700 hover:border-amber-500
              hover:text-amber-300 transition-colors"
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Barra de busca */}
      <div className="bg-[#1A0F08] border border-amber-900/20 p-5 mb-6">
        <div className="flex gap-3 mb-4">
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search(1)}
            placeholder="Buscar no AliExpress... ex: herb grinder, hookah, rolling tray"
            className="flex-1 bg-[#0D0805] border border-amber-900/40 text-amber-100
              px-4 py-2.5 text-sm focus:outline-none focus:border-amber-600
              placeholder:text-amber-900 transition-colors"
          />
          <button
            onClick={() => search(1)}
            disabled={loading || !keyword.trim()}
            className="px-6 py-2.5 bg-amber-700 hover:bg-amber-600
              disabled:opacity-40 text-[#0D0805] text-xs font-bold
              uppercase tracking-widest transition-colors"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-amber-800 text-[10px] uppercase tracking-widest block mb-1">
              Preço mín (USD)
            </label>
            <input
              type="number" value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
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
              type="number" value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
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
              type="number" value={markup}
              onChange={e => setMarkup(e.target.value)}
              className="w-full bg-[#0D0805] border border-amber-900/40 text-amber-100
                px-3 py-2 text-sm focus:outline-none focus:border-amber-600"
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

      {/* Resultados de importação */}
      {results.length > 0 && (
        <div className="mb-6 bg-[#1A0F08] border border-amber-900/20 p-4">
          <p className="text-amber-400 text-xs uppercase tracking-widest mb-3">
            {okCount} importados com sucesso · {errCount} com erro
          </p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {results.map((r, i) => (
              <p key={i} className={`text-xs ${r.status === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
                {r.status === 'ok' ? '✅' : '❌'} {r.name}
                {r.msg && <span className="text-red-600 ml-2">— {r.msg}</span>}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Grid de produtos */}
      {products.length > 0 && (
        <>
          {/* Barra de seleção */}
          <div className="flex items-center justify-between mb-4 bg-[#1A0F08]
            border border-amber-900/20 px-4 py-3">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.size === products.length && products.length > 0}
                  onChange={toggleAll}
                  className="accent-amber-500 w-3.5 h-3.5"
                />
                <span className="text-amber-700 text-xs uppercase tracking-widest">
                  {selected.size > 0
                    ? `${selected.size} de ${products.length} selecionados`
                    : 'Selecionar todos'}
                </span>
              </label>
              {selected.size > 0 && (
                <span className="text-amber-600 text-xs">
                  Venda estimada total: US${' '}
                  {products
                    .filter(p => selected.has(p.id))
                    .reduce((acc, p) => acc + parseFloat(calcSale(p)), 0)
                    .toFixed(2)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-amber-800 text-xs">
                {total.toLocaleString()} resultados · p. {page}/{totalPages}
              </span>
              {selected.size > 0 && (
                <button
                  onClick={importSelected}
                  disabled={importing}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500
                    disabled:opacity-50 text-[#0D0805] text-xs font-bold
                    uppercase tracking-widest transition-colors"
                >
                  {importing
                    ? 'Importando...'
                    : `⬆ Importar ${selected.size} produto${selected.size > 1 ? 's' : ''}`}
                </button>
              )}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-6">
            {products.map(product => {
              const cost       = parseFloat(product.sellPrice || product.nowPrice || '0')
              const sale       = calcSale(product)
              const isSelected = selected.has(product.id)
              const isImported = imported.has(product.id)

              return (
                <div
                  key={product.id}
                  onClick={() => !isImported && toggleOne(product.id)}
                  className={`relative flex flex-col cursor-pointer transition-all border ${
                    isImported
                      ? 'border-green-700/50 bg-[#1A0F08] opacity-60 cursor-default'
                      : isSelected
                      ? 'border-amber-500 bg-amber-900/20'
                      : 'border-amber-900/20 bg-[#1A0F08] hover:border-amber-800/60'
                  }`}
                >
                  {/* Checkbox */}
                  {!isImported && (
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(product.id)}
                        onClick={e => e.stopPropagation()}
                        className="accent-amber-500 w-3.5 h-3.5"
                      />
                    </div>
                  )}

                  {/* Badge importado */}
                  {isImported && (
                    <div className="absolute inset-0 bg-green-900/40 flex items-center
                      justify-center z-10">
                      <span className="text-green-300 text-2xl">✓</span>
                    </div>
                  )}

                  {/* Imagem */}
                  <div className="aspect-square bg-[#0D0805] overflow-hidden">
                    {product.bigImage
                      ? <img src={product.bigImage} alt={product.nameEn}
                          className="w-full h-full object-contain p-1" />
                      : <div className="w-full h-full flex items-center justify-center
                          text-amber-900 text-2xl">📦</div>
                    }
                  </div>

                  {/* Info */}
                  <div className="p-2.5 flex flex-col flex-1">
                    <p className="text-amber-200 text-[11px] font-medium leading-tight
                      line-clamp-2 mb-1">
                      {product.nameEn}
                    </p>

                    {product.detail_url && (
                      <a
                        href={product.detail_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-amber-800 hover:text-amber-500 text-[10px]
                          underline mb-1.5"
                      >
                        ver AE ↗
                      </a>
                    )}

                    <div className="mt-auto space-y-0.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-amber-800">Custo</span>
                        <span className="text-amber-600">US$ {cost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-amber-800">Venda</span>
                        <span className="text-amber-400 font-medium">US$ {sale}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-amber-800">Vendas</span>
                        <span className="text-amber-700">
                          {(product.listedNum ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <button
              onClick={() => search(page - 1)}
              disabled={page <= 1 || loading}
              className="px-4 py-2 border border-amber-900/30 text-amber-700
                hover:border-amber-600 disabled:opacity-30 text-xs
                uppercase tracking-widest transition-colors"
            >
              ← Anterior
            </button>
            <span className="text-amber-700 text-xs">{page} / {totalPages}</span>
            <button
              onClick={() => search(page + 1)}
              disabled={page >= totalPages || loading}
              className="px-4 py-2 border border-amber-900/30 text-amber-700
                hover:border-amber-600 disabled:opacity-30 text-xs
                uppercase tracking-widest transition-colors"
            >
              Próxima →
            </button>
          </div>
        </>
      )}

      {/* Estado vazio */}
      {!loading && products.length === 0 && !error && (
        <div className="text-center py-24 text-amber-900">
          <p className="text-5xl mb-4">🛍️</p>
          <p className="text-sm uppercase tracking-widest mb-2">
            Escolha uma categoria acima ou busque um termo
          </p>
          <p className="text-xs text-amber-900/60">
            Clique em Grinders, Narguilé, Bandejas... para carregar produtos automaticamente
          </p>
        </div>
      )}

      {loading && (
        <div className="text-center py-24 text-amber-700 text-xs uppercase tracking-widest animate-pulse">
          Buscando produtos no AliExpress...
        </div>
      )}
    </div>
  )
}