import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface ParsedProduct {
  name: string
  sku: string
  brand?: string
  description?: string
  sale_price: string
  compare_price?: string
  cost_price?: string
  stock?: string
  weight_g?: string
  intensity?: string
  origin_country?: string
  tags?: string
  images?: string
  category_slug?: string
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
async function requireStaff(supabase: any, userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw new Error('Erro ao verificar perfil: ' + error.message)

  const allowed = ['support', 'manager', 'super_admin']
  if (!profile || !allowed.includes(profile.role)) {
    throw new Error('FORBIDDEN')
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function slugify(text: string, suffix?: string): string {
  const base = (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // remove acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80)
  return suffix ? `${base}-${suffix}` : `${base}-${Date.now()}`
}

function parseImages(raw?: string): string[] {
  if (!raw?.trim()) return []
  return raw
    .split(/[|;,]/)
    .map(s => s.trim())
    .filter(s => s.startsWith('http'))
}

function parseTags(raw?: string): string[] {
  if (!raw?.trim()) return []
  return raw
    .split(/[|;,]/)
    .map(s => s.trim())
    .filter(Boolean)
}

function toNum(val?: string, fallback = 0): number {
  const n = parseFloat((val || '').replace(/[^0-9.]/g, ''))
  return isNaN(n) ? fallback : n
}

// ─── CSV mode — insere em batch ────────────────────────────────────────────────
async function importCsvProducts(
  supabase: any,
  products: ParsedProduct[],
): Promise<{ added: number; errors: string[] }> {
  const errors: string[] = []
  let   added            = 0

  for (const p of products) {
    // Validação mínima
    if (!p.name?.trim() || !p.sku?.trim()) {
      errors.push(`Linha ignorada — name e sku são obrigatórios (sku="${p.sku ?? ''}")`)
      continue
    }
    if (!p.sale_price || toNum(p.sale_price) <= 0) {
      errors.push(`SKU ${p.sku} — sale_price inválido`)
      continue
    }

    // Verifica duplicata por SKU
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('sku', p.sku.trim())
      .maybeSingle()

    if (existing) {
      errors.push(`SKU ${p.sku} já existe — pulado`)
      continue
    }

    const row = {
      name:          p.name.trim(),
      slug:          slugify(p.name),
      description:   p.description?.trim() || p.name.trim(),
      sku:           p.sku.trim(),
      brand:         p.brand?.trim()    || null,
      sale_price:    toNum(p.sale_price),
      compare_price: p.compare_price    ? toNum(p.compare_price) : null,
      cost_price:    p.cost_price       ? toNum(p.cost_price)     : null,
      stock:         p.stock            ? Math.floor(toNum(p.stock, 0)) : 0,
      active:        true,
      featured:      false,
      images:        parseImages(p.images),
      tags:          parseTags(p.tags),
      attributes: {
        source:         'csv',
        intensity:      p.intensity      || null,
        origin_country: p.origin_country || null,
        weight_g:       p.weight_g       ? toNum(p.weight_g) : null,
        category_slug:  p.category_slug  || null,
      },
    }

    const { error: insertErr } = await supabase.from('products').insert(row)
    if (insertErr) {
      errors.push(`SKU ${p.sku} — ${insertErr.message}`)
    } else {
      added++
    }
  }

  return { added, errors }
}

// ─── SKU mode — importa produto já normalizado por fornecedor externo ──────────
async function importSingleSku(
  supabase: any,
  sku: string,
  supplierId: string | null,
  markupPct: number,
): Promise<{ success: boolean; productName?: string; error?: string }> {
  // Para fornecedores genéricos (sem integração direta), o sku é inserido
  // como produto placeholder para revisão manual posterior.
  const { data: existing } = await supabase
    .from('products')
    .select('id, name')
    .eq('sku', sku.trim())
    .maybeSingle()

  if (existing) {
    return { success: false, error: `SKU ${sku} já existe no catálogo` }
  }

  const name = `Produto ${sku}`
  const row = {
    name,
    slug:        slugify(name),
    description: `Importado via SKU: ${sku}`,
    sku:         sku.trim(),
    brand:       null,
    sale_price:  0,
    cost_price:  0,
    stock:       0,
    active:      false,   // inativo até preenchimento manual
    featured:    false,
    images:      [],
    tags:        [],
    supplier_id: supplierId || null,
    attributes: {
      source:     'sku_import',
      markup_pct: markupPct,
      needs_review: true,
    },
  }

  const { data: inserted, error } = await supabase
    .from('products')
    .insert(row)
    .select('id, name')
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, productName: inserted.name }
}

// ─── POST ──────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = await createClient()

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    await requireStaff(supabase, user.id)

    const body = await req.json()
    const { mode, products, skus, supplier_id, markup_pct = 40 } = body

    // ── Modo CSV — products[] ─────────────────────────────────────────────────
    if (Array.isArray(products) && products.length > 0) {
      if (products.length > 500) {
        return NextResponse.json(
          { error: 'Máximo 500 produtos por importação CSV.' },
          { status: 400 },
        )
      }

      const result = await importCsvProducts(supabase, products)
      return NextResponse.json(result)
    }

    // ── Modo SKU — skus[] ─────────────────────────────────────────────────────
    if (mode === 'sku' && Array.isArray(skus) && skus.length > 0) {
      const results = []
      for (const sku of skus.slice(0, 50)) {
        const r = await importSingleSku(supabase, sku, supplier_id ?? null, markup_pct)
        results.push({ sku, ...r })
      }

      const added  = results.filter(r => r.success).length
      const errors = results.filter(r => !r.success).map(r => `${r.sku}: ${r.error}`)
      return NextResponse.json({ added, errors, results })
    }

    return NextResponse.json(
      { error: 'Corpo inválido. Envie { products: [...] } para CSV ou { mode: "sku", skus: [...] } para SKU.' },
      { status: 400 },
    )

  } catch (err: any) {
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }
    console.error('[import] erro:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ─── GET — diagnóstico rápido ──────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  const { count: supplierCount } = await supabase
    .from('suppliers')
    .select('*', { count: 'exact', head: true })

  const { data: aeSupplier } = await supabase
    .from('suppliers')
    .select('id, name, active, config')
    .ilike('name', '%ali%express%')
    .maybeSingle()

  const { data: aeIntegration } = await supabase
    .from('integrations')
    .select('provider, expires_at, updated_at')
    .eq('provider', 'aliexpress')
    .maybeSingle()

  return NextResponse.json({
    ok:           true,
    user_id:      user.id,
    user_email:   user.email,
    role:         profile?.role ?? 'nenhuma',
    can_import:   ['support', 'manager', 'super_admin'].includes(profile?.role),
    products_total:  productCount,
    suppliers_total: supplierCount,
    aliexpress_supplier: aeSupplier
      ? {
          id:           aeSupplier.id,
          name:         aeSupplier.name,
          active:       aeSupplier.active,
          has_token:    !!aeSupplier.config?.access_token,
          has_secret:   !!aeSupplier.config?.app_secret,
          env_key_set:  !!process.env.ALIEXPRESS_APP_KEY,
          env_secret_set: !!process.env.ALIEXPRESS_APP_SECRET,
        }
      : null,
    aliexpress_integration: aeIntegration ?? null,
  })
}