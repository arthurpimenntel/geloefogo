import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHmac, createHash } from 'crypto'

const APP_KEY    = process.env.ALIEXPRESS_APP_KEY!
const APP_SECRET = process.env.ALIEXPRESS_APP_SECRET!
const BASE_URL   = process.env.NEXT_PUBLIC_SITE_URL!
const API_HOST   = 'https://api-sg.aliexpress.com'

function signRest(apiPath: string, params: Record<string, string>, secret: string): string {
  const sorted = Object.keys(params).sort()
  const stringToSign = apiPath + sorted.map(k => `${k}${params[k]}`).join('')
  return createHmac('sha256', secret).update(stringToSign, 'utf8').digest('hex').toUpperCase()
}

function signMD5(params: Record<string, string>, secret: string): string {
  const sorted = Object.keys(params).sort()
  const str = secret + sorted.map(k => `${k}${params[k]}`).join('') + secret
  return createHash('md5').update(str, 'utf8').digest('hex').toUpperCase()
}

async function tryTokenExchange(code: string) {
  // Timestamp no formato que o TOP API espera
  const now = new Date()
  const timestamp = now.toISOString().replace('T', ' ').substring(0, 19)

  const attempts = [
    // TOP API com method explícito + timestamp formatado
    {
      label: 'MD5 /sync method=aliexpress.system.oauth.token',
      path: '/sync',
      params: {
        app_key:     APP_KEY,
        code,
        method:      'aliexpress.system.oauth.token',
        sign_method: 'md5',
        timestamp,
      },
      signFn: (p: Record<string, string>) => signMD5(p, APP_SECRET),
    },
    // REST com timestamp Unix ms (tentativas anteriores)
    {
      label: 'SHA256 /rest/auth/token/create timestamp-ms',
      path: '/rest/auth/token/create',
      params: {
        app_key:     APP_KEY,
        code,
        sign_method: 'sha256',
        timestamp:   String(Date.now()),
      },
      signFn: (p: Record<string, string>) => signRest('/rest/auth/token/create', p, APP_SECRET),
    },
    // REST com timestamp formatado
    {
      label: 'SHA256 /rest/auth/token/create timestamp-formatted',
      path: '/rest/auth/token/create',
      params: {
        app_key:     APP_KEY,
        code,
        sign_method: 'sha256',
        timestamp,
      },
      signFn: (p: Record<string, string>) => signRest('/rest/auth/token/create', p, APP_SECRET),
    },
  ]

  for (const attempt of attempts) {
    const sign = attempt.signFn(attempt.params)
    const body = new URLSearchParams({ ...attempt.params, sign })

    console.log(`[AliExpress] Tentando: ${attempt.label}`)
    console.log(`[AliExpress] Body:`, body.toString())

    const res = await fetch(`${API_HOST}${attempt.path}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body.toString(),
    })

    const rawText = await res.text()
    console.log(`[AliExpress] Status: ${res.status} | Raw: ${rawText}`)

    if (!rawText) continue

    try {
      const data = JSON.parse(rawText)
      if (data.access_token) return data
      if (data.code !== 'IncompleteSignature') {
        console.log('[AliExpress] Erro diferente — parando:', data.code)
        return data
      }
    } catch {
      console.log('[AliExpress] Resposta não é JSON')
    }
  }

  return null
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
      const timestamp = String(Date.now())
      const tokenData = await tryTokenExchange(code, timestamp)

      if (!tokenData?.access_token) {
        console.error('[AliExpress] Nenhuma tentativa retornou access_token')
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