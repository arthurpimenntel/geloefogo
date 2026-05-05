'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderItem {
  id: string
  sku: string
  name: string
  quantity: number
  unit_price: number
  cost_price: number
  ae_url: string | null
  image: string | null
}

interface ShippingAddress {
  name?: string
  full_name?: string
  phone?: string
  street?: string
  address?: string
  line1?: string
  line2?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  zip?: string
  postal_code?: string
  cep?: string
  country?: string
}

interface Order {
  id: string
  status: string
  subtotal: number
  shipping_cost: number
  total: number
  shipping_address: ShippingAddress
  notes: string | null
  supplier_order: string | null
  tracking_code: string | null
  created_at: string
  order_items: OrderItem[]
}

interface Counts {
  pending: number
  ordered: number
  tracking: number
}

type Filter = 'pending' | 'ordered' | 'tracking' | 'all'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatAddress(addr: ShippingAddress): string {
  if (!addr) return '—'
  const name    = addr.name || addr.full_name || ''
  const street  = addr.street || addr.address || addr.line1 || ''
  const number  = addr.number ? `, ${addr.number}` : ''
  const comp    = addr.complement || addr.line2 ? ` — ${addr.complement || addr.line2}` : ''
  const neigh   = addr.neighborhood ? `, ${addr.neighborhood}` : ''
  const city    = addr.city || ''
  const state   = addr.state || ''
  const zip     = addr.zip || addr.postal_code || addr.cep || ''
  const phone   = addr.phone ? `\nFone: ${addr.phone}` : ''

  return [
    name,
    `${street}${number}${comp}${neigh}`,
    `${city}${state ? ` - ${state}` : ''}${zip ? ` · CEP ${zip}` : ''}`,
    phone,
  ].filter(Boolean).join('\n')
}

