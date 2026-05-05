'use client'
import { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/admin-panel'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      const { data: profile, error: profileError } = await supabase
        .from('profiles').select('role').eq('id', data.user.id).single<{ role: string }>()
      if (profileError) throw new Error('Erro ao verificar permissões')
      const adminRoles = ['support', 'manager', 'super_admin']
      if (!adminRoles.includes(profile?.role || '')) {
        await supabase.auth.signOut()
        throw new Error('Acesso negado. Você não tem permissão de administrador.')
      }
      router.push(next)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-[#0D0805]">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/">
            <p className="font-playfair text-amber-300 text-2xl tracking-[0.1em]">Gelo &amp; Fogo</p>
            <p className="text-[9px] uppercase tracking-[0.35em] text-amber-800 mt-0.5">Área Administrativa</p>
          </Link>
        </div>
        <div className="bg-[#100B07] border border-amber-900/30 p-8">
          <div className="mb-8">
            <h1 className="font-playfair text-2xl text-amber-100">Acesso Admin</h1>
            <p className="text-amber-700 text-xs mt-1 uppercase tracking-widest">Entre com suas credenciais</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-[0.15em] text-amber-700">E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@geloefogo.com.br" required
                className="bg-[#0D0805] border border-amber-900/40 text-amber-100 px-4 py-2.5 text-sm focus:outline-none focus:border-amber-600 transition-colors placeholder:text-amber-900 w-full" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-[0.15em] text-amber-700">Senha</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required
                className="bg-[#0D0805] border border-amber-900/40 text-amber-100 px-4 py-2.5 text-sm focus:outline-none focus:border-amber-600 transition-colors placeholder:text-amber-900 w-full" />
            </div>
            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="bg-red-900/20 border border-red-800/40 px-4 py-3 text-red-300 text-xs">
                {error}
              </motion.div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-[#0D0805] text-xs font-bold uppercase tracking-[0.2em] transition-colors mt-2">
              {loading ? 'Entrando...' : 'Acessar Painel'}
            </button>
          </form>
          <div className="mt-6 pt-4 border-t border-amber-900/20">
            <Link href="/" className="block text-center text-[11px] text-amber-800 hover:text-amber-500 uppercase tracking-widest transition-colors">
              ← Voltar à loja
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0D0805]">
        <p className="text-amber-700 text-xs uppercase tracking-widest">Carregando...</p>
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  )
}