import { createClient } from '@/lib/supabase/server'
import { OrderKanban } from '@/components/admin/OrderKanban'

export const revalidate = 0

export default async function PedidosPage() {
  const supabase = await createClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total, created_at, shipping_address')
    .order('created_at', { ascending: false })
    .limit(100)

  const normalized = (orders ?? []).map((o: any) => ({
    ...o,
    createdAt: o.created_at,
    customerName: o.shipping_address?.nome ?? '—',
  }))

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-playfair text-2xl text-[#1C1008] font-semibold">Pedidos</h1>
        <p className="text-[#8C6D3F] text-sm mt-1">
          Arraste os cards para atualizar o status · {orders?.length ?? 0} pedidos carregados
        </p>
      </div>
      <OrderKanban initialOrders={normalized as any} />
    </div>
  )
}