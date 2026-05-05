import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const AE_BASE = 'https://api-sg.aliexpress.com/sync'
const APP_KEY = process.env.ALIEXPRESS_APP_KEY!

// ─── Signature (HMAC-MD5 padrão AliExpress) ───────────────────────────────────
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

// ─── Auth helpers ──────────────────────────────────────────────────────────────
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

  const appSecret    = supplier?.config?.app_secret    || process.env.ALIEXPRESS_APP_SECRET
  const accessToken  = supplier?.config?.access_token

  if (!appSecret)   throw new Error('AliExpress não configurado. Adicione ALIEXPRESS_APP_SECRET no .env ou configure o fornecedor.')
  if (!accessToken) throw new Error('AliExpress não autorizado. Conecte sua conta na página de fornecedores.')

  return { appSecret, accessToken, supplierId: supplier?.id }
}

// ─── Normalize product ─────────────────────────────────────────────────────────
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

export async function GET(req: NextRequest) {
  try {
    const auth = await authCheck(req)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { appSecret, accessToken } = await getAECredentials(auth.supabase)
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action') || 'search'

    // ── search ────────────────────────────────────────────────────────────────
    if (action === 'search') {
      const keyword    = searchParams.get('keyword') || 'trending'
      const page       = searchParams.get('page')    || '1'
      const size       = searchParams.get('size')    || '20'
      const categoryId = searchParams.get('categoryId') || ''
      const minPrice   = searchParams.get('minPrice')   || ''
      const maxPrice   = searchParams.get('maxPrice')   || ''

      const extra: Record<string, string> = {
        keywords:        keyword,
        page_no:         page,
        page_size:       size,
        sort:            'SALE_PRICE_ASC',
        target_currency: 'USD',
        target_language: 'EN',
        tracking_id:     'default',
      }
      if (categoryId) extra.category_ids  = categoryId
      if (minPrice)   extra.min_sale_price = minPrice
      if (maxPrice)   extra.max_sale_price = maxPrice

      const data  = await callAE('aliexpress.affiliate.product.query', accessToken, extra, appSecret)
      const data  = await callAE('aliexpress.affiliate.product.query', accessToken, extra, appSecret) 
      console.log('[AliExpress] Search raw:', JSON.stringify(data))
      const resp  = data?.aliexpress_affiliate_product_query_response?.resp_result
      const products = resp?.result?.products?.product ?? []

      return NextResponse.json({
        result: true,
        data: {
          list:         products.map(normalizeProduct),
          totalRecords: resp?.result?.total_record_count ?? 0,
        },
      })
    }

    // ── category-products ─────────────────────────────────────────────────────
    if (action === 'category-products') {
      const categoryId   = searchParams.get('categoryId')   || ''
      const categoryName = searchParams.get('categoryName') || ''
      const page         = searchParams.get('page') || '1'
      const size         = searchParams.get('size') || '20'

      const extra: Record<string, string> = {
        keywords:        categoryName || 'product',
        page_no:         page,
        page_size:       size,
        sort:            'SALE_PRICE_ASC',
        target_currency: 'USD',
        target_language: 'EN',
        tracking_id:     'default',
      }
      if (categoryId) extra.category_ids = categoryId

      const data  = await callAE('aliexpress.affiliate.product.query', accessToken, extra, appSecret)
      console.log('[AliExpress] Search raw:', JSON.stringify(data))
      const resp  = data?.aliexpress_affiliate_product_query_response?.resp_result
      const products = resp?.result?.products?.product ?? []

      return NextResponse.json({
        result: true,
        data: {
          list:         products.map(normalizeProduct),
          totalRecords: resp?.result?.total_record_count ?? 0,
        },
      })
    }

    // ── categories ────────────────────────────────────────────────────────────
    if (action === 'categories') {
      const data = await callAE('aliexpress.affiliate.category.get', accessToken, {
        app_signature: '',
      }, appSecret)

      const cats = data?.aliexpress_affiliate_category_get_response?.resp_result?.result?.categories?.category ?? []

      // Agrupa por categoria pai — estrutura compatível com o CategoryTree do painel
      const parentMap: Record<string, any> = {}
      const childrenMap: Record<string, any[]> = {}

      for (const cat of cats) {
        if (cat.parent_category_id === '0' || !cat.parent_category_id) {
          parentMap[String(cat.category_id)] = cat
        } else {
          const pid = String(cat.parent_category_id)
          if (!childrenMap[pid]) childrenMap[pid] = []
          childrenMap[pid].push(cat)
        }
      }

      const grouped = Object.values(parentMap).map((parent: any) => {
        const children = childrenMap[String(parent.category_id)] ?? []
        return {
          categoryFirstName: parent.category_name,
          categoryFirstList: children.length > 0
            ? [{
                categorySecondName: parent.category_name,
                categorySecondList: children.map((c: any) => ({
                  categoryId:   String(c.category_id),
                  categoryName: c.category_name,
                })),
              }]
            : [{
                categorySecondName: parent.category_name,
                categorySecondList: [{
                  categoryId:   String(parent.category_id),
                  categoryName: parent.category_name,
                }],
              }],
        }
      })

      return NextResponse.json({ result: true, data: grouped })
    }

    // ── sku / pid — busca por product_id ou URL ───────────────────────────────
    if (action === 'sku' || action === 'pid') {
      const raw = searchParams.get('sku') || searchParams.get('pid') || ''
      // Extrai ID numérico de URL AliExpress
      const idMatch =
        raw.match(/item\/(\d+)\.html/) ||
        raw.match(/[?&]id=(\d+)/)      ||
        (raw.match(/^\d+$/) ? [null, raw] : null)
      const productId = idMatch?.[1] || raw

      if (!productId) return NextResponse.json({ error: 'SKU ou URL obrigatório' }, { status: 400 })

      const data = await callAE('aliexpress.affiliate.productdetail.get', accessToken, {
        product_ids:     productId,
        target_currency: 'USD',
        target_language: 'EN',
        tracking_id:     'default',
      }, appSecret)

      const products = data?.aliexpress_affiliate_productdetail_get_response?.resp_result?.result?.products?.product ?? []
      if (products.length === 0) {
        return NextResponse.json({ result: false, message: 'Produto não encontrado no AliExpress', data: null })
      }
      return NextResponse.json({ result: true, data: { product: normalizeProduct(products[0]) } })
    }

    // ── status ────────────────────────────────────────────────────────────────
    if (action === 'status') {
      return NextResponse.json({ result: true, connected: true, message: 'AliExpress conectado.' })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (err: any) {
    const notConnected = err.message?.includes('não autorizado') || err.message?.includes('access_token')
    return NextResponse.json({ error: err.message, notConnected }, { status: notConnected ? 401 : 500 })
  }
}

// ─── POST — Importa produto AliExpress para o catálogo ────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const allowed = ['support', 'manager', 'super_admin']
    if (!profile || !allowed.includes(profile.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await req.json()
    const { product, markup_pct = 40, supplier_id } = body
    if (!product) return NextResponse.json({ error: 'Produto obrigatório' }, { status: 400 })

    const { data: rateConfig } = await supabase
      .from('configuracoes')
      .select('value')
      .eq('key', 'usd_brl_rate')
      .single()

    const usdBrlRate = parseFloat(rateConfig?.value || '5.80')
    const costUsd    = parseFloat(product.sellPrice || '0')
    const costBrl    = parseFloat((costUsd * usdBrlRate).toFixed(2))
    const saleBrl    = parseFloat((costBrl * (1 + markup_pct / 100)).toFixed(2))
    const sku        = product.sku || `AE-${product.id || Date.now()}`

    const newProduct = {
      name:          product.nameEn,
      slug:          (product.nameEn || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now(),
      description:   product.nameEn,
      cost_price:    costBrl,
      sale_price:    saleBrl,
      compare_price: null,
      stock:         product.warehouseInventoryNum || 999,
      active:        true,
      featured:      false,
      images:        product.bigImage ? [product.bigImage] : [],
      tags:          [product.oneCategoryName, product.twoCategoryName].filter(Boolean),
      sku,
      brand:         product.supplierName || 'AliExpress',
      supplier_id:   supplier_id || null,
      attributes: {
        ae_product_id: product.id,
        ae_sku:        product.sku,
        source:        'aliexpress',
        cost_usd:      costUsd,
        usd_brl_rate:  usdBrlRate,
        detail_url:    product.detail_url || null,
      },
    }

    const { data: inserted, error: err } = await supabase
      .from('products')
      .insert(newProduct)
      .select('id, name')
      .single()

    if (err) throw err
    return NextResponse.json({ success: true, product: inserted })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}