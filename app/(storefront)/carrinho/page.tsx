'use client'
import Link from 'next/link'
import { useCart } from '@/hooks/useCart'

export default function CarrinhoPage() {
  const { items, subtotal, remove, setQty } = useCart()

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-5xl mb-6">🛒</p>
        <h1 className="font-playfair text-2xl text-amber-200 mb-3">Carrinho vazio</h1>
        <p className="text-amber-600 text-sm mb-8">Adicione produtos para continuar.</p>
        <Link href="/catalogo"
          className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-[#0D0805]
            text-xs font-bold uppercase tracking-widest transition-colors">
          Ir ao Catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <h1 className="font-playfair text-3xl text-amber-100 mb-10">Seu Carrinho</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(({ product, quantity }) => (
            <div key={product.id}
              className="flex gap-4 bg-[#1A0F08] border border-amber-900/20 p-4">
              <img src={product.images?.[0]} alt={product.name}
                className="w-20 h-20 object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-amber-100 font-medium text-sm leading-tight">{product.name}</p>
                <p className="text-amber-600 text-xs mt-1">{product.brand}</p>
                <p className="text-amber-400 text-sm font-medium mt-2">
                  {product.salePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <button onClick={() => setQty(product.id, quantity - 1)}
                    className="w-7 h-7 border border-amber-800 text-amber-400 hover:border-amber-500 transition-colors text-sm">
                    −
                  </button>
                  <span className="text-amber-200 text-sm w-5 text-center">{quantity}</span>
                  <button onClick={() => setQty(product.id, quantity + 1)}
                    className="w-7 h-7 border border-amber-800 text-amber-400 hover:border-amber-500 transition-colors text-sm">
                    +
                  </button>
                  <button onClick={() => remove(product.id)}
                    className="ml-auto text-xs text-amber-800 hover:text-red-400 transition-colors">
                    Remover
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-amber-300 text-sm font-medium">
                  {(product.salePrice * quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Resumo */}
        <div className="bg-[#1A0F08] border border-amber-900/20 p-6 h-fit">
          <h2 className="font-playfair text-lg text-amber-200 mb-5">Resumo</h2>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-amber-700">Subtotal</span>
            <span className="text-amber-300">{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
          <div className="flex justify-between text-sm mb-5 pb-5 border-b border-amber-900/20">
            <span className="text-amber-700">Frete</span>
            <span className="text-amber-600 text-xs">Calculado no checkout</span>
          </div>
          <div className="flex justify-between mb-6">
            <span className="text-amber-400 font-medium">Total</span>
            <span className="font-playfair text-xl text-amber-300">
              {subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          <Link href="/checkout"
            className="block w-full py-3 bg-amber-600 hover:bg-amber-500 text-[#0D0805]
              text-center text-xs font-bold uppercase tracking-widest transition-colors">
            Finalizar Compra
          </Link>
          <Link href="/catalogo"
            className="block w-full py-2 mt-3 text-center text-amber-700 hover:text-amber-400
              text-xs uppercase tracking-widest transition-colors">
            Continuar comprando
          </Link>
        </div>
      </div>
    </div>
  )
}