function shortId(id: string) {
  return id.substring(0, 8).toUpperCase()
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtBrl(val: number) {
  return val?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? '—'
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  paid:        { label: 'Pago',         color: 'text-green-400 bg-green-900/30 border-green-800/40' },
  processing:  { label: 'Processando',  color: 'text-amber-400 bg-amber-900/30 border-amber-800/40' },
  confirmed:   { label: 'Confirmado',   color: 'text-blue-400 bg-blue-900/30 border-blue-800/40' },
  shipped:     { label: 'Enviado',      color: 'text-purple-400 bg-purple-900/30 border-purple-800/40' },
  delivered:   { label: 'Entregue',     color: 'text-teal-400 bg-teal-900/30 border-teal-800/40' },
  cancelled:   { label: 'Cancelado',    color: 'text-red-400 bg-red-900/30 border-red-800/40' },
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function FulfillmentPage() {
  const [filter,   setFilter]   = useState<Filter>('pending')
  const [orders,   setOrders]   = useState<Order[]>([])
  const [counts,   setCounts]   = useState<Counts>({ pending: 0, ordered: 0, tracking: 0 })
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  // Estado local de cada card: supplier_order e tracking_code em edição
  const [editing, setEditing] = useState<Record<string, {
    supplier_order: string
    tracking_code: string
    saving: boolean
    saved: boolean
    error: string | null
  }>>({})

  const [copied, setCopied] = useState<string | null>(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const load = useCallback(async (f: Filter) => {
    setLoading(true); setError(null)
    try {
      const res  = await fetch(`/api/admin/pedidos/fulfillment?filter=${f}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar')
      setOrders(data.orders ?? [])
      setCounts(data.counts ?? { pending: 0, ordered: 0, tracking: 0 })

      // Inicializa estado de edição para cada pedido
      const init: typeof editing = {}
      for (const o of (data.orders ?? [])) {
        init[o.id] = {
          supplier_order: o.supplier_order ?? '',
          tracking_code:  o.tracking_code  ?? '',
          saving: false,
          saved:  false,
          error:  null,
        }
      }
      setEditing(init)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(filter) }, [filter])

  // ── Save ───────────────────────────────────────────────────────────────────
  async function save(orderId: string, field: 'supplier_order' | 'tracking_code') {
    const e = editing[orderId]
    if (!e) return

    setEditing(prev => ({ ...prev, [orderId]: { ...prev[orderId], saving: true, error: null, saved: false } }))

    try {
      const res  = await fetch('/api/admin/pedidos/fulfillment', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          order_id:      orderId,
          [field]:       e[field],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Atualiza o pedido local
      setOrders(prev => prev.map(o =>
        o.id === orderId
          ? { ...o, [field]: data.order[field], status: data.order.status }
          : o
      ))
      setEditing(prev => ({ ...prev, [orderId]: { ...prev[orderId], saving: false, saved: true } }))
      setTimeout(() => setEditing(prev => ({ ...prev, [orderId]: { ...prev[orderId], saved: false } })), 2000)
    } catch (err: any) {
      setEditing(prev => ({ ...prev, [orderId]: { ...prev[orderId], saving: false, error: err.message } }))
    }
  }

  // ── Copy address ───────────────────────────────────────────────────────────
  function copyAddress(orderId: string, addr: ShippingAddress) {
    navigator.clipboard.writeText(formatAddress(addr))
    setCopied(orderId)
    setTimeout(() => setCopied(null), 2000)
  }

  const FILTERS: { key: Filter; label: string; count?: number }[] = [
    { key: 'pending',  label: 'Aguardando pedido',  count: counts.pending  },
    { key: 'ordered',  label: 'Aguardando rastreio', count: counts.ordered  },
    { key: 'tracking', label: 'Em trânsito',         count: counts.tracking },
    { key: 'all',      label: 'Todos' },
  ]

  return (
    <div className="max-w-5xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-playfair text-2xl text-amber-100">Fulfillment de Pedidos</h1>
        <p className="text-amber-700 text-sm mt-1">
          Gerencie pedidos AliExpress — registre o nº do pedido e o código de rastreio
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-1 border-b border-amber-900/30 mb-8 overflow-x-auto">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-3 text-xs uppercase tracking-widest transition-colors
              border-b-2 -mb-px whitespace-nowrap flex items-center gap-2 ${
              filter === f.key
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-amber-700 hover:text-amber-500'
            }`}
          >
            {f.label}
            {f.count != null && f.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                filter === f.key
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-amber-900/40 text-amber-700'
              }`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Estado */}
      {loading && (
        <div className="text-center py-20 text-amber-800 text-sm animate-pulse uppercase tracking-widest">
          Carregando pedidos...
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-800/40 px-5 py-4 text-red-300 text-sm mb-6">
          ❌ {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="text-center py-20 text-amber-900">
          <p className="text-4xl mb-4">
            {filter === 'pending' ? '🎉' : filter === 'ordered' ? '📦' : '🚀'}
          </p>
          <p className="text-sm uppercase tracking-widest text-amber-800">
            {filter === 'pending'
              ? 'Nenhum pedido aguardando fulfillment'
              : filter === 'ordered'
              ? 'Todos os pedidos têm rastreio'
              : 'Nenhum pedido neste filtro'}
          </p>
        </div>
      )}

      {/* Lista de pedidos */}
      <div className="space-y-4">
        {orders.map(order => {
          const e       = editing[order.id] ?? { supplier_order: '', tracking_code: '', saving: false, saved: false, error: null }
          const st      = STATUS_LABEL[order.status] ?? { label: order.status, color: 'text-amber-500' }
          const addr    = order.shipping_address ?? {}
          const hasAE   = order.order_items.some(i => i.ae_url)

          return (
            <div
              key={order.id}
              className="bg-[#1A0F08] border border-amber-900/20 overflow-hidden"
            >
              {/* Card header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-amber-900/20 bg-[#150D06]">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-amber-200 font-mono text-sm font-medium">
                      #{shortId(order.id)}
                    </span>
                    <span className="text-amber-800 text-xs ml-3">{fmtDate(order.created_at)}</span>
                  </div>
                  <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 border rounded-sm ${st.color}`}>
                    {st.label}
                  </span>
                  {order.supplier_order && (
                    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 border border-blue-800/40 bg-blue-900/20 text-blue-400 rounded-sm">
                      AE: {order.supplier_order}
                    </span>
                  )}
                </div>
                <span className="text-amber-400 text-sm font-medium">{fmtBrl(order.total)}</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-amber-900/20">

                {/* Coluna esquerda: endereço + produtos */}
                <div className="p-5 space-y-4">

                  {/* Endereço */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-amber-700 text-[10px] uppercase tracking-widest">
                        Endereço de entrega
                      </p>
                      <button
                        onClick={() => copyAddress(order.id, addr)}
                        className="text-[10px] uppercase tracking-widest text-amber-800
                          hover:text-amber-500 transition-colors"
                      >
                        {copied === order.id ? '✓ Copiado!' : '⎘ Copiar'}
                      </button>
                    </div>
                    <div className="bg-[#0D0805] border border-amber-900/20 px-3 py-2.5">
                      <pre className="text-amber-300 text-xs font-sans whitespace-pre-wrap leading-relaxed">
                        {formatAddress(addr)}
                      </pre>
                    </div>
                    {order.notes && (
                      <p className="text-amber-700 text-xs mt-2 italic">
                        Obs: {order.notes}
                      </p>
                    )}
                  </div>

                  {/* Produtos */}
                  <div>
                    <p className="text-amber-700 text-[10px] uppercase tracking-widest mb-2">
                      Produtos ({order.order_items.length})
                    </p>
                    <div className="space-y-2">
                      {order.order_items.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 bg-[#0D0805] border border-amber-900/20 px-3 py-2"
                        >
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-8 h-8 object-cover flex-shrink-0 opacity-80"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-amber-200 text-xs truncate">{item.name}</p>
                            <p className="text-amber-800 text-[10px] font-mono">{item.sku}</p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-amber-600 text-xs">×{item.quantity}</span>
                            {item.ae_url ? (
                              <a
                                href={item.ae_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] uppercase tracking-widest px-2 py-1
                                  border border-amber-700/50 text-amber-500 hover:border-amber-500
                                  hover:text-amber-300 transition-colors whitespace-nowrap"
                              >
                                Ver AE ↗
                              </a>
                            ) : (
                              <span className="text-amber-900 text-[10px]">Sem link</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Coluna direita: ações de fulfillment */}
                <div className="p-5 space-y-5">

                  {/* Nº do pedido AliExpress */}
                  <div>
                    <label className="text-amber-700 text-[10px] uppercase tracking-widest block mb-2">
                      Nº Pedido AliExpress
                    </label>
                    <p className="text-amber-800 text-[10px] mb-2">
                      Após fazer o pedido no AliExpress, cole o número aqui
                    </p>
                    <div className="flex gap-2">
                      <input
                        value={e.supplier_order}
                        onChange={ev => setEditing(prev => ({
                          ...prev,
                          [order.id]: { ...prev[order.id], supplier_order: ev.target.value },
                        }))}
                        placeholder="ex: 8171234567890"
                        className="flex-1 bg-[#0D0805] border border-amber-900/40 text-amber-100
                          px-3 py-2 text-sm font-mono focus:outline-none focus:border-amber-600
                          placeholder:text-amber-900 transition-colors"
                      />
                      <button
                        onClick={() => save(order.id, 'supplier_order')}
                        disabled={e.saving || !e.supplier_order.trim()}
                        className="px-4 py-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-40
                          text-[#0D0805] text-[10px] font-bold uppercase tracking-widest transition-colors"
                      >
                        {e.saving ? '...' : 'Salvar'}
                      </button>
                    </div>
                    {hasAE && (
                      <a
                        href="https://www.aliexpress.com/p/order/index.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-[10px] uppercase tracking-widest
                          text-amber-700 hover:text-amber-400 transition-colors underline"
                      >
                        → Abrir Meus Pedidos AliExpress
                      </a>
                    )}
                  </div>

                  {/* Código de rastreio */}
                  <div>
                    <label className="text-amber-700 text-[10px] uppercase tracking-widest block mb-2">
                      Código de Rastreio
                    </label>
                    <p className="text-amber-800 text-[10px] mb-2">
                      Disponível em 3–5 dias após o envio no painel AliExpress
                    </p>
                    <div className="flex gap-2">
                      <input
                        value={e.tracking_code}
                        onChange={ev => setEditing(prev => ({
                          ...prev,
                          [order.id]: { ...prev[order.id], tracking_code: ev.target.value },
                        }))}
                        placeholder="ex: LY123456789CN"
                        className="flex-1 bg-[#0D0805] border border-amber-900/40 text-amber-100
                          px-3 py-2 text-sm font-mono uppercase focus:outline-none
                          focus:border-amber-600 placeholder:text-amber-900 transition-colors"
                      />
                      <button
                        onClick={() => save(order.id, 'tracking_code')}
                        disabled={e.saving || !e.tracking_code.trim()}
                        className="px-4 py-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-40
                          text-[#0D0805] text-[10px] font-bold uppercase tracking-widest transition-colors"
                      >
                        {e.saving ? '...' : 'Salvar'}
                      </button>
                    </div>
                    {order.tracking_code && (
                      <a
                        href={`https://t.17track.net/pt-br#nums=${order.tracking_code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-[10px] uppercase tracking-widest
                          text-amber-700 hover:text-amber-400 transition-colors underline"
                      >
                        → Rastrear {order.tracking_code}
                      </a>
                    )}
                  </div>

                  {/* Feedback de save */}
                  {e.saved && (
                    <p className="text-green-400 text-xs">✓ Salvo com sucesso</p>
                  )}
                  {e.error && (
                    <p className="text-red-400 text-xs">❌ {e.error}</p>
                  )}

                  {/* Resumo financeiro */}
                  <div className="border-t border-amber-900/20 pt-4 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-amber-800">Subtotal</span>
                      <span className="text-amber-600">{fmtBrl(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-amber-800">Frete</span>
                      <span className="text-amber-600">{fmtBrl(order.shipping_cost)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] pt-1 border-t border-amber-900/20">
                      <span className="text-amber-500 font-medium">Total</span>
                      <span className="text-amber-400 font-medium">{fmtBrl(order.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}