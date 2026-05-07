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
    setLoading(true); setError(null)
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
      setError(err.code === '42501' || err.message?.includes('policy')
        ? '⚠️ RLS bloqueando acesso admin. Execute a migration 003 no Supabase SQL Editor.'
        : err.message)
      setLoading(false); return
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
    return p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) || (p.brand || '').toLowerCase().includes(s)
  })

  const activeCount   = products.filter(p => p.active).length
  const featuredCount = products.filter(p => p.featured).length
  const lowStockCount = products.filter(p => p.stock <= 5 && p.active).length

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-playfair text-2xl text-[#1C1008] font-semibold">Produtos</h1>
          <p className="text-[#8C6D3F] text-xs mt-1">
            {products.length} total · {activeCount} ativos · {featuredCount} em destaque
            {lowStockCount > 0 && <span className="text-red-500 ml-2">· ⚡ {lowStockCount} com estoque baixo</span>}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => router.push('/admin/produtos/novo')}
            className="px-5 py-2.5 rounded-xl border border-[#D9C9A8] text-[#6B4F2A]
              hover:border-[#C08D3A] hover:text-[#1C1008] hover:bg-[#F5EFE6]
              text-xs uppercase tracking-widest transition-all">
            + Novo Produto
          </button>
          <button onClick={() => router.push('/admin/produtos/importar')}
            className="px-5 py-2.5 rounded-xl bg-[#1C1008] hover:bg-[#3D2010]
              text-white text-xs font-bold uppercase tracking-widest transition-colors">
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
          className="flex-1 min-w-[220px] bg-white border border-[#E8DCC8] rounded-xl
            text-[#1C1008] text-sm px-4 py-2.5 focus:outline-none focus:border-[#C08D3A]
            transition-colors placeholder:text-[#C4A97A]"
        />
        {([
          { id: 'all',      label: 'Todos' },
          { id: 'active',   label: 'Ativos' },
          { id: 'inactive', label: 'Inativos' },
          { id: 'featured', label: '⭐ Destaque' },
        ] as const).map(f => (
          <button key={f.id} onClick={() => setFilterActive(f.id)}
            className={`px-4 py-2 text-xs uppercase tracking-widest rounded-xl border transition-all ${
              filterActive === f.id
                ? 'border-[#C08D3A] text-[#1C1008] bg-[#F5EFE6]'
                : 'border-[#E8DCC8] text-[#8C6D3F] hover:border-[#C08D3A]/50 hover:bg-[#FAF7F2]'
            }`}>
            {f.label}
          </button>
        ))}
        <button onClick={load}
          className="px-4 py-2 text-xs uppercase tracking-widest rounded-xl border border-[#E8DCC8]
            text-[#8C6D3F] hover:text-[#1C1008] hover:border-[#C08D3A]/50 hover:bg-[#FAF7F2] transition-all">
          ↺
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-700 text-sm mb-6">
          <p className="font-medium mb-1">❌ Erro ao carregar produtos</p>
          <p className="text-xs opacity-80">{error}</p>
          {error.includes('migration') && (
            <p className="mt-2 text-xs text-[#8C4A10]">
              Acesse Supabase → SQL Editor → execute{' '}
              <code className="bg-orange-100 px-1 rounded">003_featured_and_rls_fix.sql</code>
            </p>
          )}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="bg-white border border-[#E8DCC8] rounded-2xl p-16 text-center shadow-sm">
          <div className="text-4xl mb-3">📦</div>
          <p className="text-[#8C6D3F] text-sm">
            {search ? 'Nenhum produto encontrado para essa busca.' : 'Nenhum produto no catálogo ainda.'}
          </p>
          {!search && (
            <button onClick={() => router.push('/admin/produtos/importar')}
              className="mt-4 px-6 py-2.5 rounded-xl bg-[#1C1008] hover:bg-[#3D2010]
                text-white text-xs font-bold uppercase tracking-widest transition-colors">
              ⬆ Importar da CJ
            </button>
          )}
        </div>
      )}

      {loading && (
        <div className="text-[#8C6D3F] text-sm animate-pulse text-center py-16">Carregando produtos...</div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div className="bg-white border border-[#E8DCC8] rounded-2xl overflow-hidden overflow-x-auto shadow-sm">
          <table className="w-full text-xs min-w-[760px]">
            <thead>
              <tr className="border-b border-[#EDE4D0] bg-[#FAF7F2]">
                {['Produto', 'SKU', 'Custo', 'Venda', 'Estoque', '⭐', 'Ativo', 'Ações'].map(h => (
                  <th key={h}
                    className="text-left py-3.5 px-4 text-[#8C6D3F] uppercase tracking-widest font-medium whitespace-nowrap text-[10px]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const isSaving = saving === p.id
                return (
                  <tr key={p.id}
                    className={`border-b border-[#F0E8D8] hover:bg-[#FAF7F2] transition-colors ${
                      !p.active ? 'opacity-40' : ''
                    } ${p.featured ? 'bg-amber-50/50' : ''}`}>
                    {/* Produto */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name}
                            className="w-9 h-9 object-cover flex-shrink-0 rounded-lg border border-[#E8DCC8]" />
                        ) : (
                          <div className="w-9 h-9 bg-[#F5EFE6] rounded-lg flex-shrink-0 flex items-center justify-center text-[#C4A97A] text-[10px]">◆</div>
                        )}
                        <div>
                          <p className="text-[#1C1008] max-w-[180px] truncate leading-tight font-medium">{p.name}</p>
                          {p.category && <p className="text-[#B0916A] text-[10px] mt-0.5">{(p.category as any)?.name}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#8C6D3F] font-mono whitespace-nowrap">{p.sku}</td>
                    <td className="py-3 px-4 text-[#6B4F2A] whitespace-nowrap">{brl(p.cost_price)}</td>
                    <td className="py-3 px-4 text-[#8C4A10] font-semibold whitespace-nowrap">{brl(p.sale_price)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        p.stock === 0 ? 'bg-red-100 text-red-600' :
                        p.stock <= 5  ? 'bg-orange-100 text-orange-600' :
                        p.stock <= 20 ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button disabled={isSaving} onClick={() => toggleField(p.id, 'featured', !p.featured)}
                        className={`text-lg transition-all ${isSaving ? 'opacity-40 cursor-not-allowed' : 'hover:scale-125 cursor-pointer'}`}>
                        {p.featured ? '⭐' : '☆'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <button disabled={isSaving} onClick={() => toggleField(p.id, 'active', !p.active)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          p.active ? 'bg-[#C08D3A]' : 'bg-[#D9C9A8]'
                        } ${isSaving ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                        <span className={`inline-block h-3 w-3 rounded-full bg-white shadow transform transition-transform ${
                          p.active ? 'translate-x-5' : 'translate-x-1'
                        }`} />
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 items-center">
                        <button onClick={() => router.push(`/admin/produtos/${p.id}`)}
                          className="px-3 py-1.5 rounded-lg border border-[#E8DCC8] text-[#6B4F2A]
                            hover:border-[#C08D3A]/50 hover:text-[#1C1008] hover:bg-[#F5EFE6]
                            transition-all text-[10px] uppercase tracking-widest whitespace-nowrap">
                          Editar
                        </button>
                        <button onClick={() => deleteProduct(p.id)} disabled={isSaving}
                          className="px-2 py-1.5 rounded-lg border border-red-200 text-red-400
                            hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-40">
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
        <p className="text-[#B0916A] text-xs mt-3 text-right">
          {filtered.length} de {products.length} produtos
        </p>
      )}
    </div>
  )
}