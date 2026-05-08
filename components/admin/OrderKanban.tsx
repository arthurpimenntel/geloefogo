'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type OrderStatus = 'aguardando_pagamento' | 'pago' | 'processando' | 'enviado' | 'entregue' | 'devolvido' | 'cancelado'

interface Order {
  id: string
  status: OrderStatus
  total: number
  createdAt: string
  customerName?: string
}

const COLS: { id: OrderStatus; label: string; color: string; dot: string; badge: string }[] = [
  { id: 'aguardando_pagamento', label: 'Aguardando', color: 'border-t-yellow-400', dot: 'bg-yellow-400', badge: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  { id: 'pago',                 label: 'Pago',       color: 'border-t-blue-400',   dot: 'bg-blue-400',   badge: 'bg-blue-50 text-blue-700 border border-blue-200'   },
  { id: 'processando',          label: 'Processando',color: 'border-t-amber-400',  dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border border-amber-200'  },
  { id: 'enviado',              label: 'Enviado',    color: 'border-t-purple-400', dot: 'bg-purple-400', badge: 'bg-purple-50 text-purple-700 border border-purple-200' },
  { id: 'entregue',             label: 'Entregue',   color: 'border-t-green-400',  dot: 'bg-green-400',  badge: 'bg-green-50 text-green-700 border border-green-200'  },
  { id: 'devolvido',            label: 'Devolvido',  color: 'border-t-red-400',    dot: 'bg-red-400',    badge: 'bg-red-50 text-red-700 border border-red-200'    },
]

export function OrderKanban({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders)
  const [dragId, setDragId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const ch = supabase.channel('kanban-orders')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        ({ new: u }: any) =>
          setOrders(p => p.map(o => o.id === u.id ? { ...o, status: u.status } : o))
      ).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function moveOrder(id: string, newStatus: OrderStatus) {
    setOrders(p => p.map(o => o.id === id ? { ...o, status: newStatus } : o))
    try {
      await fetch(`/api/admin/pedidos/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch {
      setOrders(initialOrders)
    }
  }

  const totalRevenue = orders
    .filter(o => !['cancelado', 'devolvido', 'aguardando_pagamento'].includes(o.status))
    .reduce((s, o) => s + o.total, 0)

  return (
    <div>
      {/* Summary strip */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="bg-white border border-[#E8DCC8] rounded-2xl px-4 py-3 shadow-sm">
          <p className="text-[#8C6D3F] text-[10px] uppercase tracking-widest">Total pedidos</p>
          <p className="text-[#1C1008] text-lg font-playfair">{orders.length}</p>
        </div>
        <div className="bg-white border border-[#E8DCC8] rounded-2xl px-4 py-3 shadow-sm">
          <p className="text-[#8C6D3F] text-[10px] uppercase tracking-widest">Receita (ativos)</p>
          <p className="text-[#C08D3A] text-lg font-playfair">
            {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      {/* Kanban board — grid que quebra linhas: 2 cols mobile, 3 tablet, 6 desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {COLS.map(col => {
          const colOrders = orders.filter(o => o.status === col.id)
          return (
            <div
              key={col.id}
              className={`bg-[#FAF7F2] border border-[#E8DCC8] rounded-2xl border-t-2 ${col.color} transition-colors shadow-sm`}
              onDragOver={e => { e.preventDefault() }}
              onDrop={e => {
                e.preventDefault()
                const id = e.dataTransfer.getData('orderId')
                if (id && id !== col.id) moveOrder(id, col.id)
                setDragId(null)
              }}
            >
              <div className="p-3 flex items-center justify-between border-b border-[#E8DCC8]">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                  <span className="text-[#6B4F2A] text-[11px] font-medium uppercase tracking-widest">
                    {col.label}
                  </span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${col.badge}`}>
                  {colOrders.length}
                </span>
              </div>

              <div className="p-2 space-y-2 min-h-[160px]">
                {colOrders.map(order => (
                  <div
                    key={order.id}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData('orderId', order.id)
                      setDragId(order.id)
                    }}
                    onDragEnd={() => setDragId(null)}
                    className={`bg-white border border-[#E8DCC8] rounded-xl p-3 cursor-grab active:cursor-grabbing
                      hover:border-[#C08D3A] hover:shadow-sm transition-all select-none
                      ${dragId === order.id ? 'border-[#C08D3A] opacity-50' : ''}`}
                  >
                    <p className="text-[#B0916A] text-[10px] font-mono">#{order.id.slice(0, 8)}</p>
                    {order.customerName && (
                      <p className="text-[#1C1008] text-xs mt-1 truncate font-medium">{order.customerName}</p>
                    )}
                    <p className="text-[#8C4A10] text-sm font-semibold mt-1">
                      {order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <p className="text-[#B0916A] text-[10px] mt-1">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                    <select
                      value={order.status}
                      onChange={e => moveOrder(order.id, e.target.value as OrderStatus)}
                      onClick={e => e.stopPropagation()}
                      className="mt-2 w-full bg-[#FAF7F2] border border-[#D9C9A8] rounded-lg text-[#6B4F2A]
                        text-[10px] px-1.5 py-1 focus:outline-none focus:border-[#C08D3A] transition-colors"
                    >
                      {COLS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                ))}
                {colOrders.length === 0 && (
                  <div className="h-16 flex items-center justify-center">
                    <p className="text-[#D9C9A8] text-[10px] uppercase tracking-widest">Vazio</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}