'use client'
import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useCart } from '@/hooks/useCart'
import type { Product } from '@/types/domain.types'

interface Props { product: Product }

export function ProductCard({ product }: Props) {
  const [flipped, setFlipped] = useState(false)
  const [adding,  setAdding]  = useState(false)
  const addToCart = useCart(s => s.add)
  const openCart  = useCart(s => s.open)

  async function handleAdd(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    setAdding(true)
    addToCart({ ...product, salePrice, comparePrice, originCountry })
    await new Promise(r => setTimeout(r, 600))
    setAdding(false)
    openCart()
  }

  // Normalize DB snake_case fields if needed
  const salePrice    = (product as any).sale_price    ?? product.salePrice ?? 0
  const comparePrice = (product as any).compare_price ?? product.comparePrice
  const originCountry= (product as any).origin_country ?? product.originCountry
  const images       = product.images ?? []
  const firstImage   = images[0]

  const discountPct = comparePrice && comparePrice > salePrice
    ? Math.round((1 - salePrice / comparePrice) * 100)
    : 0

  return (
    <div
      className="relative cursor-pointer select-none"
      style={{ perspective: '1000px', height: '420px' }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={() => setFlipped(f => !f)} // mobile tap
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      >
        {/* ── FRENTE ── */}
        <div
          className="absolute inset-0 bg-[#100B07] border border-amber-900/20"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <MagneticZoom src={firstImage} alt={product.name} />

          <div className="p-4">
            {product.tags?.slice(0, 2).map(tag => (
              <span key={tag}
                className="inline-block mr-1.5 mb-1 text-[10px] uppercase tracking-widest
                  text-amber-500 border border-amber-800/40 px-1.5 py-0.5">
                {tag}
              </span>
            ))}

            <h3 className="font-playfair text-amber-100 text-lg leading-tight mt-1">
              {product.name}
            </h3>
            <p className="text-amber-700 text-xs mt-0.5">{product.brand}</p>

            <div className="flex items-end justify-between mt-4">
              <div>
                <span className="font-playfair text-amber-400 text-xl">
                  {salePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                {comparePrice && (
                  <span className="text-amber-800 text-xs line-through ml-2">
                    {comparePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                )}
              </div>
              {discountPct > 0 && (
                <span className="text-[10px] bg-amber-600 text-[#0D0805] font-bold px-1.5 py-0.5">
                  -{discountPct}%
                </span>
              )}
            </div>

            <p className="text-amber-800 text-xs mt-2">
              {(product.stock ?? 0) === 0 ? '✕ Esgotado' :
               (product.stock ?? 0) <= 5  ? `⚡ Últimas ${product.stock} un.` :
               '✓ Em estoque'}
            </p>
          </div>
        </div>

        {/* ── VERSO ── */}
        <div
          className="absolute inset-0 bg-[#1A0F06] border border-amber-600/30
            flex flex-col justify-between p-6 overflow-hidden"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="overflow-hidden">
            <p className="text-amber-600 text-xs uppercase tracking-widest mb-1">Detalhes</p>
            <h3 className="font-playfair text-amber-100 text-xl mb-3 leading-tight">
              {product.name}
            </h3>
            <p className="text-amber-300/80 text-sm leading-relaxed line-clamp-3">
              {product.description ?? ''}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                product.brand           && { label:'Marca',     value: product.brand },
                originCountry           && { label:'Origem',    value: originCountry },
                product.category?.name  && { label:'Categoria', value: product.category.name },
                product.intensity       && { label:'Intensidade',
                  value: { suave:'Suave', medio:'Médio', forte:'Forte', muito_forte:'Muito Forte' }[product.intensity] ?? product.intensity },
              ].filter(Boolean).map((attr: any) => (
                <div key={attr.label}>
                  <p className="text-amber-800 text-[10px] uppercase tracking-widest">{attr.label}</p>
                  <p className="text-amber-300 text-xs mt-0.5 truncate">{attr.value}</p>
                </div>
              ))}
            </div>

            {product.intensity && (
              <div className="mt-4">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(n => {
                    const lvl = { suave:1, medio:2, forte:3, muito_forte:4 }[product.intensity!] ?? 0
                    return <div key={n} className={`h-1 flex-1 ${n <= lvl ? 'bg-amber-500' : 'bg-amber-900/40'}`} />
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2.5 mt-4">
            <button
              onClick={handleAdd}
              disabled={adding || (product.stock ?? 0) === 0}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50
                text-[#0D0805] text-xs font-bold uppercase tracking-widest transition-colors"
            >
              {(product.stock ?? 0) === 0 ? 'Esgotado' : adding ? 'Adicionando...' : 'Adicionar ao Carrinho'}
            </button>
            <a
              href={`/produto/${product.slug}`}
              onClick={e => e.stopPropagation()}
              className="text-center text-amber-600 text-xs uppercase tracking-widest
                hover:text-amber-400 transition-colors"
            >
              Ver página completa →
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function MagneticZoom({ src, alt }: { src?: string; alt: string }) {
  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width)  * 100
    const y = ((e.clientY - rect.top)  / rect.height) * 100
    const img = e.currentTarget.querySelector('img') as HTMLImageElement | null
    if (!img) return
    img.style.transformOrigin = `${x}% ${y}%`
    img.style.transform = 'scale(1.35)'
  }
  function handleLeave(e: React.MouseEvent<HTMLDivElement>) {
    const img = e.currentTarget.querySelector('img') as HTMLImageElement | null
    if (img) img.style.transform = 'scale(1)'
  }

  return (
    <div className="overflow-hidden h-52 relative bg-amber-900/10"
      onMouseMove={handleMove} onMouseLeave={handleLeave}>
      {src ? (
        <Image src={src} alt={alt} fill
          className="object-cover transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-amber-900 text-4xl">◆</div>
      )}
    </div>
  )
}
