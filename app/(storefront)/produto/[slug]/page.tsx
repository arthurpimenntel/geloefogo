import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ProductDetailClient } from './ProductDetailClient'

export const revalidate = 300

export async function generateStaticParams() {
  const supabase = await createClient()
  const { data } = await supabase.from('products').select('slug').eq('active', true).is('deleted_at', null)
  return (data ?? []).map((p: any) => ({ slug: p.slug }))
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params   // ← resolve a Promise

  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('*, category:categories(name, slug), reviews(rating, comment, verified, created_at, user:profiles(full_name))')
    .eq('slug', slug)   // ← usa a variável extraída
    .eq('active', true)
    .is('deleted_at', null)
    .single()

  if (!product) notFound()

  const { data: related } = await supabase
    .from('products')
    .select('id, slug, name, brand, sale_price, images')
    .eq('active', true).is('deleted_at', null)
    .eq('category_id', product.category_id ?? '')
    .neq('id', product.id).limit(4)

  const avgRating = product.reviews?.length
    ? product.reviews.reduce((s: number, r: any) => s + r.rating, 0) / product.reviews.length
    : null

  const INTENSITY_LABEL: Record<string, string> = { suave:'Suave', medio:'Médio', forte:'Forte', muito_forte:'Muito Forte' }

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[11px] uppercase tracking-widest mb-10 flex-wrap">
        <Link href="/" className="text-amber-800 hover:text-amber-500 transition-colors">Início</Link>
        <span className="text-amber-900">›</span>
        <Link href="/catalogo" className="text-amber-800 hover:text-amber-500 transition-colors">Catálogo</Link>
        {product.category && (<><span className="text-amber-900">›</span>
          <Link href={`/catalogo?categoria=${product.category.slug}`} className="text-amber-800 hover:text-amber-500 transition-colors">{product.category.name}</Link></>)}
        <span className="text-amber-900">›</span>
        <span className="text-amber-600 truncate max-w-[160px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-square bg-[#1A0F08] border border-amber-900/20 overflow-hidden">
            {product.images?.[0] ? (
              <Image src={product.images[0]} alt={product.name} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 50vw" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-amber-900 text-6xl">◆</div>
            )}
            {product.compare_price && product.compare_price > product.sale_price && (
              <div className="absolute top-4 left-4 bg-amber-600 text-[#0D0805] text-[10px] font-bold uppercase tracking-widest px-2 py-1">
                -{Math.round((1 - product.sale_price / product.compare_price) * 100)}%
              </div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.slice(0,5).map((src: string, i: number) => (
                <div key={i} className="w-16 h-16 flex-shrink-0 border border-amber-900/20 overflow-hidden">
                  <Image src={src} alt="" width={64} height={64} className="object-cover w-full h-full" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.tags?.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {product.tags.map((tag: string) => (
                <span key={tag} className="text-[10px] uppercase tracking-widest border border-amber-800/40 text-amber-500 px-2 py-0.5">{tag}</span>
              ))}
            </div>
          )}
          <h1 className="font-playfair text-3xl md:text-4xl text-amber-100 leading-tight mb-2">{product.name}</h1>
          {product.brand && <p className="text-amber-700 text-xs uppercase tracking-[0.2em] mb-4">{product.brand}</p>}

          {avgRating && (
            <div className="flex items-center gap-2 mb-5">
              <div className="flex gap-0.5">{[1,2,3,4,5].map(n => <span key={n} className={n <= Math.round(avgRating) ? 'text-amber-500' : 'text-amber-900'}>★</span>)}</div>
              <span className="text-amber-700 text-xs">{avgRating.toFixed(1)} ({product.reviews.length} avaliações)</span>
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-baseline gap-3">
              <span className="font-playfair text-3xl text-amber-400">
                {product.sale_price.toLocaleString('pt-BR', { style:'currency', currency:'BRL' })}
              </span>
              {product.compare_price && (
                <span className="text-amber-800 text-base line-through">
                  {product.compare_price.toLocaleString('pt-BR', { style:'currency', currency:'BRL' })}
                </span>
              )}
            </div>
            <p className="text-amber-700 text-xs mt-1">
              ou 12x de {(product.sale_price / 12).toLocaleString('pt-BR', { style:'currency', currency:'BRL' })} sem juros
            </p>
          </div>

          {product.description && (
            <p className="text-amber-300/80 text-sm leading-relaxed mb-6 border-t border-amber-900/20 pt-6">{product.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              product.intensity     && { label:'Intensidade', value: INTENSITY_LABEL[product.intensity] ?? product.intensity },
              product.origin_country && { label:'Origem',      value: product.origin_country },
              product.brand         && { label:'Marca',        value: product.brand },
              product.sku           && { label:'SKU',          value: product.sku },
            ].filter(Boolean).map((attr: any) => (
              <div key={attr.label} className="bg-[#1A0F08] p-3">
                <p className="text-amber-800 text-[10px] uppercase tracking-widest">{attr.label}</p>
                <p className="text-amber-300 text-sm mt-1">{attr.value}</p>
              </div>
            ))}
          </div>

          {product.intensity && (
            <div className="mb-6">
              <p className="text-amber-800 text-[10px] uppercase tracking-widest mb-2">Intensidade</p>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => {
                  const lvl = { suave:1, medio:2, forte:3, muito_forte:4 }[product.intensity] ?? 0
                  return <div key={n} className={`h-1.5 flex-1 ${n <= lvl ? 'bg-amber-500' : 'bg-amber-900/30'}`} />
                })}
              </div>
            </div>
          )}

          <div className="mb-6">
            {product.stock === 0 ? <span className="text-red-400 text-xs uppercase tracking-widest">Produto esgotado</span>
              : product.stock <= 5 ? <span className="text-amber-500 text-xs">⚡ Últimas {product.stock} unidades</span>
              : <span className="text-green-400 text-xs">✓ Em estoque</span>}
          </div>

          <ProductDetailClient product={{
            id: product.id, slug: product.slug, sku: product.sku, name: product.name,
            brand: product.brand, description: product.description, category: product.category,
            salePrice: product.sale_price, comparePrice: product.compare_price,
            costPrice: product.cost_price, stock: product.stock,
            images: product.images ?? [], intensity: product.intensity,
            originCountry: product.origin_country, tags: product.tags ?? [], active: product.active,
          }} />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-amber-900/20">
            {[{ icon:'🔒',text:'Compra segura'},{ icon:'🚚',text:'Frete todo BR'},{ icon:'💳',text:'12x sem juros'},{ icon:'⚡',text:'Pix 5% OFF'}].map(({icon,text}) => (
              <div key={text} className="flex flex-col items-center text-center gap-1">
                <span className="text-xl">{icon}</span>
                <span className="text-amber-800 text-[10px] uppercase tracking-widest">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {product.reviews?.length > 0 && (
        <section className="mb-16">
          <h2 className="font-playfair text-2xl text-amber-100 mb-6">Avaliações</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.reviews.map((r: any, i: number) => (
              <div key={i} className="bg-[#1A0F08] border border-amber-900/20 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-amber-300 text-sm font-medium">{r.user?.full_name ?? 'Cliente verificado'}</p>
                    <p className="text-amber-800 text-[11px] uppercase tracking-widest mt-0.5">{new Date(r.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex gap-0.5">{[1,2,3,4,5].map(n => <span key={n} className={n <= r.rating ? 'text-amber-500 text-sm' : 'text-amber-900 text-sm'}>★</span>)}</div>
                </div>
                {r.comment && <p className="text-amber-500 text-sm leading-relaxed">{r.comment}</p>}
                {r.verified && <p className="text-green-600 text-[10px] uppercase tracking-widest mt-3">✓ Compra verificada</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {related && related.length > 0 && (
        <section>
          <h2 className="font-playfair text-2xl text-amber-100 mb-6">Você também pode gostar</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p: any) => (
              <Link key={p.id} href={`/produto/${p.slug}`}
                className="block bg-[#1A0F08] border border-amber-900/20 hover:border-amber-700 transition-colors group">
                <div className="aspect-square overflow-hidden">
                  {p.images?.[0]
                    ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full bg-amber-900/10 flex items-center justify-center text-amber-900 text-3xl">◆</div>}
                </div>
                <div className="p-3">
                  <p className="text-amber-200 text-sm font-medium leading-tight">{p.name}</p>
                  <p className="text-amber-600 text-[11px] mt-0.5">{p.brand}</p>
                  <p className="text-amber-400 text-sm mt-2">{p.sale_price.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}