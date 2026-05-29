import type { Job } from './types'

// Static job data used as fallback when DB is unavailable
export const STATIC_JOBS: Omit<Job, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    slug: 'senior-backend-engineer',
    title: 'Senior Backend Engineer',
    department: 'Engineering',
    location: 'Remote Europe',
    employment_type: 'Full-time',
    salary_min: 85000,
    salary_max: 115000,
    currency: 'EUR',
    status: 'active',
    description: `We are building infrastructure that sits across an organisation's entire software stack — passively, intelligently, and without disruption. The backend is where that intelligence lives.

As a Senior Backend Engineer at KoreLabs, you will design and build the systems that ingest, process, and act on signals from thousands of integration points across Slack, Jira, Notion, HubSpot, and more. You will work on real-time data pipelines, the workflow intelligence engine at the core of KoreOS, and the API layer that makes everything work together.

This is not a CRUD application job. The problems here are genuinely hard: how do you identify coordination patterns in noisy organisational data? How do you build a system that learns in production without requiring human intervention? How do you make something that works seamlessly across deeply heterogeneous enterprise environments?`,
    requirements: [
      '5+ years of backend engineering experience',
      'Strong fundamentals: distributed systems, data modeling, API design',
      'Experience with at least one of: Go, Rust, Python at production scale',
      'Genuine interest in the problem of organisational intelligence',
      'Based in European time zones (CET ±3h)',
      'Right to work in the EU or UK',
    ],
    benefits: [
      '€85,000–€115,000 base salary',
      'Meaningful equity package',
      'Remote-first with optional Berlin office access',
      '30 days holiday',
      'Learning budget: €2,500/year',
      'Hardware: choose your setup',
      'Annual team retreat',
    ],
  },
  {
    slug: 'senior-frontend-engineer',
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    location: 'Remote Europe',
    employment_type: 'Full-time',
    salary_min: 80000,
    salary_max: 110000,
    currency: 'EUR',
    status: 'active',
    description: `KoreOS surfaces intelligence to organisations through interfaces that should feel obvious, not clever. The frontend is how our customers actually experience the product.

As a Senior Frontend Engineer, you will build the dashboards, notification surfaces, and configuration interfaces that enterprise teams use every day. The frontend at KoreLabs is not a wrapper around a backend API — it is a product that needs to handle complex real-time state, large datasets, and the particular challenge of making AI-driven decisions legible to non-technical users.`,
    requirements: [
      '5+ years of frontend engineering experience',
      'Expert-level React and TypeScript',
      'Strong intuition for UX — you notice when something feels wrong',
      'Experience with real-time data and complex state management',
      'Eye for visual quality — you care about spacing, typography, motion',
      'Based in European time zones (CET ±3h)',
      'Right to work in the EU or UK',
    ],
    benefits: [
      '€80,000–€110,000 base salary',
      'Meaningful equity package',
      'Remote-first with optional Berlin office access',
      '30 days holiday',
      'Learning budget: €2,500/year',
      'Hardware: choose your setup',
      'Annual team retreat',
    ],
  },
  {
    slug: 'ai-ml-engineer',
    title: 'AI/ML Engineer',
    department: 'AI Research & Engineering',
    location: 'Remote Europe',
    employment_type: 'Full-time',
    salary_min: 90000,
    salary_max: 125000,
    currency: 'EUR',
    status: 'active',
    description: `The intelligence in KoreOS is not a wrapper around an LLM API call. It is a system that learns how organisations work, identifies patterns in noisy data, and makes decisions that affect real people's time and attention. Getting this right is the hardest problem we are working on.

As an AI/ML Engineer, you will work on the models, pipelines, and infrastructure that power KoreOS's core intelligence. This spans supervised learning for pattern recognition, LLM integration for natural language understanding, and the evaluation systems that tell us whether the intelligence is actually working.`,
    requirements: [
      '4+ years of applied ML engineering in production systems',
      'Strong Python and ML engineering fundamentals',
      'Experience with NLP, sequence modeling, or time-series analysis',
      'Rigorous about evaluation: you do not ship what you cannot measure',
      'Comfortable working at the intersection of research and engineering',
      'Based in European time zones (CET ±3h)',
      'Right to work in the EU or UK',
    ],
    benefits: [
      '€90,000–€125,000 base salary',
      'Meaningful equity package',
      'Remote-first with optional Berlin engineering hub access',
      '30 days holiday',
      'Learning budget: €3,000/year (conference + compute)',
      'Hardware: choose your setup',
      'Annual team retreat',
    ],
  },
  {
    slug: 'cybersecurity-engineer',
    title: 'Cybersecurity Engineer',
    department: 'Security',
    location: 'Remote Europe',
    employment_type: 'Full-time',
    salary_min: 85000,
    salary_max: 115000,
    currency: 'EUR',
    status: 'active',
    description: `KoreOS sits across an organisation's entire software stack — Slack, Jira, HubSpot, Microsoft 365. That level of access is only possible if customers trust us completely. Security is not a feature we add at the end. It is a design constraint we start with.

As our Cybersecurity Engineer, you will own KoreLabs' security posture — from the architecture of how we handle customer data, to the controls we maintain for our cloud infrastructure, to the processes we run for incident response.`,
    requirements: [
      '4+ years of security engineering or a related role',
      'Deep understanding of cloud security (AWS preferred)',
      'Experience with OAuth security, API security, and SaaS integration patterns',
      'Familiarity with GDPR and enterprise security frameworks (ISO 27001 a plus)',
      'Able to communicate security constraints clearly to non-security engineers',
      'Based in European time zones (CET ±3h)',
      'Right to work in the EU or UK',
    ],
    benefits: [
      '€85,000–€115,000 base salary',
      'Meaningful equity package',
      'Remote-first with optional Berlin office access',
      '30 days holiday',
      'Learning budget: €3,000/year',
      'Hardware: choose your setup',
      'Annual team retreat',
    ],
  },
  {
    slug: 'devops-infrastructure-engineer',
    title: 'DevOps / Infrastructure Engineer',
    department: 'Engineering',
    location: 'Remote Europe',
    employment_type: 'Full-time',
    salary_min: 80000,
    salary_max: 110000,
    currency: 'EUR',
    status: 'active',
    description: `We are building infrastructure for other companies' infrastructure. You will be the first person whose primary job is infrastructure at KoreLabs — which means you will get to do it right from a relatively early stage, before technical debt accumulates and before operational problems become customer problems.`,
    requirements: [
      '4+ years of DevOps or infrastructure engineering',
      'Strong AWS experience across ECS/EKS, RDS, and related services',
      'Infrastructure as code with Terraform or Pulumi',
      'Kubernetes production experience',
      'Experience with observability tooling (Datadog, Grafana, or similar)',
      'Based in European time zones (CET ±3h)',
      'Right to work in the EU or UK',
    ],
    benefits: [
      '€80,000–€110,000 base salary',
      'Meaningful equity package',
      'Remote-first with optional Berlin office access',
      '30 days holiday',
      'Learning budget: €2,500/year',
      'Hardware: choose your setup',
      'Annual team retreat',
    ],
  },
  {
    slug: 'product-designer',
    title: 'Product Designer',
    department: 'Design',
    location: 'Remote Europe',
    employment_type: 'Full-time',
    salary_min: 70000,
    salary_max: 95000,
    currency: 'EUR',
    status: 'active',
    description: `Design at KoreLabs is a first-class engineering function. KoreOS needs to be trusted and used by people who are skeptical of AI. Making it legible, calm, and trustworthy is a design problem as much as an engineering one.

As our Product Designer, you will own the design of KoreOS — the dashboard, notification surfaces, configuration flow, and the moments when KoreOS explains what it has done and why.`,
    requirements: [
      '4+ years of product design experience, preferably in B2B SaaS',
      'Strong visual design sensibility — your portfolio should show it',
      'Excellent interaction design and information architecture skills',
      'Comfortable with ambiguity and working in a fast-moving environment',
      'Can prototype in code or Figma — whichever is faster for the problem',
      'Based in European time zones (CET ±3h)',
      'Right to work in the EU or UK',
    ],
    benefits: [
      '€70,000–€95,000 base salary',
      'Meaningful equity package',
      'Remote-first with optional Amsterdam HQ or Berlin office access',
      '30 days holiday',
      'Learning budget: €2,500/year',
      'Hardware: choose your setup',
      'Annual team retreat',
    ],
  },
  {
    slug: 'operations-analyst',
    title: 'Operations Analyst',
    department: 'Operations',
    location: 'Remote Europe',
    employment_type: 'Full-time',
    salary_min: 55000,
    salary_max: 75000,
    currency: 'EUR',
    status: 'active',
    description: `At 47 people, we are still small enough that operations matters enormously — but large enough that without someone focused on it, things start slipping. The Operations Analyst role exists to make sure they do not.

You will work across business operations, helping us understand how the company is running, identifying where processes are breaking down, and building the systems that let us scale from 47 to 150 people without losing the clarity that makes us good.`,
    requirements: [
      '2–4 years of experience in operations, business analysis, or a similar role',
      'Comfortable working with data: SQL, spreadsheets, and dashboards',
      'Strong written communication — you will document things clearly',
      'High attention to detail combined with the ability to see the bigger picture',
      'Genuine interest in how organisations work',
      'Based in European time zones (CET ±3h)',
      'Right to work in the EU or UK',
    ],
    benefits: [
      '€55,000–€75,000 base salary',
      'Equity package',
      'Remote-first with optional Amsterdam HQ or Berlin office access',
      '30 days holiday',
      'Learning budget: €1,500/year',
      'Hardware: choose your setup',
      'Annual team retreat',
    ],
  },
]

export function getJobBySlug(slug: string) {
  return STATIC_JOBS.find((j) => j.slug === slug) ?? null
}

export const ROLE_OPTIONS = STATIC_JOBS.map((j) => j.title)
