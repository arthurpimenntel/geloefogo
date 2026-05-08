'use client';

import { useState } from 'react';

// SVG inline — zero dependência de ícones
const IconMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const IconPhone = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.4 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 10.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const IconMapPin = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconInstagram = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);
const IconFacebook = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

export function Footer() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setTimeout(() => {
      setEmail('');
      setSubmitted(false);
    }, 3000);
  };

  return (
    <footer className="bg-[#F5EFE6]">
      {/* Newsletter */}
      <div className="border-t border-[#D4B896]/40 py-16 px-6">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-[#8B7355] mb-3">Newsletter</p>
          <h3 className="text-3xl font-serif font-bold text-[#1C1C1C] mb-3">
            Fique por dentro
          </h3>
          <p className="text-[#8B7355] mb-8 leading-relaxed">
            Promoções, lançamentos e ofertas exclusivas direto no seu email.
          </p>
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="flex-1 px-4 py-3 rounded-xl bg-[#EDE3D6] border border-[#D4B896]/40 text-[#1C1C1C] placeholder-[#B8A898] text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-[#1C1C1C] text-[#F5EFE6] font-semibold text-sm rounded-xl hover:bg-[#2D2D2D] transition-all tracking-wide"
            >
              {submitted ? '✓' : 'Inscrever'}
            </button>
          </form>
          {submitted && (
            <p className="text-[#C9A96E] mt-4 text-sm font-semibold tracking-wide">
              Email cadastrado com sucesso!
            </p>
          )}
        </div>
      </div>

      {/* Main Footer */}
      <div className="border-t border-[#D4B896]/40 px-6 py-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-[#1C1C1C] flex items-center justify-center">
                <span className="text-[#C9A96E] font-serif text-xs font-bold">G&F</span>
              </div>
              <span className="text-lg font-serif font-bold text-[#1C1C1C]">Gelo & Fogo</span>
            </div>
            <p className="text-[#8B7355] text-sm leading-relaxed mb-6">
              A melhor tabacaria premium do Brasil — produtos importados, qualidade garantida.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-full border border-[#D4B896] flex items-center justify-center text-[#8B7355] hover:bg-[#1C1C1C] hover:text-[#C9A96E] hover:border-[#1C1C1C] transition-all">
                <IconInstagram />
              </a>
              <a href="#" className="w-9 h-9 rounded-full border border-[#D4B896] flex items-center justify-center text-[#8B7355] hover:bg-[#1C1C1C] hover:text-[#C9A96E] hover:border-[#1C1C1C] transition-all">
                <IconFacebook />
              </a>
            </div>
          </div>

          {/* Contato */}
          <div>
            <h4 className="text-xs tracking-[0.25em] uppercase text-[#8B7355] mb-5">Contato</h4>
            <div className="space-y-4">
              <a href="tel:+5511999999999" className="flex items-center gap-3 text-[#1C1C1C] text-sm hover:text-[#C9A96E] transition-colors">
                <span className="text-[#8B7355]"><IconPhone /></span>
                (11) 99999-9999
              </a>
              <a href="mailto:contato@gelofogo.com.br" className="flex items-center gap-3 text-[#1C1C1C] text-sm hover:text-[#C9A96E] transition-colors">
                <span className="text-[#8B7355]"><IconMail /></span>
                contato@gelofogo.com.br
              </a>
              <div className="flex items-center gap-3 text-[#8B7355] text-sm">
                <IconMapPin />
                São Paulo - SP, Brasil
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs tracking-[0.25em] uppercase text-[#8B7355] mb-5">Links</h4>
            <ul className="space-y-3">
              {['Sobre Nós', 'Produtos', 'Promoções', 'Contato'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-[#1C1C1C] hover:text-[#C9A96E] transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Políticas */}
          <div>
            <h4 className="text-xs tracking-[0.25em] uppercase text-[#8B7355] mb-5">Políticas</h4>
            <ul className="space-y-3">
              {['Termos de Uso', 'Privacidade', 'Trocas e Devoluções', 'Frete'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-[#1C1C1C] hover:text-[#C9A96E] transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-[#D4B896]/40 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#8B7355] text-xs tracking-wide">
            © 2026 Gelo & Fogo. Todos os direitos reservados.
          </p>
          <p className="text-[#8B7355] text-xs tracking-wide">
            Cartão · PIX · Boleto
          </p>
        </div>
      </div>
    </footer>
  );
}