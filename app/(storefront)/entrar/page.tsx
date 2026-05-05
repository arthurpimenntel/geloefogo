'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import Link from 'next/link'

type Mode = 'login' | 'register' | 'forgot'

function EntrarForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/'

  const [mode, setMode]       = useState<Mode>('login')
  const [email, setEmail]     = useState('')
  const [password, setPass]   = useState('')
  const [name, setName]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push(next)
        router.refresh()

      } else if (mode === 'register') {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        })
        if (error) throw error

        if (signUpData.user && signUpData.user.identities?.length === 0) {
          throw new Error('User already registered')
        }

        if (signUpData.user && signUpData.session) {
          await supabase
            .from('profiles')
            .update({ full_name: name } as any)
            .eq('id', signUpData.user.id)
        }

        setSuccess('Conta criada! Verifique seu e-mail para confirmar o cadastro.')

      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset`,
        })
        if (error) throw error
        setSuccess('Link de redefinição enviado para seu e-mail.')
      }
    } catch (err: any) {
      const msg: Record<string, string> = {
        'Invalid login credentials': 'E-mail ou senha incorretos.',
        'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
        'User already registered': 'Este e-mail já está cadastrado.',
        'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
        'signup_disabled': 'Cadastro de novos usuários está temporariamente desativado.',
        'email_address_invalid': 'Endereço de e-mail inválido.',
        'over_email_send_rate_limit': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
        'weak_password': 'Senha muito fraca. Use pelo menos 6 caracteres.',
      }
      setError(msg[err.message] ?? msg[err.code] ?? err.message ?? 'Ocorreu um erro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const TITLE: Record<Mode, string> = {
    login:    'Bem-vindo de volta',
    register: 'Criar conta',
    forgot:   'Redefinir senha',
  }
  const SUBTITLE: Record<Mode, string> = {
    login:    'Acesse sua conta para continuar',
    register: 'Junte-se à nossa comunidade premium',
    forgot:   'Enviaremos um link para seu e-mail',
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16
      bg-[#0D0805] relative overflow-hidden">

      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(ellipse at 20% 50%, #d97706 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, #92400e 0%, transparent 60%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0, 0, 1] }}
        className="w-full max-w-md relative"
      >
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <p className="font-playfair text-amber-300 text-2xl tracking-[0.1em]">
              Gelo &amp; Fogo
            </p>
            <p className="text-[9px] uppercase tracking-[0.35em] text-amber-800 mt-0.5">
              Tabacaria Premium
            </p>
          </Link>
        </div>

        <div className="bg-[#100B07] border border-amber-900/30 p-8">
          <div className="mb-8">
            <h1 className="font-playfair text-2xl text-amber-100">{TITLE[mode]}</h1>
            <p className="text-amber-700 text-xs mt-1 uppercase tracking-widest">
              {SUBTITLE[mode]}
            </p>
          </div>

          {mode !== 'forgot' && (
            <div className="flex border border-amber-900/30 mb-8">
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(null) }}
                  className={`flex-1 py-2.5 text-[11px] uppercase tracking-[0.2em] transition-colors ${
                    mode === m
                      ? 'bg-amber-700 text-[#0D0805] font-bold'
                      : 'text-amber-700 hover:text-amber-400'
                  }`}
                >
                  {m === 'login' ? 'Entrar' : 'Cadastrar'}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <Field label="Nome completo" type="text" value={name} onChange={setName} placeholder="João Silva" required />
            )}
            <Field label="E-mail" type="email" value={email} onChange={setEmail} placeholder="seu@email.com" required />
            {mode !== 'forgot' && (
              <Field label="Senha" type="password" value={password} onChange={setPass} placeholder="••••••••" required />
            )}

            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setError(null) }}
                  className="text-[11px] text-amber-800 hover:text-amber-500 transition-colors uppercase tracking-widest"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-900/20 border border-red-800/40 px-4 py-3 text-red-300 text-xs"
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-900/20 border border-green-800/40 px-4 py-3 text-green-300 text-xs"
              >
                {success}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-700 hover:bg-amber-600 disabled:opacity-50
                text-[#0D0805] text-xs font-bold uppercase tracking-[0.2em] transition-colors mt-2"
            >
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar Conta' : 'Enviar Link'}
            </button>
          </form>

          {mode === 'forgot' && (
            <button
              onClick={() => { setMode('login'); setError(null) }}
              className="mt-6 block text-center text-xs text-amber-800 hover:text-amber-500 uppercase tracking-widest transition-colors w-full"
            >
              ← Voltar para login
            </button>
          )}
        </div>

        <p className="text-center mt-6">
          <Link href="/" className="text-amber-800 hover:text-amber-500 text-[11px] uppercase tracking-widest transition-colors">
            ← Voltar à loja
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

function Field({
  label, type, value, onChange, placeholder, required,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] uppercase tracking-[0.15em] text-amber-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="bg-[#0D0805] border border-amber-900/40 text-amber-100
          px-4 py-2.5 text-sm focus:outline-none focus:border-amber-600
          transition-colors placeholder:text-amber-900 w-full"
      />
    </div>
  )
}

export default function EntrarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0D0805]">
        <p className="text-amber-700 text-xs uppercase tracking-widest">Carregando...</p>
      </div>
    }>
      <EntrarForm />
    </Suspense>
  )
}