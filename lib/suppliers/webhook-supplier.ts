// lib/suppliers/webhook-supplier.ts
import { createClient } from '@/lib/supabase/server'
import type { SupplierAdapter } from './adapter.interface'
import type {
  ProductFilter,
  OrderPayload,
  SupplierOrderResult,
  TrackingInfo,
  SyncResult,
} from '@/types/supplier.types'
import type { Product } from '@/types/domain.types'

interface WebhookSupplierConfig {
  id: string
  name: string
  orderUrl: string
  trackingUrl: string
  pingUrl: string
  token: string
}

export class WebhookSupplierAdapter implements SupplierAdapter {
  readonly supplierId: string
  readonly supplierName: string
  private config: WebhookSupplierConfig

  constructor(config: WebhookSupplierConfig) {
    this.supplierId = config.id
    this.supplierName = config.name
    this.config = config
  }

  // Produtos já foram inseridos pelo webhook push do fornecedor
  async getProducts(filters?: ProductFilter): Promise<Product[]> {
    const supabase = await createClient()
    let query = supabase
      .from('products')
      .select('*')
      .eq('supplier_id', this.supplierId)

    if (filters?.category) query = query.eq('category', filters.category)
    if (filters?.skus?.length) query = query.in('sku', filters.skus)
    if (filters?.updatedAfter) {
      query = query.gte('updated_at', filters.updatedAfter.toISOString())
    }

    const { data, error } = await query
    if (error) throw new Error(`WebhookSupplier getProducts: ${error.message}`)
    return (data ?? []) as unknown as Product[]
  }

  async getStock(sku: string): Promise<number> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('products')
      .select('stock')
      .eq('sku', sku)
      .eq('supplier_id', this.supplierId)
      .single()

    if (error) return 0
    return data?.stock ?? 0
  }

  async createOrder(order: OrderPayload): Promise<SupplierOrderResult> {
    const res = await fetch(this.config.orderUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.token}`,
      },
      body: JSON.stringify({
        reference: order.externalRef,
        items: order.items,
        shipping: order.shippingAddress,
        customer_cpf: order.customerCpf,
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => 'sem resposta')
      throw new Error(`WebhookSupplier createOrder HTTP ${res.status}: ${text}`)
    }

    const data = await res.json()

    return {
      supplierOrderId: data.id ?? data.order_id ?? order.externalRef,
      status: data.status === 'accepted' ? 'accepted' : 'pending',
      estimatedShipDate: data.estimated_ship_date
        ? new Date(data.estimated_ship_date)
        : undefined,
      message: data.message,
    }
  }

  async trackOrder(orderId: string): Promise<TrackingInfo> {
    const res = await fetch(`${this.config.trackingUrl}/${orderId}`, {
      headers: { Authorization: `Bearer ${this.config.token}` },
    })

    if (!res.ok) {
      return {
        code: '',
        carrier: 'N/A',
        events: [{ date: new Date().toISOString(), status: 'unknown', description: 'Informação indisponível' }],
      }
    }

    const data = await res.json()
    return {
      code: data.tracking_code ?? '',
      carrier: data.carrier ?? 'N/A',
      estimatedDelivery: data.estimated_delivery ? new Date(data.estimated_delivery) : undefined,
      events: (data.events ?? []).map((e: { date: string; status: string; location?: string; description?: string }) => ({
        date: e.date,
        status: e.status,
        location: e.location,
        description: e.description ?? e.status,
      })),
    }
  }

  // Sync via webhook — produtos já chegam via push, apenas retorna o atual
  async syncCatalog(): Promise<SyncResult> {
    const supabase = await createClient()
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('supplier_id', this.supplierId)

    return { added: 0, updated: count ?? 0, removed: 0, errors: [] }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(this.config.pingUrl, {
        headers: { Authorization: `Bearer ${this.config.token}` },
        signal: AbortSignal.timeout(5000),
      })
      return res.ok
    } catch {
      return false
    }
  }
}