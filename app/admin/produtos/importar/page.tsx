'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ParsedProduct {
  name: string; sku: string; brand: string; description: string
  sale_price: string; cost_price: string; stock: string
  images: string; tags: string; origin_country: string
  intensity: string; category_slug: string
}
interface Supplier { id: string; name: string; type: string; active: boolean }
interface SkuResult { sku: string; status: 'success' | 'error' | 'pending'; productName?: string; message?: string }
interface CJCategory { categoryId: string; categoryName: string }
interface CJCategoryGroup { categoryFirstName: string; categoryFirstList: { categorySecondName: string; categorySecondList: CJCategory[] }[] }
interface CJProduct { id: string; nameEn: string; sku: string; spu: string; bigImage: string; sellPrice: string; nowPrice: string; listedNum: number; oneCategoryName?: string; twoCategoryName?: string; threeCategoryName?: string; supplierName?: string; warehouseInventoryNum?: number; totalVerifiedInventory?: number }

const REQUIRED_COLS = ['name', 'sku', 'sale_price']
const TEMPLATE_HEADERS = 'name,sku,brand,description,sale_price,compare_price,cost_price,stock,weight_g,intensity,origin_country,tags,images,category_slug'
const TEMPLATE_EXAMPLE = 'Cohiba Siglo VI,CUB-001,Cohiba,"O ápice da arte charuteira",890.00,1050.00,400.00,8,150,medio,Cuba,"Importado,Premium",https://exemplo.com/img.jpg,charutos'

type Tab = 'catcode' | 'category' | 'sku' | 'csv'

