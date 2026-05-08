import { createClient } from '@/lib/supabase/server'
import ProductCardQuadrant from '@/components/storefront/ProductCardQuadrant'
import { CatalogFilters } from '@/components/storefront/CatalogFilters'

interface SearchParams {
  q?:        string
  preco_min?: string
  preco_max?: string
  destaque?: string
  ordem?:    string
  cursor?:   string
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
  const PAGE     = 48

  let query = supabase
    .from('products')
    .select(`
      id, slug, sku, name, brand, sale_price, compare_price,
      stock, images, tags, origin_country,
      category:categories(name, slug)
    `)
    .eq('active', true)
    .is('deleted_at', null)
    .limit(PAGE + 1)

  if (params.ordem === 'recente') {
    query = query.order('created_at', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  if (params.destaque === 'true') {
    query = query.eq('featured', true)
  }

  if (params.q) {
    query = query.textSearch('search_vector', params.q, {
      type: 'websearch', config: 'portuguese',
    })
  }

  if (params.preco_min) query = query.gte('sale_price', parseInt(params.preco_min))
  if (params.preco_max) query = query.lte('sale_price', parseInt(params.preco_max))
  if (params.cursor)    query = query.lt('created_at', params.cursor)

  const { data: rawProducts, error } = await query
  const products = (rawProducts as CatalogProduct[]) ?? []

  if (error) {
    console.error('Erro ao buscar produtos:', error)
    return (
      <main className="min-h-screen bg-[#F5EFE6] flex items-center justify-center">
        <p className="text-[#8B7355]">Erro ao carregar produtos. Tente novamente.</p>
      </main>
    )
  }

  const hasMore    = products.length > PAGE
  const items      = hasMore ? products.slice(0, PAGE) : products
  const nextCursor = hasMore && items.length > 0
    ? (items[items.length - 1] as any).created_at
    : null

  const title = params.destaque === 'true'
    ? 'Destaques'
    : params.ordem === 'recente'
    ? 'Novidades'
    : params.q
    ? `"${params.q}"`
    : 'Catálogo'

  const subtitle = params.destaque === 'true'
    ? 'Produtos selecionados'
    : params.ordem === 'recente'
    ? 'Os mais recentes'
    : 'Todos os produtos'

  return (
    <main className="min-h-screen bg-[#F5EFE6]">
      <div className="max-w-[1600px] mx-auto px-6 py-12">

        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-6 border-b border-[#D4B896]/40">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#8B7355] mb-1">{subtitle}</p>
            <h1 className="text-4xl font-serif font-bold text-[#1C1C1C]">{title}</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden lg:block">
              <CatalogFilters />
            </div>
            <div className="lg:hidden">
              <CatalogFilters mobile />
            </div>
            <p className="text-[#8B7355] text-xs uppercase tracking-widest whitespace-nowrap">
              {items.length} produto{items.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Grid */}
        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#8B7355] font-serif text-xl mb-2">Nenhum produto encontrado.</p>
            <p className="text-[#B8A898] text-sm mb-6">Tente outros filtros ou explore o catálogo completo.</p>
            <a
              href="/catalogo"
              className="inline-block px-6 py-3 border border-[#1C1C1C] text-[#1C1C1C] text-xs uppercase tracking-widest rounded-full hover:bg-[#1C1C1C] hover:text-[#F5EFE6] transition-all duration-300"
            >
              Ver tudo
            </a>
          </div>
        ) : (
          <ProductCardQuadrant products={items as any} />
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
      </div>
    </main>
  )
}