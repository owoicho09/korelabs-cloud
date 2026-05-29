import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { getInitials } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'About',
  description: 'We are a 47-person team building AI infrastructure for European enterprises from Amsterdam and Berlin.',
}

const VALUES = [
  {
    name: 'Ruthless Clarity',
    description:
      'We cut everything that is not essential. In the product, in how we communicate, in how we make decisions. Clarity is not a style preference — it is the foundation of good work.',
  },
  {
    name: 'Builder Mentality',
    description:
      'We are engineers and operators who build things. We prefer a working prototype to a perfect specification. We learn by doing, not by planning to do.',
  },
  {
    name: 'Trust by Default',
    description:
      'We hire people who do not need to be managed. We trust our colleagues to make good decisions, and we trust our customers with honest information about where we are.',
  },
  {
    name: 'European by Design',
    description:
      'We are not trying to build a European version of an American company. We are building a company that reflects what is genuinely different about how European organisations work — and what they care about.',
  },
  {
    name: 'Radical Transparency',
    description:
      'We share information widely, including information about our finances, our mistakes, and our uncertainties. Trust is built on truth.',
  },
]

const TEAM = [
  { first: 'Lars', last: 'Reinhardt', role: 'CEO & Co-founder', location: 'Amsterdam' },
  { first: 'Mara', last: 'Voss', role: 'CTO & Co-founder', location: 'Berlin' },
  { first: 'Jonas', last: 'Brandt', role: 'Head of Product', location: 'Berlin' },
  { first: 'Sophie', last: 'Dekker', role: 'Head of Customer Success', location: 'Amsterdam' },
  { first: 'Timo', last: 'Hoffmann', role: 'Head of Engineering', location: 'Berlin' },
  { first: 'Anika', last: 'Müller', role: 'Head of Sales', location: 'Amsterdam' },
]

export default function AboutPage() {
  return (
    <>
      <Header />

      {/* Story */}
      <section className="pt-32 pb-24">
        <div className="container">
          <div className="max-w-3xl">
            <AnimatedSection>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-6">Our story</p>
              <h1 className="font-display text-[44px] md:text-[56px] text-[#1A2A1E] leading-tight mb-8">
                We got tired of watching smart people waste their time.
              </h1>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <div className="space-y-5 text-[17px] text-[#637A6F] leading-relaxed">
                <p>
                  KoreLabs was founded in Amsterdam in 2022 by Lars and Mara, who had spent the previous decade working in and around European enterprise software. They kept seeing the same problem: organisations filled with capable people who were spending 20–25% of their working lives not working — but coordinating.
                </p>
                <p>
                  The pattern was the same everywhere. Stand-ups to coordinate what was already in Jira. Slack threads to answer questions that were already in Notion. Meetings to decide things that a clear process would have handled automatically. The tools were excellent at storing information. None of them knew what to do with it.
                </p>
                <p>
                  KoreOS is what happens when you treat coordination overhead as a solvable engineering problem rather than an inevitable property of organisational life. It sits across your existing tools, learns how your organisation actually works, and systematically reduces the friction that does not need to exist.
                </p>
                <p>
                  We raised a €4M seed in 2023 and a €11M Series A in early 2025. We are 47 people based in Amsterdam and Berlin, serving mid-sized European enterprises who want the kind of operational efficiency that large companies achieve through headcount — but without the headcount.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Values */}
      <section id="values" className="section bg-white border-y border-[#D8E8E0]">
        <div className="container">
          <AnimatedSection>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-4">How we work</p>
            <h2 className="font-display text-[36px] md:text-[44px] text-[#1A2A1E] leading-tight mb-16 max-w-lg">
              Five things we care about, and why.
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {VALUES.map((value, i) => (
              <AnimatedSection key={value.name} delay={i * 0.06}>
                <div className="flex gap-5">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-brand font-display font-semibold text-sm">{i + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-[#1A2A1E] mb-2">{value.name}</h3>
                    <p className="text-sm text-[#637A6F] leading-relaxed">{value.description}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section">
        <div className="container">
          <AnimatedSection>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-4">The team</p>
            <h2 className="font-display text-[36px] md:text-[44px] text-[#1A2A1E] leading-tight mb-4">
              47 people. Two cities. One product.
            </h2>
            <p className="text-[#637A6F] mb-16 max-w-xl">
              We are engineers, designers, researchers, and operators. Most of us are remote, with offices in Amsterdam and Berlin.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {TEAM.map((member, i) => (
              <AnimatedSection key={member.first} delay={i * 0.05}>
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center mb-3">
                    <span className="font-display text-lg font-semibold text-brand-700">
                      {getInitials(member.first, member.last)}
                    </span>
                  </div>
                  <div className="font-medium text-sm text-[#1A2A1E]">
                    {member.first} {member.last}
                  </div>
                  <div className="text-xs text-[#637A6F] mt-0.5">{member.role}</div>
                  <div className="text-xs text-[#9FB5A9] mt-0.5">{member.location}</div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="section bg-[#1A2A1E]">
        <div className="container">
          <AnimatedSection>
            <h2 className="font-display text-[32px] md:text-[40px] text-white mb-12 text-center">
              Two cities. Built for Europe.
            </h2>
          </AnimatedSection>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {[
              {
                city: 'Amsterdam',
                role: 'Headquarters',
                detail: 'Commercial, product, and leadership. Our home office since 2022.',
              },
              {
                city: 'Berlin',
                role: 'Engineering Hub',
                detail: 'The largest concentration of our engineering and research team.',
              },
            ].map((loc, i) => (
              <AnimatedSection key={loc.city} delay={i * 0.1}>
                <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-xs font-semibold uppercase tracking-widest text-brand mb-3">{loc.role}</div>
                  <div className="font-display text-2xl text-white mb-2">{loc.city}</div>
                  <p className="text-sm text-[#8FB5A0]">{loc.detail}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
