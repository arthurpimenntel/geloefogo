'use client'

import { useState } from 'react'

export function NewsletterForm() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    // Aqui você pode integrar com Resend, Mailchimp, etc.
    await new Promise(r => setTimeout(r, 800))
    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <p className="text-green-400 text-xs uppercase tracking-widest py-2">
        ✓ Inscrito com sucesso!
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="seu@email.com.br"
        required
        className="bg-[#100B07] border border-amber-900/40 text-amber-200
          px-4 py-2.5 text-xs focus:outline-none focus:border-amber-600
          transition-colors placeholder:text-amber-900 w-full"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2.5 bg-amber-700 hover:bg-amber-600 disabled:opacity-50
          text-[#0D0805] text-[10px] font-bold uppercase tracking-[0.2em] transition-colors"
      >
        {loading ? 'Aguarde...' : 'Assinar'}
      </button>
    </form>
  )
}