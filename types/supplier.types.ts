// types/supplier.types.ts
import type { Product } from './domain.types'

// ── Re-exports from adapter interface ──────────────────────────────────────
export type { SupplierAdapter } from '@/lib/suppliers/adapter.interface'

// ── Core supplier types ────────────────────────────────────────────────────
export interface ProductFilter {
  category?: string
  updatedAfter?: Date
  skus?: string[]
}

export interface OrderPayload {
  externalRef: string
  items: Array<{ sku: string; qty: number }>
  shippingAddress: Address
  customerCpf: string
}

export interface Address {
  name: string
  street: string
  number: string
  complement?: string
  district: string
  city: string
  state: string
  zipCode: string
  country?: string
}

export interface SupplierOrderResult {
  supplierOrderId: string
  estimatedShipDate?: Date
  status: 'accepted' | 'rejected' | 'pending'
  message?: string
}

export interface TrackingEvent {
  date: string
  status: string
  location?: string
  description: string
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

// ── Supplier config & metadata ─────────────────────────────────────────────
export type SupplierType = 'rest' | 'csv' | 'webhook' | 'manual'

export interface SupplierConfig {
  id: string
  name: string
  type: SupplierType
  markupPct: number
  active: boolean
  config: Record<string, unknown>
}

export interface SupplierSyncLog {
  id: string
  supplierId: string
  startedAt: string
  finishedAt?: string
  result?: SyncResult
  error?: string
}