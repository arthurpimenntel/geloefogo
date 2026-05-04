export interface ProductFilter {
  category?: string
  updatedAfter?: Date
  skus?: string[]
}

export interface OrderPayload {
  externalRef: string        // nosso order.id
  items: Array<{ sku: string; qty: number }>
  shippingAddress: Address
  customerCpf: string
}

export interface SupplierOrderResult {
  supplierOrderId: string
  estimatedShipDate?: Date
  status: 'accepted' | 'rejected' | 'pending'
  message?: string
}

export interface TrackingInfo {
  code: string
  carrier: string
  events: TrackingEvent[]
  estimatedDelivery?: Date
}

export interface SyncResult {
  added: number
  updated: number
  removed: number
  errors: Array<{ sku: string; reason: string }>
}

// Contrato base — cada adaptador implementa
export interface SupplierAdapter {
  readonly supplierId: string
  readonly supplierName: string
  getProducts(filters?: ProductFilter): Promise<Product[]>
  getStock(sku: string): Promise<number>
  createOrder(order: OrderPayload): Promise<SupplierOrderResult>
  trackOrder(supplierId: string): Promise<TrackingInfo>
  syncCatalog(): Promise<SyncResult>
  healthCheck(): Promise<boolean>
}

// Registry — seleciona fornecedor com estoque automaticamente
export class SupplierRegistry {
  private static adapters: Map<string, SupplierAdapter> = new Map()

  static register(adapter: SupplierAdapter) {
    this.adapters.set(adapter.supplierId, adapter)
  }

  static async getWithStock(sku: string): Promise<SupplierAdapter | null> {
    // Ordena por prioridade (vem do DB), testa estoque
    for (const adapter of this.adapters.values()) {
      const stock = await adapter.getStock(sku)
      if (stock > 0) return adapter
    }
    return null
  }
}