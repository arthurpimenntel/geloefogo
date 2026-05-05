import { HeroSection } from '@/components/storefront/HeroSection'
import { ProductCard } from '@/components/storefront/ProductCard'
import { BrazilMapSVG } from '@/components/storefront/BrazilMapSVG'
import { MarqueeBand } from '@/components/storefront/MarqueeBand'
import type { Product } from '@/types/domain.types'

export const revalidate = 60

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1', slug: 'cohiba-siglo-vi', sku: 'CUB-001',
    name: 'Cohiba Siglo VI', brand: 'Cohiba',
    description: 'O ápice da arte charuteira cubana. Fumo longo selecionado, queima lenta e uniforme, com notas de cedro, cacau e especiarias suaves.',
    category: { id: 'c1', name: 'Charutos', slug: 'charutos' },
    salePrice: 890, comparePrice: 1050, costPrice: 400,
    stock: 8, images: ['https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80'],
    intensity: 'medio', originCountry: 'Cuba',
    tags: ['Mais Vendido', 'Importado', 'Premium'],
    active: true,
  },
  {
    id: '2', slug: 'montecristo-no2', sku: 'CUB-002',
    name: 'Montecristo Nº 2', brand: 'Montecristo',
    description: 'Torpedo icônico, referência mundial. Complexidade crescente do pé à cabeça, com notas terrosas, amadeiradas e um final longo e cremoso.',
    category: { id: 'c1', name: 'Charutos', slug: 'charutos' },
    salePrice: 620, comparePrice: 720, costPrice: 280,
    stock: 12, images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'],
    intensity: 'forte', originCountry: 'Cuba',
    tags: ['Mais Vendido', 'Importado'],
    active: true,
  },
  {
    id: '3', slug: 'romeo-julieta-churchill', sku: 'CUB-003',
    name: 'Romeo y Julieta Churchill', brand: 'Romeo y Julieta',
    description: 'O Churchill que deu nome ao formato. Equilibrado, elegante, com notas florais e amadeiradas. Ideal para ocasiões especiais.',
    category: { id: 'c1', name: 'Charutos', slug: 'charutos' },
    salePrice: 490, costPrice: 200,
    stock: 20, images: ['https://images.unsplash.com/photo-1567761939344-a13aa94a2efa?w=600&q=80'],
    intensity: 'suave', originCountry: 'Cuba',
    tags: ['Mais Vendido', 'Clássico'],
    active: true,
  },
  {
    id: '4', slug: 'padron-1964-anniversary', sku: 'NIC-001',
    name: 'Padrón 1964 Anniversary', brand: 'Padrón',
    description: 'Lançado para celebrar 30 anos da marca. Fumo nicaraguense envelhecido 4 anos, notas de chocolate escuro, café e baunilha.',
    category: { id: 'c1', name: 'Charutos', slug: 'charutos' },
    salePrice: 750, comparePrice: 890, costPrice: 340,
    stock: 6, images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'],
    intensity: 'muito_forte', originCountry: 'Nicarágua',
    tags: ['Mais Vendido', 'Aniversário'],
    active: true,
  },
  {
    id: '5', slug: 'arturo-fuente-opus-x', sku: 'DOM-001',
    name: 'Arturo Fuente Opus X', brand: 'Arturo Fuente',
    description: 'O charuto mais cobiçado da República Dominicana. Fumo exclusivo da Château de la Fuente, perfil complexo e inigualável.',
    category: { id: 'c1', name: 'Charutos', slug: 'charutos' },
    salePrice: 1200, comparePrice: 1450, costPrice: 550,
    stock: 3, images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80'],
    intensity: 'forte', originCountry: 'República Dominicana',
    tags: ['Mais Vendido', 'Raro', 'Premium'],
    active: true,
  },
  {
    id: '6', slug: 'davidoff-grand-cru-no1', sku: 'DOM-002',
    name: 'Davidoff Grand Cru Nº 1', brand: 'Davidoff',
    description: 'Elegância suíça em forma de charuto. Fumo dominicano de primeira linha, construção impecável, notas de creme, mel e especiarias leves.',
    category: { id: 'c1', name: 'Charutos', slug: 'charutos' },
    salePrice: 560, costPrice: 240,
    stock: 15, images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80'],
    intensity: 'suave', originCountry: 'República Dominicana',
    tags: ['Mais Vendido', 'Suave'],
    active: true,
  },
]

