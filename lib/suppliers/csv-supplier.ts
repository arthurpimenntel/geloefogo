// lib/suppliers/csv-supplier.ts
import Papa from 'papaparse'
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

interface CsvSupplierConfig {
  id: string
  name: string
  ftpHost: string
  ftpUser: string
  ftpPass: string
  filePath: string
  markupPct: number
}

interface CsvRow {
  sku: string
  name: string
  sale_price: string
  cost_price?: string
  stock: string
  description?: string
  category?: string
  brand?: string
  images?: string
  [key: string]: string | undefined
}

export class CsvSupplierAdapter implements SupplierAdapter {
  readonly supplierId: string
  readonly supplierName: string
  private config: CsvSupplierConfig

  constructor(config: CsvSupplierConfig) {
    this.supplierId = config.id
    this.supplierName = config.name
    this.config = config
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
    if (error) throw new Error(`CsvSupplier getProducts: ${error.message}`)
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
    // Fornecedor CSV não tem API de pedidos — pedido fica pendente para admin
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('supplier_orders')
      .insert({
        supplier_id: this.supplierId,
        external_ref: order.externalRef,
        items: order.items,
        shipping_address: order.shippingAddress,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) throw new Error(`CsvSupplier createOrder: ${error.message}`)

    return {
      supplierOrderId: data.id,
      status: 'pending',
      message: 'Pedido aguarda processamento manual pelo admin',
    }
  }

  async trackOrder(_orderId: string): Promise<TrackingInfo> {
    return {
      code: '',
      carrier: 'A confirmar',
      events: [{ date: new Date().toISOString(), status: 'pending', description: 'Aguardando envio' }],
    }
  }

  async syncCatalog(): Promise<SyncResult> {
    const result: SyncResult = { added: 0, updated: 0, removed: 0, errors: [] }

    let csvContent: string
    try {
      csvContent = await this.downloadFromFtp()
    } catch (err) {
      throw new Error(`CsvSupplier FTP download error: ${String(err)}`)
    }

    const parsed = Papa.parse<CsvRow>(csvContent, {
      header: true,
      skipEmptyLines: true,
    })

    if (!parsed.data.length) return result

    const supabase = await createClient()

    const upsertBatch = []
    for (const row of parsed.data) {
      if (!row.sku || !row.name || !row.sale_price || !row.stock) {
        result.errors.push({ sku: row.sku ?? 'N/A', reason: 'Colunas obrigatórias ausentes' })
        continue
      }

      const costPrice = parseFloat(row.cost_price ?? '0')
      const salePrice = costPrice * (1 + this.config.markupPct / 100)

      upsertBatch.push({
        sku: row.sku,
        name: row.name,
        cost_price: costPrice,
        sale_price: salePrice,
        stock: parseInt(row.stock, 10),
        description: row.description ?? '',
        category: row.category ?? 'outros',
        brand: row.brand ?? null,
        images: row.images ? row.images.split('|') : [],
        supplier_id: this.supplierId,
        active: true,
        updated_at: new Date().toISOString(),
      })
    }

    if (upsertBatch.length) {
      const { error } = await supabase
        .from('products')
        .upsert(upsertBatch, { onConflict: 'sku' })

      if (error) throw new Error(`CsvSupplier upsert error: ${error.message}`)
      result.added = upsertBatch.length
    }

    return result
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.downloadFromFtp()
      return true
    } catch {
      return false
    }
  }

  private async downloadFromFtp(): Promise<string> {
    // Dynamic import para não quebrar o bundle em ambientes sem ftp2
    const { default: FtpClient } = await import('ftp2' as string) as any // eslint-disable-line @typescript-eslint/no-explicit-any

    return new Promise((resolve, reject) => {
      const client = new FtpClient()

      client.on('ready', () => {
        client.get(this.config.filePath, (err: Error | null, stream: NodeJS.ReadableStream) => {
          if (err) { client.end(); return reject(err) }
          let data = ''
          stream.on('data', (chunk: Buffer) => { data += chunk.toString() })
          stream.on('end', () => { client.end(); resolve(data) })
          stream.on('error', (e: Error) => { client.end(); reject(e) })
        })
      })

      client.on('error', reject)

      client.connect({
        host: this.config.ftpHost,
        user: this.config.ftpUser,
        password: this.config.ftpPass,
      })
    })
  }
}