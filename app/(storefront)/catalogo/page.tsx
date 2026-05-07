import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/storefront/ProductCard'
import { CatalogFilters } from '@/components/storefront/CatalogFilters'

interface SearchParams {
  q?:           string
  categoria?:   string
  intensidade?: string
  marca?:       string
  preco_min?:   string
  preco_max?:   string
  tag?:         string
  cursor?:      string
}

type CatalogProduct = {
  id: string
  slug: string
  sku: string
  name: string
  brand: string | null
  sale_price: number
  compare_price: number | null
  stock: number
  images: string[]
  intensity: string | null
  tags: string[]
  origin_country: string | null
  category: { name: string; slug: string } | null
}

export const revalidate = 120

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params   = await searchParams
  const supabase = await createClient()
  const PAGE     = 24

  let query = supabase
    .from('products')
    .select(`
      id, slug, sku, name, brand, sale_price, compare_price,
      stock, images, intensity, tags, origin_country,
      category:categories(name, slug)
    `)
    .eq('active', true)
    .is('deleted_at', null)
    .limit(PAGE + 1)
    .order('created_at', { ascending: false })

  if (params.q) {
    query = query.textSearch('search_vector', params.q, {
      type: 'websearch', config: 'portuguese',
    })
  }

  if (params.categoria) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', params.categoria)
      .single<{ id: string }>()
    if (cat?.id) query = query.eq('category_id', cat.id)
  }

  if (params.intensidade) query = query.eq('intensity', params.intensidade)
  if (params.marca)       query = query.eq('brand', params.marca)
  if (params.preco_min)   query = query.gte('sale_price', parseInt(params.preco_min))
  if (params.preco_max)   query = query.lte('sale_price', parseInt(params.preco_max))
  if (params.tag)         query = query.contains('tags', [params.tag])
  if (params.cursor)      query = query.lt('created_at', params.cursor)

  const { data: rawProducts, error } = await query
  const products = (rawProducts as CatalogProduct[]) ?? []

  if (error) {
    console.error('Erro ao buscar produtos:', error)
    return (
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="text-center text-[#8B7355]">
          Erro ao carregar produtos. Tente novamente mais tarde.
        </div>
      </main>
    )
  }

  const hasMore    = products.length > PAGE
  const items      = hasMore ? products.slice(0, PAGE) : products
  const nextCursor = hasMore && items.length > 0
    ? (items[items.length - 1] as any).created_at
    : null

  return (
    <main className="min-h-screen bg-[#F5EFE6]">
      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* Título da página */}
        <div className="mb-10">
          <p className="text-xs tracking-[0.3em] uppercase text-[#8B7355] mb-2">
            {params.categoria ? `Categoria` : 'Todos os Produtos'}
          </p>
          <h1 className="text-4xl font-serif font-bold text-[#1C1C1C]">
            {params.categoria
              ? params.categoria.charAt(0).toUpperCase() + params.categoria.slice(1)
              : 'Catálogo'}
          </h1>
        </div>

        <div className="flex gap-10">
          {/* Sidebar filtros */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <CatalogFilters />
          </aside>

          {/* Grid produtos */}
          <section className="flex-1">
            <p className="text-[#8B7355] text-xs uppercase tracking-widest mb-8">
              {items.length} produto{items.length !== 1 ? 's' : ''}
              {params.categoria ? ` em "${params.categoria}"` : ''}
            </p>

            {items.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-[#8B7355] font-serif text-xl mb-2">Nenhum produto encontrado.</p>
                <p className="text-[#B8A898] text-sm">Tente outros filtros ou explore o catálogo completo.</p>
                <a
                  href="/catalogo"
                  className="inline-block mt-6 px-6 py-3 border border-[#1C1C1C] text-[#1C1C1C] text-xs uppercase tracking-widest rounded-full hover:bg-[#1C1C1C] hover:text-[#F5EFE6] transition-all duration-300"
                >
                  Ver tudo
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {items.map(p => (
                  <ProductCard key={p.id} product={p as any} />
                ))}
              </div>
            )}

            {nextCursor && (
              <a
                href={`/catalogo?${new URLSearchParams({
                  ...Object.fromEntries(
                    Object.entries(params).filter(([, v]) => v != null) as [string, string][]
                  ),
                  cursor: nextCursor,
                })}`}
                className="mt-12 block w-full py-4 border border-[#D4B896] text-center text-[#8B7355] text-xs uppercase tracking-widest hover:border-[#1C1C1C] hover:text-[#1C1C1C] transition-all duration-300 rounded-full"
              >
                Carregar mais
              </a>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}