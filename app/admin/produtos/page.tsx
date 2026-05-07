'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Product {
  id: string
  name: string
  sku: string
  brand: string | null
  cost_price: number
  sale_price: number
  stock: number
  active: boolean
  featured: boolean
  images: string[] | null
  created_at: string
  category: { name: string; slug: string } | null
}

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function ProdutosAdminPage() {
  const router = useRouter()
  const supabase = createClient()

  const [products,     setProducts]     = useState<Product[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [search,       setSearch]       = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive' | 'featured'>('all')
  const [saving,       setSaving]       = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    let q = supabase
      .from('products')
      .select('id, name, sku, brand, cost_price, sale_price, stock, active, featured, images, created_at, category:categories(name, slug)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(300)

    if (filterActive === 'active')   q = q.eq('active', true)
    if (filterActive === 'inactive') q = q.eq('active', false)
    if (filterActive === 'featured') q = q.eq('featured', true)

    const { data, error: err } = await q

    if (err) {
      if (err.code === '42501' || err.message?.includes('policy')) {
        setError('⚠️ RLS bloqueando acesso admin. Execute a migration 003 no Supabase SQL Editor.')
      } else {
        setError(err.message)
      }
      setLoading(false)
      return
    }

    setProducts((data as any[]) || [])
    setLoading(false)
  }, [filterActive])

  useEffect(() => { load() }, [load])

  async function toggleField(id: string, field: 'active' | 'featured', value: boolean) {
    setSaving(id)
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
    const { error: err } = await supabase
      .from('products')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (err) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: !value } : p))
      alert('Erro ao salvar: ' + err.message)
    }
    setSaving(null)
  }

  async function deleteProduct(id: string) {
    if (!confirm('Remover este produto? Ele será marcado como deletado.')) return
    setSaving(id)
    const { error: err } = await supabase
      .from('products')
      .update({ deleted_at: new Date().toISOString(), active: false })
      .eq('id', id)
    if (err) { alert('Erro: ' + err.message); setSaving(null); return }
    setProducts(prev => prev.filter(p => p.id !== id))
    setSaving(null)
  }

  const filtered = products.filter(p => {
    if (!search.trim()) return true
    const s = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(s) ||
      p.sku.toLowerCase().includes(s) ||
      (p.brand || '').toLowerCase().includes(s)
    )
  })

  const activeCount   = products.filter(p => p.active).length
  const featuredCount = products.filter(p => p.featured).length
  const lowStockCount = products.filter(p => p.stock <= 5 && p.active).length

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-playfair text-2xl text-amber-100 font-semibold">Produtos</h1>
          <p className="text-amber-700 text-xs mt-1">
            {products.length} total · {activeCount} ativos · {featuredCount} em destaque
            {lowStockCount > 0 && (
              <span className="text-red-400 ml-2">· ⚡ {lowStockCount} com estoque baixo</span>
            )}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => router.push('/admin/produtos/novo')}
            className="px-5 py-2.5 rounded-xl border border-white/10 text-amber-500
              hover:border-amber-700/50 hover:text-amber-300 text-xs uppercase tracking-widest
              transition-all hover:bg-white/5"
          >
            + Novo Produto
          </button>
          <button
            onClick={() => router.push('/admin/produtos/importar')}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500
              text-[#0D0805] text-xs font-bold uppercase tracking-widest transition-colors"
          >
            ⬆ Importar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, SKU ou marca..."
          className="flex-1 min-w-[220px] bg-[#1E1208] border border-white/5 rounded-xl
            text-amber-200 text-sm px-4 py-2.5 focus:outline-none focus:border-amber-700/50
            transition-colors placeholder:text-amber-900"
        />
        {([
          { id: 'all',      label: 'Todos' },
          { id: 'active',   label: 'Ativos' },
          { id: 'inactive', label: 'Inativos' },
          { id: 'featured', label: '⭐ Destaque' },
        ] as const).map(f => (
          <button
            key={f.id}
            onClick={() => setFilterActive(f.id)}
            className={`px-4 py-2 text-xs uppercase tracking-widest rounded-xl border transition-all ${
              filterActive === f.id
                ? 'border-amber-600/60 text-amber-300 bg-amber-900/30'
                : 'border-white/5 text-amber-700 hover:border-amber-800/50 hover:text-amber-500 hover:bg-white/5'
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={load}
          className="px-4 py-2 text-xs uppercase tracking-widest rounded-xl border border-white/5
            text-amber-700 hover:text-amber-400 hover:border-amber-800/50 hover:bg-white/5 transition-all"
        >
          ↺
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-700/30 rounded-2xl px-5 py-4 text-red-300 text-sm mb-6">
          <p className="font-medium mb-1">❌ Erro ao carregar produtos</p>
          <p className="text-xs opacity-80">{error}</p>
          {error.includes('migration') && (
            <p className="mt-2 text-xs text-amber-500">
              Acesse Supabase → SQL Editor → execute o arquivo{' '}
              <code className="bg-amber-900/30 px-1 rounded">003_featured_and_rls_fix.sql</code>
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="bg-[#1E1208] border border-white/5 rounded-2xl p-16 text-center">
          <div className="text-4xl mb-3">📦</div>
          <p className="text-amber-700 text-sm">
            {search ? 'Nenhum produto encontrado para essa busca.' : 'Nenhum produto no catálogo ainda.'}
          </p>
          {!search && (
            <button
              onClick={() => router.push('/admin/produtos/importar')}
              className="mt-4 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500
                text-[#0D0805] text-xs font-bold uppercase tracking-widest transition-colors"
            >
              ⬆ Importar da CJ
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-amber-700 text-sm animate-pulse text-center py-16">
          Carregando produtos...
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div className="bg-[#1E1208] border border-white/5 rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-xs min-w-[760px]">
            <thead>
              <tr className="border-b border-white/5">
                {['Produto', 'SKU', 'Custo', 'Venda', 'Estoque', '⭐ Destaque', 'Ativo', 'Ações'].map(h => (
                  <th
                    key={h}
                    className="text-left py-3.5 px-4 text-amber-700 uppercase tracking-widest font-medium whitespace-nowrap text-[10px]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const isSaving = saving === p.id
                return (
                  <tr
                    key={p.id}
                    className={`border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors ${
                      !p.active ? 'opacity-40' : ''
                    } ${p.featured ? 'bg-amber-900/5' : ''}`}
                  >
                    {/* Produto */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {p.images?.[0] ? (
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-9 h-9 object-cover flex-shrink-0 rounded-lg"
                          />
                        ) : (
                          <div className="w-9 h-9 bg-amber-900/20 rounded-lg flex-shrink-0 flex items-center justify-center text-amber-800 text-[10px]">
                            ◆
                          </div>
                        )}
                        <div>
                          <p className="text-amber-200 max-w-[180px] truncate leading-tight">{p.name}</p>
                          {p.category && (
                            <p className="text-amber-800 text-[10px] mt-0.5">{(p.category as any)?.name}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="py-3 px-4 text-amber-700 font-mono whitespace-nowrap">{p.sku}</td>

                    {/* Custo */}
                    <td className="py-3 px-4 text-amber-600 whitespace-nowrap">{brl(p.cost_price)}</td>

                    {/* Venda */}
                    <td className="py-3 px-4 text-amber-400 font-medium whitespace-nowrap">{brl(p.sale_price)}</td>

                    {/* Estoque */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        p.stock === 0 ? 'bg-red-900/30 text-red-400' :
                        p.stock <= 5  ? 'bg-red-900/20 text-red-400' :
                        p.stock <= 20 ? 'bg-amber-900/30 text-amber-400' :
                        'bg-green-900/20 text-green-400'
                      }`}>
                        {p.stock}
                      </span>
                    </td>

                    {/* Destaque */}
                    <td className="py-3 px-4">
                      <button
                        disabled={isSaving}
                        onClick={() => toggleField(p.id, 'featured', !p.featured)}
                        title={p.featured ? 'Remover do destaque' : 'Colocar em destaque'}
                        className={`text-lg transition-all ${
                          isSaving ? 'opacity-40 cursor-not-allowed' : 'hover:scale-125 cursor-pointer'
                        }`}
                      >
                        {p.featured ? '⭐' : '☆'}
                      </button>
                    </td>

                    {/* Ativo toggle */}
                    <td className="py-3 px-4">
                      <button
                        disabled={isSaving}
                        onClick={() => toggleField(p.id, 'active', !p.active)}
                        title={p.active ? 'Clique para desativar' : 'Clique para ativar'}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          p.active ? 'bg-amber-600' : 'bg-white/10'
                        } ${isSaving ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span className={`inline-block h-3 w-3 rounded-full bg-white shadow transform transition-transform ${
                          p.active ? 'translate-x-5' : 'translate-x-1'
                        }`} />
                      </button>
                    </td>

                    {/* Ações */}
                    <td className="py-3 px-4">
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => router.push(`/admin/produtos/${p.id}`)}
                          className="px-3 py-1.5 rounded-lg border border-white/10 text-amber-600
                            hover:border-amber-700/50 hover:text-amber-400 transition-all
                            text-[10px] uppercase tracking-widest whitespace-nowrap hover:bg-white/5"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteProduct(p.id)}
                          disabled={isSaving}
                          className="px-2 py-1.5 rounded-lg border border-red-900/20 text-red-800
                            hover:border-red-700/50 hover:text-red-500 transition-all disabled:opacity-40"
                          title="Remover produto"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-amber-800 text-xs mt-3 text-right">
          {filtered.length} de {products.length} produtos
        </p>
      )}
    </div>
  )
}