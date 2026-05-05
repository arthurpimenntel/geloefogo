import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireStaff(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw Object.assign(new Error('Não autorizado'), { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const allowed = ['support', 'manager', 'super_admin']
  if (!profile || !allowed.includes(profile.role)) {
    throw Object.assign(new Error('Sem permissão'), { status: 403 })
  }
  return user
}

// ─── GET — lista pedidos para fulfillment ──────────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  try {
    await requireStaff(supabase)

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') || 'pending'

    // Busca pedidos com items + produto (para pegar detail_url do AliExpress)
    let query = supabase
      .from('orders')
      .select(`
        id,
        status,
        subtotal,
        shipping_cost,
        total,
        shipping_address,
        notes,
        supplier_order,
        tracking_code,
        tracking_events,
        created_at,
        updated_at,
        order_items (
          id,
          product_id,
          sku,
          name,
          quantity,
          unit_price,
          cost_price,
          products (
            id,
            images,
            attributes
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    // Filtros por estado de fulfillment
    if (filter === 'pending') {
      // Pago mas sem pedido no fornecedor ainda
      query = query
        .in('status', ['paid', 'processing', 'confirmed'])
        .is('supplier_order', null)
    } else if (filter === 'ordered') {
      // Pedido feito no AliExpress mas sem rastreio
      query = query
        .not('supplier_order', 'is', null)
        .is('tracking_code', null)
    } else if (filter === 'tracking') {
      // Tem rastreio
      query = query.not('tracking_code', 'is', null)
    }
    // filter === 'all' — sem filtro adicional

    const { data: orders, error } = await query

    if (error) throw new Error(error.message)

    // Enriquece cada item com a URL do AliExpress
    const enriched = (orders || []).map((order: any) => ({
      ...order,
      order_items: (order.order_items || []).map((item: any) => {
        // Tenta pegar URL do produto (salva no import)
        const detailUrl = item.products?.attributes?.detail_url ?? null

        // Constrói URL a partir do SKU se não tiver URL salva
        // SKU formato: AE-1005006123456789
        let aeUrl = detailUrl
        if (!aeUrl && item.sku?.startsWith('AE-')) {
          const productId = item.sku.replace('AE-', '')
          aeUrl = `https://www.aliexpress.com/item/${productId}.html`
        }

        // Imagem do produto
        const image = item.products?.images?.[0] ?? null

        return {
          id:         item.id,
          product_id: item.product_id,
          sku:        item.sku,
          name:       item.name,
          quantity:   item.quantity,
          unit_price: item.unit_price,
          cost_price: item.cost_price,
          ae_url:     aeUrl,
          image,
        }
      }),
    }))

    // Contagens para os filtros
    const { data: counts } = await supabase.rpc('get_fulfillment_counts').maybeSingle()
    // Se a RPC não existir, calcula manualmente
    const { count: pendingCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['paid', 'processing', 'confirmed'])
      .is('supplier_order', null)

    const { count: orderedCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .not('supplier_order', 'is', null)
      .is('tracking_code', null)

    const { count: trackingCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .not('tracking_code', 'is', null)

    return NextResponse.json({
      result: true,
      orders: enriched,
      counts: {
        pending:  pendingCount  ?? 0,
        ordered:  orderedCount  ?? 0,
        tracking: trackingCount ?? 0,
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: err.status ?? 500 },
    )
  }
}

// ─── PATCH — atualiza fulfillment de um pedido ────────────────────────────────
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  try {
    await requireStaff(supabase)

    const body = await req.json()
    const { order_id, supplier_order, tracking_code, status } = body

    if (!order_id) {
      return NextResponse.json({ error: 'order_id obrigatório' }, { status: 400 })
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }

    if (supplier_order !== undefined) {
      updates.supplier_order = supplier_order || null
      // Se está registrando o pedido no fornecedor, avança status
      if (supplier_order && !status) updates.status = 'processing'
    }

    if (tracking_code !== undefined) {
      updates.tracking_code = tracking_code || null
      // Se está adicionando rastreio, avança status
      if (tracking_code && !status) updates.status = 'shipped'

      // Registra evento de rastreio
      if (tracking_code) {
        const { data: current } = await supabase
          .from('orders')
          .select('tracking_events')
          .eq('id', order_id)
          .single()

        const events = current?.tracking_events ?? []
        updates.tracking_events = [
          ...events,
          {
            event:      'tracking_added',
            code:       tracking_code,
            timestamp:  new Date().toISOString(),
            note:       'Código adicionado manualmente',
          },
        ]
      }
    }

    if (status !== undefined) {
      updates.status = status
    }

    const { data: updated, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', order_id)
      .select('id, status, supplier_order, tracking_code, updated_at')
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ result: true, order: updated })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: err.status ?? 500 },
    )
  }
}