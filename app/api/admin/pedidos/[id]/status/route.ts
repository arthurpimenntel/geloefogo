// app/api/admin/pedidos/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { OrderStatus } from '@/types/domain.types'

const VALID_STATUSES: OrderStatus[] = [
  'aguardando_pagamento',
  'pago',
  'processando',
  'enviado',
  'entregue',
  'devolvido',
  'cancelado',
]

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params  // ← resolve a Promise

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['manager', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await req.json()
    const { status, trackingCode } = body as {
      status: OrderStatus
      trackingCode?: string
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Status inválido: ${status}` }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'enviado' && trackingCode) {
      updateData.tracking_code = trackingCode
      updateData.shipped_at = new Date().toISOString()
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)   // ← usa id no lugar de params.id
      .select('id, status, customer_id')
      .single()

    if (error) throw error
    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    revalidatePath(`/conta/pedidos/${id}`)  // ← id
    revalidatePath('/admin/pedidos')

    return NextResponse.json({ id: order.id, status: order.status })
  } catch (err) {
    console.error(`[PATCH /api/admin/pedidos/${id}/status]`, err)  // ← id
    return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 })
  }
}