import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHmac } from 'crypto'

const APP_KEY      = process.env.ALIEXPRESS_APP_KEY!
const APP_SECRET   = process.env.ALIEXPRESS_APP_SECRET!
const BASE_URL     = process.env.NEXT_PUBLIC_SITE_URL!
const API_HOST     = 'https://api-sg.aliexpress.com'
const CALLBACK_URL = `${BASE_URL}/api/aliexpress/oauth`

/**
 * Implementação exata do ae_sdk (código fonte verificado):
 * 1. Se method contém "/", ele vira prefixo da string e é removido dos params
 * 2. Restante dos params: ordenados alfabeticamente, concatenados chave+valor
 * 3. HMAC-SHA256 com app_secret como chave (NÃO é plain SHA256)
 * 4. Request é POST com params na QUERY STRING (não no body)
 */
function signAndBuildUrl(
  apiPath: string,
  params: Record<string, string | number>,
  secret: string,
): string {
  const p = { ...params }

  // O path vira prefixo da string de assinatura (e é removido dos params)
  let basestring = apiPath

  basestring += Object.entries(p)
    .filter(([, v]) => v != null)
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce((acc, [key, value]) => acc + key + String(value), '')

  const sign = createHmac('sha256', secret)
    .update(basestring)
    .digest('hex')
    .toUpperCase()

  // Monta a URL com os params na query string (igual ao ae_sdk)
  const sortedEntries = Object.entries(p)
    .filter(([, v]) => v != null)
    .sort(([a], [b]) => a.localeCompare(b))

  const query = sortedEntries
    .map(([k, v], i) => `${i === 0 ? '?' : '&'}${k}=${encodeURIComponent(String(v))}`)
    .join('')

  return `${API_HOST}/rest${apiPath}${query}&sign=${encodeURIComponent(sign)}`
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
      const params = {
        app_key:     APP_KEY,
        code,
        sign_method: 'sha256',
        timestamp:   Date.now(),
      }

      const url = signAndBuildUrl('/auth/token/create', params, APP_SECRET)

      console.log('[AliExpress] URL final:', url)

      // POST sem body — params vão na query string (comportamento do ae_sdk)
      const res = await fetch(url, { method: 'POST' })

      const rawText = await res.text()
      console.log('[AliExpress] Status:', res.status, '| Raw:', rawText)

      const data = JSON.parse(rawText)

      if (!data.access_token) {
        console.error('[AliExpress] Sem access_token:', rawText)
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