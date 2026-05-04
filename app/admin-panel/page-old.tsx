import { createClient } from '@/lib/supabase/server'
import { KpiCard } from '@/components/admin/KpiCard'
import Link from 'next/link'

export const revalidate = 30

export default async function AdminDashboard() {
  const supabase = await createClient()
  const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [ordersRes, pendingRes, productsRes, customersRes, suppliersRes] = await Promise.all([
    supabase.from('orders').select('total, created_at').gte('created_at', thisMonth).neq('status', 'cancelado'),
    supabase.from('orders').select('id', { count: 'exact', head: true }).in('status', ['pago', 'processando']),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('active', true),
  ])

  const orders    = ordersRes.data ?? []
  const revenue   = orders.reduce((s, o) => s + o.total, 0)
  const avgTicket = orders.length ? revenue / orders.length : 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-playfair text-2xl text-amber-100">Dashboard</h1>
        <p className="text-amber-700 text-sm mt-1">
          Resumo do mês atual · {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <KpiCard label="Faturamento" value={revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} sub="este mês" trend="up" />
        <KpiCard label="Pedidos" value={String(orders.length)} sub="este mês" trend="up" />
        <KpiCard label="Ticket Médio" value={avgTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} sub="este mês" />
        <KpiCard label="Aguardando" value={String(pendingRes.count ?? 0)} sub="processar agora" trend="down" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick actions */}
        <div className="lg:col-span-2 bg-[#1A0F08] border border-amber-900/20 p-5">
          <h2 className="text-amber-400 text-xs uppercase tracking-widest mb-4">Atalhos Rápidos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: '/admin/pedidos',          label: 'Ver Pedidos',         icon: '📦' },
              { href: '/admin/produtos/novo',    label: 'Novo Produto',        icon: '➕' },
              { href: '/admin/produtos/importar',label: 'Importar CSV',        icon: '📄' },
              { href: '/admin/fornecedores/novo',label: 'Novo Fornecedor',     icon: '🔗' },
              { href: '/admin/marketing/cupom/novo', label: 'Criar Cupom',    icon: '🎟' },
              { href: '/admin/clientes',         label: 'Ver Clientes',        icon: '👤' },
              { href: '/admin/financeiro',        label: 'Financeiro',         icon: '💰' },
              { href: '/admin/configuracoes',    label: 'Configurações',       icon: '⚙️' },
            ].map(({ href, label, icon }) => (
              <Link key={href} href={href}
                className="flex flex-col items-center gap-2 p-3 border border-amber-900/20
                  hover:border-amber-700 text-amber-600 hover:text-amber-300 text-xs
                  text-center transition-colors group">
                <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
                <span className="uppercase tracking-widest leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-[#1A0F08] border border-amber-900/20 p-5">
          <h2 className="text-amber-400 text-xs uppercase tracking-widest mb-4">Visão Geral</h2>
          <div className="space-y-4">
            {[
              { label: 'Produtos ativos',     value: productsRes.count ?? 0 },
              { label: 'Clientes cadastrados',value: customersRes.count ?? 0 },
              { label: 'Fornecedores ativos', value: suppliersRes.count ?? 0 },
              { label: 'Pedidos pendentes',   value: pendingRes.count ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-amber-700 text-xs">{label}</span>
                <span className="text-amber-300 font-playfair text-lg">{value}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-amber-900/20">
            <Link href="/" target="_blank"
              className="block text-center text-[11px] text-amber-800 hover:text-amber-500
                uppercase tracking-widest transition-colors">
              Ver loja pública →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
