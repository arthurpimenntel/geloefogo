// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import { ServiceWorkerRegister } from '@/components/effects/ServiceWorkerRegister'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Tabacaria Premium — Charutos, Cachimbos e Acessórios',
  description:
    'Os melhores charutos, cachimbos, narguilés e acessórios importados. Entrega para todo o Brasil.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#C08D3A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="bg-[#FAF7F2] font-sans antialiased">
        <main className="relative">
          {children}
        </main>

        <ServiceWorkerRegister />
      </body>
    </html>
  )
}