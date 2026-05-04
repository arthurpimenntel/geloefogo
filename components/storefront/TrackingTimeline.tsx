'use client'
import { useEffect, useState } from 'react'
import type { TrackingEvent } from '@/types/domain.types'

const STATUS_CONFIG = {
  aguardando_pagamento: { label: 'Aguardando pagamento', color: 'bg-yellow-600'  },
  pago:                 { label: 'Pagamento aprovado',   color: 'bg-blue-600'    },
  processando:          { label: 'Preparando pedido',   color: 'bg-amber-600'   },
  enviado:              { label: 'Enviado',             color: 'bg-purple-600'  },
  entregue:             { label: 'Entregue',            color: 'bg-green-600'   },
  devolvido:            { label: 'Devolvido',           color: 'bg-red-700'     },
  cancelado:            { label: 'Cancelado',           color: 'bg-zinc-600'    },
} as const

interface Props { orderId: string }

export function TrackingTimeline({ orderId }: Props) {
  const [events, setEvents] = useState<TrackingEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const res  = await fetch(`/api/rastreio/${orderId}`)
        const data = await res.json()
        if (!cancelled) setEvents(data.events ?? [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    poll()
    const timer = setInterval(poll, 60_000) // atualiza a cada minuto
    return () => { cancelled = true; clearInterval(timer) }
  }, [orderId])

  if (loading) return (
    <div className="animate-pulse space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-12 bg-amber-950/30 rounded"/>)}
    </div>
  )

  return (
    <ol className="relative border-l border-amber-900/40 ml-4 space-y-6">
      {events.map((ev, idx) => {
        const cfg = STATUS_CONFIG[ev.status] ?? { label: ev.status, color: 'bg-amber-700' }
        return (
          <li key={idx} className="ml-6">
            {/* Dot na linha do tempo */}
            <span className={`absolute -left-2 flex items-center justify-center
              w-4 h-4 rounded-full ${idx === 0 ? cfg.color : 'bg-amber-900/40'}
              ring-4 ring-[#0D0805]`}>
              {idx === 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-white"/>
              )}
            </span>

            <div className="bg-[#1A0F08] border border-amber-900/20 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className=`text-xs font-semibold uppercase tracking-widest
                  ${idx === 0 ? 'text-amber-400' : 'text-amber-700'}`>
                  {cfg.label}
                </span>
                <time className="text-amber-800 text-xs">
                  {new Date(ev.date).toLocaleString('pt-BR')}
                </time>
              </div>
              <p className="text-amber-300/70 text-sm">{ev.description}</p>
              {ev.location && (
                <p className="text-amber-700 text-xs mt-1">{ev.location}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}