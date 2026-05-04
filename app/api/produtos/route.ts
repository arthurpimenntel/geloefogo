// app/api/produtos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const categoria  = searchParams.get('categoria')
  const intensidade = searchParams.get('intensidade')
  const busca      = searchParams.get('busca')
  const page       = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit      = Math.min(48, parseInt(searchParams.get('limit') ?? '24', 10))
  const offset     = (page - 1) * limit

  try {
    const supabase = await createClient()
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('active', true)

    if (categoria)  query = query.eq('category', categoria)
    if (intensidade) query = query.eq('intensity', intensidade)
    if (busca) {
      query = query.or(
        `name.fts.${busca},description.fts.${busca}`
      )
    }

    const { data: products, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    const total = count ?? 0

    return NextResponse.json({
      products: products ?? [],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    console.error('[GET /api/produtos]', err)
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    )
  }
}