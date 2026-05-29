import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <>
      <Header />
      <section className="min-h-screen flex items-center justify-center pt-16">
        <div className="text-center">
          <p className="font-display text-[120px] text-brand/20 font-semibold leading-none mb-6">404</p>
          <h1 className="font-display text-3xl text-[#1A2A1E] mb-3">Page not found.</h1>
          <p className="text-[#637A6F] mb-8">This page does not exist or has been moved.</p>
          <Link href="/">
            <Button variant="outline">Back to home</Button>
          </Link>
        </div>
      </section>
      <Footer />
    </>
  )
}
