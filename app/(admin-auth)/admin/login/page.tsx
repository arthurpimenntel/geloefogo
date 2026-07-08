// app/(admin)/admin/login/page.tsx
'use client'
import { Suspense, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/admin'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single<{ role: string }>()

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
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-[#FAF7F2]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/">
            <p className="font-playfair text-[#1C1008] text-2xl tracking-[0.1em]">
              Gelo &amp; Fogo
            </p>
            <p className="text-[9px] uppercase tracking-[0.35em] text-[#B0916A] mt-0.5">
              Área Administrativa
            </p>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E8DCC8] rounded-2xl shadow-sm p-8">
          <div className="mb-8">
            <h1 className="font-playfair text-2xl text-[#1C1008]">Acesso Admin</h1>
            <p className="text-[#8C6D3F] text-xs mt-1 uppercase tracking-widest">
              Entre com suas credenciais
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-[0.15em] text-[#8C6D3F] font-medium">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@geloefogo.com.br"
                required
                className="bg-white border border-[#E8DCC8] rounded-xl text-[#1C1008]
                  px-4 py-2.5 text-sm focus:outline-none focus:border-[#C08D3A]
                  transition-colors placeholder:text-[#B0916A] w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-[0.15em] text-[#8C6D3F] font-medium">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-white border border-[#E8DCC8] rounded-xl text-[#1C1008]
                  px-4 py-2.5 text-sm focus:outline-none focus:border-[#C08D3A]
                  transition-colors placeholder:text-[#B0916A] w-full"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-xs"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1C1008] hover:bg-[#3D2010] disabled:opacity-50
                text-white text-xs font-bold uppercase tracking-[0.2em]
                rounded-xl transition-colors mt-2"
            >
              {loading ? 'Entrando...' : 'Acessar Painel'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#E8DCC8]">
            <Link
              href="/"
              className="block text-center text-[11px] text-[#B0916A] hover:text-[#6B4F2A]
                uppercase tracking-widest transition-colors"
            >
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
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <p className="text-[#B0916A] text-xs uppercase tracking-widest animate-pulse">Carregando...</p>
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  )
}