// lib/suppliers/manual-supplier.ts
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

interface ManualSupplierConfig {
  id: string
  name: string
}

export class ManualSupplierAdapter implements SupplierAdapter {
  readonly supplierId: string
  readonly supplierName: string

  constructor(config: ManualSupplierConfig) {
    this.supplierId = config.id
    this.supplierName = config.name
  }

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
    if (error) throw new Error(`ManualSupplier getProducts: ${error.message}`)
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
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('supplier_orders')
      .insert({
        supplier_id: this.supplierId,
        external_ref: order.externalRef,
        items: order.items,
        shipping_address: order.shippingAddress,
        status: 'manual',
        requires_manual_processing: true,
      })
      .select('id')
      .single()

    if (error) throw new Error(`ManualSupplier createOrder: ${error.message}`)

    return {
      supplierOrderId: data.id,
      status: 'pending',
      message: 'Pedido registrado para processamento manual pelo admin',
    }
  }

  async trackOrder(orderId: string): Promise<TrackingInfo> {
    const supabase = await createClient()

    const { data: order } = await supabase
      .from('orders')
      .select('tracking_code, tracking_events')
      .eq('id', orderId)
      .single()

    return {
      code: order?.tracking_code ?? '',
      carrier: 'A confirmar',
      events: order?.tracking_events ?? [
        {
          date: new Date().toISOString(),
          status: 'pending',
          description: 'Aguardando envio',
        },
      ],
    }
  }

  // Sync é feito pelo admin via upload de CSV no painel — retorna vazio
  async syncCatalog(): Promise<SyncResult> {
    return { added: 0, updated: 0, removed: 0, errors: [] }
  }

  // Fornecedor manual está sempre disponível
  async healthCheck(): Promise<boolean> {
    return true
  }
}