import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHmac } from 'crypto'

const APP_KEY    = process.env.ALIEXPRESS_APP_KEY!
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET!
const BASE_URL   = process.env.NEXT_PUBLIC_SITE_URL!
const API_HOST   = 'https://api-sg.aliexpress.com'
const API_PATH   = '/rest/auth/token/create'

/**
 * AliExpress REST API signing (IOP SDK)
 * stringToSign = apiPath + sorted(key + value) — sem secret no input do HMAC
 */
function signRequest(
  apiPath: string,
  params: Record<string, string>,
  secret: string
): string {
  const sorted = Object.keys(params).sort()
  const stringToSign = apiPath + sorted.map(k => `${k}${params[k]}`).join('')
  return createHmac('sha256', secret)
    .update(stringToSign, 'utf8')
    .digest('hex')
    .toUpperCase()
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const code   = searchParams.get('code')

  if (action === 'connect') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(`${BASE_URL}/admin/login`)

    const callbackUrl = `${BASE_URL}/api/aliexpress/oauth`
    const authUrl = new URL('https://auth.aliexpress.com/oauth/authorize')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('force_auth', 'true')
    authUrl.searchParams.set('redirect_uri', callbackUrl)
    authUrl.searchParams.set('client_id', APP_KEY)
    return NextResponse.redirect(authUrl.toString())
  }

  if (code) {
    const supabase = await createClient()
    try {
      const callbackUrl = `${BASE_URL}/api/aliexpress/oauth`
      const timestamp   = String(Date.now())

      // sign_method DEVE estar aqui dentro, não fora
      const paramsToSign: Record<string, string> = {
        app_key:      APP_KEY,
        code,
        grant_type:   'authorization_code',
        redirect_uri: callbackUrl,
        sign_method:  'sha256',
        timestamp,
      }

      const sign = signRequest(API_PATH, paramsToSign, APP_SECRET)

      // Debug: confirma a string que está sendo assinada
      const debugStr = API_PATH + Object.keys(paramsToSign).sort()
        .map(k => `${k}${paramsToSign[k]}`).join('')
      console.log('[AliExpress] stringToSign:', debugStr)
      console.log('[AliExpress] sign:', sign)

      const body = new URLSearchParams({ ...paramsToSign, sign })

      const tokenRes = await fetch(`${API_HOST}${API_PATH}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    body.toString(),
      })

      const tokenData = await tokenRes.json()
      console.log('[AliExpress] tokenData:', JSON.stringify(tokenData, null, 2))

      if (!tokenData.access_token) {
        return NextResponse.redirect(`${BASE_URL}/admin/fornecedores?ae_error=token_failed`)
      }

      await supabase.from('integrations').upsert({
        provider:      'aliexpress',
        access_token:  tokenData.access_token,
        refresh_token: tokenData.refresh_token ?? null,
        expires_at:    tokenData.expire_time
          ? new Date(Number(tokenData.expire_time)).toISOString()
          : null,
        account_id:    tokenData.account ?? null,
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