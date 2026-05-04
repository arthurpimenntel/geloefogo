// app/api/pedidos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redeemPoints } from '@/lib/fidelity'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const {
      items,
      shippingAddress,
      shippingCost,
      discount,
      subtotal,
      total,
      redeemPoints: pointsToRedeem,
    } = body

    if (!items?.length || !shippingAddress) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Cria o pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: user.id,
        status: 'aguardando_pagamento',
        subtotal,
        shipping_cost: shippingCost ?? 0,
        discount: discount ?? 0,
        total,
        shipping_address: shippingAddress,
      })
      .select('id')
      .single()

    if (orderError) throw orderError

    // Insere os itens
    const orderItems = items.map((item: { productId: string; qty: number; unitPrice: number; name: string }) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.qty,
      unit_price: item.unitPrice,
      name: item.name,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    // Resgata pontos de fidelidade se solicitado
    if (pointsToRedeem && pointsToRedeem > 0) {
      await redeemPoints(user.id, pointsToRedeem, order.id)
    }

    return NextResponse.json({ orderId: order.id }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/pedidos]', err)
    return NextResponse.json({ error: 'Erro ao criar pedido' }, { status: 500 })
  }
}

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, status, total, created_at, tracking_code')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(orders ?? [])
  } catch (err) {
    console.error('[GET /api/pedidos]', err)
    return NextResponse.json({ error: 'Erro ao buscar pedidos' }, { status: 500 })
  }
}