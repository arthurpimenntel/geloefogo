'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HeroSection() {
  // Lê a largura real já no primeiro render (evita carregar o vídeo errado
  // e trocar por outro logo em seguida, o que dobrava o download inicial).
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 768
  );

  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <section className="relative w-full h-screen flex items-end overflow-hidden bg-[#1C1C1C]">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/video/hero-poster.jpg"
        className="absolute inset-0 w-full h-full object-cover opacity-50"
        key={isDesktop ? 'desktop' : 'mobile'}
      >
        <source
          src={isDesktop ? '/video/videodesktop.mp4' : '/video/videocelular.mp4'}
          type="video/mp4"
        />
      </video>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C] via-[#1C1C1C]/40 to-transparent" />

      {/* Content */}
      <div className="relative z-10 w-full px-6 md:px-16 pb-20 md:pb-28 max-w-5xl">
        <p className="text-xs tracking-[0.4em] uppercase text-[#C9A96E] mb-5">
          Tabacaria Premium · Entregamos para todo Brasil
        </p>
        <h1 className="text-6xl md:text-8xl font-serif font-black text-[#F5EFE6] leading-[0.95] mb-8">
          Gelo<br />
          <span className="text-[#C9A96E]">&</span> Fogo
        </h1>
        <p className="text-base md:text-lg text-[#B8A898] mb-10 max-w-md leading-relaxed">
          Os melhores produtos importados, selecionados com critério para quem entende.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/catalogo"
            className="px-8 py-4 bg-[#C9A96E] text-[#1C1C1C] rounded-full font-bold text-sm tracking-widest uppercase hover:bg-[#B8944F] transition-all duration-300 text-center"
          >
            Ver Catálogo
          </Link>
          <Link
            href="/catalogo#sobre"
            className="px-8 py-4 border border-[#F5EFE6]/30 text-[#F5EFE6] rounded-full font-semibold text-sm tracking-widest uppercase hover:border-[#F5EFE6]/60 transition-all duration-300 text-center"
          >
            Saiba Mais
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 right-8 z-20 flex flex-col items-center gap-2 opacity-50">
        <span className="text-[#F5EFE6] text-xs tracking-widest uppercase rotate-90 origin-center translate-x-4">
          Scroll
        </span>
        <div className="w-px h-12 bg-[#F5EFE6]/40 animate-pulse" />
      </div>
    </section>
  );
}