import Link from 'next/link'
import { ArrowRight, Zap, Eye, Layers, Shield, CheckCircle } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AnimatedSection } from '@/components/ui/AnimatedSection'
import { Button } from '@/components/ui/Button'

const INTEGRATIONS = [
  { name: 'Slack', color: '#611f69' },
  { name: 'Jira', color: '#0052cc' },
  { name: 'Notion', color: '#000000' },
  { name: 'HubSpot', color: '#ff5c35' },
  { name: 'Microsoft 365', color: '#0078d4' },
  { name: 'Google Workspace', color: '#4285f4' },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Connect',
    description:
      'Add KoreOS to your Slack workspace and connect your other tools. Takes five minutes. No migration. No configuration.',
    icon: Layers,
  },
  {
    step: '02',
    title: 'Observe',
    description:
      'KoreOS learns how work flows through your organisation — what gets stuck, what slows down, which meetings could be a message.',
    icon: Eye,
  },
  {
    step: '03',
    title: 'Eliminate',
    description:
      'Coordination waste gets routed away before it starts. Updates go where they need to. Context travels with tasks. Your team works.',
    icon: Zap,
  },
]

const IMPACT = [
  { value: '30–40%', label: 'reduction in coordination overhead' },
  { value: '90 days', label: 'to see measurable impact' },
  { value: '19–23%', label: 'of productive time currently wasted' },
  { value: '47', label: 'people building this, not thousands' },
]

export default function HomePage() {
  return (
    <>
      <Header />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F0F7F3]/60 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-brand/5 blur-3xl pointer-events-none" />

        <div className="container relative py-24 md:py-32">
          <div className="max-w-4xl">
            <AnimatedSection delay={0.05}>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand/20 text-brand text-xs font-medium mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                Series A · Amsterdam
              </span>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <h1 className="font-display text-[52px] md:text-[68px] lg:text-[80px] text-[#1A2A1E] leading-[1.05] tracking-[-0.03em] mb-8 text-balance">
                Your organisation is losing 23% of its productive time.
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={0.18}>
              <p className="text-lg md:text-xl text-[#637A6F] leading-relaxed max-w-2xl mb-10">
                KoreOS sits quietly across Slack, Jira, Notion, and your tools — learning how your organisation actually works. Then it eliminates the coordination that was wasting everyone&apos;s time.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={0.24}>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/contact">
                  <Button size="lg">
                    Request access
                    <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link href="/product">
                  <Button variant="outline" size="lg">
                    See how it works
                  </Button>
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="section bg-white border-y border-[#D8E8E0]">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <AnimatedSection>
              <h2 className="font-display text-[36px] md:text-[44px] text-[#1A2A1E] leading-tight mb-6">
                Coordination is killing productivity. Not your people.
              </h2>
            </AnimatedSection>
            <AnimatedSection delay={0.08}>
              <p className="text-lg text-[#637A6F] leading-relaxed mb-12">
                The average knowledge worker spends nearly a quarter of their working week on coordination — status updates, clarifying context, attending meetings to schedule meetings. It is not a people problem. It is a tools problem. Your tools do not talk to each other. KoreOS does.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={0.12}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {IMPACT.map(({ value, label }) => (
                  <div key={label} className="p-5 rounded-2xl bg-[#FAFAF8] border border-[#D8E8E0]">
                    <div className="font-display text-[28px] md:text-[32px] text-brand font-semibold mb-1">
                      {value}
                    </div>
                    <div className="text-xs text-[#637A6F] leading-snug">{label}</div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <AnimatedSection>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-4">How it works</p>
              <h2 className="font-display text-[36px] md:text-[44px] text-[#1A2A1E] leading-tight">
                No migration. No training. No disruption.
              </h2>
            </AnimatedSection>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, description, icon: Icon }, i) => (
              <AnimatedSection key={step} delay={i * 0.08}>
                <div className="relative p-8 rounded-2xl bg-white border border-[#D8E8E0] hover:border-brand/40 transition-colors">
                  <div className="text-[11px] font-mono font-semibold text-[#9FB5A9] mb-6 tracking-widest">{step}</div>
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-5">
                    <Icon size={20} className="text-brand" />
                  </div>
                  <h3 className="font-display text-xl text-[#1A2A1E] mb-3">{title}</h3>
                  <p className="text-sm text-[#637A6F] leading-relaxed">{description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="section bg-white border-y border-[#D8E8E0]">
        <div className="container">
          <div className="text-center mb-12">
            <AnimatedSection>
              <h2 className="font-display text-[28px] md:text-[32px] text-[#1A2A1E] mb-4">
                Works with the tools your organisation already uses.
              </h2>
              <p className="text-[#637A6F]">No replacing anything. KoreOS connects to your existing stack.</p>
            </AnimatedSection>
          </div>

          <AnimatedSection delay={0.1}>
            <div className="flex flex-wrap justify-center gap-4">
              {INTEGRATIONS.map(({ name }) => (
                <div
                  key={name}
                  className="px-6 py-3 rounded-xl bg-[#FAFAF8] border border-[#D8E8E0] text-sm font-medium text-[#1A2A1E]"
                >
                  {name}
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Security trust bar */}
      <section className="py-16">
        <div className="container">
          <AnimatedSection>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-sm text-[#637A6F]">
              {[
                { icon: Shield, text: 'GDPR compliant' },
                { icon: Shield, text: 'Data stays in the EU' },
                { icon: CheckCircle, text: 'SOC 2 (in progress)' },
                { icon: Shield, text: 'Encrypted at rest and in transit' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <Icon size={16} className="text-brand" />
                  {text}
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-[#1A2A1E]">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <AnimatedSection>
              <h2 className="font-display text-[36px] md:text-[48px] text-white leading-tight mb-6">
                Ready to stop losing 23% of productive time?
              </h2>
            </AnimatedSection>
            <AnimatedSection delay={0.08}>
              <p className="text-lg text-[#8FB5A0] mb-10">
                We work with European organisations of 50–500 people. No American-style land-and-expand. No required training. No contracts you will regret.
              </p>
            </AnimatedSection>
            <AnimatedSection delay={0.14}>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/contact">
                  <Button size="lg" className="bg-brand hover:bg-brand-400">
                    Request access
                    <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link href="/careers">
                  <Button variant="ghost" size="lg" className="text-[#8FB5A0] hover:text-white hover:bg-white/10">
                    We are hiring
                  </Button>
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
