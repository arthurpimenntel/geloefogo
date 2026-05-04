// app/api/fornecedores/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  roles: string[]
): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  return !!data && roles.includes(data.role)
}

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const allowed = await requireRole(supabase, user.id, ['manager', 'super_admin'])
    if (!allowed) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('suppliers')
      .select('id, name, type, last_sync, active')
      .eq('active', true)
      .order('name')

    if (error) throw error

    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('[GET /api/fornecedores]', err)
    return NextResponse.json({ error: 'Erro ao buscar fornecedores' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const allowed = await requireRole(supabase, user.id, ['super_admin'])
    if (!allowed) {
      return NextResponse.json({ error: 'Apenas super_admin pode criar fornecedores' }, { status: 403 })
    }

    const body = await req.json()
    const { name, type, markupPct, config } = body

    if (!name || !type) {
      return NextResponse.json({ error: 'name e type são obrigatórios' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('suppliers')
      .insert({ name, type, markup_pct: markupPct ?? 30, config: config ?? {}, active: true })
      .select('id, name, type')
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[POST /api/fornecedores]', err)
    return NextResponse.json({ error: 'Erro ao criar fornecedor' }, { status: 500 })
  }
}