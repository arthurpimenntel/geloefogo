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
  const params  = await searchParams
  const supabase = await createClient()
  const PAGE    = 24

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

    if (cat?.id) {
      query = query.eq('category_id', cat.id)
    }
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
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-center text-red-400">
          Erro ao carregar produtos. Tente novamente mais tarde.
        </div>
      </main>
    )
  }

  const productsArray = products || []
  const hasMore    = productsArray.length > PAGE
  const items      = hasMore ? productsArray.slice(0, PAGE) : productsArray
  const nextCursor = hasMore && items.length > 0
    ? (items[items.length - 1] as any).created_at
    : null

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex gap-8">
        <aside className="hidden lg:block w-60 flex-shrink-0">
          <CatalogFilters />
        </aside>

        <section className="flex-1">
          <p className="text-amber-700 text-xs uppercase tracking-widest mb-6">
            {items.length} produto{items.length !== 1 ? 's' : ''}
            {params.categoria ? ` em "${params.categoria}"` : ''}
          </p>

          {items.length === 0 ? (
            <div className="text-center text-amber-400 py-12">
              Nenhum produto encontrado. Tente outros filtros.
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
              className="mt-10 block w-full py-3 border border-amber-800/40
                text-center text-amber-600 text-sm uppercase tracking-widest
                hover:border-amber-600 hover:text-amber-300 transition"
            >
              Carregar mais
            </a>
          )}
        </section>
      </div>
    </main>
  )
}