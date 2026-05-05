import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'

const APP_KEY    = process.env.ALIEXPRESS_APP_KEY!
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET!
const BASE_URL   = process.env.NEXT_PUBLIC_SITE_URL!
const API_HOST   = 'https://api-sg.aliexpress.com'
const CALLBACK_URL = `${BASE_URL}/api/aliexpress/oauth`

/**
 * Assinatura para System Interfaces (ex: /auth/token/create)
 * Formato: hex( sha256( apiPath + param1value1param2value2... ) )
 * É plain SHA256, NÃO é HMAC. O secret NÃO é usado como chave.
 * Ref: https://www.scribd.com/document/869829507/Aliexpress-Affiliate-Documentation-1
 */
function signSystemInterface(
  apiPath: string,
  params: Record<string, string>,
): string {
  const sorted = Object.keys(params).sort()
  // Concatena os params SEM separadores: "app_key123code3_xxx..."
  const concatenated = sorted.map(k => `${k}${params[k]}`).join('')
  // Prefixa com o path da API
  const stringToSign = apiPath + concatenated
  // Plain SHA256 (sem chave) — NÃO é HMAC
  return createHash('sha256').update(stringToSign, 'utf8').digest('hex').toUpperCase()
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const code   = searchParams.get('code')

  if (action === 'connect') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(`${BASE_URL}/admin/login`)

    const authUrl = new URL('https://auth.aliexpress.com/oauth/authorize')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('force_auth',    'true')
    authUrl.searchParams.set('redirect_uri',  CALLBACK_URL)
    authUrl.searchParams.set('client_id',     APP_KEY)
    return NextResponse.redirect(authUrl.toString())
  }

  if (code) {
    const supabase = await createClient()
    try {
      // Apenas os 4 parâmetros que entram na assinatura (doc oficial)
      const timestamp = String(Date.now())
      const signParams: Record<string, string> = {
        app_key:     APP_KEY,
        code,
        sign_method: 'sha256',
        timestamp,
      }

      const sign = signSystemInterface('/auth/token/create', signParams)

      // O body da requisição pode ter campos extras que NÃO entram na assinatura
      const body = new URLSearchParams({
        ...signParams,
        sign,
      })

      console.log('[AliExpress] String assinada:', `/auth/token/create` +
        Object.keys(signParams).sort().map(k => `${k}${signParams[k]}`).join('')
      )
      console.log('[AliExpress] Sign gerada:', sign)
      console.log('[AliExpress] Body:', body.toString())

      const res = await fetch(`${API_HOST}/rest/auth/token/create`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    body.toString(),
      })

      const rawText = await res.text()
      console.log('[AliExpress] Status:', res.status, '| Raw:', rawText)

      const data = JSON.parse(rawText)

      if (!data.access_token) {
        console.error('[AliExpress] Sem access_token. Resposta:', rawText)
        return NextResponse.redirect(`${BASE_URL}/admin/fornecedores?ae_error=token_failed`)
      }

      await supabase.from('integrations').upsert({
        provider:      'aliexpress',
        access_token:  data.access_token,
        refresh_token: data.refresh_token ?? null,
        expires_at:    data.expire_time
          ? new Date(Number(data.expire_time)).toISOString()
          : null,
        account_id:    data.account ?? null,
        updated_at:    new Date().toISOString(),
      }, { onConflict: 'provider' })

      return NextResponse.redirect(`${BASE_URL}/admin/fornecedores?ae_connected=1`)
    } catch (err) {
      console.error('[AliExpress] Erro inesperado:', err)
      return NextResponse.redirect(`${BASE_URL}/admin/fornecedores?ae_error=server_error`)
    }
  }

  return NextResponse.redirect(`${BASE_URL}/admin/fornecedores`)
}