import type { Metadata } from 'next'
import { Shield, Zap, Eye, Link2, RefreshCw, Lock } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { AnimatedSection } from '@/components/ui/AnimatedSection'

export const metadata: Metadata = {
  title: 'Product — KoreOS',
  description: 'KoreOS is the ambient workflow intelligence layer for European enterprises. Learn about its capabilities, architecture, and security posture.',
}

const CAPABILITIES = [
  {
    icon: Eye,
    title: 'Passive observation',
    description:
      'KoreOS never asks your team to do anything differently. It reads signals from your existing tools without requiring input or configuration from end users.',
  },
  {
    icon: Zap,
    title: 'Coordination waste detection',
    description:
      'Identifies when tasks are blocked, when context has been lost, when meetings are scheduling more meetings, and when the same information is being asked for the fourth time.',
  },
  {
    icon: RefreshCw,
    title: 'Automated routing',
    description:
      'When KoreOS detects coordination waste, it routes the right information to the right place — automatically, before someone has to ask.',
  },
  {
    icon: Link2,
    title: 'Cross-tool context',
    description:
      'Maintains a model of how work flows across Slack, Jira, Notion, HubSpot, and more — so nothing falls through the gaps between tools.',
  },
  {
    icon: Shield,
    title: 'Trust controls',
    description:
      'Every automated action is transparent and reversible. Teams set boundaries on what KoreOS can and cannot do. The audit log shows everything.',
  },
  {
    icon: Lock,
    title: 'EU data residency',
    description:
      'All customer data is processed and stored in EU infrastructure. GDPR-compliant by architecture, not just by policy.',
  },
]

const INTEGRATIONS = [
  { name: 'Slack', description: 'Message routing, thread summarisation, status updates' },
  { name: 'Jira', description: 'Task status, blocker detection, cycle time analysis' },
  { name: 'Notion', description: 'Context retrieval, documentation gap detection' },
  { name: 'HubSpot', description: 'Pipeline correlation with internal coordination patterns' },
  { name: 'Microsoft 365', description: 'Calendar analysis, email thread patterns, Teams integration' },
  { name: 'Google Workspace', description: 'Calendar and Docs integration' },
]

export default function ProductPage() {
  return (
    <>
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-24">
        <div className="container">
          <div className="max-w-3xl">
            <AnimatedSection>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-6">KoreOS</p>
              <h1 className="font-display text-[44px] md:text-[56px] text-[#1A2A1E] leading-tight mb-8">
                An intelligence layer for how your organisation works.
              </h1>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <p className="text-xl text-[#637A6F] leading-relaxed">
                KoreOS is not a tool you open. It is infrastructure that runs quietly across the tools you already use — observing, learning, and systematically reducing the coordination overhead that is costing your organisation 23% of its productive time.
              </p>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* What it does */}
      <section className="section bg-white border-y border-[#D8E8E0]">
        <div className="container">
          <AnimatedSection>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-4">Capabilities</p>
            <h2 className="font-display text-[36px] md:text-[44px] text-[#1A2A1E] leading-tight mb-16 max-w-xl">
              Six things KoreOS does that your tools cannot.
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CAPABILITIES.map((cap, i) => (
              <AnimatedSection key={cap.title} delay={i * 0.06}>
                <div className="p-7 rounded-2xl bg-[#FAFAF8] border border-[#D8E8E0] hover:border-brand/30 transition-colors h-full">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-5">
                    <cap.icon size={20} className="text-brand" />
                  </div>
                  <h3 className="font-display text-lg text-[#1A2A1E] mb-2">{cap.title}</h3>
                  <p className="text-sm text-[#637A6F] leading-relaxed">{cap.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="section">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-4">Architecture</p>
              <h2 className="font-display text-[36px] md:text-[40px] text-[#1A2A1E] leading-tight mb-6">
                Passive by design. Precise by necessity.
              </h2>
              <div className="space-y-4 text-[#637A6F] text-[15px] leading-relaxed">
                <p>
                  KoreOS works at two layers: an event ingestion layer that processes signals from integrations in real time, and an intelligence layer that maintains a model of how your organisation works and what is going wrong.
                </p>
                <p>
                  The event processing pipeline handles thousands of signals per minute at production scale, per customer, with full tenant isolation. Every customer&apos;s data is isolated at the queue and processing level — not just the database level.
                </p>
                <p>
                  The intelligence layer combines structured pattern recognition (for known coordination waste patterns) with learned models that adapt to how your specific organisation works. It gets more accurate over time.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <div className="bg-[#1A2A1E] rounded-2xl p-8 font-mono text-sm text-[#8FB5A0]">
                <div className="text-[#4A9270] mb-4 text-xs uppercase tracking-widest">KoreOS Stack</div>
                {[
                  { layer: 'Integrations', detail: 'Slack · Jira · Notion · HubSpot · M365' },
                  { layer: 'Event Ingestion', detail: 'Go · SQS · per-tenant isolation' },
                  { layer: 'Intelligence Engine', detail: 'Python · ML pipeline · pattern matching' },
                  { layer: 'Action Layer', detail: 'Routing · automation · audit logging' },
                  { layer: 'Data Layer', detail: 'PostgreSQL · Redis · EU-only storage' },
                ].map((item, i) => (
                  <div key={item.layer} className="flex items-start gap-4 py-3 border-t border-white/5 first:border-0">
                    <span className="text-[#4A9270] text-xs w-6 opacity-60">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <div className="text-white text-xs mb-0.5">{item.layer}</div>
                      <div className="text-[#637A6F] text-xs">{item.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="section bg-white border-y border-[#D8E8E0]">
        <div className="container">
          <AnimatedSection>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-4">Integrations</p>
            <h2 className="font-display text-[36px] md:text-[40px] text-[#1A2A1E] leading-tight mb-4">
              Connect your existing stack.
            </h2>
            <p className="text-[#637A6F] mb-12 max-w-xl">
              KoreOS adds intelligence on top of the tools your team already uses. No migration required.
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {INTEGRATIONS.map((intg, i) => (
              <AnimatedSection key={intg.name} delay={i * 0.05}>
                <div className="p-5 rounded-xl border border-[#D8E8E0] bg-[#FAFAF8]">
                  <div className="font-medium text-[#1A2A1E] mb-1">{intg.name}</div>
                  <div className="text-xs text-[#637A6F]">{intg.description}</div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="section">
        <div className="container">
          <div className="max-w-2xl">
            <AnimatedSection>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-4">Security</p>
              <h2 className="font-display text-[36px] md:text-[40px] text-[#1A2A1E] leading-tight mb-6">
                The trust conversation starts before the contract.
              </h2>
              <p className="text-[#637A6F] text-[15px] leading-relaxed mb-10">
                KoreOS sits across sensitive organisational data. We know that. Our security architecture is designed around that fact — not as an afterthought.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <div className="space-y-4">
                {[
                  'All customer data encrypted at rest (AES-256) and in transit (TLS 1.3)',
                  'OAuth tokens stored encrypted with KMS-managed keys',
                  'Full tenant isolation at queue, processing, and database layers',
                  'EU-only data residency — no data leaves European AWS regions',
                  'GDPR-compliant data processing agreements available for all customers',
                  'Annual third-party penetration testing',
                  'SOC 2 Type II (in progress — target: Q3 2025)',
                  'Security.txt and responsible disclosure policy published',
                ].map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-brand-50 border border-brand/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                    </div>
                    <span className="text-[15px] text-[#637A6F]">{point}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
