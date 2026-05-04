import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'

let tokenCache: { token: string; expires: number } | null = null

async function getCJToken(apiKey: string): Promise<string> {
  if (tokenCache && tokenCache.expires > Date.now() + 5 * 60 * 1000) {
    return tokenCache.token
  }
  const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  })
  const data = await res.json()
  if (!data.result) throw new Error(data.message || 'Falha ao autenticar no CJDropshipping')
  const expiryDate = new Date(data.data.accessTokenExpiryDate).getTime()
  tokenCache = { token: data.data.accessToken, expires: expiryDate }
  return tokenCache.token
}

async function getAuthToken(supabase: any): Promise<string> {
  const { data: supplier } = await supabase
    .from('suppliers')
    .select('config')
    .ilike('name', '%cj%')
    .eq('active', true)
    .single()

  const apiKey = supplier?.config?.api_key || process.env.CJ_API_KEY
  if (!apiKey) throw new Error('CJDropshipping não configurado. Cadastre o fornecedor com a API Key.')
  return getCJToken(apiKey)
}

async function authCheck(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado', status: 401, supabase: null }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const allowed = ['support', 'manager', 'super_admin']
  if (!profile || !allowed.includes(profile.role)) return { error: 'Sem permissão', status: 403, supabase: null }

  return { error: null, status: 200, supabase }
}

// A API CJ retorna produtos em data.content[0].productList (não data.list)
function extractProducts(data: any): any[] {
  if (Array.isArray(data?.data?.content)) {
    return data.data.content.flatMap((c: any) => c.productList ?? [])
  }
  if (Array.isArray(data?.data?.list)) {
    return data.data.list
  }
  return []
}

function extractTotal(data: any): number {
  return data?.data?.totalRecords ?? 0
}

