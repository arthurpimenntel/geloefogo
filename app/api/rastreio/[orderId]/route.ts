import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SupplierRegistry } from '@/lib/suppliers/adapter.interface'

// O contexto da rota deve receber params como uma Promise
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  // 1. Extraia e aguarde o orderId
  const { orderId } = await params

  const db = createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: order } = await db
    .from('orders')
    .select('id, user_id, supplier_order_id, supplier_id, tracking_code, tracking_events, status')
    .eq('id', orderId)
    .single()

  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (order.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Retorna diretamente caso já tenha sido entregue
  if (order.status === 'entregue' && order.tracking_events) {
    return NextResponse.json({ events: order.tracking_events }, {
      headers: { 'Cache-Control': 'public, max-age=3600' }
    })
  }

  let events = order.tracking_events ?? []
  try {
    if (order.supplier_order_id) {
      const adapter = SupplierRegistry.getById(order.supplier_id || '')
      if (adapter) {
        const tracking = await adapter.trackOrder(order.supplier_order_id)
        events = tracking.events
        
        await db.from('orders')
          .update({ tracking_events: events, tracking_code: tracking.code })
          .eq('id', orderId)
      }
    }
  } catch (error) {
    console.error(error)
  }

  return NextResponse.json({ events })
}
