'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function usePixPolling(orderId: string) {
  const [status, setStatus] = useState<'pendente' | 'aprovado' | 'expirado'>('pendente')
  const supabase = createClient()

  useEffect(() => {
    // Supabase Realtime: escuta UPDATE na tabela payments
    const channel = supabase
      .channel(`pix-order-${orderId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'payments',
          filter: `order_id=eq.${orderId}` },
        (payload) => {
          const newStatus = payload.new.status
          if (newStatus === 'aprovado') setStatus('aprovado')
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orderId])

  return status
}