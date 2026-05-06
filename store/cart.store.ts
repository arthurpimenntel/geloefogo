import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/types/domain.types'

export interface CartItem {
  product: Product
  quantity: number
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  open: () => void
  close: () => void
  add(product: Product, qty?: number): void
  remove(productId: string): void
  setQty(productId: string, qty: number): void
  clear(): void
  readonly subtotal: number
  readonly itemCount: number
}

function sanitizeProduct(product: Product): Product {
  return {
    ...product,
    salePrice:    parseFloat(String(product.salePrice))    || 0,
    comparePrice: product.comparePrice != null
      ? parseFloat(String(product.comparePrice)) || 0
      : null,
    costPrice: product.costPrice != null
      ? parseFloat(String(product.costPrice)) || 0
      : null,
  }
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items:  [],
      isOpen: false,

      open:  () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),

      add(product, qty = 1) {
        const sanitized = sanitizeProduct(product)
        set(state => {
          const existing = state.items.find(i => i.product.id === sanitized.id)
          if (existing) {
            return {
              items: state.items.map(i =>
                i.product.id === sanitized.id
                  ? { ...i, quantity: i.quantity + qty }
                  : i
              ),
            }
          }
          return { items: [...state.items, { product: sanitized, quantity: qty }] }
        })
      },

      remove(id) {
        set(s => ({ items: s.items.filter(i => i.product.id !== id) }))
      },

      setQty(id, qty) {
        if (qty <= 0) { get().remove(id); return }
        set(s => ({
          items: s.items.map(i =>
            i.product.id === id ? { ...i, quantity: qty } : i
          ),
        }))
      },

      clear: () => set({ items: [] }),

      get subtotal() {
        return get().items.reduce(
          (s, i) => s + (parseFloat(String(i.product.salePrice)) || 0) * i.quantity,
          0
        )
      },

      get itemCount() {
        return get().items.reduce((s, i) => s + i.quantity, 0)
      },
    }),
    {
      name: 'tabacaria-cart',
      // Sanitiza preços ao reidratar do localStorage
      onRehydrateStorage: () => state => {
        if (!state) return
        state.items = state.items.map(item => ({
          ...item,
          product: sanitizeProduct(item.product),
        }))
      },
    }
  )
)