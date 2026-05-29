import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { STATIC_JOBS } from '@/lib/jobs'
import { formatSalary } from '@/lib/utils'
import { ApplicationForm } from './ApplicationForm'

interface Props {
  params: Promise<{ jobSlug: string }>
}

export async function generateStaticParams() {
  return STATIC_JOBS.map((j) => ({ jobSlug: j.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { jobSlug } = await params
  const job = STATIC_JOBS.find((j) => j.slug === jobSlug)
  if (!job) return {}
  return { title: `Apply — ${job.title}` }
}

export default async function ApplyPage({ params }: Props) {
  const { jobSlug } = await params
  const job = STATIC_JOBS.find((j) => j.slug === jobSlug)
  if (!job) notFound()

  return (
    <>
      <Header />

      <section className="pt-28 pb-8">
        <div className="container max-w-2xl">
          <AnimatedSection>
            <Link
              href={`/careers/${job.slug}`}
              className="inline-flex items-center gap-2 text-sm text-[#637A6F] hover:text-[#1A2A1E] transition-colors mb-8"
            >
              <ArrowLeft size={16} />
              Back to job description
            </Link>

            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-3">
                {job.department}
              </p>
              <h1 className="font-display text-[36px] md:text-[44px] text-[#1A2A1E] leading-tight mb-2">
                {job.title}
              </h1>
              <p className="text-[#637A6F] text-sm">
                {job.location} · {formatSalary(job.salary_min, job.salary_max)}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-brand-50 border border-brand/20 mb-8">
              <p className="text-sm text-brand-700">
                We read every application. The form takes about 5 minutes. We will respond within a few business days.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <ApplicationForm jobSlug={job.slug} jobTitle={job.title} />
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </>
  )
}
