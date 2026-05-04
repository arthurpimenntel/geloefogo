export interface Product {
  id: string
  slug: string
  sku: string
  name: string
  description: string
  category: Category
  salePrice: number
  comparePrice?: number
  costPrice: number
  stock: number
  images: string[]
  videoUrl?: string
  intensity?: 'suave' | 'medio' | 'forte' | 'muito_forte'
  brand?: string
  originCountry?: string
  tags: string[]
  harmonization?: HarmonizationData
  averageRating?: number
  reviewCount?: number
  active: boolean
}

export interface HarmonizationData {
  drink: string
  occasion: string
  notes: string
}

export interface Order {
  id: string
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  shippingCost: number
  discount: number
  total: number
  shippingAddress: Address
  payment?: Payment
  trackingCode?: string
  trackingEvents?: TrackingEvent[]
  createdAt: string
}

export type OrderStatus =
  | 'aguardando_pagamento' | 'pago' | 'processando'
  | 'enviado' | 'entregue' | 'devolvido' | 'cancelado'

export interface TrackingEvent {
  date: string
  location: string
  description: string
  status: OrderStatus
}
export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
}

export interface Address {
  name: string
  line1: string
  line2?: string
  city: string
  state: string
  zip: string
  country: string
}

export interface Payment {
  method: 'pix' | 'boleto' | 'credit_card'
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  paidAt?: string
  pixCode?: string
  boletoUrl?: string
  stripeIntentId?: string
}

export interface OrderItem {
  productId: string
  name: string
  sku: string
  price: number
  quantity: number
  image?: string
}