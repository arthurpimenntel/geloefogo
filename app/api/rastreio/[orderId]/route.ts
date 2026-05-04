import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SupplierRegistry } from '@/lib/suppliers/adapter.interface'

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const db = createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: order } = await db
    .from('orders')
    .select('id, user_id, supplier_order_id, tracking_code, tracking_events, status')
    .eq('id', params.orderId)
    .single()

  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (order.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Se já tiver eventos em cache e o pedido foi entregue, retorna diretamente
  if (order.status === 'entregue' && order.tracking_events) {
    return NextResponse.json({ events: order.tracking_events }, {
      headers: { 'Cache-Control': 'public, max-age=3600' }
    })
  }

  // Busca atualização do fornecedor
  let events = order.tracking_events ?? []
  try {
    if (order.supplier_order_id) {
      const adapter = SupplierRegistry.getById(order./* supplier_id */ '')
      if (adapter) {
        const tracking = await adapter.trackOrder(order.supplier_order_id)
        events = tracking.events
        // Persiste no DB para reduzir chamadas ao fornecedor
        await db.from('orders')
          .update({ tracking_events: events, tracking_code: tracking.code })
          .eq('id', params.orderId)
      }
    }
  } catch { /* usa o cache existente se fornecedor falhar */ }

  return NextResponse.json({ events })
}