export default function ImportarProdutosPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get('tab') as Tab) ?? 'catcode'
  )

  // ── Shared ─────────────────────────────────────────────────────────────────
  const [suppliers,        setSuppliers]        = useState<Supplier[]>([])
  const [suppliersLoading, setSuppliersLoading] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<string>('')
  const [markupPct,        setMarkupPct]        = useState('40')

  useEffect(() => {
    setSuppliersLoading(true)
    fetch('/api/fornecedores')
      .then(r => r.json())
      .then((data: Supplier[]) => {
        const list = Array.isArray(data) ? data : []
        setSuppliers(list)
        if (list.length > 0) setSelectedSupplier(list[0].id)
      })
      .catch(() => {})
      .finally(() => setSuppliersLoading(false))
  }, [])

  const isCJ = suppliers.find(s => s.id === selectedSupplier)?.name?.toLowerCase().includes('cj') ?? false
  const isAE = suppliers.find(s => s.id === selectedSupplier)?.name?.toLowerCase().includes('aliexpress') ?? false

  // ── Shared supplier/markup panel ───────────────────────────────────────────
  const SupplierPanel = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-[#1A0F08] border border-amber-900/20 p-5">
        <label className="text-amber-400 text-xs uppercase tracking-widest block mb-3">Fornecedor</label>
        {suppliersLoading ? (
          <div className="text-amber-700 text-xs animate-pulse">Carregando...</div>
        ) : (
          <select value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)}
            className="w-full bg-[#0D0805] border border-amber-900/30 text-amber-200 text-sm px-3 py-2.5 focus:outline-none focus:border-amber-700 transition-colors appearance-none cursor-pointer">
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <p className="text-amber-800 text-xs mt-2">
          {isCJ ? '⚡ Integração direta via API CJDropshipping'
            : isAE ? '🛍️ Integração direta via API AliExpress Affiliate'
            : '📦 Importação via endpoint do fornecedor'}
        </p>
      </div>
      <div className="bg-[#1A0F08] border border-amber-900/20 p-5">
        <label className="text-amber-400 text-xs uppercase tracking-widest block mb-3">Markup (%)</label>
        <div className="flex items-center gap-3">
          <input type="number" min="0" max="500" value={markupPct} onChange={e => setMarkupPct(e.target.value)}
            className="w-full bg-[#0D0805] border border-amber-900/30 text-amber-200 text-sm px-3 py-2.5 focus:outline-none focus:border-amber-700 transition-colors [appearance:textfield]" />
          <span className="text-amber-600 text-sm">%</span>
        </div>
        <p className="text-amber-800 text-xs mt-2">Aplicado sobre o custo em BRL (custo USD × cotação)</p>
      </div>
    </div>
  )

  // ── CATCODE tab state ───────────────────────────────────────────────────────
  const [catCodeInput,    setCatCodeInput]    = useState('')
  const [catCodeQty,      setCatCodeQty]      = useState('20')
  const [catCodeProducts, setCatCodeProducts] = useState<CJProduct[]>([])
  const [catCodeLoading,  setCatCodeLoading]  = useState(false)
  const [catCodeError,    setCatCodeError]    = useState<string | null>(null)
  const [catCodeSelected, setCatCodeSelected] = useState<Set<string>>(new Set())
  const [catCodeImporting,setCatCodeImporting]= useState(false)
  const [catCodeResults,  setCatCodeResults]  = useState<{ name: string; status: 'success'|'error'; message?: string }[]>([])

  async function loadByCode() {
    const code = catCodeInput.trim()
    if (!code) { setCatCodeError(`Digite o código da categoria ${isCJ ? 'CJ' : 'AliExpress'}.`); return }
    const qty = Math.min(Math.max(parseInt(catCodeQty) || 20, 1), 100)
    setCatCodeLoading(true); setCatCodeError(null); setCatCodeProducts([]); setCatCodeSelected(new Set()); setCatCodeResults([])
    try {
      const api = isCJ ? 'cj' : isAE ? 'aliexpress' : 'cj'
      const res  = await fetch(`/api/${api}?action=category-products&categoryId=${encodeURIComponent(code)}&page=1&size=${qty}`)
      const data = await res.json()
      const list: CJProduct[] = data?.data?.list ?? []
      if (!data.result && !list.length) { setCatCodeError(data.message || 'Categoria não encontrada ou sem produtos.') }
      else if (list.length === 0) { setCatCodeError('Nenhum produto encontrado nesta categoria.') }
      else { setCatCodeProducts(list) }
    } catch { setCatCodeError('Erro de rede.') }
    finally { setCatCodeLoading(false) }
  }

  function toggleCatCode(id: string) {
    setCatCodeSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }

  function toggleAllCatCode() {
    setCatCodeSelected(
      catCodeSelected.size === catCodeProducts.length ? new Set() : new Set(catCodeProducts.map(p => p.id))
    )
  }

  async function importCatCodeSelected() {
    const toImport = catCodeProducts.filter(p => catCodeSelected.has(p.id))
    if (!toImport.length) return
    setCatCodeImporting(true); setCatCodeResults([])
    const results: typeof catCodeResults = []
    const api = isCJ ? 'cj' : 'aliexpress'
    for (const product of toImport) {
      try {
        const res  = await fetch(`/api/${api}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product, markup_pct: parseFloat(markupPct) || 40, supplier_id: selectedSupplier }),
        })
        const data = await res.json()
        if (data.error) results.push({ name: product.nameEn, status: 'error', message: data.error })
        else results.push({ name: data.product?.name ?? product.nameEn, status: 'success' })
      } catch (e: any) {
        results.push({ name: product.nameEn, status: 'error', message: e.message })
      }
    }
    setCatCodeResults(results)
    setCatCodeImporting(false)
    setCatCodeSelected(new Set())
  }

  // ── Category tab state ─────────────────────────────────────────────────────
  const [categories,          setCategories]          = useState<CJCategoryGroup[]>([])
  const [catLoading,          setCatLoading]           = useState(false)
  const [catError,            setCatError]             = useState<string | null>(null)
  const [openFirst,           setOpenFirst]            = useState<string | null>(null)
  const [openSecond,          setOpenSecond]           = useState<string | null>(null)
  const [selectedCat,         setSelectedCat]          = useState<CJCategory | null>(null)
  const [catSearch,           setCatSearch]            = useState('')
  const [catProducts,         setCatProducts]          = useState<CJProduct[]>([])
  const [catProductsPage,     setCatProductsPage]      = useState(1)
  const [catProductsTotal,    setCatProductsTotal]     = useState(0)
  const [catProductsLoading,  setCatProductsLoading]   = useState(false)
  const [selectedProducts,    setSelectedProducts]     = useState<Set<string>>(new Set())
  const [importing,           setImporting]            = useState(false)
  const [importResults,       setImportResults]        = useState<{ name: string; status: 'success'|'error'; message?: string }[]>([])
  const [catDebugMsg,         setCatDebugMsg]          = useState<string | null>(null)

  function loadCategories() {
    setCatLoading(true); setCatError(null)
    const api = isCJ ? 'cj' : isAE ? 'aliexpress' : 'cj'
    fetch(`/api/${api}?action=categories`)
      .then(r => r.json())
      .then(d => {
        if ((d.result || Array.isArray(d.data)) && Array.isArray(d.data)) setCategories(d.data)
        else setCatError(d.message || d.error || 'Erro ao carregar categorias')
      })
      .catch(() => setCatError('Erro de rede'))
      .finally(() => setCatLoading(false))
  }

  useEffect(() => {
    if (activeTab === 'category' && categories.length === 0) loadCategories()
  }, [activeTab, selectedSupplier])

  useEffect(() => {
    setCategories([])
    setSelectedCat(null)
    setCatProducts([])
  }, [selectedSupplier])

  function loadCategoryProducts(catId: string, catName: string, page = 1) {
    setCatProductsLoading(true)
    const api = isCJ ? 'cj' : isAE ? 'aliexpress' : 'cj'
    const params = new URLSearchParams({
      action: 'category-products',
      categoryId: catId,
      categoryName: catName,
      page: String(page),
      size: '20',
    })
    fetch(`/api/${api}?${params}`)
      .then(r => r.json())
      .then(d => {
        const list = d?.data?.list ?? []
        setCatProducts(list)
        setCatProductsTotal(d?.data?.totalRecords ?? 0)
        setCatProductsPage(page)
        setSelectedProducts(new Set())
        setImportResults([])
        setCatDebugMsg(list.length === 0 && d?.message ? d.message : null)
      })
      .catch(() => {})
      .finally(() => setCatProductsLoading(false))
  }

  function selectCategory(cat: CJCategory) {
    setSelectedCat(cat); setCatProducts([]); loadCategoryProducts(cat.categoryId, cat.categoryName, 1)
  }

  function toggleProduct(id: string) {
    setSelectedProducts(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }

  function toggleAll() {
    setSelectedProducts(selectedProducts.size === catProducts.length ? new Set() : new Set(catProducts.map(p => p.id)))
  }

  async function importSelected() {
    const toImport = catProducts.filter(p => selectedProducts.has(p.id))
    if (!toImport.length) return
    setImporting(true); setImportResults([])
    const results: typeof importResults = []
    const api = isCJ ? 'cj' : 'aliexpress'
    for (const product of toImport) {
      try {
        const res  = await fetch(`/api/${api}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product, markup_pct: parseFloat(markupPct) || 40, supplier_id: selectedSupplier }),
        })
        const data = await res.json()
        if (data.error) results.push({ name: product.nameEn, status: 'error', message: data.error })
        else results.push({ name: data.product?.name ?? product.nameEn, status: 'success' })
      } catch (e: any) {
        results.push({ name: product.nameEn, status: 'error', message: e.message })
      }
    }
    setImportResults(results); setImporting(false); setSelectedProducts(new Set())
  }

  const flatCategories: (CJCategory & { firstName: string; secondName: string })[] = []
  for (const first of categories) {
    for (const second of first.categoryFirstList ?? []) {
      for (const cat of second.categorySecondList ?? []) {
        flatCategories.push({ ...cat, firstName: first.categoryFirstName, secondName: second.categorySecondName })
      }
    }
  }
  const filteredFlat = catSearch.trim()
    ? flatCategories.filter(c =>
        c.categoryName.toLowerCase().includes(catSearch.toLowerCase()) ||
        c.firstName.toLowerCase().includes(catSearch.toLowerCase()) ||
        c.secondName.toLowerCase().includes(catSearch.toLowerCase())
      )
    : []

  // ── SKU tab state ──────────────────────────────────────────────────────────
  const [skuInput,     setSkuInput]     = useState('')
  const [skuImporting, setSkuImporting] = useState(false)
  const [skuResults,   setSkuResults]   = useState<SkuResult[]>([])
  const [skuError,     setSkuError]     = useState<string | null>(null)

  async function handleSkuImport() {
    const skus = skuInput.split('\n').map(s => s.trim()).filter(Boolean)
    if (!skus.length) { setSkuError('Digite pelo menos uma entrada.'); return }
    if (!selectedSupplier) { setSkuError('Selecione um fornecedor.'); return }
    setSkuImporting(true); setSkuError(null)
    setSkuResults(skus.map(sku => ({ sku, status: 'pending' })))

    for (let i = 0; i < skus.length; i++) {
      const sku = skus[i]
      try {
        let res: Response, data: any
        if (isCJ) {
          const isUrl  = sku.startsWith('http')
          const isUuid = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i.test(sku)
          const skuData = await fetch(`/api/cj?action=${isUrl || isUuid ? 'pid' : 'sku'}&${isUrl || isUuid ? 'pid' : 'sku'}=${encodeURIComponent(sku)}`).then(r => r.json())
          if (!skuData.result || !skuData.data?.product) {
            setSkuResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', message: skuData.message ?? 'Não encontrado' } : r))
            continue
          }
          res  = await fetch('/api/cj', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product: skuData.data.product, markup_pct: parseFloat(markupPct) || 40, supplier_id: selectedSupplier }) })
          data = await res.json()
        } else if (isAE) {
          const isUrl       = sku.startsWith('http')
          const isNumericId = /^\d{10,}$/.test(sku)
          const skuData = await fetch(`/api/aliexpress?action=${isUrl || isNumericId ? 'pid' : 'sku'}&${isUrl || isNumericId ? 'pid' : 'sku'}=${encodeURIComponent(sku)}`).then(r => r.json())
          if (skuData.error || !skuData.data?.product) {
            setSkuResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', message: skuData.error ?? skuData.message ?? 'Não encontrado' } : r))
            continue
          }
          res  = await fetch('/api/aliexpress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product: skuData.data.product, markup_pct: parseFloat(markupPct) || 40, supplier_id: selectedSupplier }) })
          data = await res.json()
        } else {
          res  = await fetch('/api/admin/produtos/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skus: [sku], supplier_id: selectedSupplier, markup_pct: parseFloat(markupPct) || 40, mode: 'sku' }) })
          data = await res.json()
        }
        if (!res!.ok || data.error) {
          setSkuResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', message: data.error ?? 'Erro' } : r))
        } else {
          setSkuResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'success', productName: data.product?.name ?? sku } : r))
        }
      } catch (err: any) {
        setSkuResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error', message: err.message } : r))
      }
    }
    setSkuImporting(false)
  }

  // ── CSV tab state ──────────────────────────────────────────────────────────
  const [parsed,       setParsed]       = useState<ParsedProduct[]>([])
  const [csvError,     setCsvError]     = useState<string | null>(null)
  const [csvImporting, setCsvImporting] = useState(false)
  const [csvResult,    setCsvResult]    = useState<{ added: number; errors: string[] } | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setCsvError(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const text  = ev.target?.result as string
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
        if (lines.length < 2) throw new Error('Arquivo vazio ou sem dados.')
        const hdrs    = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
        const missing = REQUIRED_COLS.filter(c => !hdrs.includes(c))
        if (missing.length > 0) throw new Error(`Colunas obrigatórias ausentes: ${missing.join(', ')}`)
        const rows: ParsedProduct[] = lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
          const obj: any = {}
          hdrs.forEach((h, i) => { obj[h] = vals[i] ?? '' })
          return obj as ParsedProduct
        }).filter(r => r.name && r.sku)
        setParsed(rows)
      } catch (err: any) { setCsvError(err.message); setParsed([]) }
    }
    reader.readAsText(file, 'UTF-8')
  }

  async function handleCsvImport() {
    if (!parsed.length) return
    setCsvImporting(true); setCsvError(null)
    try {
      const res  = await fetch('/api/admin/produtos/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: parsed }),
      })
      const data = await res.json()
      setCsvResult({ added: data.added ?? 0, errors: data.errors ?? [] })
      if (data.added > 0) setParsed([])
    } catch { setCsvError('Erro ao importar.') }
    finally { setCsvImporting(false) }
  }

  function downloadTemplate() {
    const csv  = TEMPLATE_HEADERS + '\n' + TEMPLATE_EXAMPLE
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = 'template_produtos.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const skuCount = skuInput.split('\n').filter(s => s.trim()).length

  // ── Product grid shared component ──────────────────────────────────────────
  function ProductGrid({
    products, selected, onToggle, onToggleAll, onImport, importing, results, loading, debugMsg,
  }: {
    products: CJProduct[]; selected: Set<string>
    onToggle: (id: string) => void; onToggleAll: () => void
    onImport: () => void; importing: boolean
    results: { name: string; status: 'success'|'error'; message?: string }[]
    loading?: boolean; debugMsg?: string | null
  }) {
    if (loading) return <div className="bg-[#1A0F08] border border-amber-900/20 p-12 text-center text-amber-700 text-sm animate-pulse">Carregando produtos...</div>
    return (
      <div>
        {results.length > 0 && (
          <div className="mb-4 bg-[#1A0F08] border border-amber-900/20 p-4">
            <p className="text-amber-400 text-xs uppercase tracking-widest mb-2">
              {results.filter(r => r.status === 'success').length} importados · {results.filter(r => r.status === 'error').length} erros
            </p>
            {results.map((r, i) => (
              <p key={i} className={`text-xs ${r.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {r.status === 'success' ? '✅' : '❌'} {r.name}{r.message ? ` — ${r.message}` : ''}
              </p>
            ))}
          </div>
        )}
        <div className="bg-[#1A0F08] border border-amber-900/20 overflow-hidden">
          <div className="px-4 py-3 border-b border-amber-900/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input type="checkbox"
                checked={products.length > 0 && selected.size === products.length}
                onChange={onToggleAll}
                className="accent-amber-500 w-3.5 h-3.5 cursor-pointer" />
              <span className="text-amber-700 text-xs uppercase tracking-widest">
                {selected.size > 0 ? `${selected.size} selecionado${selected.size > 1 ? 's' : ''}` : 'Selecionar todos'}
              </span>
            </div>
            {selected.size > 0 && (
              <button onClick={onImport} disabled={importing}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-[#0D0805] text-xs font-bold uppercase tracking-widest transition-colors">
                {importing ? 'Importando...' : `⬆ Importar ${selected.size}`}
              </button>
            )}
          </div>
          {products.length === 0 ? (
            <p className="text-amber-800 text-xs p-8 text-center">{debugMsg || 'Nenhum produto encontrado'}</p>
          ) : (
            products.map(p => (
              <div key={p.id} onClick={() => onToggle(p.id)}
                className={`flex items-center gap-4 px-4 py-3 border-b border-amber-900/10 cursor-pointer transition-colors ${
                  selected.has(p.id) ? 'bg-amber-900/20' : 'hover:bg-amber-900/10'
                }`}>
                <input type="checkbox" checked={selected.has(p.id)} onChange={() => {}}
                  className="accent-amber-500 w-3.5 h-3.5 flex-shrink-0 cursor-pointer" />
                {p.bigImage && (
                  <img src={p.bigImage} alt={p.nameEn} className="w-10 h-10 object-cover flex-shrink-0 bg-amber-900/20" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-amber-200 text-xs truncate">{p.nameEn}</p>
                  <p className="text-amber-800 text-[10px] font-mono">{p.sku || p.spu}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-amber-400 text-xs">US$ {parseFloat(p.sellPrice || p.nowPrice || '0').toFixed(2)}</p>
                  <p className="text-amber-800 text-[10px]">{p.listedNum ?? 0} vendas</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  const skuPlaceholder = isCJ
    ? 'CJNSSYWY01847\nhttps://cjdropshipping.com/product/detail.html?id=04A22450-...\n04A22450-67F0-4617-A132-E7AE7F8963B0'
    : isAE
    ? 'https://www.aliexpress.com/item/1005006123456789.html\n1005006123456789'
    : 'SKU-001\nSKU-002'

  const skuHelp = isCJ
    ? 'Aceita: SKU (ex: CJNSSYWY...), UUID ou URL da CJ'
    : isAE
    ? 'Aceita: URL do produto AliExpress ou ID numérico (ex: 1005006123456789)'
    : 'Um SKU por linha'

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="text-amber-700 hover:text-amber-400 text-xs uppercase tracking-widest transition-colors">← Voltar</button>
        <div>
          <h1 className="font-playfair text-2xl text-amber-100">Importar Produtos</h1>
          <p className="text-amber-700 text-xs mt-0.5">Via código de categoria, árvore de categorias, SKU ou CSV</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-amber-900/30 mb-8 overflow-x-auto">
        {([
          ['catcode',  '🔢 Código de Categoria'],
          ['category', '🗂 Árvore de Categorias'],
          ['sku',      '🔍 Por SKU / Link'],
          ['csv',      '📄 Por CSV'],
        ] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-xs uppercase tracking-widest transition-colors border-b-2 -mb-px whitespace-nowrap ${
              activeTab === tab ? 'border-amber-500 text-amber-300' : 'border-transparent text-amber-700 hover:text-amber-500'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── CATCODE TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'catcode' && (
        <div>
          <SupplierPanel />
          <div className="bg-[#1A0F08] border border-amber-900/20 p-5 mb-6">
            <p className="text-amber-400 text-xs uppercase tracking-widest mb-4">
              Buscar por Código de Categoria {isCJ ? 'CJ' : isAE ? 'AliExpress' : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="text-amber-700 text-xs block mb-1.5">Código da categoria</label>
                <input
                  value={catCodeInput}
                  onChange={e => setCatCodeInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadByCode()}
                  placeholder={isCJ ? 'Ex: 3228' : isAE ? 'Ex: 200001126' : 'Código da categoria'}
                  className="w-full bg-[#0D0805] border border-amber-900/30 text-amber-200 text-sm font-mono px-3 py-2.5 focus:outline-none focus:border-amber-700 transition-colors placeholder:text-amber-900"
                />
              </div>
              <div>
                <label className="text-amber-700 text-xs block mb-1.5">Qtd. máxima</label>
                <input type="number" min="1" max="100" value={catCodeQty} onChange={e => setCatCodeQty(e.target.value)}
                  className="w-full bg-[#0D0805] border border-amber-900/30 text-amber-200 text-sm px-3 py-2.5 focus:outline-none focus:border-amber-700 transition-colors [appearance:textfield]" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-amber-800 text-xs">
                {isCJ ? 'Encontre o código na URL da categoria em cjdropshipping.com'
                  : isAE ? 'Encontre o ID na URL da categoria em aliexpress.com'
                  : 'Informe o código da categoria do fornecedor'}
              </p>
              <button onClick={loadByCode} disabled={catCodeLoading}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-[#0D0805] text-xs font-bold uppercase tracking-widest transition-colors">
                {catCodeLoading ? 'Buscando...' : '🔍 Buscar'}
              </button>
            </div>
          </div>
          {catCodeError && <div className="bg-red-900/20 border border-red-700/40 px-5 py-3 text-red-300 text-sm mb-6">❌ {catCodeError}</div>}
          {catCodeProducts.length > 0 && (
            <div>
              <p className="text-amber-400 text-sm mb-4">
                {catCodeProducts.length} produto{catCodeProducts.length !== 1 ? 's' : ''} encontrado{catCodeProducts.length !== 1 ? 's' : ''}
                <span className="text-amber-800 text-xs ml-2">· código {catCodeInput}</span>
              </p>
              <ProductGrid
                products={catCodeProducts} selected={catCodeSelected}
                onToggle={toggleCatCode} onToggleAll={toggleAllCatCode}
                onImport={importCatCodeSelected} importing={catCodeImporting} results={catCodeResults}
              />
            </div>
          )}
        </div>
      )}

      {/* ── CATEGORY TAB ───────────────────────────────────────────────────── */}
      {activeTab === 'category' && (
        <div>
          <SupplierPanel />
          {catError && (
            <div className="bg-red-900/20 border border-red-700/40 px-5 py-3 text-red-300 text-sm mb-6 flex items-center justify-between">
              <span>❌ {catError}</span>
              <button onClick={loadCategories} className="text-amber-500 text-xs uppercase tracking-widest hover:text-amber-300">Tentar novamente</button>
            </div>
          )}
          {catLoading && <div className="text-amber-700 text-sm animate-pulse text-center py-12">Carregando categorias{isAE ? ' AliExpress' : ' CJ'}...</div>}
          {!catLoading && !catError && categories.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="bg-[#1A0F08] border border-amber-900/20">
                  <div className="p-4 border-b border-amber-900/20">
                    <input value={catSearch} onChange={e => setCatSearch(e.target.value)}
                      placeholder="Buscar categoria..."
                      className="w-full bg-[#0D0805] border border-amber-900/30 text-amber-200 text-xs px-3 py-2 focus:outline-none focus:border-amber-700 placeholder:text-amber-900" />
                  </div>
                  <div className="overflow-auto max-h-[500px]">
                    {catSearch.trim() ? (
                      filteredFlat.length === 0 ? (
                        <p className="text-amber-800 text-xs p-4">Nenhuma categoria encontrada</p>
                      ) : (
                        filteredFlat.map(cat => (
                          <button key={cat.categoryId} onClick={() => selectCategory(cat)}
                            className={`w-full text-left px-4 py-2.5 text-xs transition-colors border-b border-amber-900/10 ${
                              selectedCat?.categoryId === cat.categoryId ? 'bg-amber-900/30 text-amber-300' : 'text-amber-600 hover:bg-amber-900/20 hover:text-amber-400'
                            }`}>
                            <div className="text-amber-800 text-[10px]">{cat.firstName} › {cat.secondName}</div>
                            <div>{cat.categoryName}</div>
                            <div className="text-amber-900 text-[10px] font-mono">ID: {cat.categoryId}</div>
                          </button>
                        ))
                      )
                    ) : (
                      categories.map(first => (
                        <div key={first.categoryFirstName}>
                          <button onClick={() => setOpenFirst(openFirst === first.categoryFirstName ? null : first.categoryFirstName)}
                            className="w-full text-left px-4 py-3 text-xs text-amber-500 hover:text-amber-300 hover:bg-amber-900/10 transition-colors border-b border-amber-900/10 flex items-center justify-between font-medium uppercase tracking-wider">
                            <span>{first.categoryFirstName}</span>
                            <span className="text-amber-800">{openFirst === first.categoryFirstName ? '▲' : '▼'}</span>
                          </button>
                          {openFirst === first.categoryFirstName && (first.categoryFirstList ?? []).map(second => (
                            <div key={second.categorySecondName}>
                              <button onClick={() => setOpenSecond(openSecond === second.categorySecondName ? null : second.categorySecondName)}
                                className="w-full text-left px-6 py-2.5 text-xs text-amber-600 hover:text-amber-400 hover:bg-amber-900/10 transition-colors border-b border-amber-900/10 flex items-center justify-between">
                                <span>{second.categorySecondName}</span>
                                <span className="text-amber-800 text-[10px]">{openSecond === second.categorySecondName ? '▲' : '▼'}</span>
                              </button>
                              {openSecond === second.categorySecondName && (second.categorySecondList ?? []).map(cat => (
                                <button key={cat.categoryId} onClick={() => selectCategory(cat)}
                                  className={`w-full text-left px-8 py-2 text-xs transition-colors border-b border-amber-900/10 ${
                                    selectedCat?.categoryId === cat.categoryId ? 'bg-amber-900/30 text-amber-300' : 'text-amber-700 hover:bg-amber-900/20 hover:text-amber-400'
                                  }`}>
                                  <div>{cat.categoryName}</div>
                                  <div className="text-amber-900 text-[10px] font-mono">ID: {cat.categoryId}</div>
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2">
                {!selectedCat ? (
                  <div className="bg-[#1A0F08] border border-amber-900/20 p-12 text-center">
                    <div className="text-3xl mb-3">🗂</div>
                    <p className="text-amber-700 text-sm">Selecione uma categoria à esquerda</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-amber-300 text-sm font-medium">{selectedCat.categoryName}</p>
                        <p className="text-amber-700 text-xs">{catProductsTotal} produtos · Página {catProductsPage}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {catProductsPage > 1 && (
                          <button onClick={() => loadCategoryProducts(selectedCat.categoryId, selectedCat.categoryName, catProductsPage - 1)}
                            className="px-3 py-1.5 border border-amber-900/30 text-amber-600 hover:text-amber-400 text-xs transition-colors">← Ant</button>
                        )}
                        {catProducts.length === 20 && (
                          <button onClick={() => loadCategoryProducts(selectedCat.categoryId, selectedCat.categoryName, catProductsPage + 1)}
                            className="px-3 py-1.5 border border-amber-900/30 text-amber-600 hover:text-amber-400 text-xs transition-colors">Próx →</button>
                        )}
                      </div>
                    </div>
                    <ProductGrid
                      products={catProducts} selected={selectedProducts}
                      onToggle={toggleProduct} onToggleAll={toggleAll}
                      onImport={importSelected} importing={importing} results={importResults}
                      loading={catProductsLoading} debugMsg={catDebugMsg}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SKU TAB ─────────────────────────────────────────────────────────── */}
      {activeTab === 'sku' && (
        <div>
          <SupplierPanel />
          <div className="bg-[#1A0F08] border border-amber-900/20 p-5 mb-6">
            <label className="text-amber-400 text-xs uppercase tracking-widest block mb-3">
              {isCJ ? 'SKU, UUID ou URL da CJ' : isAE ? 'URL ou ID do AliExpress' : 'SKU'} — um por linha
            </label>
            <textarea value={skuInput} onChange={e => { setSkuInput(e.target.value); setSkuResults([]); setSkuError(null) }}
              placeholder={skuPlaceholder} rows={6}
              className="w-full bg-[#0D0805] border border-amber-900/30 text-amber-200 text-sm font-mono px-3 py-2.5 focus:outline-none focus:border-amber-700 transition-colors resize-none placeholder:text-amber-900" />
            <p className="text-amber-800 text-[11px] mt-2">{skuHelp}</p>
            <div className="flex items-center justify-between mt-4">
              <span className="text-amber-800 text-xs">{skuCount > 0 ? `${skuCount} item${skuCount > 1 ? 's' : ''} detectado${skuCount > 1 ? 's' : ''}` : 'Nenhum item inserido'}</span>
              <button onClick={handleSkuImport} disabled={skuImporting || skuCount === 0 || !selectedSupplier}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-[#0D0805] text-xs font-bold uppercase tracking-widest transition-colors">
                {skuImporting ? 'Importando...' : `⬆ Importar ${skuCount > 0 ? skuCount : ''}`}
              </button>
            </div>
          </div>
          {skuError && <div className="bg-red-900/20 border border-red-700/40 px-5 py-3 text-red-300 text-sm mb-6">❌ {skuError}</div>}
          {skuResults.length > 0 && (
            <div className="bg-[#1A0F08] border border-amber-900/20 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-amber-900/20">
                    {['SKU / Link', 'Produto', 'Status'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-amber-700 uppercase tracking-widest font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {skuResults.map((r, i) => (
                    <tr key={i} className="border-b border-amber-900/10">
                      <td className="py-2.5 px-4 text-amber-700 font-mono max-w-[200px] truncate">{r.sku}</td>
                      <td className="py-2.5 px-4 text-amber-200">{r.productName || '—'}</td>
                      <td className="py-2.5 px-4">
                        {r.status === 'pending' && <span className="text-amber-600 animate-pulse">⏳ Processando...</span>}
                        {r.status === 'success' && <span className="text-green-400">✅ Importado</span>}
                        {r.status === 'error'   && <span className="text-red-400">❌ {r.message ?? 'Erro'}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CSV TAB ─────────────────────────────────────────────────────────── */}
      {activeTab === 'csv' && (
        <div>
          <div className="bg-[#1A0F08] border border-amber-900/20 p-5 mb-6 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-amber-400 text-xs uppercase tracking-widest mb-1">Template CSV</p>
              <p className="text-amber-700 text-xs">Colunas obrigatórias: <code className="text-amber-500">name, sku, sale_price</code></p>
            </div>
            <button onClick={downloadTemplate}
              className="px-4 py-2 border border-amber-700 text-amber-500 hover:border-amber-500 hover:text-amber-300 text-xs uppercase tracking-widest transition-colors flex-shrink-0">
              ⬇ Baixar Template
            </button>
          </div>
          <div onClick={() => fileRef.current?.click()}
            className="bg-[#1A0F08] border-2 border-dashed border-amber-900/40 hover:border-amber-700 p-12 text-center cursor-pointer transition-colors mb-6 group">
            <div className="text-4xl mb-4">📄</div>
            <p className="text-amber-500 text-sm mb-1 group-hover:text-amber-300 transition-colors">Clique para selecionar seu arquivo CSV</p>
            <p className="text-amber-800 text-xs">Máximo: 5MB · Encoding: UTF-8</p>
            <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
          </div>
          {csvError && <div className="bg-red-900/20 border border-red-700/40 px-5 py-3 text-red-300 text-sm mb-6">❌ {csvError}</div>}
          {csvResult && (
            <div className={`border px-5 py-4 mb-6 ${csvResult.added > 0 ? 'bg-green-900/20 border-green-700/40' : 'bg-amber-900/20 border-amber-700/40'}`}>
              <p className="text-green-300 text-sm font-medium">✅ {csvResult.added} produtos importados com sucesso!</p>
              {csvResult.errors.length > 0 && (
                <ul className="mt-3 space-y-1">{csvResult.errors.slice(0,10).map((e, i) => <li key={i} className="text-amber-700 text-xs">{e}</li>)}</ul>
              )}
            </div>
          )}
          {parsed.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-amber-400 text-sm">{parsed.length} produtos prontos</p>
                <button onClick={handleCsvImport} disabled={csvImporting}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-[#0D0805] text-xs font-bold uppercase tracking-widest transition-colors">
                  {csvImporting ? 'Importando...' : `⬆ Importar ${parsed.length} Produtos`}
                </button>
              </div>
              <div className="bg-[#1A0F08] border border-amber-900/20 overflow-auto max-h-96">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[#1A0F08]">
                    <tr className="border-b border-amber-900/20">
                      {['Nome','SKU','Marca','Preço','Estoque','Tags'].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-amber-700 uppercase tracking-widest font-normal">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map((p, i) => (
                      <tr key={i} className="border-b border-amber-900/10 hover:bg-amber-900/10">
                        <td className="py-2.5 px-4 text-amber-200">{p.name}</td>
                        <td className="py-2.5 px-4 text-amber-700 font-mono">{p.sku}</td>
                        <td className="py-2.5 px-4 text-amber-600">{p.brand||'—'}</td>
                        <td className="py-2.5 px-4 text-amber-400">{parseFloat(p.sale_price||'0').toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
                        <td className="py-2.5 px-4 text-amber-500">{p.stock||'0'}</td>
                        <td className="py-2.5 px-4 text-amber-700">{p.tags||'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
