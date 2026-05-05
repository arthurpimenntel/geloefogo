// app/api/aliexpress/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const AE_BASE = 'https://api-sg.aliexpress.com/sync'
const APP_KEY = process.env.ALIEXPRESS_APP_KEY!

// ─── Helpers de assinatura e chamada (mesma lógica do products/route.ts) ──────
function signRequest(params: Record<string, string>, appSecret: string): string {
  const sorted = Object.keys(params).sort().map(k => `${k}${params[k]}`).join('')
  return crypto
    .createHmac('md5', appSecret)
    .update(`${appSecret}${sorted}${appSecret}`)
    .digest('hex')
    .toUpperCase()
}

function buildParams(method: string, accessToken: string, extra: Record<string, string>, appSecret: string) {
  const params: Record<string, string> = {
    method,
    app_key: APP_KEY,
    access_token: accessToken,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    sign_method: 'hmac-md5',
    ...extra,
  }
  params.sign = signRequest(params, appSecret)
  return params
}

async function callAE(method: string, accessToken: string, extra: Record<string, string>, appSecret: string) {
  const params = buildParams(method, accessToken, extra, appSecret)
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${AE_BASE}?${qs}`)
  return res.json()
}

// ─── Verificação de autenticação e permissão ──────────────────────────────────
async function authCheck(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado', status: 401, supabase: null }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const allowed = ['support', 'manager', 'super_admin']
  if (!profile || !allowed.includes(profile.role)) return { error: 'Sem permissão', status: 403, supabase: null }
  return { error: null, status: 200, supabase }
}

async function getAECredentials(supabase: any) {
  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id, config')
    .ilike('name', '%ali%express%')
    .eq('active', true)
    .single()

  const appSecret   = supplier?.config?.app_secret   || process.env.ALIEXPRESS_APP_SECRET
  const accessToken = supplier?.config?.access_token

  if (!appSecret)   throw new Error('AliExpress não configurado. Adicione ALIEXPRESS_APP_SECRET no .env ou configure o fornecedor.')
  if (!accessToken) throw new Error('AliExpress não autorizado. Conecte sua conta na página de fornecedores.')

  return { appSecret, accessToken, supplierId: supplier?.id }
}

// ─── Normalização de produto (igual ao products/route.ts) ─────────────────────
function normalizeProduct(p: any) {
  const price    = p.target_sale_price || p.sale_price || p.original_price || '0'
  const priceVal = parseFloat(String(price).replace(/[^0-9.]/g, '')) || 0
  return {
    id:                     p.product_id || p.item_id,
    nameEn:                 p.product_title || p.subject,
    sku:                    p.product_id ? `AE-${p.product_id}` : `AE-${Date.now()}`,
    bigImage:               p.product_main_image_url || p.image_url || '',
    sellPrice:              String(priceVal),
    nowPrice:               null,
    listedNum:              p.lastest_volume || p.sale_count || 0,
    warehouseInventoryNum:  999,
    totalVerifiedInventory: 0,
    oneCategoryName:        p.first_level_category_name  || null,
    twoCategoryName:        p.second_level_category_name || null,
    threeCategoryName:      null,
    supplierName:           p.shop_name || 'AliExpress',
    categoryId:             p.first_level_category_id   || null,
    detail_url:             p.product_detail_url         || null,
  }
}

// ─── Handler GET ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const auth = await authCheck(req)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { appSecret, accessToken } = await getAECredentials(auth.supabase)
    const { searchParams } = new URL(req.url)

    const keyword    = searchParams.get('keyword') || ''
    const page       = searchParams.get('page')    || '1'
    const size       = searchParams.get('size')    || '20'
    const categoryId = searchParams.get('categoryId') || ''
    const minPrice   = searchParams.get('minPrice')   || ''
    const maxPrice   = searchParams.get('maxPrice')   || ''

    const extra: Record<string, string> = {
      keywords:        keyword || 'trending',
      page_no:         page,
      page_size:       size,
      sort:            'SALE_PRICE_ASC',
      target_currency: 'USD',
      target_language: 'EN',
      tracking_id:     'default',
    }
    if (categoryId) extra.category_ids = categoryId
    if (minPrice)   extra.min_sale_price = minPrice
    if (maxPrice)   extra.max_sale_price = maxPrice

    const data  = await callAE('aliexpress.affiliate.product.query', accessToken, extra, appSecret)
    const resp  = data?.aliexpress_affiliate_product_query_response?.resp_result
    const products = resp?.result?.products?.product ?? []

    return NextResponse.json({
      result: true,
      data: {
        list:         products.map(normalizeProduct),
        totalRecords: resp?.result?.total_record_count ?? 0,
      },
    })
  } catch (err: any) {
    const notConnected = err.message?.includes('não autorizado') || err.message?.includes('access_token')
    return NextResponse.json({ error: err.message, notConnected }, { status: notConnected ? 401 : 500 })
  }
}