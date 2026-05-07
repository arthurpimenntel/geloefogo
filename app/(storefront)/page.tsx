import HeroSection from '@/components/storefront/HeroSection';
import ProductCardQuadrant from '@/components/storefront/ProductCardQuadrant';
import MarqueeBand from '@/components/storefront/MarqueeBand';
import { BrazilMapSVG } from '@/components/storefront/BrazilMapSVG';
import { createClient } from '@/lib/supabase/server';

export type Product = {
  id: string;
  slug: string;
  name: string;
  sale_price: number;
  compare_price: number | null;
  images: string[] | null;
  description: string | null;
  category_id: string | null;
  brand: string | null;
  intensity: string | null;
  origin_country: string | null;
  featured: boolean;
  stock: number;
};

export default async function StorefrontPage() {
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from('products')
    .select(
      'id, slug, name, sale_price, compare_price, images, description, category_id, brand, intensity, origin_country, featured, stock'
    )
    .eq('active', true)
    .is('deleted_at', null)
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) {
    console.error('Supabase fetch error:', error.message);
  }

  const featuredProducts: Product[] = products ?? [];

  return (
    <main className="w-full bg-[#F5EFE6]">

      {/* Hero Section */}
      <section>
        <HeroSection />
      </section>

      {/* Marquee */}
      <section>
        <MarqueeBand />
      </section>

      {/* Produtos em Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="mb-16">
          <p className="text-xs tracking-[0.3em] uppercase text-[#8B7355] mb-3">Seleção da Casa</p>
          <h2 className="text-5xl font-serif font-bold text-[#1C1C1C] leading-tight">
            Destaques
          </h2>
        </div>
        <ProductCardQuadrant products={featuredProducts} />
      </section>

      {/* Mapa do Brasil */}
      <section className="py-24 px-6 bg-[#EDE3D6]">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs tracking-[0.3em] uppercase text-[#8B7355] mb-3 text-center">Cobertura Nacional</p>
          <h2 className="text-5xl font-serif font-bold text-[#1C1C1C] mb-4 text-center leading-tight">
            Atendemos em todo Brasil
          </h2>
          <p className="text-[#8B7355] text-center mb-16 tracking-wide">
            Entrega rápida e segura para todas as regiões
          </p>
          <div className="flex justify-center max-w-2xl mx-auto">
            <BrazilMapSVG />
          </div>
        </div>
      </section>

    </main>
  );
}