import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireStaff(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw Object.assign(new Error('Não autorizado'), { status: 401 })
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle()
  const allowed = ['support', 'manager', 'super_admin']
  if (!profile || !allowed.includes(profile.role))
    throw Object.assign(new Error('Sem permissão'), { status: 403 })
  return user
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  try {
    await requireStaff(supabase)
    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') || 'pending'

    let query = supabase
      .from('orders')
      .select(`
        id, status, subtotal, shipping_cost, total,
        shipping_address, notes,
        supplier_order_id, tracking_code, tracking_events,
        created_at, updated_at,
        order_items (
          id, product_id, sku, name, quantity, unit_price, cost_price,
          products ( id, images, attributes )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (filter === 'pending') {
      query = query
        .in('status', ['pago', 'processando'])
        .is('supplier_order_id', null)
    } else if (filter === 'ordered') {
      query = query
        .not('supplier_order_id', 'is', null)
        .is('tracking_code', null)
    } else if (filter === 'tracking') {
      query = query.not('tracking_code', 'is', null)
    }

    const { data: orders, error } = await query
    if (error) throw new Error(error.message)

    const enriched = (orders || []).map((order: any) => ({
      ...order,
      order_items: (order.order_items || []).map((item: any) => {
        const detailUrl = item.products?.attributes?.detail_url ?? null
        let aeUrl = detailUrl
        if (!aeUrl && item.sku?.startsWith('AE-')) {
          aeUrl = `https://www.aliexpress.com/item/${item.sku.replace('AE-', '')}.html`
        }
        return {
          id:         item.id,
          product_id: item.product_id,
          sku:        item.sku,
          name:       item.name,
          quantity:   item.quantity,
          unit_price: item.unit_price,
          cost_price: item.cost_price,
          ae_url:     aeUrl,
          image:      item.products?.images?.[0] ?? null,
        }
      }),
    }))

    const [{ count: pendingCount }, { count: orderedCount }, { count: trackingCount }] =
      await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true })
          .in('status', ['pago', 'processando']).is('supplier_order_id', null),
        supabase.from('orders').select('*', { count: 'exact', head: true })
          .not('supplier_order_id', 'is', null).is('tracking_code', null),
        supabase.from('orders').select('*', { count: 'exact', head: true })
          .not('tracking_code', 'is', null),
      ])

    return NextResponse.json({
      result: true,
      orders: enriched,
      counts: { pending: pendingCount ?? 0, ordered: orderedCount ?? 0, tracking: trackingCount ?? 0 },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  try {
    await requireStaff(supabase)
    const body = await req.json()
    const { order_id, supplier_order_id, tracking_code, status } = body

    if (!order_id)
      return NextResponse.json({ error: 'order_id obrigatório' }, { status: 400 })

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }

    if (supplier_order_id !== undefined) {
      updates.supplier_order_id = supplier_order_id || null
      if (supplier_order_id && !status) updates.status = 'processando'
    }

    if (tracking_code !== undefined) {
      updates.tracking_code = tracking_code || null
      if (tracking_code && !status) updates.status = 'enviado'
      if (tracking_code) {
        const { data: current } = await supabase
          .from('orders').select('tracking_events').eq('id', order_id).single()
        const events = current?.tracking_events ?? []
        updates.tracking_events = [
          ...events,
          { event: 'tracking_adicionado', code: tracking_code, timestamp: new Date().toISOString() },
        ]
      }
    }

    if (status !== undefined) updates.status = status

    const { data: updated, error } = await supabase
      .from('orders').update(updates).eq('id', order_id)
      .select('id, status, supplier_order_id, tracking_code, updated_at').single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ result: true, order: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 })
  }
}