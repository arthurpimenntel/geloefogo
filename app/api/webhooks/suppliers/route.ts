// app/api/webhooks/suppliers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidateCatalog } from '@/lib/revalidate'
import crypto from 'crypto'

interface StockUpdateItem {
  sku: string
  stock: number
}

interface CatalogUpdateItem {
  sku: string
  name: string
  sale_price: number
  cost_price?: number
  stock: number
  description?: string
  category?: string
  brand?: string
  images?: string[]
  active?: boolean
}

function validateSecret(req: NextRequest): boolean {
  const secret = req.headers.get('x-webhook-secret') ?? ''
  const expected = process.env.WEBHOOK_SUPPLIER_SECRET ?? ''
  if (!expected || !secret) return false
  return crypto.timingSafeEqual(
    Buffer.from(secret),
    Buffer.from(expected)
  )
}

export async function POST(req: NextRequest) {
  if (!validateSecret(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supplierId = req.headers.get('x-supplier-id')
  if (!supplierId) {
    return NextResponse.json({ error: 'x-supplier-id ausente' }, { status: 400 })
  }

  try {
    const body = await req.json()
    const { type, data } = body

    if (!type || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    const supabase = await createClient()

    if (type === 'stock_update') {
      const items = data as StockUpdateItem[]
      for (const item of items) {
        await supabase
          .from('products')
          .update({ stock: item.stock, updated_at: new Date().toISOString() })
          .eq('sku', item.sku)
          .eq('supplier_id', supplierId)
      }
    } else if (type === 'catalog_update') {
      const items = data as CatalogUpdateItem[]
      const rows = items.map((item) => ({
        sku: item.sku,
        name: item.name,
        sale_price: item.sale_price,
        cost_price: item.cost_price ?? 0,
        stock: item.stock,
        description: item.description ?? '',
        category: item.category ?? 'outros',
        brand: item.brand ?? null,
        images: item.images ?? [],
        supplier_id: supplierId,
        active: item.active ?? true,
        updated_at: new Date().toISOString(),
      }))

      const { error } = await supabase
        .from('products')
        .upsert(rows, { onConflict: 'sku' })

      if (error) throw error
    } else {
      return NextResponse.json({ error: `Tipo desconhecido: ${type}` }, { status: 400 })
    }

    await revalidateCatalog()

    return NextResponse.json({ received: true, type, count: data.length })
  } catch (err) {
    console.error('[Supplier Webhook] Erro:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}