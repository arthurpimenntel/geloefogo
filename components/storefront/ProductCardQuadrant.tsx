'use client';

import { useState } from 'react';
import { ShoppingBag, Heart, Share2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import type { Product } from '@/app/(storefront)/page';

interface ProductCardQuadrantProps {
  products: Product[];
}

export default function ProductCardQuadrant({ products }: ProductCardQuadrantProps) {
  const { addToCart } = useCart();
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());

  const toggleLike = (id: string) => {
    setLikedProducts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.sale_price,
      quantity: 1,
    });
  };

  if (!products.length) {
    return (
      <div className="text-center py-20 text-[#8B7355] font-serif text-xl">
        Nenhum produto em destaque no momento.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
      {products.map((product) => {
        const image = product.images?.[0] ?? null;
        const isLiked = likedProducts.has(product.id);
        const hasDiscount =
          product.compare_price && product.compare_price > product.sale_price;
        const outOfStock = product.stock <= 0;

        return (
          <div
            key={product.id}
            className="group bg-[#EDE3D6] rounded-2xl overflow-hidden hover:shadow-xl transition-shadow duration-500"
            style={{
              display: 'grid',
              gridTemplateRows: '280px 1fr auto',
            }}
          >
            {/* ── IMAGEM ── altura fixa */}
            <div className="relative bg-[#D9CEBD] overflow-hidden">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-7xl opacity-30">🪴</span>
                </div>
              )}

              {/* Like button */}
              <button
                onClick={() => toggleLike(product.id)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#F5EFE6]/80 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110"
              >
                <Heart
                  size={16}
                  className={isLiked ? 'text-rose-500' : 'text-[#8B7355]'}
                  fill={isLiked ? 'currentColor' : 'none'}
                />
              </button>

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {hasDiscount && (
                  <span className="px-2 py-1 bg-[#C9A96E] text-[#1C1C1C] text-xs font-bold rounded-full tracking-wider uppercase">
                    Oferta
                  </span>
                )}
                {outOfStock && (
                  <span className="px-2 py-1 bg-[#1C1C1C]/70 text-[#F5EFE6] text-xs font-semibold rounded-full tracking-wider uppercase">
                    Esgotado
                  </span>
                )}
                {product.origin_country && (
                  <span className="px-2 py-1 bg-[#F5EFE6]/80 text-[#8B7355] text-xs font-semibold rounded-full tracking-wider">
                    {product.origin_country}
                  </span>
                )}
              </div>
            </div>

            {/* ── CONTEÚDO ── expande com 1fr, empurra botão para baixo */}
            <div className="p-6 pb-2">
              {product.brand && (
                <p className="text-xs tracking-[0.25em] uppercase text-[#8B7355] mb-1">
                  {product.brand}
                </p>
              )}
              <h3
                className="font-serif font-bold text-[#1C1C1C] mb-2 leading-tight"
                style={{
                  fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {product.name}
              </h3>
              {product.description && (
                <p
                  className="text-sm text-[#8B7355] leading-relaxed"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {product.description}
                </p>
              )}

              {/* Preço */}
              <div className="flex items-baseline gap-3 mt-4">
                <span className="text-2xl font-serif font-black text-[#1C1C1C]">
                  R${' '}
                  {product.sale_price.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-[#8B7355] line-through">
                    R${' '}
                    {product.compare_price!.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* ── BOTÃO ── sempre no fundo, alinhado entre cards */}
            <div className="px-6 pb-6 pt-2 flex gap-2">
              <button
                onClick={() => handleAddToCart(product)}
                disabled={outOfStock}
                className="flex-1 py-3 px-4 bg-[#1C1C1C] text-[#F5EFE6] rounded-xl font-semibold text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-[#2D2D2D] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
              >
                <ShoppingBag size={17} />
                {outOfStock ? 'Esgotado' : 'Adicionar'}
              </button>
              <button className="w-11 h-11 rounded-xl bg-[#D9CEBD] flex items-center justify-center hover:bg-[#C9BDB0] transition-colors flex-shrink-0">
                <Share2 size={16} className="text-[#8B7355]" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}3