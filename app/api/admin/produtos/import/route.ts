import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function slugify(str: string) {
  return str.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 6)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { products } = await req.json()
  if (!Array.isArray(products)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  const { data: categories } = await supabase.from('categories').select('id, slug')
  const catMap = Object.fromEntries((categories ?? []).map((c: any) => [c.slug, c.id]))

  let added = 0
  const errors: string[] = []

  for (const p of products) {
    try {
      if (!p.name || !p.sku) { errors.push(`Linha ignorada: nome ou SKU ausente`); continue }
      const images = p.images ? p.images.split(',').map((s: string) => s.trim()).filter(Boolean) : []
      const tags   = p.tags   ? p.tags.split(',').map((s: string) => s.trim()).filter(Boolean)   : []
      const { error } = await supabase.from('products').upsert({
        name: p.name, slug: slugify(p.name), sku: p.sku,
        brand: p.brand || null, description: p.description || null,
        category_id: catMap[p.category_slug] ?? null,
        sale_price: parseFloat(p.sale_price) || 0,
        compare_price: p.compare_price ? parseFloat(p.compare_price) : null,
        cost_price: p.cost_price ? parseFloat(p.cost_price) : 0,
        stock: parseInt(p.stock) || 0,
        weight_g: p.weight_g ? parseInt(p.weight_g) : null,
        intensity: p.intensity || null, origin_country: p.origin_country || null,
        tags, images, active: true, updated_at: new Date().toISOString(),
      }, { onConflict: 'sku' })
      if (error) errors.push(`SKU ${p.sku}: ${error.message}`)
      else added++
    } catch (err: any) { errors.push(`SKU ${p.sku}: ${err.message}`) }
  }
  return NextResponse.json({ added, errors })
}
