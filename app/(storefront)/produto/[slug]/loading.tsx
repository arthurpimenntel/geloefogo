// app/(storefront)/produto/[slug]/loading.tsx

export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-[#0D0805] pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* ── Coluna esquerda: galeria ── */}
          <div className="flex flex-col gap-4">
            {/* Imagem principal */}
            <div className="w-full aspect-square bg-amber-900/20 animate-pulse" />
            {/* Thumbnails */}
            <div className="flex gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-20 h-20 bg-amber-900/20 animate-pulse" />
              ))}
            </div>
          </div>

          {/* ── Coluna direita: informações ── */}
          <div className="flex flex-col gap-6 pt-2">
            {/* Tags */}
            <div className="flex gap-2">
              <div className="h-5 w-20 bg-amber-900/20 animate-pulse" />
              <div className="h-5 w-16 bg-amber-900/20 animate-pulse" />
            </div>

            {/* Nome */}
            <div className="flex flex-col gap-2">
              <div className="h-10 w-3/4 bg-amber-900/20 animate-pulse" />
              <div className="h-6 w-1/2 bg-amber-900/20 animate-pulse" />
            </div>

            {/* Avaliação */}
            <div className="flex gap-2 items-center">
              <div className="h-4 w-24 bg-amber-900/20 animate-pulse" />
              <div className="h-4 w-12 bg-amber-900/20 animate-pulse" />
            </div>

            {/* Preço */}
            <div className="flex items-baseline gap-3">
              <div className="h-10 w-36 bg-amber-900/20 animate-pulse" />
              <div className="h-6 w-24 bg-amber-900/20 animate-pulse" />
            </div>

            {/* Intensidade */}
            <div className="flex flex-col gap-2">
              <div className="h-4 w-20 bg-amber-900/20 animate-pulse" />
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-1.5 w-full bg-amber-900/20 animate-pulse" />
                ))}
              </div>
            </div>

            {/* Atributos */}
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="h-3 w-16 bg-amber-900/20 animate-pulse" />
                  <div className="h-5 w-24 bg-amber-900/20 animate-pulse" />
                </div>
              ))}
            </div>

            {/* Quantidade + botão */}
            <div className="flex gap-3 mt-2">
              <div className="h-12 w-28 bg-amber-900/20 animate-pulse" />
              <div className="h-12 flex-1 bg-amber-900/20 animate-pulse" />
            </div>

            {/* Frete */}
            <div className="flex flex-col gap-2">
              <div className="h-4 w-32 bg-amber-900/20 animate-pulse" />
              <div className="flex gap-2">
                <div className="h-10 flex-1 bg-amber-900/20 animate-pulse" />
                <div className="h-10 w-24 bg-amber-900/20 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Seção de descrição ── */}
        <div className="mt-16 flex flex-col gap-4">
          <div className="h-6 w-40 bg-amber-900/20 animate-pulse" />
          <div className="flex flex-col gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`h-4 bg-amber-900/20 animate-pulse ${i === 4 ? 'w-2/3' : 'w-full'}`} />
            ))}
          </div>
        </div>

        {/* ── Avaliações ── */}
        <div className="mt-16 flex flex-col gap-6">
          <div className="h-6 w-48 bg-amber-900/20 animate-pulse" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex flex-col gap-2 border-t border-amber-900/20 pt-6">
              <div className="flex gap-2 items-center">
                <div className="h-4 w-24 bg-amber-900/20 animate-pulse" />
                <div className="h-4 w-16 bg-amber-900/20 animate-pulse" />
              </div>
              <div className="h-4 w-full bg-amber-900/20 animate-pulse" />
              <div className="h-4 w-4/5 bg-amber-900/20 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}