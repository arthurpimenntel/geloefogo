import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AdminMobileSidebar } from '@/components/admin/AdminMobileSidebar'

const NAV = [
  { href: '/admin',               label: 'Dashboard',    icon: '▦' },
  { href: '/admin/pedidos',       label: 'Pedidos',      icon: '📦' },
  { href: '/admin/produtos',      label: 'Produtos',     icon: '🗂' },
  { href: '/admin/fornecedores',  label: 'Fornecedores', icon: '🔗' },
  { href: '/admin/clientes',      label: 'Clientes',     icon: '👤' },
  { href: '/admin/marketing',     label: 'Marketing',    icon: '📣' },
  { href: '/admin/financeiro',    label: 'Financeiro',   icon: '💰' },
  { href: '/admin/configuracoes', label: 'Config.',      icon: '⚙️' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const allowed = ['support', 'manager', 'super_admin']
  if (!profile || !allowed.includes(profile.role)) redirect('/403')

  return (
    <div className="flex min-h-screen bg-[#0F0A06]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-shrink-0 flex-col fixed top-0 bottom-0 left-0 z-30 bg-[#160E08] border-r border-white/5">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/5">
          <Link href="/" className="block group">
            <p className="font-playfair text-amber-200 text-base group-hover:text-amber-100 transition-colors">
              Gelo &amp; Fogo
            </p>
            <p className="text-amber-700 text-[10px] mt-0.5 uppercase tracking-widest">Painel Admin</p>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-3 overflow-y-auto space-y-0.5">
          {NAV.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-amber-700
                hover:text-amber-200 hover:bg-white/5 text-sm transition-all"
            >
              <span className="text-base w-5 flex-shrink-0 text-center">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-white/5 mx-3 mb-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/5">
            <div className="w-7 h-7 rounded-full bg-amber-700/40 flex items-center justify-center text-amber-300 text-xs font-bold flex-shrink-0">
              {(profile.full_name ?? user.email ?? '?')[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="text-amber-300 text-xs truncate font-medium">{profile.full_name ?? user.email}</p>
              <p className="text-amber-700 text-[10px] uppercase tracking-widest mt-0.5">{profile.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between
        px-4 py-3 bg-[#160E08]/95 backdrop-blur-sm border-b border-white/5">
        <Link href="/"><p className="font-playfair text-amber-200 text-base">Gelo &amp; Fogo</p></Link>
        <AdminMobileSidebar nav={NAV} user={{ name: profile.full_name ?? user.email ?? '', role: profile.role }} />
      </div>

      {/* Main content */}
      <div className="flex-1 md:ml-60 overflow-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-8 pt-20 md:pt-8">
          {children}
        </div>
      </div>
    </div>
  )
}