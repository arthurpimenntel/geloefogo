// lib/revalidate.ts
'use server'

import { revalidatePath } from 'next/cache'

export async function revalidateProduct(slug: string): Promise<void> {
  revalidatePath('/produto/' + slug)
}

export async function revalidateCatalog(): Promise<void> {
  revalidatePath('/catalogo')
}

export async function revalidateHome(): Promise<void> {
  revalidatePath('/')
}