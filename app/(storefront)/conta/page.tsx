import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const revalidate = 0

// Tipos auxiliares (evitam o "never")
type Profile = {
  full_name: string | null
  phone: string | null
  cpf: string | null
  points: number
}

type Order = {
  id: string
  status: string
  total: number
  created_at: string
  tracking_code: string | null
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  aguardando_pagamento: { label: 'Aguardando Pagamento', color: 'text-yellow-400' },
  pago:                 { label: 'Pago',                  color: 'text-blue-400' },
  processando:          { label: 'Processando',           color: 'text-amber-400' },
  enviado:              { label: 'Enviado',               color: 'text-purple-400' },
  entregue:             { label: 'Entregue',              color: 'text-green-400' },
  devolvido:            { label: 'Devolvido',             color: 'text-red-400' },
  cancelado:            { label: 'Cancelado',             color: 'text-red-600' },
}

export default async function MinhaContaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/entrar?next=/conta')

  const [profileRes, ordersRes] = await Promise.all([
    supabase.from('profiles').select('full_name, phone, cpf, points').eq('id', user.id).single(),
    supabase.from('orders')
      .select('id, status, total, created_at, tracking_code')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  // Dizemos ao TypeScript os tipos corretos
  const profile = profileRes.data as Profile | null
  const orders  = (ordersRes.data ?? []) as Order[]

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-playfair text-3xl text-amber-100 mb-10">Minha Conta</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Profile card */}
        <div className="md:col-span-1 bg-[#1A0F08] border border-amber-900/20 p-6">
          <div className="w-14 h-14 bg-amber-900/30 flex items-center justify-center mb-4 text-2xl">
            {profile?.full_name?.[0]?.toUpperCase() ?? '👤'}
          </div>
          <p className="text-amber-200 font-medium text-lg">{profile?.full_name ?? 'Sem nome'}</p>
          <p className="text-amber-700 text-xs mt-1">{user.email}</p>
          {profile?.phone && <p className="text-amber-700 text-xs mt-1">{profile.phone}</p>}

          <div className="mt-5 pt-5 border-t border-amber-900/20">
            <p className="text-amber-800 text-[10px] uppercase tracking-widest mb-1">Pontos de Fidelidade</p>
            <p className="font-playfair text-2xl text-amber-400">{profile?.points ?? 0} pts</p>
          </div>

          <div className="mt-6 space-y-2">
            <form action="/api/auth/signout" method="POST">
              <button type="submit"
                className="w-full py-2 border border-amber-900/40 text-amber-700
                  hover:border-amber-700 hover:text-amber-400 text-xs uppercase
                  tracking-widest transition-colors">
                Sair
              </button>
            </form>
          </div>
        </div>

        {/* Orders list */}
        <div className="md:col-span-2">
          <h2 className="font-playfair text-xl text-amber-200 mb-5">Meus Pedidos</h2>

          {orders.length === 0 ? (
            <div className="bg-[#1A0F08] border border-amber-900/20 p-10 text-center">
              <p className="text-amber-700 text-sm mb-4">Nenhum pedido ainda.</p>
              <Link href="/catalogo"
                className="inline-block px-6 py-2.5 border border-amber-700 text-amber-500
                  hover:border-amber-500 hover:text-amber-300 text-xs uppercase
                  tracking-widest transition-colors">
                Explorar catálogo
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => {
                const s = STATUS_LABEL[order.status] ?? { label: order.status, color: 'text-amber-500' }
                return (
                  <div key={order.id}
                    className="bg-[#1A0F08] border border-amber-900/20 p-4 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-amber-800 text-[10px] font-mono uppercase tracking-widest">
                        #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-amber-300 text-sm font-medium mt-1">
                        {order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      <p className="text-amber-800 text-xs mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${s.color}`}>{s.label}</p>
                      {order.tracking_code && (
                        <p className="text-amber-700 text-xs font-mono mt-1">{order.tracking_code}</p>
                      )}
                      <Link href={`/checkout/rastreio/${order.id}`}
                        className="text-amber-700 hover:text-amber-400 text-xs uppercase
                          tracking-widest transition-colors mt-2 inline-block">
                        Rastrear →
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}