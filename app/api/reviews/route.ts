// app/api/reviews/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('product_id')
  const status    = searchParams.get('status') ?? 'approved'
  const limit     = parseInt(searchParams.get('limit') ?? '20')
  const offset    = parseInt(searchParams.get('offset') ?? '0')

  let query = supabase
    .from('reviews')
    .select(`
      id, video_url, thumbnail_url, rating, caption, views, likes, created_at,
      product:products(id, name, slug, images),
      user:profiles(id, full_name, avatar_url)
    `)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (productId) query = query.eq('product_id', productId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reviews: data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Autenticação
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const body = await req.json()
  const { product_id, order_id, video_url, thumbnail_url, rating, caption } = body

  // Validações básicas
  if (!product_id || !order_id || !video_url || !rating) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 })
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Nota deve ser entre 1 e 5.' }, { status: 400 })
  }

  // Verificar se o pedido pertence ao usuário e contém o produto
  const { data: orderItem } = await supabase
    .from('order_items')
    .select('id, order:orders(id, user_id, status)')
    .eq('product_id', product_id)
    .eq('order_id', order_id)
    .single()

  if (!orderItem) {
    return NextResponse.json({ error: 'Pedido não encontrado ou produto não consta nele.' }, { status: 403 })
  }

  const order = (orderItem as any).order
  if (order.user_id !== user.id) {
    return NextResponse.json({ error: 'Este pedido não pertence à sua conta.' }, { status: 403 })
  }

  const validStatuses = ['pago', 'processando', 'enviado', 'entregue']
  if (!validStatuses.includes(order.status)) {
    return NextResponse.json({ error: 'Pedido precisa estar pago ou entregue para avaliar.' }, { status: 403 })
  }

  // Verificar se já avaliou este produto
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', product_id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Você já avaliou este produto.' }, { status: 409 })
  }

  // Criar avaliação
  const { data: review, error } = await supabase
    .from('reviews')
    .insert({
      user_id:       user.id,
      product_id,
      order_id,
      video_url,
      thumbnail_url: thumbnail_url ?? null,
      rating,
      caption:       caption ?? null,
      status:        'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ review, message: 'Avaliação enviada! Será publicada após moderação.' }, { status: 201 })
}