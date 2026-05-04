import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createClient()

  // Marca como expirado e cancela pedido associado
  const { data: expired } = await db
    .from('payments')
    .update({ status: 'falhou' })
    .eq('method', 'pix')
    .eq('status', 'pendente')
    .lt('pix_expires_at', new Date().toISOString())
    .select('order_id')

  if (expired?.length) {
    await db.from('orders')
      .update({ status: 'cancelado' })
      .in('id', expired.map(p => p.order_id))
      .eq('status', 'aguardando_pagamento') // só cancela se ainda não pagou
  }

  return NextResponse.json({ expired: expired?.length ?? 0 })
}