'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/hooks/useCart'
import type { Product } from '@/types/domain.types'

interface Props { product: Product }

export function ProductCard({ product }: Props) {
  const [adding, setAdding] = useState(false)
  const [liked,  setLiked]  = useState(false)
  const addToCart = useCart(s => s.add)
  const openCart  = useCart(s => s.open)

  const salePrice     = (product as any).sale_price    ?? product.salePrice    ?? 0
  const comparePrice  = (product as any).compare_price ?? product.comparePrice
  const originCountry = (product as any).origin_country ?? product.originCountry
  const images        = product.images ?? []
  const firstImage    = images[0]
  const outOfStock    = (product.stock ?? 0) === 0
  const lowStock      = !outOfStock && (product.stock ?? 0) <= 5

  const discountPct = comparePrice && comparePrice > salePrice
    ? Math.round((1 - salePrice / comparePrice) * 100)
    : 0

  async function handleAdd(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    if (outOfStock) return
    setAdding(true)
    addToCart({ ...product, salePrice, comparePrice, originCountry })
    await new Promise(r => setTimeout(r, 600))
    setAdding(false)
    openCart()
  }

  return (
    <div
      className="group bg-[#EDE3D6] rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
      style={{
        display: 'grid',
        gridTemplateRows: '220px 1fr auto auto',
      }}
    >
      {/* ── IMAGEM ── linha 1: altura fixa */}
      <div className="relative bg-[#D9CEBD] overflow-hidden">
        {firstImage ? (
          <Image
            src={firstImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#8B7355] text-4xl opacity-30">◆</div>
        )}

        {/* Like */}
        <button
          onClick={e => { e.preventDefault(); setLiked(l => !l) }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#F5EFE6]/80 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform z-10"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? '#C9A96E' : 'none'} stroke={liked ? '#C9A96E' : '#8B7355'} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {discountPct > 0 && (
            <span className="px-2 py-0.5 bg-[#C9A96E] text-[#1C1C1C] text-[10px] font-bold rounded-full tracking-wider uppercase">-{discountPct}%</span>
          )}
          {outOfStock && (
            <span className="px-2 py-0.5 bg-[#1C1C1C]/70 text-[#F5EFE6] text-[10px] font-semibold rounded-full tracking-wider uppercase">Esgotado</span>
          )}
          {lowStock && (
            <span className="px-2 py-0.5 bg-[#8B7355]/80 text-[#F5EFE6] text-[10px] font-semibold rounded-full tracking-wider uppercase">Últimas {product.stock} un.</span>
          )}
        </div>
      </div>

      {/* ── CONTEÚDO ── linha 2: expande com 1fr */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-[10px] tracking-[0.25em] uppercase text-[#8B7355] mb-1">
          {product.brand ?? '\u00A0'}
        </p>
        <h3
          className="font-serif font-bold text-[#1C1C1C] text-base leading-snug"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {product.name}
        </h3>
      </div>

      {/* ── PREÇO ── linha 3: sempre colado acima do botão */}
      <div className="px-4 pb-2">
        <div className="flex items-baseline gap-2">
          <span className="font-serif font-black text-[#1C1C1C] text-xl">
            {salePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          {comparePrice && comparePrice > salePrice && (
            <span className="text-[#B8A898] text-xs line-through">
              {comparePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          )}
        </div>
      </div>

      {/* ── BOTÃO ── linha 4: sempre no fundo */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={handleAdd}
          disabled={adding || outOfStock}
          className="flex-1 py-2.5 bg-[#1C1C1C] text-[#F5EFE6] text-xs font-semibold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-[#2D2D2D] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          {outOfStock ? 'Esgotado' : adding ? '...' : 'Adicionar'}
        </button>
        <Link
          href={`/produto/${product.slug}`}
          onClick={e => e.stopPropagation()}
          className="w-10 h-10 rounded-xl bg-[#D9CEBD] flex items-center justify-center hover:bg-[#C9BDB0] transition-colors flex-shrink-0"
          title="Ver produto"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>
    </div>
  )
}