import type { SupplierAdapter, ProductFilter, OrderPayload,
  SupplierOrderResult, TrackingInfo, SyncResult } from './adapter.interface'
import type { Product } from '@/types/domain.types'
import { createClient } from '@/lib/supabase/server'

export class RestSupplierAdapter implements SupplierAdapter {
  readonly supplierId: string
  readonly supplierName: string
  private baseUrl: string
  private token: string
  private markupPct: number

  constructor(config: { id: string; name: string; baseUrl: string; token: string; markupPct: number }) {
    this.supplierId   = config.id
    this.supplierName = config.name
    this.baseUrl      = config.baseUrl
    this.token        = config.token
    this.markupPct    = config.markupPct
  }

  private async fetchWithRetry(path: string, retries = 3): Promise<any> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const res = await fetch(`${this.baseUrl}${path}`, {
          headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/json' },
          next: { revalidate: 0 }  // sempre fresco na sync
        })
        if (res.status === 429) {
          const retryAfter = Number(res.headers.get('retry-after') ?? 5)
          await new Promise(r => setTimeout(r, retryAfter * 1000))
          continue
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`)
        return res.json()
      } catch (err) {
        if (attempt === retries - 1) throw err
        await new Promise(r => setTimeout(r, 1000 * 2 ** attempt))
      }
    }
  }

  async syncCatalog(): Promise<SyncResult> {
    const supabase  = createClient()
    const raw       = await this.fetchWithRetry('/catalog')
    const result: SyncResult = { added: 0, updated: 0, removed: 0, errors: [] }

    for (const item of raw.products) {
      try {
        const salePrice = Math.ceil(item.cost * (1 + this.markupPct / 100) / 0.1) * 0.1
        const { error, data } = await supabase
          .from('products')
          .upsert({
            sku:          item.sku,
            supplier_sku: item.id,
            supplier_id:  this.supplierId,
            name:         item.name,
            cost_price:   item.cost,
            sale_price:   salePrice,
            stock:        item.qty,
            images:       item.images,
            active:       true
          }, { onConflict: 'sku', ignoreDuplicates: false })
          .select('id')
          .single()
        if (error) throw error
        data ? result.updated++ : result.added++
      } catch (e: any) {
        result.errors.push({ sku: item.sku, reason: e.message })
      }
    }
    return result
  }

  async getStock(sku: string) {
    const data = await this.fetchWithRetry(`/stock/${sku}`)
    return data.quantity ?? 0
  }

  async createOrder(order: OrderPayload): Promise<SupplierOrderResult> {
    const res = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    })
    const data = await res.json()
    return { supplierOrderId: data.id, status: data.status, estimatedShipDate: new Date(data.ship_date) }
  }

  async trackOrder(supplierOrderId: string) {
    return this.fetchWithRetry(`/orders/${supplierOrderId}/tracking`)
  }

  async getProducts() { return [] }

  async healthCheck() {
    try { await this.fetchWithRetry('/ping'); return true }
    catch { return false }
  }
}