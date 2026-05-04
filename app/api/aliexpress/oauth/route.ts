import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const APP_KEY    = process.env.ALIEXPRESS_APP_KEY!
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET!

// GET /api/aliexpress/oauth
//   ?action=connect → gera URL de autorização e redireciona
//   ?code=xxx       → callback com authorization code
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/admin/login', req.url))

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const code   = searchParams.get('code')

  // ── Inicia fluxo OAuth ────────────────────────────────────────────────────
  if (action === 'connect') {
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/aliexpress/oauth`
    const authUrl = `https://auth.aliexpress.com/oauth/authorize?response_type=code&force_auth=true&redirect_uri=${encodeURIComponent(callbackUrl)}&client_id=${APP_KEY}`
    return NextResponse.redirect(authUrl)
  }

  // ── Callback com o code ───────────────────────────────────────────────────
  if (code) {
    try {
      const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/aliexpress/oauth`
      const tokenRes = await fetch(
        `https://api-sg.aliexpress.com/rest/auth/token/create?code=${code}&app_key=${APP_KEY}&app_secret=${APP_SECRET}&redirect_uri=${encodeURIComponent(callbackUrl)}`,
        { method: 'POST' }
      )
      const tokenData = await tokenRes.json()

      if (!tokenData.access_token) {
        console.error('[AliExpress OAuth] Falha ao obter token:', tokenData)
        return NextResponse.redirect(new URL('/admin/fornecedores?ae_error=token_failed', req.url))
      }

      // Salva/atualiza fornecedor no Supabase
      const { data: existing } = await supabase
        .from('suppliers')
        .select('id, config')
        .ilike('name', '%aliexpress%')
        .single()

      const config = {
        ...(existing?.config || {}),
        app_key:       APP_KEY,
        app_secret:    APP_SECRET,
        access_token:  tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires: tokenData.expire_time,
        account:       tokenData.account,
        user_id:       tokenData.user_id,
      }

      if (existing?.id) {
        await supabase.from('suppliers').update({ config, active: true }).eq('id', existing.id)
      } else {
        await supabase.from('suppliers').insert({
          name:       'AliExpress',
          type:       'rest_api',
          config,
          markup_pct: 40,
          priority:   20,
          active:     true,
        })
      }

      return NextResponse.redirect(new URL('/admin/fornecedores?ae_connected=1', req.url))
    } catch (err: any) {
      console.error('[AliExpress OAuth] Erro:', err)
      return NextResponse.redirect(new URL('/admin/fornecedores?ae_error=server_error', req.url))
    }
  }

  return NextResponse.redirect(new URL('/admin/fornecedores', req.url))
}

// POST /api/aliexpress/oauth?action=disconnect
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  if (searchParams.get('action') === 'disconnect') {
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('id, config')
      .ilike('name', '%aliexpress%')
      .single()

    if (supplier) {
      const { app_key, app_secret } = supplier.config || {}
      await supabase.from('suppliers').update({
        config: { app_key, app_secret },
        active: false,
      }).eq('id', supplier.id)
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}