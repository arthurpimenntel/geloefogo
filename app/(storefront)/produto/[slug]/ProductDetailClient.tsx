'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/hooks/useCart'
import type { Product } from '@/types/domain.types'

export function ProductDetailClient({ product }: { product: Product }) {
  const [qty,     setQty]     = useState(1)
  const [adding,  setAdding]  = useState(false)
  const [added,   setAdded]   = useState(false)
  const { add, open } = useCart()

  async function handleAdd() {
    if (product.stock === 0) return
    setAdding(true)
    add(product, qty)
    await new Promise(r => setTimeout(r, 500))
    setAdding(false)
    setAdded(true)
    open()
    setTimeout(() => setAdded(false), 2500)
  }

  const maxQty = Math.min(product.stock, 10)

  return (
    <div className="space-y-4">
      {/* Qty selector */}
      {product.stock > 0 && (
        <div className="flex items-center gap-4">
          <p className="text-amber-700 text-[11px] uppercase tracking-widest">Quantidade</p>
          <div className="flex items-center border border-amber-900/40">
            <button
              onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-9 h-9 text-amber-600 hover:text-amber-300 text-lg transition-colors
                flex items-center justify-center"
            >
              −
            </button>
            <span className="w-10 text-center text-amber-200 text-sm">{qty}</span>
            <button
              onClick={() => setQty(q => Math.min(maxQty, q + 1))}
              className="w-9 h-9 text-amber-600 hover:text-amber-300 text-lg transition-colors
                flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Add to cart button */}
      <button
        onClick={handleAdd}
        disabled={adding || product.stock === 0}
        className="relative w-full py-4 overflow-hidden transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          bg-amber-700 hover:bg-amber-600 text-[#0D0805]
          text-sm font-bold uppercase tracking-[0.2em]"
      >
        <AnimatePresence mode="wait">
          {added ? (
            <motion.span
              key="added"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="block"
            >
              ✓ Adicionado ao carrinho
            </motion.span>
          ) : adding ? (
            <motion.span key="adding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="block">
              Adicionando...
            </motion.span>
          ) : product.stock === 0 ? (
            <motion.span key="oos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="block">
              Produto Esgotado
            </motion.span>
          ) : (
            <motion.span
              key="normal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="block"
            >
              Adicionar ao Carrinho
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Buy now */}
      {product.stock > 0 && (
        <a
          href="/checkout"
          onClick={() => { add(product, qty) }}
          className="block w-full py-3 border border-amber-700/60 text-amber-500
            hover:border-amber-500 hover:text-amber-300 text-center text-xs
            uppercase tracking-[0.2em] transition-colors"
        >
          Comprar Agora
        </a>
      )}
    </div>
  )
}
