// lib/shipping.ts

export interface ShippingOption {
  label: string
  price: number
  estimatedDays: number
  carrier: string
}

interface ViaCepResponse {
  cep: string
  uf: string
  erro?: boolean
}

function getNumericCep(cep: string): number {
  return parseInt(cep.replace(/\D/g, ''), 10)
}

function isSulSudeste(cep: string): boolean {
  const num = getNumericCep(cep)
  // Sudeste: SP 01000000-19999999, RJ 20000000-28999999, MG 30000000-39999999, ES 29000000-29999999
  // Sul: PR 80000000-87999999, SC 88000000-89999999, RS 90000000-99999999
  return (
    (num >= 1000000 && num <= 39999999) ||
    (num >= 80000000 && num <= 99999999)
  )
}

async function fetchCep(cep: string): Promise<ViaCepResponse> {
  const clean = cep.replace(/\D/g, '')
  if (clean.length !== 8) throw new Error('CEP inválido')

  const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`, {
    next: { revalidate: 86400 }, // cache 24h
  })

  if (!res.ok) throw new Error('Serviço de CEP indisponível')

  const data: ViaCepResponse = await res.json()
  if (data.erro) throw new Error(`CEP ${cep} não encontrado`)

  return data
}

export async function calcShipping(
  cep: string,
  weightKg: number = 0.5,
  subtotal: number
): Promise<ShippingOption[]> {
  // Valida o CEP consultando ViaCEP
  await fetchCep(cep)

  // Frete grátis acima de R$299
  if (subtotal >= 299) {
    return [
      {
        label: 'Frete Grátis (PAC)',
        price: 0,
        estimatedDays: 10,
        carrier: 'Correios',
      },
    ]
  }

  const isFast = isSulSudeste(cep)

  const pac: ShippingOption = {
    label: 'PAC',
    price: isFast ? 14.9 : 19.9,
    estimatedDays: isFast ? 7 : 12,
    carrier: 'Correios',
  }

  const sedex: ShippingOption = {
    label: 'SEDEX',
    price: isFast ? 29.9 : 39.9,
    estimatedDays: isFast ? 3 : 5,
    carrier: 'Correios',
  }

  return [pac, sedex]
}