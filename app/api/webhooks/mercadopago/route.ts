// app/api/webhooks/mercadopago/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { awardPoints } from '@/lib/fidelity'
import crypto from 'crypto'

function validateSignature(req: NextRequest, rawBody: string): boolean {
  const xSignature = req.headers.get('x-signature') ?? ''
  const xRequestId = req.headers.get('x-request-id') ?? ''
  const dataId = req.nextUrl.searchParams.get('data.id') ?? ''

  // Formato MP: ts=...,v1=...
  const parts = Object.fromEntries(
    xSignature.split(',').map((p) => p.split('=') as [string, string])
  )
  const ts  = parts['ts']  ?? ''
  const v1  = parts['v1']  ?? ''

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

  const expectedHash = crypto
    .createHmac('sha256', process.env.MP_WEBHOOK_SECRET!)
    .update(manifest)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(expectedHash),
    Buffer.from(v1)
  )
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  try {
    if (!validateSignature(req, rawBody)) {
      console.warn('[MP Webhook] Assinatura inválida')
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
    }

    const body = JSON.parse(rawBody)

    if (body.type !== 'payment') {
      return NextResponse.json({ received: true })
    }

    const paymentId = String(body.data?.id ?? '')
    if (!paymentId) {
      return NextResponse.json({ error: 'payment id ausente' }, { status: 400 })
    }

    // Busca status atual no MP
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN!}` },
    })

    if (!mpRes.ok) throw new Error(`MP API status ${mpRes.status}`)

    const mpPayment = await mpRes.json()

    if (mpPayment.status !== 'approved') {
      return NextResponse.json({ received: true })
    }

    const supabase = await createClient()

    // Atualiza payments
    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .update({ status: 'aprovado', updated_at: new Date().toISOString() })
      .eq('provider_id', paymentId)
      .select('order_id')
      .single()

    if (payErr || !payment) {
      console.error('[MP Webhook] Payment não encontrado:', paymentId)
      return NextResponse.json({ received: true })
    }

    // Atualiza orders
    await supabase
      .from('orders')
      .update({ status: 'pago', updated_at: new Date().toISOString() })
      .eq('id', payment.order_id)

    // Concede pontos de fidelidade
    const { data: order } = await supabase
      .from('orders')
      .select('customer_id, total')
      .eq('id', payment.order_id)
      .single()

    if (order) {
      const points = Math.floor(order.total * 10)
      await awardPoints(order.customer_id, points, payment.order_id)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[MP Webhook] Erro:', err)
    // Retorna 200 para evitar reenvio do MP
    return NextResponse.json({ received: true })
  }
}