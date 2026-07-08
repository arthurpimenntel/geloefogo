// app/api/reviews/[id]/reject/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

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

  const body = await req.json().catch(() => ({}))
  const reason = body.reason ?? null

  const { error } = await supabase
    .from('reviews')
    .update({
      status:        'rejected',
      reject_reason: reason,
      reviewed_at:   new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('status', 'pending')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, message: 'Avaliação rejeitada.' })
}