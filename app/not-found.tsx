import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF8] px-6 text-center">
      <p
        className="text-[96px] md:text-[120px] font-semibold leading-none mb-6 select-none"
        style={{ color: 'rgba(74,146,112,0.15)', fontFamily: 'var(--font-fraunces), Georgia, serif' }}
      >
        404
      </p>
      <h1
        className="text-3xl mb-3 text-[#1A2A1E]"
        style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
      >
        Page not found.
      </h1>
      <p className="text-[#637A6F] mb-8 max-w-xs">
        This page does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center px-5 py-2.5 rounded-xl border border-[#D8E8E0] text-sm font-medium text-[#1A2A1E] bg-white hover:border-[#4A9270] hover:text-[#4A9270] transition-colors"
      >
        Back to home
      </Link>
    </div>
  )
}
