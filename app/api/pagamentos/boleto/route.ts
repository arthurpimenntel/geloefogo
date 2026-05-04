// app/api/pagamentos/boleto/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createBoletoPayment } from '@/lib/payments/mercadopago'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { orderId, amount, payerEmail, payerCpf, payerName } = await req.json()

    if (!orderId || !amount || !payerEmail || !payerCpf || !payerName) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const result = await createBoletoPayment({
      orderId, amount, payerEmail, payerCpf, payerName,
    })

    // Salva na tabela payments
    await supabase.from('payments').insert({
      order_id: orderId,
      provider: 'mercadopago',
      provider_id: result.paymentId,
      amount,
      currency: 'BRL',
      method: 'boleto',
      status: 'pendente',
      boleto_url: result.boletoUrl,
      boleto_code: result.boletoCode,
      due_date: result.dueDate,
    })

    return NextResponse.json({
      boletoUrl: result.boletoUrl,
      boletoCode: result.boletoCode,
      dueDate: result.dueDate,
    })
  } catch (err) {
    console.error('[POST /api/pagamentos/boleto]', err)
    return NextResponse.json({ error: 'Erro ao gerar boleto' }, { status: 500 })
  }
}