import Link from 'next/link'

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0D0805]">
      <div className="text-center">
        <p className="font-playfair text-8xl text-amber-900/40 mb-4">403</p>
        <h1 className="font-playfair text-2xl text-amber-200 mb-3">Acesso Negado</h1>
        <p className="text-amber-700 text-sm mb-8">
          Você não tem permissão para acessar esta página.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/"
            className="px-8 py-3 bg-amber-700 hover:bg-amber-600 text-[#0D0805]
              text-xs font-bold uppercase tracking-widest transition-colors">
            Voltar à loja
          </Link>
          <Link href="/entrar"
            className="px-8 py-3 border border-amber-800 text-amber-600
              hover:border-amber-600 hover:text-amber-300 text-xs uppercase
              tracking-widest transition-colors">
            Entrar com outra conta
          </Link>
        </div>
      </div>
    </div>
  )
}
