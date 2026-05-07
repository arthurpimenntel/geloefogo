'use client';

const items = [
  '✦ Qualidade Premium',
  '✦ Entrega Rápida',
  '✦ Produtos Importados',
  '✦ Garantia Total',
  '✦ Avaliação 5 Estrelas',
  '✦ Curadoria Especializada',
];

export default function MarqueeBand() {
  // Duplica 4x para garantir loop sem branco visível em qualquer largura
  const repeated = [...items, ...items, ...items, ...items];

  return (
    <>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee 28s linear infinite;
          will-change: transform;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="w-full overflow-hidden bg-[#1C1C1C] py-3 select-none">
        <div className="marquee-track flex gap-0 whitespace-nowrap w-max">
          {repeated.map((item, i) => (
            <span
              key={i}
              className="text-[#C9A96E] font-serif font-semibold text-sm md:text-base tracking-widest uppercase px-8"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}