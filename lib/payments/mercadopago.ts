// lib/payments/mercadopago.ts
import MercadoPago, { Payment } from 'mercadopago'

const mp = new MercadoPago({ accessToken: process.env.MP_ACCESS_TOKEN! })
const payment = new Payment(mp)

export async function createPixPayment(params: {
  orderId: string
  amount: number
  payerEmail: string
  payerCpf: string
}): Promise<{
  qrCode: string
  qrBase64: string
  paymentId: string
  expiresAt: string
}> {
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 min

  const result = await payment.create({
    body: {
      transaction_amount: params.amount,
      payment_method_id: 'pix',
      description: `Pedido Gelo & Fogo #${params.orderId.slice(0, 8).toUpperCase()}`,
      date_of_expiration: expiresAt.toISOString(),
      external_reference: params.orderId,
      payer: {
        email: params.payerEmail,
        identification: { type: 'CPF', number: params.payerCpf.replace(/\D/g, '') },
      },
    },
  })

  const pointOfInteraction = result.point_of_interaction
  const qrData = pointOfInteraction?.transaction_data

  if (!qrData?.qr_code || !qrData?.qr_code_base64) {
    throw new Error('Mercado Pago não retornou QR Code Pix')
  }

  return {
    qrCode: qrData.qr_code,
    qrBase64: qrData.qr_code_base64,
    paymentId: String(result.id!),
    expiresAt: expiresAt.toISOString(),
  }
}

export async function createBoletoPayment(params: {
  orderId: string
  amount: number
  payerEmail: string
  payerCpf: string
  payerName: string
}): Promise<{
  boletoUrl: string
  boletoCode: string
  paymentId: string
  dueDate: string
}> {
  // Vencimento em 3 dias úteis (aprox. 4 dias corridos)
  const dueDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)

  const result = await payment.create({
    body: {
      transaction_amount: params.amount,
      payment_method_id: 'bolbradesco',
      description: `Pedido Gelo & Fogo #${params.orderId.slice(0, 8).toUpperCase()}`,
      date_of_expiration: dueDate.toISOString(),
      external_reference: params.orderId,
      payer: {
        email: params.payerEmail,
        first_name: params.payerName.split(' ')[0],
        last_name: params.payerName.split(' ').slice(1).join(' ') || 'Cliente',
        identification: { type: 'CPF', number: params.payerCpf.replace(/\D/g, '') },
      },
    },
  })

  const boletoUrl = result.transaction_details?.external_resource_url
  const boletoCode = result.barcode?.content

  if (!boletoUrl || !boletoCode) {
    throw new Error('Mercado Pago não retornou dados do boleto')
  }

  return {
    boletoUrl,
    boletoCode,
    paymentId: String(result.id!),
    dueDate: dueDate.toISOString(),
  }
}

export async function checkPaymentStatus(
  paymentId: string
): Promise<'pendente' | 'aprovado' | 'cancelado' | 'expirado'> {
  try {
    const result = await payment.get({ id: Number(paymentId) })

    switch (result.status) {
      case 'approved':  return 'aprovado'
      case 'cancelled': return 'cancelado'
      case 'expired':   return 'expirado'
      default:          return 'pendente'
    }
  } catch (err) {
    console.error('[MercadoPago] checkPaymentStatus error:', err)
    return 'pendente'
  }
}