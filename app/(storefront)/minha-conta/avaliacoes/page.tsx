// app/(storefront)/minha-conta/avaliacoes/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReviewUpload } from '@/components/storefront/ReviewUpload'
import Link from 'next/link'

export const revalidate = 0

export default async function MinhasAvaliacoesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/minha-conta/avaliacoes')

  // Buscar itens de pedidos pagos do usuário (elegíveis para avaliação)
  const { data: orderItems } = await supabase
    .from('order_items')
    .select(`
      product_id,
      order:orders!inner(id, status, created_at),
      product:products(id, name, images)
    `)
    .eq('orders.user_id', user.id)
    .in('orders.status', ['pago', 'processando', 'enviado', 'entregue'])
    .order('orders.created_at', { ascending: false })

  // Buscar avaliações já feitas
  const { data: myReviews } = await supabase
    .from('reviews')
    .select('id, product_id, status, rating, caption, created_at, video_url, thumbnail_url')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const reviewedProductIds = new Set((myReviews ?? []).map(r => r.product_id))

  // Montar lista de elegíveis (deduplicar por produto, pegar pedido mais recente)
  const seenProducts = new Set<string>()
  const eligibleProducts = []

  for (const item of (orderItems ?? []) as any[]) {
    if (seenProducts.has(item.product_id)) continue
    seenProducts.add(item.product_id)

    eligibleProducts.push({
      product_id:       item.product_id,
      order_id:         item.order.id,
      product_name:     item.product?.name ?? 'Produto',
      product_image:    item.product?.images?.[0] ?? null,
      order_date:       item.order.created_at,
      already_reviewed: reviewedProductIds.has(item.product_id),
    })
  }

  // Buscar cupons de avaliação do usuário
  const { data: coupons } = await supabase
    .from('review_coupons')
    .select('code, discount_pct, used, expires_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const availableCount = eligibleProducts.filter(p => !p.already_reviewed).length

  return (
    <main className="min-h-screen bg-[#FAF7F2]">
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-8">
          <Link href="/minha-conta"
            className="text-[#8C6D3F] hover:text-[#1C1008] text-xs uppercase tracking-widest transition-colors mb-4 block">
            ← Minha Conta
          </Link>
          <h1 className="font-playfair text-3xl text-[#1C1008]">Minhas Avaliações</h1>
          <p className="text-[#8C6D3F] text-sm mt-1">
            Avalie produtos que você comprou e ganhe <span className="text-[#C08D3A] font-semibold">15% de desconto</span>.
          </p>
        </div>

        {/* Cupons disponíveis */}
        {(coupons ?? []).length > 0 && (
          <div className="mb-8">
            <p className="text-[#8C6D3F] text-[10px] uppercase tracking-[0.25em] mb-3 font-medium">
              Seus cupons de avaliação
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(coupons ?? []).map(c => (
                <div key={c.code}
                  className={`rounded-2xl border p-4 ${
                    c.used
                      ? 'border-[#E8DCC8] bg-[#FAF7F2] opacity-60'
                      : 'border-[#C08D3A]/30 bg-white shadow-sm'
                  }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-mono text-[#1C1008] font-bold tracking-widest text-sm">{c.code}</p>
                      <p className="text-[#C08D3A] text-xs font-semibold">{c.discount_pct}% de desconto</p>
                    </div>
                    {c.used ? (
                      <span className="text-[9px] uppercase tracking-widest text-[#B0916A] border border-[#D9C9A8] rounded-full px-2 py-0.5">Usado</span>
                    ) : (
                      <span className="text-[9px] uppercase tracking-widest text-green-600 border border-green-200 bg-green-50 rounded-full px-2 py-0.5">Ativo</span>
                    )}
                  </div>
                  {!c.used && (
                    <p className="text-[#B0916A] text-[10px]">
                      Válido até {new Date(c.expires_at).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Minhas avaliações enviadas */}
        {(myReviews ?? []).length > 0 && (
          <div className="mb-8">
            <p className="text-[#8C6D3F] text-[10px] uppercase tracking-[0.25em] mb-3 font-medium">
              Avaliações enviadas
            </p>
            <div className="space-y-3">
              {(myReviews ?? []).map(r => (
                <div key={r.id}
                  className="flex items-center gap-4 bg-white border border-[#E8DCC8] rounded-2xl p-4 shadow-sm">
                  {r.thumbnail_url ? (
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#E8DCC8] flex-shrink-0 bg-black relative">
                      <img src={r.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
                          <span className="text-white text-[8px] ml-0.5">▶</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-[#F5EFE6] border border-[#E8DCC8] flex items-center justify-center flex-shrink-0">
                      <span className="text-[#D9C9A8] text-xl">🎬</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className={`text-sm ${s <= r.rating ? 'text-[#C08D3A]' : 'text-[#D9C9A8]'}`}>★</span>
                      ))}
                    </div>
                    {r.caption && <p className="text-[#6B4F2A] text-xs truncate">{r.caption}</p>}
                    <p className="text-[#B0916A] text-[10px] mt-1">
                      {new Date(r.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className={`text-[9px] uppercase tracking-widest rounded-full px-2.5 py-1 font-medium flex-shrink-0 ${
                    r.status === 'approved' ? 'bg-green-50 text-green-600 border border-green-200' :
                    r.status === 'rejected' ? 'bg-red-50 text-red-500 border border-red-200' :
                    'bg-amber-50 text-amber-600 border border-amber-200'
                  }`}>
                    {r.status === 'approved' ? 'Publicado' : r.status === 'rejected' ? 'Rejeitado' : 'Em análise'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload de nova avaliação */}
        <div className="bg-white border border-[#E8DCC8] rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-playfair text-xl text-[#1C1008]">Nova Avaliação</h2>
              <p className="text-[#8C6D3F] text-xs mt-0.5">
                {availableCount > 0
                  ? `${availableCount} produto${availableCount > 1 ? 's' : ''} aguardando avaliação`
                  : 'Nenhum produto disponível para avaliar'}
              </p>
            </div>
            {availableCount > 0 && (
              <div className="bg-[#C08D3A]/10 border border-[#C08D3A]/20 rounded-xl px-3 py-2 text-center">
                <p className="text-[#C08D3A] font-bold text-lg font-playfair">15%</p>
                <p className="text-[#8C4A10] text-[9px] uppercase tracking-widest">off</p>
              </div>
            )}
          </div>
          <ReviewUpload eligibleProducts={eligibleProducts} />
        </div>
      </div>
    </main>
  )
}