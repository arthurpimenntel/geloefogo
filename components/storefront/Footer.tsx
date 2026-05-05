import Link from 'next/link'
import { NewsletterForm } from './NewsletterForm'

const CATEGORIES = [
  { label: 'Charutos',     href: '/catalogo?categoria=charutos' },
  { label: 'Cigarrilhas',  href: '/catalogo?categoria=cigarrilhas' },
  { label: 'Cachimbos',    href: '/catalogo?categoria=cachimbos' },
  { label: 'Narguilés',    href: '/catalogo?categoria=narguiles' },
  { label: 'Acessórios',   href: '/catalogo?categoria=acessorios' },
  { label: 'Kits Presente',href: '/catalogo?categoria=kits-presente' },
]

const INFO_LINKS = [
  { label: 'Rastrear Pedido',   href: '/checkout/rastreio' },
  { label: 'Política de Troca', href: '/troca' },
  { label: 'Frete e Entrega',   href: '/frete' },
  { label: 'Quem Somos',        href: '/sobre' },
  { label: 'Contato',           href: '/contato' },
]

export function Footer() {
  return (
    <footer className="border-t border-amber-900/20 bg-[#0A0604] mt-20">
      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand */}
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="mb-5">
            <p className="font-playfair text-amber-200 text-xl tracking-[0.1em]">
              Gelo &amp; Fogo
            </p>
            <p className="text-[9px] uppercase tracking-[0.35em] text-amber-800 mt-0.5">
              Tabacaria Premium
            </p>
          </div>
          <p className="text-amber-700 text-xs leading-relaxed max-w-[220px]">
            Os melhores charutos, cachimbos e acessórios importados.
            Entregamos prazeres selecionados em todo o Brasil.
          </p>
          <div className="flex gap-3 mt-6">
            {[
              { label: 'Instagram', icon: InstagramIcon, href: '#' },
              { label: 'WhatsApp',  icon: WhatsAppIcon,  href: '#' },
            ].map(({ label, icon: Icon, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="w-9 h-9 border border-amber-900/40 flex items-center justify-center
                  text-amber-700 hover:text-amber-300 hover:border-amber-700
                  transition-all duration-200"
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>

        {/* Categorias */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-amber-600 mb-5">
            Categorias
          </p>
          <ul className="space-y-3">
            {CATEGORIES.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-amber-700 hover:text-amber-300 text-xs
                    uppercase tracking-widest transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Informações */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-amber-600 mb-5">
            Informações
          </p>
          <ul className="space-y-3">
            {INFO_LINKS.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-amber-700 hover:text-amber-300 text-xs
                    uppercase tracking-widest transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-amber-600 mb-5">
            Newsletter
          </p>
          <p className="text-amber-700 text-xs leading-relaxed mb-4">
            Receba novidades, lançamentos e ofertas exclusivas da nossa curadoria.
          </p>
          <NewsletterForm />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-amber-900/20">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row
          items-center justify-between gap-3">
          <p className="text-amber-900 text-[10px] uppercase tracking-widest text-center sm:text-left">
            © {new Date().getFullYear()} Gelo &amp; Fogo Tabacaria. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <p className="text-amber-900 text-[10px] uppercase tracking-widest">
              CNPJ 00.000.000/0001-00
            </p>
            <span className="text-amber-900/40">·</span>
            <p className="text-amber-900 text-[10px]">
              Proibida a venda para menores de 18 anos.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  )
}