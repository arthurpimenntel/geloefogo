'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

function ConfirmacaoContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const metodo  = searchParams.get('metodo') ?? 'pix'

  const METODO_MSG: Record<string, { title: string; desc: string; icon: string }> = {
    pix:    { title: 'Pague via Pix',      desc: 'O QR Code e código copia-e-cola foram enviados ao seu e-mail. O pagamento é confirmado em instantes.', icon: '⚡' },
    boleto: { title: 'Boleto Gerado',      desc: 'O boleto bancário foi enviado ao seu e-mail. O vencimento é em 3 dias úteis.', icon: '📄' },
    cartao: { title: 'Pagamento Aprovado!', desc: 'Seu cartão foi cobrado com sucesso. O pedido está sendo processado.', icon: '💳' },
  }
  const info = METODO_MSG[metodo] ?? METODO_MSG.pix

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }} className="text-center">
        <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
          transition={{ type:'spring', stiffness:200, damping:20, delay:0.2 }}
          className="w-20 h-20 mx-auto mb-6 border-2 border-amber-600 flex items-center justify-center">
          <span className="text-amber-500 text-3xl">✓</span>
        </motion.div>

        <h1 className="font-playfair text-3xl text-amber-100 mb-3">Pedido Confirmado!</h1>
        <p className="text-amber-600 text-xs uppercase tracking-widest mb-2">
          Pedido #{orderId?.slice(0, 8) ?? '--------'}
        </p>
        <p className="text-amber-500 text-sm mb-8">
          Você receberá um e-mail de confirmação com os detalhes do pedido.
        </p>

        <div className="bg-[#1A0F08] border border-amber-900/20 p-6 mb-8 text-left">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{info.icon}</span>
            <p className="text-amber-300 text-sm font-medium">{info.title}</p>
          </div>
          <p className="text-amber-600 text-sm">{info.desc}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {orderId && (
            <Link href={`/checkout/rastreio/${orderId}`}
              className="px-6 py-3 border border-amber-700 text-amber-500 hover:border-amber-500
                hover:text-amber-300 text-xs uppercase tracking-widest transition-colors">
              🔍 Rastrear Pedido
            </Link>
          )}
          <Link href="/catalogo"
            className="px-6 py-3 bg-amber-700 hover:bg-amber-600 text-[#0D0805]
              text-xs font-bold uppercase tracking-widest transition-colors">
            Continuar Comprando
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default function ConfirmacaoPage() {
  return (
    <Suspense fallback={
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-amber-700 text-xs uppercase tracking-widest">Carregando...</p>
      </div>
    }>
      <ConfirmacaoContent />
    </Suspense>
  )
}