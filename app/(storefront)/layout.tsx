import { Navbar } from '@/components/storefront/Navbar'
import { Footer } from '@/components/storefront/Footer'
import { GoldenCursor } from '@/components/effects/GoldenCursor'

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <GoldenCursor />
      <Navbar />
      <div className="pt-20">
        {children}
      </div>
      <Footer />
    </>
  )
}
