// app/api/pagamentos/stripe/intent/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPaymentIntent } from '@/lib/payments/stripe'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { orderId, amount, customerEmail } = await req.json()

    if (!orderId || !amount || !customerEmail) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const { clientSecret, paymentIntentId } = await createPaymentIntent(
      amount,
      orderId,
      customerEmail
    )

    // Registra pagamento pendente
    await supabase.from('payments').insert({
      order_id: orderId,
      provider: 'stripe',
      provider_id: paymentIntentId,
      amount,
      currency: 'BRL',
      method: 'card',
      status: 'pendente',
    })

    return NextResponse.json({ clientSecret })
  } catch (err) {
    console.error('[POST /api/pagamentos/stripe/intent]', err)
    return NextResponse.json({ error: 'Erro ao criar intenção de pagamento' }, { status: 500 })
  }
}