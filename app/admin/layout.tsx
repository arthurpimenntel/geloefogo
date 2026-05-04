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
    <div className="flex min-h-screen bg-[#0A0604]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 flex-shrink-0 border-r border-amber-900/20 flex-col fixed top-0 bottom-0 left-0 z-30 bg-[#0A0604]">
        <div className="p-5 border-b border-amber-900/20">
          <Link href="/" className="block group">
            <p className="font-playfair text-amber-300 text-base group-hover:text-amber-200 transition-colors">Gelo &amp; Fogo</p>
            <p className="text-amber-700 text-xs mt-0.5 uppercase tracking-widest">Admin</p>
          </Link>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map(({ href, label, icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-5 py-2.5 text-amber-700 hover:text-amber-300
                hover:bg-amber-900/20 text-sm transition-colors">
              <span className="text-base flex-shrink-0">{icon}</span>
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-5 border-t border-amber-900/20">
          <p className="text-amber-600 text-xs truncate">{profile.full_name ?? user.email}</p>
          <p className="text-amber-800 text-[10px] uppercase tracking-widest mt-0.5">{profile.role}</p>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between
        px-4 py-3 bg-[#0A0604]/95 backdrop-blur-sm border-b border-amber-900/20">
        <Link href="/"><p className="font-playfair text-amber-300 text-base">Gelo &amp; Fogo</p></Link>
        <AdminMobileSidebar nav={NAV} user={{ name: profile.full_name ?? user.email ?? '', role: profile.role }} />
      </div>

      {/* Main content */}
      <div className="flex-1 md:ml-56 overflow-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-8 pt-20 md:pt-8">
          {children}
        </div>
      </div>
    </div>
  )
}
