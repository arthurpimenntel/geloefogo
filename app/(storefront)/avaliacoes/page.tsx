// app/(storefront)/avaliacoes/page.tsx
import { createClient } from '@/lib/supabase/server'
import { ReviewFeed } from '@/components/storefront/ReviewFeed'
import Link from 'next/link'

export const revalidate = 60

export default async function AvaliacoesPage() {
  const supabase = await createClient()

  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      id, video_url, thumbnail_url, rating, caption, views, likes, created_at,
      product:products(id, name, slug, images),
      user:profiles(id, full_name, avatar_url)
    `)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(30)

  const list = (reviews ?? []) as any[]

  return (
    <main className="bg-[#FAF7F2] min-h-screen">
      {/* Layout: feed centralizado em tela cheia estilo TikTok */}
      <div className="flex flex-col lg:flex-row min-h-screen">

        {/* Coluna esquerda — info */}
        <aside className="lg:w-72 xl:w-80 flex-shrink-0 p-8 flex flex-col justify-between
          border-r border-[#E8DCC8] bg-white hidden lg:flex">
          <div>
            <Link href="/" className="block mb-10">
              <p className="font-playfair text-[#1C1008] text-xl tracking-wide">Gelo &amp; Fogo</p>
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#B0916A] mt-0.5">Tabacaria Premium</p>
            </Link>

            <div className="mb-8">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#B0916A] mb-2">Avaliações em Vídeo</p>
              <h1 className="font-playfair text-3xl text-[#1C1008] leading-tight">
                O que nossos<br />clientes dizem
              </h1>
              <p className="text-[#8C6D3F] text-sm mt-3 leading-relaxed">
                Avaliações reais de quem comprou. Role para ver mais.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#E8DCC8]">
                <p className="font-playfair text-2xl text-[#1C1008]">{list.length}+</p>
                <p className="text-[#8C6D3F] text-xs mt-0.5">Avaliações</p>
              </div>
              <div className="bg-[#FAF7F2] rounded-2xl p-4 border border-[#E8DCC8]">
                <p className="font-playfair text-2xl text-[#C08D3A]">15%</p>
                <p className="text-[#8C6D3F] text-xs mt-0.5">Desconto</p>
              </div>
            </div>

            {/* CTA avaliar */}
            <div className="bg-[#1C1008] rounded-2xl p-5 text-white">
              <p className="font-playfair text-lg leading-tight mb-1">Avalie e ganhe</p>
              <p className="text-white/60 text-xs mb-4 leading-relaxed">
                Comprou algum produto? Poste seu vídeo e ganhe 15% de desconto na próxima compra.
              </p>
              <Link href="/minha-conta/avaliacoes"
                className="block w-full py-2.5 bg-[#C08D3A] hover:bg-[#8C4A10] text-white text-xs
                  font-bold uppercase tracking-widest rounded-xl text-center transition-colors">
                Avaliar produto
              </Link>
            </div>
          </div>

          <div className="mt-8">
            <Link href="/catalogo"
              className="text-[#8C6D3F] hover:text-[#1C1008] text-xs uppercase tracking-widest transition-colors">
              ← Ver catálogo
            </Link>
          </div>
        </aside>

        {/* Feed central — TikTok style */}
        <div className="flex-1 relative">
          {/* Mobile header */}
          <div className="lg:hidden fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 py-3
            bg-gradient-to-b from-black/60 to-transparent">
            <Link href="/" className="font-playfair text-white text-lg">Gelo &amp; Fogo</Link>
            <Link href="/minha-conta/avaliacoes"
              className="px-3 py-1.5 bg-[#C08D3A] text-white text-[10px] font-bold uppercase tracking-widest rounded-xl">
              + Avaliar
            </Link>
          </div>

          <div
            className="w-full lg:max-w-sm xl:max-w-md mx-auto"
            style={{ height: '100dvh' }}
          >
            <ReviewFeed reviews={list} />
          </div>
        </div>

        {/* Coluna direita — dicas (desktop) */}
        <aside className="lg:w-64 xl:w-72 flex-shrink-0 p-8 border-l border-[#E8DCC8] bg-white hidden xl:flex flex-col gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#B0916A] mb-3">Como funciona</p>
            <div className="space-y-4">
              {[
                { n: '01', title: 'Compre um produto', desc: 'Qualquer produto do nosso catálogo.' },
                { n: '02', title: 'Grave seu vídeo', desc: 'Mostre o produto, conte sua experiência.' },
                { n: '03', title: 'Envie a avaliação', desc: 'Na sua conta, em "Minhas Avaliações".' },
                { n: '04', title: 'Ganhe 15% off', desc: 'Cupom válido por 90 dias após aprovação.' },
              ].map(s => (
                <div key={s.n} className="flex gap-3">
                  <span className="font-playfair text-[#C08D3A] text-sm font-bold flex-shrink-0 w-6">{s.n}</span>
                  <div>
                    <p className="text-[#1C1008] text-xs font-semibold">{s.title}</p>
                    <p className="text-[#B0916A] text-[11px] mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#E8DCC8] pt-6">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#B0916A] mb-3">Dicas para um bom vídeo</p>
            <ul className="space-y-2">
              {[
                'Boa iluminação natural',
                'Mostre o produto aberto',
                'Fale sobre o sabor/aroma',
                'Máximo 60 segundos',
              ].map(tip => (
                <li key={tip} className="flex items-start gap-2 text-[11px] text-[#6B4F2A]">
                  <span className="text-[#C08D3A] mt-0.5">◆</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  )
}