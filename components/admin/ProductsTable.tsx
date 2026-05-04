'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface Product {
  id: string
  name: string
  sku: string
  sale_price: number
  stock: number
  active: boolean
  brand?: string
  tags?: string[]
  images?: string[]
  category?: { name: string } | null
}

const STATUS_OPTIONS = [
  { value: '',       label: 'Todos' },
  { value: 'ativo',  label: 'Ativos' },
  { value: 'inativo',label: 'Inativos' },
  { value: 'baixo',  label: 'Estoque baixo' },
]

export function ProductsTable({
  initialProducts,
  searchQ,
  statusFilter,
}: {
  initialProducts: Product[]
  searchQ: string
  statusFilter: string
}) {
  const router   = useRouter()
  const pathname = usePathname()
  const sp       = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [products, setProducts] = useState(initialProducts)
  const [toggling, setToggling] = useState<string | null>(null)
  const supabase = createClient()

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(sp.toString())
    if (value) params.set(key, value); else params.delete(key)
    params.delete('page')
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  async function toggleActive(id: string, current: boolean) {
    setToggling(id)
    const { error } = await supabase
      .from('products')
      .update({ active: !current })
      .eq('id', id)
    if (!error) {
      setProducts(p => p.map(prod =>
        prod.id === id ? { ...prod, active: !current } : prod
      ))
    }
    setToggling(null)
  }

  return (
    <div>
      {/* Search & filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="search"
          defaultValue={searchQ}
          placeholder="Buscar por nome, SKU ou marca..."
          onKeyDown={e => {
            if (e.key === 'Enter')
              updateFilter('q', (e.target as HTMLInputElement).value)
          }}
          onBlur={e => updateFilter('q', e.target.value)}
          className="flex-1 min-w-[200px] bg-[#1A0F08] border border-amber-900/30 text-amber-200
            px-4 py-2 text-sm focus:outline-none focus:border-amber-600 transition-colors
            placeholder:text-amber-900"
        />
        <div className="flex border border-amber-900/30 overflow-hidden">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => updateFilter('status', opt.value)}
              className={`px-3 py-2 text-xs uppercase tracking-widest transition-colors whitespace-nowrap ${
                statusFilter === opt.value
                  ? 'bg-amber-700 text-[#0D0805] font-bold'
                  : 'text-amber-700 hover:text-amber-400 hover:bg-amber-900/20'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: cards */}
      <div className="sm:hidden space-y-3">
        {products.map(p => (
          <div key={p.id}
            className="bg-[#1A0F08] border border-amber-900/20 p-4 flex gap-3">
            {p.images?.[0] ? (
              <div className="w-14 h-14 flex-shrink-0 relative overflow-hidden">
                <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="56px" />
              </div>
            ) : (
              <div className="w-14 h-14 flex-shrink-0 bg-amber-900/20 flex items-center justify-center text-amber-900 text-xl">◆</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-amber-200 text-sm font-medium truncate">{p.name}</p>
              <p className="text-amber-800 text-xs font-mono">{p.sku}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-amber-400 text-sm">
                  {p.sale_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <span className={`text-xs ${p.stock <= 5 ? 'text-red-400' : 'text-amber-600'}`}>
                  {p.stock} un.
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={() => toggleActive(p.id, p.active)}
                  disabled={toggling === p.id}
                  className={`text-xs px-2 py-0.5 transition-colors ${p.active
                    ? 'bg-green-900/30 text-green-400 hover:bg-red-900/30 hover:text-red-400'
                    : 'bg-red-900/30 text-red-400 hover:bg-green-900/30 hover:text-green-400'
                  } disabled:opacity-50`}
                >
                  {toggling === p.id ? '...' : p.active ? 'Ativo' : 'Inativo'}
                </button>
                <a href={`/admin/produtos/${p.id}`}
                  className="text-amber-700 hover:text-amber-400 text-xs transition-colors">
                  Editar →
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block bg-[#1A0F08] border border-amber-900/20 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-amber-900/20">
              {['', 'Produto', 'SKU', 'Categoria', 'Preço', 'Estoque', 'Status', ''].map((h, i) => (
                <th key={i}
                  className="text-left py-3 px-4 text-amber-700 text-xs uppercase tracking-widest font-normal whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={isPending ? 'opacity-50' : ''}>
            {products.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-amber-800 text-sm">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
            {products.map(p => (
              <tr key={p.id}
                className="border-b border-amber-900/10 hover:bg-amber-900/10 transition-colors group">
                {/* Thumbnail */}
                <td className="py-2 pl-4 pr-2 w-10">
                  {p.images?.[0] ? (
                    <div className="w-9 h-9 relative overflow-hidden flex-shrink-0">
                      <Image src={p.images[0]} alt="" fill className="object-cover" sizes="36px" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 bg-amber-900/20 flex items-center justify-center text-amber-900 text-xs">◆</div>
                  )}
                </td>
                <td className="py-3 px-4">
                  <p className="text-amber-200 font-medium leading-tight">{p.name}</p>
                  {p.brand && <p className="text-amber-800 text-xs mt-0.5">{p.brand}</p>}
                </td>
                <td className="py-3 px-4 text-amber-700 font-mono text-xs whitespace-nowrap">{p.sku}</td>
                <td className="py-3 px-4 text-amber-700 text-xs">
                  {(p.category as any)?.name ?? '—'}
                </td>
                <td className="py-3 px-4 text-amber-300 whitespace-nowrap">
                  {p.sale_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="py-3 px-4">
                  <span className={`text-xs font-medium ${
                    p.stock === 0    ? 'text-red-500' :
                    p.stock <= 5     ? 'text-red-400' :
                    p.stock <= 20    ? 'text-amber-400' :
                    'text-green-400'
                  }`}>
                    {p.stock} un.
                  </span>
                </td>
                {/* Quick toggle active */}
                <td className="py-3 px-4">
                  <button
                    onClick={() => toggleActive(p.id, p.active)}
                    disabled={toggling === p.id}
                    title={p.active ? 'Clique para desativar' : 'Clique para ativar'}
                    className={`text-xs px-2 py-0.5 transition-colors cursor-pointer disabled:opacity-50 ${
                      p.active
                        ? 'bg-green-900/30 text-green-400 hover:bg-red-900/30 hover:text-red-400'
                        : 'bg-red-900/30 text-red-400 hover:bg-green-900/30 hover:text-green-400'
                    }`}
                  >
                    {toggling === p.id ? '...' : p.active ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td className="py-3 px-4 pr-6">
                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={`/produto/${p.sku}`} target="_blank"
                      className="text-amber-800 hover:text-amber-500 text-xs transition-colors" title="Ver na loja">
                      👁
                    </a>
                    <a href={`/admin/produtos/${p.id}`}
                      className="text-amber-700 hover:text-amber-400 text-xs transition-colors">
                      Editar →
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
