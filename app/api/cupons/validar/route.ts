import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json()
    if (!code) return NextResponse.json({ error: 'Código não informado' }, { status: 400 })

    const supabase = await createClient()
    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('active', true)
      .single()

    if (!coupon) return NextResponse.json({ error: 'Cupom não encontrado ou inativo' }, { status: 404 })

    const now = new Date()

    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return NextResponse.json({ error: 'Cupom ainda não está válido' }, { status: 400 })
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return NextResponse.json({ error: 'Cupom expirado' }, { status: 400 })
    }
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({ error: 'Limite de usos do cupom atingido' }, { status: 400 })
    }
    if (coupon.min_order && subtotal < coupon.min_order) {
      return NextResponse.json({
        error: `Pedido mínimo de ${coupon.min_order.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} para este cupom`,
      }, { status: 400 })
    }

    return NextResponse.json({
      id:    coupon.id,
      code:  coupon.code,
      type:  coupon.type,
      value: coupon.value,
    })
  } catch (err) {
    console.error('[POST /api/cupons/validar]', err)
    return NextResponse.json({ error: 'Erro ao validar cupom' }, { status: 500 })
  }
}