function normalizeResponse(data: any): any {
  const list = extractProducts(data)
  const totalRecords = extractTotal(data)
  return {
    result: data.result ?? true,
    message: data.message,
    data: { list, totalRecords },
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authCheck(req)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const token = await getAuthToken(auth.supabase)
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action') || 'search'

    // ── search ────────────────────────────────────────────────────────────────
    if (action === 'search') {
      const keyword    = searchParams.get('keyword') || ''
      const page       = searchParams.get('page') || '1'
      const size       = searchParams.get('size') || '20'
      const minPrice   = searchParams.get('minPrice') || ''
      const maxPrice   = searchParams.get('maxPrice') || ''
      const categoryId = searchParams.get('categoryId') || ''

      const params = new URLSearchParams({
        page, size,
        ...(keyword    && { keyWord: keyword }),
        ...(minPrice   && { startSellPrice: minPrice }),
        ...(maxPrice   && { endSellPrice: maxPrice }),
        ...(categoryId && { categoryId }),
      })

      const res = await fetch(`${CJ_BASE}/product/listV2?${params}`, {
        headers: { 'CJ-Access-Token': token },
      })
      const data = await res.json()
      return NextResponse.json(normalizeResponse(data))
    }

    // ── category-products ────────────────────────────────────────────────────
    if (action === 'category-products') {
      const categoryId   = searchParams.get('categoryId') || ''
      const categoryName = searchParams.get('categoryName') || ''
      const page         = searchParams.get('page') || '1'
      const size         = searchParams.get('size') || '20'

      if (!categoryId) return NextResponse.json({ error: 'categoryId obrigatório' }, { status: 400 })

      // Tentativa 1: categoryId direto (UUID ou numérico)
      const res1 = await fetch(
        `${CJ_BASE}/product/listV2?${new URLSearchParams({ categoryId, page, size })}`,
        { headers: { 'CJ-Access-Token': token } }
      )
      const data1 = await res1.json()
      const list1 = extractProducts(data1)
      if (list1.length > 0) return NextResponse.json(normalizeResponse(data1))

      // Tentativa 2: busca por keyword = nome da categoria
      if (categoryName) {
        const res2 = await fetch(
          `${CJ_BASE}/product/listV2?${new URLSearchParams({ keyWord: categoryName, page, size })}`,
          { headers: { 'CJ-Access-Token': token } }
        )
        const data2 = await res2.json()
        const list2 = extractProducts(data2)
        if (list2.length > 0) return NextResponse.json(normalizeResponse(data2))
      }

      return NextResponse.json({
        result: true,
        data: { list: [], totalRecords: 0 },
        _debug: {
          message: 'Categoria não retornou produtos.',
          categoryId,
          categoryName,
        },
      })
    }

    // ── detail ────────────────────────────────────────────────────────────────
    if (action === 'detail') {
      const pid = searchParams.get('pid')
      if (!pid) return NextResponse.json({ error: 'pid obrigatório' }, { status: 400 })
      const res = await fetch(`${CJ_BASE}/product/query?pid=${pid}`, {
        headers: { 'CJ-Access-Token': token },
      })
      const data = await res.json()
      return NextResponse.json(data)
    }

    // ── sku ───────────────────────────────────────────────────────────────────
    if (action === 'sku') {
      const sku = searchParams.get('sku')
      if (!sku) return NextResponse.json({ error: 'sku obrigatório' }, { status: 400 })

      const directRes = await fetch(`${CJ_BASE}/product/query?pid=${encodeURIComponent(sku)}`, {
        headers: { 'CJ-Access-Token': token },
      })
      const directData = await directRes.json()
      if (directData.result && directData.data) {
        return NextResponse.json({ result: true, data: { product: directData.data } })
      }

      const searchRes = await fetch(
        `${CJ_BASE}/product/listV2?keyWord=${encodeURIComponent(sku)}&page=1&size=20`,
        { headers: { 'CJ-Access-Token': token } }
      )
      const searchData = await searchRes.json()
      const list = extractProducts(searchData)

      const skuUpper = sku.toUpperCase()
      const match = list.find((p: any) =>
        (p.sku ?? '').toUpperCase() === skuUpper ||
        (p.spu ?? '').toUpperCase() === skuUpper
      )

      if (match) return NextResponse.json({ result: true, data: { product: match } })

      return NextResponse.json({
        result: false,
        message: 'SKU não encontrada no CJDropshipping',
        data: null,
      })
    }

    // ── pid ───────────────────────────────────────────────────────────────────
    if (action === 'pid') {
      let raw = searchParams.get('pid') || ''
      const urlMatch = raw.match(/[?&]id=([A-F0-9\-]{36})/i)
      if (urlMatch) raw = urlMatch[1]
      if (!raw) return NextResponse.json({ error: 'pid ou URL obrigatório' }, { status: 400 })

      const res = await fetch(`${CJ_BASE}/product/query?pid=${encodeURIComponent(raw)}`, {
        headers: { 'CJ-Access-Token': token },
      })
      const data = await res.json()
      if (data.result && data.data) {
        return NextResponse.json({ result: true, data: { product: data.data } })
      }
      return NextResponse.json({ result: false, message: data.message || 'Produto não encontrado' })
    }

    // ── categories ────────────────────────────────────────────────────────────
    if (action === 'categories') {
      const res = await fetch(`${CJ_BASE}/product/getCategory`, {
        headers: { 'CJ-Access-Token': token },
      })
      const data = await res.json()
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/cj — importa produto CJ para o catálogo
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
    const costUsd = parseFloat(product.sellPrice || product.nowPrice || '0')
    const costBrl = parseFloat((costUsd * usdBrlRate).toFixed(2))
    const saleBrl = parseFloat((costBrl * (1 + markup_pct / 100)).toFixed(2))
    const sku = product.sku || product.spu || `CJ-${product.id || Date.now()}`

    const newProduct = {
      name:          product.nameEn,
      slug:          (product.nameEn || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now(),
      description:   product.description || product.nameEn,
      cost_price:    costBrl,
      sale_price:    saleBrl,
      compare_price: null,
      stock:         product.warehouseInventoryNum || product.totalVerifiedInventory || 0,
      active:        true,
      featured:      false,
      images:        product.bigImage ? [product.bigImage] : [],
      tags:          [product.oneCategoryName, product.twoCategoryName, product.threeCategoryName].filter(Boolean),
      sku,
      brand:         product.supplierName || 'CJDropshipping',
      supplier_id:   supplier_id || null,
      attributes: {
        cj_pid:       product.id,
        cj_sku:       product.sku,
        source:       'cjdropshipping',
        cost_usd:     costUsd,
        usd_brl_rate: usdBrlRate,
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