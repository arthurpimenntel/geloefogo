// lib/email/resend.ts
import { Resend } from 'resend'
import { OrderConfirmed } from './templates/OrderConfirmed'
import { ShippingUpdate } from './templates/ShippingUpdate'
import type { Order } from '@/types/domain.types'

const resend = new Resend(process.env.RESEND_API_KEY!)

const FROM = 'Gelo & Fogo <pedidos@geloefogo.com.br>'

export interface OrderConfirmedEmailProps {
  order: Order
  customerName: string
  customerEmail: string
}

export interface ShippingUpdateEmailProps {
  customerName: string
  orderId: string
  trackingCode: string
  carrier: string
  trackingUrl: string
}

export async function sendOrderConfirmed(
  to: string,
  props: OrderConfirmedEmailProps
): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Pedido #${props.order.id.slice(0, 8).toUpperCase()} confirmado! 🔥`,
    react: OrderConfirmed(props),
  })

  if (error) {
    console.error('[Resend] sendOrderConfirmed error:', error)
    throw new Error(`Falha ao enviar e-mail de confirmação: ${error.message}`)
  }
}

export async function sendShippingUpdate(
  to: string,
  props: ShippingUpdateEmailProps
): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Seu pedido foi enviado! Rastreie agora 📦`,
    react: ShippingUpdate(props),
  })

  if (error) {
    console.error('[Resend] sendShippingUpdate error:', error)
    throw new Error(`Falha ao enviar e-mail de envio: ${error.message}`)
  }
}

export { resend }