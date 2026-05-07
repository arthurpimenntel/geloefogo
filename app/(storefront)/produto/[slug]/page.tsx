import { createClient, createStaticClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ProductDetailClient } from './ProductDetailClient'
import { ProductGallery } from './ProductGallery'

export const revalidate = 300

export async function generateStaticParams() {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('products').select('slug').eq('active', true).is('deleted_at', null)
  return (data ?? []).map((p: any) => ({ slug: p.slug }))
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('*, category:categories(name, slug), reviews(rating, comment, verified, created_at, user:profiles(full_name))')
    .eq('slug', slug).eq('active', true).is('deleted_at', null).single() as { data: any }

  if (!product) notFound()

  const { data: related } = await supabase
    .from('products')
    .select('id, slug, name, brand, sale_price, images')
    .eq('active', true).is('deleted_at', null)
    .eq('category_id', product.category_id ?? '')
    .neq('id', product.id).limit(4) as { data: any }

  const avgRating = product.reviews?.length
    ? product.reviews.reduce((s: number, r: any) => s + r.rating, 0) / product.reviews.length
    : null

  const INTENSITY_LABEL: Record<string, string> = { suave:'Suave', medio:'Médio', forte:'Forte', muito_forte:'Muito Forte' }

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[11px] uppercase tracking-widest mb-10 flex-wrap">
        <Link href="/" className="text-[#B0916A] hover:text-[#8C4A10] transition-colors">Início</Link>
        <span className="text-[#D9C9A8]">›</span>
        <Link href="/catalogo" className="text-[#B0916A] hover:text-[#8C4A10] transition-colors">Catálogo</Link>
        {product.category && (
          <>
            <span className="text-[#D9C9A8]">›</span>
            <Link href={`/catalogo?categoria=${product.category.slug}`}
              className="text-[#B0916A] hover:text-[#8C4A10] transition-colors">{product.category.name}</Link>
          </>
        )}
        <span className="text-[#D9C9A8]">›</span>
        <span className="text-[#8C6D3F] truncate max-w-[160px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
        {/* Galeria */}
        <div className="space-y-3">
          {product.compare_price && product.compare_price > product.sale_price && (
            <div className="inline-flex items-center gap-1.5 bg-[#C08D3A] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
              -{Math.round((1 - product.sale_price / product.compare_price) * 100)}% OFF
            </div>
          )}
          <ProductGallery images={product.images ?? []} productName={product.name} />
        </div>

        {/* Info */}
        <div>
          {product.tags?.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {product.tags.map((tag: string) => (
                <span key={tag}
                  className="text-[10px] uppercase tracking-widest border border-[#D9C9A8] text-[#8C6D3F] px-2.5 py-1 rounded-full bg-[#FAF7F2]">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h1 className="font-playfair text-3xl md:text-4xl text-[#1C1008] leading-tight mb-2">{product.name}</h1>
          {product.brand && (
            <p className="text-[#B0916A] text-xs uppercase tracking-[0.2em] mb-4">{product.brand}</p>
          )}

          {avgRating && (
            <div className="flex items-center gap-2 mb-5">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(n => (
                  <span key={n} className={n <= Math.round(avgRating) ? 'text-[#C08D3A]' : 'text-[#D9C9A8]'}>★</span>
                ))}
              </div>
              <span className="text-[#8C6D3F] text-xs">{avgRating.toFixed(1)} ({product.reviews.length} avaliações)</span>
            </div>
          )}

          <div className="mb-6 p-5 bg-[#FAF7F2] rounded-2xl border border-[#E8DCC8]">
            <div className="flex items-baseline gap-3">
              <span className="font-playfair text-3xl text-[#8C4A10] font-semibold">
                {product.sale_price.toLocaleString('pt-BR', { style:'currency', currency:'BRL' })}
              </span>
              {product.compare_price && (
                <span className="text-[#C4A97A] text-base line-through">
                  {product.compare_price.toLocaleString('pt-BR', { style:'currency', currency:'BRL' })}
                </span>
              )}
            </div>
            <p className="text-[#B0916A] text-xs mt-1">
              ou 12x de {(product.sale_price / 12).toLocaleString('pt-BR', { style:'currency', currency:'BRL' })} sem juros
            </p>
          </div>

          {product.description && (
            <p className="text-[#4A3520] text-sm leading-relaxed mb-6 border-t border-[#E8DCC8] pt-6">
              {product.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              product.intensity      && { label:'Intensidade', value: INTENSITY_LABEL[product.intensity] ?? product.intensity },
              product.origin_country && { label:'Origem',      value: product.origin_country },
              product.brand          && { label:'Marca',       value: product.brand },
              product.sku            && { label:'SKU',         value: product.sku },
            ].filter(Boolean).map((attr: any) => (
              <div key={attr.label} className="bg-white border border-[#E8DCC8] rounded-xl p-3">
                <p className="text-[#B0916A] text-[10px] uppercase tracking-widest">{attr.label}</p>
                <p className="text-[#1C1008] text-sm mt-1 font-medium">{attr.value}</p>
              </div>
            ))}
          </div>

          {product.intensity && (
            <div className="mb-6">
              <p className="text-[#B0916A] text-[10px] uppercase tracking-widest mb-2">Intensidade</p>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => {
                  const lvl = { suave:1, medio:2, forte:3, muito_forte:4 }[product.intensity] ?? 0
                  return <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= lvl ? 'bg-[#C08D3A]' : 'bg-[#E8DCC8]'}`} />
                })}
              </div>
            </div>
          )}

          <div className="mb-6">
            {product.stock === 0
              ? <span className="text-red-500 text-xs uppercase tracking-widest">Produto esgotado</span>
              : product.stock <= 5
              ? <span className="text-[#C08D3A] text-xs">⚡ Últimas {product.stock} unidades</span>
              : <span className="text-green-600 text-xs">✓ Em estoque</span>}
          </div>

          <ProductDetailClient product={{
            id: product.id, slug: product.slug, sku: product.sku, name: product.name,
            brand: product.brand, description: product.description, category: product.category,
            salePrice: product.sale_price, comparePrice: product.compare_price,
            costPrice: product.cost_price, stock: product.stock,
            images: product.images ?? [], intensity: product.intensity,
            originCountry: product.origin_country, tags: product.tags ?? [], active: product.active,
          }} />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#E8DCC8]">
            {[
              { icon:'🔒', text:'Compra segura' },
              { icon:'🚚', text:'Frete todo BR' },
              { icon:'💳', text:'12x sem juros' },
              { icon:'⚡', text:'Pix 5% OFF' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex flex-col items-center text-center gap-1.5 p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DCC8]">
                <span className="text-xl">{icon}</span>
                <span className="text-[#8C6D3F] text-[10px] uppercase tracking-widest">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      {product.reviews?.length > 0 && (
        <section className="mb-16">
          <h2 className="font-playfair text-2xl text-[#1C1008] mb-6">Avaliações</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.reviews.map((r: any, i: number) => (
              <div key={i} className="bg-white border border-[#E8DCC8] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[#1C1008] text-sm font-medium">{r.user?.full_name ?? 'Cliente verificado'}</p>
                    <p className="text-[#B0916A] text-[11px] uppercase tracking-widest mt-0.5">
                      {new Date(r.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(n => (
                      <span key={n} className={n <= r.rating ? 'text-[#C08D3A] text-sm' : 'text-[#D9C9A8] text-sm'}>★</span>
                    ))}
                  </div>
                </div>
                {r.comment && <p className="text-[#4A3520] text-sm leading-relaxed">{r.comment}</p>}
                {r.verified && <p className="text-green-600 text-[10px] uppercase tracking-widest mt-3">✓ Compra verificada</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related */}
      {related && related.length > 0 && (
        <section>
          <h2 className="font-playfair text-2xl text-[#1C1008] mb-6">Você também pode gostar</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p: any) => (
              <Link key={p.id} href={`/produto/${p.slug}`}
                className="block bg-white border border-[#E8DCC8] rounded-2xl overflow-hidden
                  hover:border-[#C08D3A]/50 hover:shadow-md transition-all group">
                <div className="aspect-square overflow-hidden bg-[#FAF7F2]">
                  {p.images?.[0]
                    ? <img src={p.images[0]} alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center text-[#C4A97A] text-3xl">◆</div>}
                </div>
                <div className="p-3">
                  <p className="text-[#1C1008] text-sm font-medium leading-tight">{p.name}</p>
                  <p className="text-[#B0916A] text-[11px] mt-0.5">{p.brand}</p>
                  <p className="text-[#8C4A10] text-sm font-semibold mt-2">
                    {p.sale_price.toLocaleString('pt-BR', { style:'currency', currency:'BRL' })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}