import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { SupplierRegistry } from '@/lib/suppliers/adapter.interface'
import { Resend } from 'resend'
import { OrderConfirmedEmail } from '@/lib/email/templates/OrderConfirmed'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()          // raw body obrigatório para HMAC
  const sig  = req.headers.get('stripe-signature')!
  const db   = createClient()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }

  if (event.type !== 'payment_intent.succeeded')
    return NextResponse.json({ received: true })

  const intent  = event.data.object as Stripe.PaymentIntent
  const orderId = intent.metadata?.orderId
  if (!orderId)
    return NextResponse.json({ error: 'missing orderId' }, { status: 400 })

  // Idempotência — reentrancy segura
  const { data: existing } = await db
    .from('payments').select('status')
    .eq('provider_id', intent.id).single()
  if (existing?.status === 'aprovado')
    return NextResponse.json({ received: true, skipped: true })

  // 1 · Atualiza tabelas
  await db.from('payments').update({ status: 'aprovado' })
    .eq('provider_id', intent.id)
  await db.from('orders').update({ status: 'pago' }).eq('id', orderId)

  // 2 · Busca pedido completo
  const { data: order } = await db
    .from('orders')
    .select('*, order_items(*), profiles(email, full_name, cpf)')
    .eq('id', orderId).single()
  if (!order) return NextResponse.json({ error: 'order not found' }, { status: 404 })

  // 3 · Fulfillment no fornecedor
  try {
    for (const item of order.order_items) {
      const adapter = await SupplierRegistry.getWithStock(item.sku)
      if (!adapter) throw new Error(`Sem estoque: ${item.sku}`)
      const result = await adapter.createOrder({
        externalRef:     orderId,
        items:           [{ sku: item.sku, qty: item.quantity }],
        shippingAddress: order.shipping_address,
        customerCpf:     order.profiles?.cpf ?? '',
      })
      await db.from('orders')
        .update({ status: 'processando', supplier_order_id: result.supplierOrderId })
        .eq('id', orderId)
    }
  } catch (err: any) {
    // Alerta ops, mas retorna 200 — Stripe não vai retentar
    await resend.emails.send({
      from: 'ops@suatabacaria.com.br', to: 'ops@suatabacaria.com.br',
      subject: `⚠ Fulfillment falhou — #${orderId}`, text: err.message,
    })
  }

  // 4 · E-mail de confirmação
  await resend.emails.send({
    from:    'Tabacaria <pedidos@suatabacaria.com.br>',
    to:      order.profiles?.email ?? '',
    subject: `Pedido confirmado #${orderId.slice(0,8)}`,
    react:   OrderConfirmedEmail({
      customerName: order.profiles?.full_name ?? 'Cliente',
      orderId,
      items: order.order_items.map((i: any) => ({
        name: i.name, qty: i.quantity, price: i.unit_price, image: '',
      })),
      total:       order.total,
      trackingUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/rastreio/${orderId}`,
    }),
  })

  return NextResponse.json({ received: true })
}