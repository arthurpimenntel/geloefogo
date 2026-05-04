import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

// ✅ Tipo com os campos que a página realmente usa
type RastreioOrder = {
  status: string
  total: number
  tracking_code: string | null
  shipping_address: {
    nome: string
    rua: string
    numero: string
    complemento?: string
    bairro: string
    cidade: string
    estado: string
    cep: string
  } | null
  order_items: Array<{
    name: string
    quantity: number
    unit_price: number
  }>
}

const STATUS_STEPS = [
  { id: 'aguardando_pagamento', label: 'Aguardando Pagamento', icon: '🕐' },
  { id: 'pago',                 label: 'Pagamento Confirmado',  icon: '✅' },
  { id: 'processando',          label: 'Preparando',            icon: '📦' },
  { id: 'enviado',              label: 'Enviado',               icon: '🚚' },
  { id: 'entregue',             label: 'Entregue',              icon: '🎉' },
]

export default async function RastreioPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('orders')
    .select('*, order_items(name, quantity, unit_price)')
    .eq('id', orderId)
    .single()

  // 👇 Aqui está a mágica: dizemos ao TypeScript que o dado tem o formato certo
  const order = data as RastreioOrder | null

  if (!order) notFound()

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.id === order.status)
  const isCanceled = order.status === 'cancelado' || order.status === 'devolvido'

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/" className="text-amber-800 hover:text-amber-500 text-[11px] uppercase tracking-widest transition-colors">
        ← Início
      </Link>

      <div className="mt-6 mb-10">
        <h1 className="font-playfair text-3xl text-amber-100">Rastreamento</h1>
        <p className="text-amber-700 text-xs uppercase tracking-widest mt-1">
          Pedido #{orderId.slice(0, 8)}
        </p>
      </div>

      {/* Status timeline */}
      {!isCanceled ? (
        <div className="mb-10">
          {STATUS_STEPS.map((step, i) => {
            const done    = i <= currentStepIndex
            const current = i === currentStepIndex
            const last    = i === STATUS_STEPS.length - 1
            return (
              <div key={step.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 flex items-center justify-center text-sm flex-shrink-0
                    border-2 transition-colors ${done
                      ? current
                        ? 'border-amber-500 bg-amber-900/40 text-amber-300'
                        : 'border-amber-700 bg-amber-900/20 text-amber-600'
                      : 'border-amber-900/30 text-amber-900'}`}>
                    {done ? step.icon : '○'}
                  </div>
                  {!last && (
                    <div className={`w-px flex-1 min-h-[2rem] ${done && !current ? 'bg-amber-700/50' : 'bg-amber-900/20'}`} />
                  )}
                </div>
                <div className="pb-8">
                  <p className={`text-sm font-medium ${current ? 'text-amber-200' : done ? 'text-amber-500' : 'text-amber-900'}`}>
                    {step.label}
                    {current && <span className="ml-2 text-[10px] text-amber-600 uppercase tracking-widest">← Atual</span>}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-red-900/20 border border-red-800/40 p-5 mb-10">
          <p className="text-red-300 text-sm">⚠️ Pedido {order.status === 'devolvido' ? 'devolvido' : 'cancelado'}.</p>
        </div>
      )}

      {/* Order details */}
      <div className="bg-[#1A0F08] border border-amber-900/20 p-5 mb-6">
        <h2 className="text-amber-500 text-[10px] uppercase tracking-widest mb-4">Detalhes do Pedido</h2>
        <div className="space-y-2">
          {(order.order_items ?? []).map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-amber-300">{item.name} × {item.quantity}</span>
              <span className="text-amber-500">
                {(item.unit_price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          ))}
          <div className="flex justify-between border-t border-amber-900/20 pt-3 mt-3">
            <span className="text-amber-400 font-medium">Total</span>
            <span className="text-amber-300 font-playfair">
              {order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      {order.shipping_address && (
        <div className="bg-[#1A0F08] border border-amber-900/20 p-5">
          <h2 className="text-amber-500 text-[10px] uppercase tracking-widest mb-3">Endereço de Entrega</h2>
          <p className="text-amber-300 text-sm">{order.shipping_address.nome}</p>
          <p className="text-amber-600 text-sm">
            {order.shipping_address.rua}, {order.shipping_address.numero}
            {order.shipping_address.complemento && ` — ${order.shipping_address.complemento}`}
          </p>
          <p className="text-amber-600 text-sm">
            {order.shipping_address.bairro} · {order.shipping_address.cidade}/{order.shipping_address.estado}
          </p>
          <p className="text-amber-700 text-sm">CEP {order.shipping_address.cep}</p>
        </div>
      )}

      {order.tracking_code && (
        <div className="bg-[#1A0F08] border border-amber-600/30 p-5 mt-6">
          <p className="text-amber-500 text-[10px] uppercase tracking-widest mb-2">Código de Rastreio</p>
          <p className="text-amber-300 font-mono text-lg">{order.tracking_code}</p>
          <a href={`https://www.correios.com.br/rastreamento?codigo=${order.tracking_code}`}
            target="_blank" rel="noopener noreferrer"
            className="mt-3 inline-block text-amber-600 hover:text-amber-300 text-xs
              uppercase tracking-widest transition-colors">
            Rastrear nos Correios →
          </a>
        </div>
      )}
    </div>
  )
}