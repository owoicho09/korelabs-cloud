import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Clock, Euro } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { Button } from '@/components/ui/Button'
import { STATIC_JOBS } from '@/lib/jobs'
import { formatSalary } from '@/lib/utils'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return STATIC_JOBS.map((j) => ({ slug: j.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const job = STATIC_JOBS.find((j) => j.slug === slug)
  if (!job) return {}
  return {
    title: job.title,
    description: `${job.title} at KoreLabs Cloud — ${job.location}, ${formatSalary(job.salary_min, job.salary_max)}`,
  }
}

export default async function JobPage({ params }: Props) {
  const { slug } = await params
  const job = STATIC_JOBS.find((j) => j.slug === slug)
  if (!job) notFound()

  return (
    <>
      <Header />

      <section className="pt-28 pb-8">
        <div className="container">
          <AnimatedSection>
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 text-sm text-[#637A6F] hover:text-[#1A2A1E] transition-colors mb-8"
            >
              <ArrowLeft size={16} />
              All open roles
            </Link>
          </AnimatedSection>
        </div>
      </section>

      <section className="pb-16">
        <div className="container">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main content */}
            <div className="lg:col-span-2">
              <AnimatedSection>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-4">
                  {job.department}
                </p>
                <h1 className="font-display text-[40px] md:text-[52px] text-[#1A2A1E] leading-tight mb-8">
                  {job.title}
                </h1>
              </AnimatedSection>

              <AnimatedSection delay={0.1}>
                <div className="flex flex-wrap gap-4 mb-10 pb-10 border-b border-[#D8E8E0] text-sm text-[#637A6F]">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} />
                    {job.employment_type}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-brand">
                    <Euro size={14} />
                    {formatSalary(job.salary_min, job.salary_max)}
                  </span>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.12}>
                <div className="prose prose-slate max-w-none">
                  {job.description.split('\n\n').map((para, i) => (
                    <p key={i} className="text-[15px] text-[#637A6F] leading-relaxed mb-5">
                      {para}
                    </p>
                  ))}
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.14}>
                <div className="mt-10 mb-10">
                  <h2 className="font-display text-xl text-[#1A2A1E] mb-5">What we are looking for</h2>
                  <ul className="space-y-3">
                    {job.requirements.map((req) => (
                      <li key={req} className="flex items-start gap-3 text-sm text-[#637A6F]">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand mt-2 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.16}>
                <div>
                  <h2 className="font-display text-xl text-[#1A2A1E] mb-5">What we offer</h2>
                  <ul className="space-y-3">
                    {job.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-3 text-sm text-[#637A6F]">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand mt-2 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimatedSection>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <AnimatedSection delay={0.08}>
                <div className="sticky top-24 p-6 rounded-2xl border border-[#D8E8E0] bg-white">
                  <h3 className="font-display text-lg text-[#1A2A1E] mb-2">{job.title}</h3>
                  <p className="text-sm text-[#637A6F] mb-6">
                    {job.location} · {formatSalary(job.salary_min, job.salary_max)}
                  </p>

                  <Link href={`/apply/${job.slug}`}>
                    <Button size="lg" className="w-full mb-3">
                      Apply for this role
                    </Button>
                  </Link>

                  <p className="text-xs text-[#9FB5A9] text-center">
                    Takes about 5 minutes. We read every application.
                  </p>

                  <div className="mt-6 pt-6 border-t border-[#D8E8E0] space-y-2 text-xs text-[#637A6F]">
                    <div className="flex justify-between">
                      <span>Department</span>
                      <span className="text-[#1A2A1E]">{job.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type</span>
                      <span className="text-[#1A2A1E]">{job.employment_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Location</span>
                      <span className="text-[#1A2A1E]">{job.location}</span>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
