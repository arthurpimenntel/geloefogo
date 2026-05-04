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

const COLS: { id: OrderStatus; label: string; color: string; dot: string }[] = [
  { id: 'aguardando_pagamento', label: 'Aguardando', color: 'border-yellow-700', dot: 'bg-yellow-500' },
  { id: 'pago',                 label: 'Pago',       color: 'border-blue-600',   dot: 'bg-blue-500'   },
  { id: 'processando',          label: 'Processando',color: 'border-amber-600',  dot: 'bg-amber-500'  },
  { id: 'enviado',              label: 'Enviado',    color: 'border-purple-600', dot: 'bg-purple-500' },
  { id: 'entregue',             label: 'Entregue',   color: 'border-green-600',  dot: 'bg-green-500'  },
  { id: 'devolvido',            label: 'Devolvido',  color: 'border-red-800',    dot: 'bg-red-500'    },
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
        <div className="bg-[#1A0F08] border border-amber-900/20 px-4 py-3">
          <p className="text-amber-800 text-[10px] uppercase tracking-widest">Total pedidos</p>
          <p className="text-amber-300 text-lg font-playfair">{orders.length}</p>
        </div>
        <div className="bg-[#1A0F08] border border-amber-900/20 px-4 py-3">
          <p className="text-amber-800 text-[10px] uppercase tracking-widest">Receita (ativos)</p>
          <p className="text-amber-300 text-lg font-playfair">
            {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex gap-3 overflow-x-auto pb-6 -mx-4 px-4">
        {COLS.map(col => {
          const colOrders = orders.filter(o => o.status === col.id)
          const isDragOver = false
          return (
            <div
              key={col.id}
              className={`flex-shrink-0 w-52 md:w-56 bg-[#1A0F08] border-t-2 ${col.color}
                transition-colors`}
              onDragOver={e => { e.preventDefault() }}
              onDrop={e => {
                e.preventDefault()
                const id = e.dataTransfer.getData('orderId')
                if (id && id !== col.id) moveOrder(id, col.id)
                setDragId(null)
              }}
            >
              <div className="p-3 flex items-center justify-between border-b border-amber-900/20">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                  <span className="text-amber-400 text-[11px] font-medium uppercase tracking-widest">
                    {col.label}
                  </span>
                </div>
                <span className="bg-amber-900/40 text-amber-600 text-[10px] px-1.5 py-0.5">
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
                    className={`bg-[#231409] border p-3 cursor-grab active:cursor-grabbing
                      hover:border-amber-700 transition-all select-none
                      ${dragId === order.id ? 'border-amber-600 opacity-50' : 'border-amber-900/30'}`}
                  >
                    <p className="text-amber-500 text-[10px] font-mono">#{order.id.slice(0, 8)}</p>
                    {order.customerName && (
                      <p className="text-amber-300 text-xs mt-1 truncate">{order.customerName}</p>
                    )}
                    <p className="text-amber-100 text-sm font-medium mt-1">
                      {order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <p className="text-amber-800 text-[10px] mt-1">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                    {/* Quick move select */}
                    <select
                      value={order.status}
                      onChange={e => moveOrder(order.id, e.target.value as OrderStatus)}
                      onClick={e => e.stopPropagation()}
                      className="mt-2 w-full bg-[#0D0805] border border-amber-900/40 text-amber-700
                        text-[10px] px-1.5 py-1 focus:outline-none focus:border-amber-700"
                    >
                      {COLS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                ))}
                {colOrders.length === 0 && (
                  <div className="h-16 flex items-center justify-center">
                    <p className="text-amber-900/60 text-[10px] uppercase tracking-widest">Vazio</p>
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
