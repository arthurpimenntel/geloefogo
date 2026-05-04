import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0D0805]">
      <div className="text-center max-w-sm">
        <p className="font-playfair text-8xl text-amber-900/30 mb-4">404</p>
        <h1 className="font-playfair text-2xl text-amber-200 mb-3">Página não encontrada</h1>
        <p className="text-amber-700 text-sm leading-relaxed mb-8">
          O produto ou página que você procura não existe ou foi removido.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/catalogo"
            className="px-8 py-3 bg-amber-700 hover:bg-amber-600 text-[#0D0805]
              text-xs font-bold uppercase tracking-widest transition-colors">
            Ver Catálogo
          </Link>
          <Link href="/"
            className="px-8 py-3 border border-amber-800/60 text-amber-600
              hover:border-amber-600 hover:text-amber-300 text-xs uppercase
              tracking-widest transition-colors">
            Início
          </Link>
        </div>
      </div>
    </div>
  )
}
