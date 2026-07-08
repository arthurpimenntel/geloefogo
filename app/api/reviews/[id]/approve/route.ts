// app/api/reviews/[id]/approve/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  // Verificar se é admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string }>()

  const adminRoles = ['support', 'manager', 'super_admin']
  if (!adminRoles.includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
  }

  // Aprovar avaliação
  const { data: review, error } = await supabase
    .from('reviews')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('status', 'pending')
    .select('id, user_id')
    .single()

  if (error || !review) {
    return NextResponse.json({ error: error?.message ?? 'Avaliação não encontrada.' }, { status: 404 })
  }

  // Gerar cupom de 15% via função SQL
  const { data: couponCode, error: couponError } = await supabase
    .rpc('generate_review_coupon', { p_review_id: params.id })

  if (couponError) {
    console.error('Erro ao gerar cupom:', couponError)
    // Não falha — avaliação já foi aprovada
  }

  return NextResponse.json({
    success: true,
    coupon_code: couponCode ?? null,
    message: 'Avaliação aprovada e cupom de 15% gerado.',
  })
}