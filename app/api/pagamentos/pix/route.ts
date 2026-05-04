import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import MercadoPago, { Payment } from 'mercadopago'

const mp = new MercadoPago({ accessToken: process.env.MP_ACCESS_TOKEN! })

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderId, amount, payerEmail, payerCpf } = await req.json()

  const payment = await new Payment(mp).create({
    body: {
      transaction_amount: amount,
      description: 'Tabacaria — Pedido #' + orderId,
      payment_method_id: 'pix',
      date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      payer: { email: payerEmail, identification: { type: 'CPF', number: payerCpf } }
    }
  })

  const qrCode     = payment.point_of_interaction?.transaction_data?.qr_code
  const qrBase64   = payment.point_of_interaction?.transaction_data?.qr_code_base64

  await supabase.from('payments').insert({
    order_id:       orderId,
    method:         'pix',
    status:         'pendente',
    provider:       'mercadopago',
    provider_id:    String(payment.id),
    amount,
    pix_qr_code:    qrCode,
    pix_expires_at: new Date(Date.now() + 30 * 60 * 1000)
  })

  return NextResponse.json({ qrCode, qrBase64, paymentId: payment.id })
}