async function getDestaqueProdutos(): Promise<Product[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const isConfigured = url.startsWith('https://') && key.startsWith('eyJ')
  if (!isConfigured) return MOCK_PRODUCTS

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const SELECT = `
      id, slug, sku, name, brand, sale_price, compare_price,
      stock, images, intensity, tags, origin_country,
      harmonization, description,
      category:categories(name, slug)
    `

    const { data: featuredData } = await supabase
      .from('products')
      .select(SELECT)
      .eq('active', true)
      .is('deleted_at', null)
      .eq('featured', true)
      .order('updated_at', { ascending: false })
      .limit(6)

    if (featuredData && featuredData.length > 0) {
      return featuredData as unknown as Product[]
    }

    const { data: tagData } = await supabase
      .from('products')
      .select(SELECT)
      .eq('active', true)
      .is('deleted_at', null)
      .contains('tags', ['Mais Vendido'])
      .order('created_at', { ascending: false })
      .limit(6)

    if (tagData && tagData.length > 0) {
      return tagData as unknown as Product[]
    }

    const { data: recentData } = await supabase
      .from('products')
      .select(SELECT)
      .eq('active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(6)

    return (recentData as unknown as Product[]) ?? MOCK_PRODUCTS
  } catch {
    return MOCK_PRODUCTS
  }
}

export default async function HomePage() {
  const destaques = await getDestaqueProdutos()

  return (
    <>
      <HeroSection />

      {/* ── SEÇÃO DA LOJA COM FUNDO PARALLAX FIXO ── */}
      <section className="relative">
        {/* Fundo parallax — desktop */}
        <div
          className="absolute inset-0 hidden md:block"
          style={{
            backgroundImage: 'url(/images/fotodesktop.jpg)',
            backgroundAttachment: 'fixed',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.18,
          }}
        />

        {/* Fundo parallax — mobile (scroll normal, iOS não suporta fixed) */}
        <div
          className="absolute inset-0 block md:hidden"
          style={{
            backgroundImage: 'url(/images/fotomobile.jpg)',
            backgroundAttachment: 'scroll',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.18,
          }}
        />

        {/* Overlay para garantir contraste do texto sobre a foto */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(13,8,5,0.82) 0%, rgba(13,8,5,0.65) 50%, rgba(13,8,5,0.82) 100%)',
          }}
        />

        {/* Conteúdo da seção */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-amber-600 text-xs uppercase tracking-[0.2em] mb-2">Seleção da casa</p>
              <h2 className="font-playfair text-3xl text-amber-100">Em Alta</h2>
            </div>
            <a
              href="/catalogo"
              className="text-amber-600 hover:text-amber-300 text-xs uppercase tracking-widest transition-colors"
            >
              Ver todos →
            </a>
          </div>

          <div className="relative">
            <div
              className="absolute inset-0 -mx-4 rounded-2xl opacity-30 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(201,150,58,0.15) 0%, transparent 70%)',
              }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {destaques.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <MarqueeBand />

      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: '🚚', title: 'Frete Grátis', desc: 'Pedidos acima de R$300' },
            { icon: '💳', title: '12x Sem Juros', desc: 'No cartão de crédito' },
            { icon: '⚡', title: 'Pix 5% OFF', desc: 'Desconto no pagamento' },
            { icon: '🔄', title: 'Troca Fácil', desc: 'Até 7 dias após receber' },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="flex flex-col items-center text-center p-6 border border-amber-900/20 bg-[#100B07]"
            >
              <span className="text-3xl mb-3">{icon}</span>
              <p className="text-amber-200 text-sm font-medium">{title}</p>
              <p className="text-amber-700 text-xs mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-amber-600 text-xs uppercase tracking-[0.2em] mb-2">Cobertura nacional</p>
            <h2 className="font-playfair text-3xl text-amber-100 mb-4">
              Entregamos em todo o Brasil
            </h2>
            <p className="text-amber-500 text-sm leading-relaxed mb-6">
              Passe o mouse sobre o mapa e veja o prazo estimado para a sua região. Trabalhamos com
              Correios, Jadlog e transportadoras regionais para garantir a melhor entrega.
            </p>
            <a
              href="/catalogo"
              className="inline-block px-8 py-3 border border-amber-700 text-amber-500
                hover:border-amber-400 hover:text-amber-200 text-xs uppercase tracking-widest transition-colors"
            >
              Comprar Agora
            </a>
          </div>
          <div className="flex justify-center">
            <BrazilMapSVG />
          </div>
        </div>
      </section>
    </>
  )
}