import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { ContactForm } from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Talk to the KoreLabs team about KoreOS, partnerships, or anything else.',
}

export default function ContactPage() {
  return (
    <>
      <Header />

      <section className="pt-32 pb-24">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <AnimatedSection>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-6">Talk to us</p>
              <h1 className="font-display text-[44px] md:text-[52px] text-[#1A2A1E] leading-tight mb-6">
                We talk to every serious enquiry personally.
              </h1>
              <p className="text-lg text-[#637A6F] leading-relaxed mb-10">
                If you are a mid-sized European organisation wondering whether KoreOS could help, or an investor, or someone interested in joining the team — send us a note. You will hear back from someone who can actually help, not an automated response.
              </p>

              <div className="space-y-6">
                {[
                  {
                    label: 'Headquarters',
                    value: 'Amsterdam, Netherlands',
                  },
                  {
                    label: 'Engineering',
                    value: 'Berlin, Germany',
                  },
                  {
                    label: 'General',
                    value: 'hello@korelabs.cloud',
                  },
                  {
                    label: 'Careers',
                    value: 'careers@korelabs.cloud',
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-6">
                    <span className="text-xs font-semibold uppercase tracking-widest text-[#9FB5A9] w-24 pt-0.5">
                      {label}
                    </span>
                    <span className="text-[#637A6F] text-sm">{value}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <div className="p-8 rounded-2xl border border-[#D8E8E0] bg-white">
                <h2 className="font-display text-2xl text-[#1A2A1E] mb-6">Send us a message</h2>
                <ContactForm />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
