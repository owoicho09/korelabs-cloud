import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin, Clock } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { Button } from '@/components/ui/Button'
import { STATIC_JOBS } from '@/lib/jobs'
import { formatSalary } from '@/lib/utils'
import { TalentPoolForm } from './TalentPoolForm'

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Join KoreLabs and build the intelligence layer for how European organisations work.',
}

export default function CareersPage() {
  const jobs = STATIC_JOBS.filter((j) => j.status === 'active')

  return (
    <>
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16">
        <div className="container">
          <div className="max-w-2xl">
            <AnimatedSection>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-6">We&apos;re hiring</p>
              <h1 className="font-display text-[44px] md:text-[56px] text-[#1A2A1E] leading-tight mb-6">
                Build infrastructure that changes how organisations work.
              </h1>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <p className="text-lg text-[#637A6F] leading-relaxed">
                We are a 47-person team, Series A funded, building a product that is genuinely hard and genuinely useful. We are looking for engineers, designers, and operators who want to own significant work from early.
              </p>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Why KoreLabs */}
      <section className="py-12 bg-white border-y border-[#D8E8E0]">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Real autonomy',
                body: 'We hire senior people and give them senior problems. No micromanagement. No backlog grooming for its own sake.',
              },
              {
                title: 'European by design',
                body: '30 days holiday. Sensible working hours. A culture that does not ask you to sacrifice everything else for the company.',
              },
              {
                title: 'Hard problems',
                body: 'The problems here are genuinely difficult — technically, analytically, and in terms of product thinking. That is the point.',
              },
            ].map((point, i) => (
              <AnimatedSection key={point.title} delay={i * 0.06}>
                <div>
                  <h3 className="font-display text-xl text-[#1A2A1E] mb-2">{point.title}</h3>
                  <p className="text-sm text-[#637A6F] leading-relaxed">{point.body}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Open roles */}
      <section className="section">
        <div className="container">
          <AnimatedSection>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-4">Open roles</p>
            <h2 className="font-display text-[32px] md:text-[40px] text-[#1A2A1E] leading-tight mb-10">
              {jobs.length} positions open now.
            </h2>
          </AnimatedSection>

          <div className="space-y-3">
            {jobs.map((job, i) => (
              <AnimatedSection key={job.slug} delay={i * 0.04}>
                <Link href={`/careers/${job.slug}`} className="group block">
                  <div className="flex items-center justify-between p-6 rounded-2xl border border-[#D8E8E0] bg-white hover:border-brand/40 hover:shadow-sm transition-all">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-1.5">
                        <h3 className="font-medium text-[#1A2A1E] text-[15px] group-hover:text-brand transition-colors">
                          {job.title}
                        </h3>
                        <span className="text-xs text-[#9FB5A9] bg-[#F4F7F5] px-2 py-0.5 rounded-full">
                          {job.department}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#637A6F]">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {job.employment_type}
                        </span>
                        <span className="font-medium text-[#4A9270]">
                          {formatSalary(job.salary_min, job.salary_max)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[#9FB5A9] group-hover:text-brand transition-colors ml-4">
                      <span className="text-xs font-medium hidden sm:block">View role</span>
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Talent pool */}
      <section className="section bg-white border-t border-[#D8E8E0]">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <AnimatedSection>
              <h2 className="font-display text-[32px] md:text-[36px] text-[#1A2A1E] leading-tight mb-4">
                Not the right moment? Join our talent pool.
              </h2>
              <p className="text-[#637A6F] mb-10">
                If none of these roles fit right now but you are interested in KoreLabs, leave your details. When something opens up that matches, we will reach out directly — no automated blasts.
              </p>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <TalentPoolForm />
            </AnimatedSection>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
