'use client'

const ITEMS = [
  '🇨🇺 Charutos Cubanos',
  '🇩🇴 República Dominicana',
  '🔥 Frete Grátis acima de R$300',
  '🌿 Tabaco Orgânico',
  '💳 12x sem juros',
  '⚡ Pix com 5% de desconto',
  '🏆 Mais de 800 clientes satisfeitos',
  '🇧🇷 Entrega para todo o Brasil',
  '🎁 Kits Presente',
  '🔞 Proibido para menores de 18 anos',
]

interface MarqueeBandProps {
  /** bg-white (padrão) ou bg-[#1A0F08] para o footer */
  dark?: boolean
}

export function MarqueeBand({ dark = false }: MarqueeBandProps) {
  const repeated = [...ITEMS, ...ITEMS] // duplicado → loop seamless

  return (
    <div className={`overflow-hidden py-2.5 border-y ${
      dark ? 'border-amber-900/30 bg-[#1A0F08]' : 'border-amber-200/20 bg-white'
    }`}>
      <div
        className="flex whitespace-nowrap"
        style={{ animation: 'marquee 32s linear infinite' }}
      >
        {repeated.map((item, i) => (
          <span
            key={i}
            className={`text-xs font-medium uppercase tracking-widest mx-8 ${
              dark ? 'text-amber-700' : 'text-[#2C1810]'
            }`}
          >
            {item}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        div:hover > div {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
