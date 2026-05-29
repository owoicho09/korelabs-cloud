-- KoreLabs Cloud — Job Seed Data
-- Run after schema.sql

insert into jobs (slug, title, department, location, employment_type, salary_min, salary_max, currency, description, requirements, benefits, status) values

(
  'senior-backend-engineer',
  'Senior Backend Engineer',
  'Engineering',
  'Remote Europe',
  'Full-time',
  85000,
  115000,
  'EUR',
  'We are building infrastructure that sits across an organisation''s entire software stack — passively, intelligently, and without disruption. The backend is where that intelligence lives.

As a Senior Backend Engineer at KoreLabs, you will design and build the systems that ingest, process, and act on signals from thousands of integration points across Slack, Jira, Notion, HubSpot, and more. You will work on real-time data pipelines, the workflow intelligence engine at the core of KoreOS, and the API layer that makes everything work together.

This is not a CRUD application job. The problems here are genuinely hard: how do you identify coordination patterns in noisy organisational data? How do you build a system that learns in production without requiring human intervention? How do you make something that works seamlessly across deeply heterogeneous enterprise environments?

You will own significant parts of the system. You will make architecture decisions. You will work closely with the founding team.

What you will work on:
— The KoreOS intelligence engine: the core pipeline that processes organisational signals and surfaces coordination waste
— Integration adapters for Slack, Jira, Notion, HubSpot, and Microsoft 365
— The event processing architecture that needs to handle spikes gracefully
— API design and developer experience for internal services
— Performance and scalability as we grow from dozens to hundreds of enterprise customers

We write primarily in Go and Python. Our infrastructure runs on AWS. We use PostgreSQL and Redis heavily. If you have not worked with Go before but are a strong engineer, that is fine — we care more about how you think than which languages you know.',
  ARRAY[
    '5+ years of backend engineering experience',
    'Strong fundamentals: distributed systems, data modeling, API design',
    'Experience with at least one of: Go, Rust, Python at production scale',
    'Genuine interest in the problem of organisational intelligence',
    'Based in European time zones (CET ±3h)',
    'Right to work in the EU or UK'
  ],
  ARRAY[
    '€85,000–€115,000 base salary',
    'Meaningful equity package',
    'Remote-first with optional Berlin office access',
    '30 days holiday',
    'Learning budget: €2,500/year',
    'Hardware: choose your setup',
    'Annual team retreat'
  ],
  'active'
),

(
  'senior-frontend-engineer',
  'Senior Frontend Engineer',
  'Engineering',
  'Remote Europe',
  'Full-time',
  80000,
  110000,
  'EUR',
  'KoreOS surfaces intelligence to organisations through interfaces that should feel obvious, not clever. The frontend is how our customers actually experience the product.

As a Senior Frontend Engineer, you will build the dashboards, notification surfaces, and configuration interfaces that enterprise teams use every day. You will work on the KoreOS web application that lives inside organisations'' workflows — the part users see when they want to understand what is happening, configure how KoreOS behaves, or review what has been automated.

The frontend at KoreLabs is not a wrapper around a backend API. It is a product that needs to handle complex real-time state, large datasets, and the particular challenge of making AI-driven decisions legible to non-technical users.

What you will work on:
— The KoreOS dashboard: real-time visibility into coordination patterns and automated actions
— Configuration interfaces that let organisations customise how KoreOS behaves
— Integration with Slack surfaces (App Home, modals, shortcuts)
— Data visualisation for organisational intelligence
— The customer-facing web application from authentication to settings

We use React, TypeScript, and a small set of well-chosen libraries. We care deeply about performance, accessibility, and the kind of attention to detail that separates a good interface from an excellent one.',
  ARRAY[
    '5+ years of frontend engineering experience',
    'Expert-level React and TypeScript',
    'Strong intuition for UX — you notice when something feels wrong',
    'Experience with real-time data and complex state management',
    'Eye for visual quality — you care about spacing, typography, motion',
    'Based in European time zones (CET ±3h)',
    'Right to work in the EU or UK'
  ],
  ARRAY[
    '€80,000–€110,000 base salary',
    'Meaningful equity package',
    'Remote-first with optional Berlin office access',
    '30 days holiday',
    'Learning budget: €2,500/year',
    'Hardware: choose your setup',
    'Annual team retreat'
  ],
  'active'
),

(
  'ai-ml-engineer',
  'AI/ML Engineer',
  'AI Research & Engineering',
  'Remote Europe',
  'Full-time',
  90000,
  125000,
  'EUR',
  'The intelligence in KoreOS is not a wrapper around an LLM API call. It is a system that learns how organisations work, identifies patterns in noisy data, and makes decisions that affect real people''s time and attention. Getting this right is the hardest problem we are working on.

As an AI/ML Engineer, you will work on the models, pipelines, and infrastructure that power KoreOS''s core intelligence. This spans supervised learning for pattern recognition, LLM integration for natural language understanding, and the evaluation systems that tell us whether the intelligence is actually working.

You will not be fine-tuning models for the sake of it. You will be solving real problems: how do you detect coordination waste in a stream of Slack messages and Jira events? How do you build a system that is accurate enough to act on, and transparent enough to trust?

What you will work on:
— Pattern recognition models that identify coordination waste across different types of organisations
— The signal processing pipeline that transforms raw integration data into structured organisational intelligence
— LLM integration for understanding intent, context, and relationships in unstructured text
— Evaluation frameworks: how do we know when the model is getting better or worse?
— Inference infrastructure that runs at low latency on our own stack

We use Python throughout the ML stack. We run models on AWS SageMaker and serve via FastAPI. We work with LLMs pragmatically — using them where they genuinely help, not as a default answer.',
  ARRAY[
    '4+ years of applied ML engineering in production systems',
    'Strong Python and ML engineering fundamentals',
    'Experience with NLP, sequence modeling, or time-series analysis',
    'Rigorous about evaluation: you do not ship what you cannot measure',
    'Comfortable working at the intersection of research and engineering',
    'Based in European time zones (CET ±3h)',
    'Right to work in the EU or UK'
  ],
  ARRAY[
    '€90,000–€125,000 base salary',
    'Meaningful equity package',
    'Remote-first with optional Berlin engineering hub access',
    '30 days holiday',
    'Learning budget: €3,000/year (conference + compute)',
    'Hardware: choose your setup',
    'Annual team retreat'
  ],
  'active'
),

(
  'cybersecurity-engineer',
  'Cybersecurity Engineer',
  'Security',
  'Remote Europe',
  'Full-time',
  85000,
  115000,
  'EUR',
  'KoreOS sits across an organisation''s entire software stack — Slack, Jira, HubSpot, Microsoft 365. That level of access is only possible if customers trust us completely. Security is not a feature we add at the end. It is a design constraint we start with.

As our Cybersecurity Engineer, you will own KoreLabs'' security posture — from the architecture of how we handle customer data, to the controls we maintain for our cloud infrastructure, to the processes we run for incident response. You will work closely with engineering to make security decisions early, and you will be the person who defines what "secure by design" actually means in practice for KoreOS.

This is a broad role at a company where the surface area is real and growing. You will not be fighting fires all day — you will be building the systems and culture that mean we have fewer fires.

What you will work on:
— Security architecture for KoreOS: how customer data is isolated, processed, and stored
— Cloud security across our AWS and Supabase infrastructure
— OAuth and integration security: we handle tokens for dozens of integrations per customer
— Penetration testing and vulnerability management
— GDPR and enterprise security compliance (we have customers asking hard questions)
— Security awareness and training across the engineering team
— Incident response planning and execution',
  ARRAY[
    '4+ years of security engineering or a related role',
    'Deep understanding of cloud security (AWS preferred)',
    'Experience with OAuth security, API security, and SaaS integration patterns',
    'Familiarity with GDPR and enterprise security frameworks (ISO 27001 a plus)',
    'Able to communicate security constraints clearly to engineers who are not security specialists',
    'Based in European time zones (CET ±3h)',
    'Right to work in the EU or UK'
  ],
  ARRAY[
    '€85,000–€115,000 base salary',
    'Meaningful equity package',
    'Remote-first with optional Berlin office access',
    '30 days holiday',
    'Learning budget: €3,000/year',
    'Hardware: choose your setup',
    'Annual team retreat'
  ],
  'active'
),

(
  'devops-infrastructure-engineer',
  'DevOps / Infrastructure Engineer',
  'Engineering',
  'Remote Europe',
  'Full-time',
  80000,
  110000,
  'EUR',
  'We are building infrastructure for other companies'' infrastructure. The irony of having flaky, slow, or opaque deployment systems is not lost on us. We want the internal engineering experience to be as good as the product experience we deliver to customers.

As our DevOps and Infrastructure Engineer, you will own the platforms and practices that our engineering team builds on. You will run the systems that KoreOS runs on, build the CI/CD pipelines that get code from a PR to production, and make the operational decisions that determine whether we can scale to handle much larger customers.

You will be the first person whose primary job is infrastructure at KoreLabs. That means you will get to do it right from a relatively early stage — before technical debt accumulates and before operational problems become customer problems.

What you will work on:
— AWS infrastructure: EKS, RDS, ElastiCache, SQS — the stack that KoreOS runs on
— Infrastructure as code with Terraform
— CI/CD: GitHub Actions to production deployments with proper testing gates
— Observability: logging, metrics, alerting across our services
— Kubernetes cluster management for our microservices
— Cost management as our infrastructure grows with customer volume
— Runbooks, on-call rotation, and incident response tooling',
  ARRAY[
    '4+ years of DevOps or infrastructure engineering',
    'Strong AWS experience across ECS/EKS, RDS, and related services',
    'Infrastructure as code with Terraform or Pulumi',
    'Kubernetes production experience',
    'Experience with observability tooling (Datadog, Grafana, or similar)',
    'Based in European time zones (CET ±3h)',
    'Right to work in the EU or UK'
  ],
  ARRAY[
    '€80,000–€110,000 base salary',
    'Meaningful equity package',
    'Remote-first with optional Berlin office access',
    '30 days holiday',
    'Learning budget: €2,500/year',
    'Hardware: choose your setup',
    'Annual team retreat'
  ],
  'active'
),

(
  'product-designer',
  'Product Designer',
  'Design',
  'Remote Europe',
  'Full-time',
  70000,
  95000,
  'EUR',
  'Design at KoreLabs is a first-class engineering function — not an afterthought. KoreOS needs to be trusted and used by people who are skeptical of AI. Making it legible, calm, and trustworthy is a design problem as much as an engineering one.

As our Product Designer, you will own the design of KoreOS — the dashboard, the notification surfaces, the configuration flow, and the moments when KoreOS explains what it has done and why. You will work closely with engineering and will be involved in product decisions from the earliest stages.

You do not need to have designed AI products before, but you do need to have a point of view on how software should feel. We have high standards for visual quality, interaction design, and the kind of attention that makes a product feel considered rather than assembled.

What you will work on:
— The KoreOS product experience: from onboarding to daily use
— How AI-driven actions are surfaced and explained to end users
— Slack integration surfaces: App Home, modals, notifications
— The configuration and settings experience
— Data visualisation for organisational intelligence
— Design system: component library, tokens, documentation
— User research: talking to customers and turning feedback into better product

We use Figma. We care about the quality of finished work, not just the quality of the process.',
  ARRAY[
    '4+ years of product design experience, preferably in B2B SaaS',
    'Strong visual design sensibility — your portfolio should show it',
    'Excellent interaction design and information architecture skills',
    'Comfortable with ambiguity and working in a fast-moving environment',
    'Can prototype in code or Figma — whichever is faster for the problem',
    'Based in European time zones (CET ±3h)',
    'Right to work in the EU or UK'
  ],
  ARRAY[
    '€70,000–€95,000 base salary',
    'Meaningful equity package',
    'Remote-first with optional Amsterdam HQ or Berlin office access',
    '30 days holiday',
    'Learning budget: €2,500/year',
    'Hardware: choose your setup',
    'Annual team retreat'
  ],
  'active'
),

(
  'operations-analyst',
  'Operations Analyst',
  'Operations',
  'Remote Europe',
  'Full-time',
  55000,
  75000,
  'EUR',
  'At 47 people, we are still small enough that operations matters enormously — but large enough that without someone focused on it, things start slipping. The Operations Analyst role exists to make sure they do not.

You will work across business operations, helping us understand how the company is running, identifying where processes are breaking down, and building the systems that let us scale from 47 to 150 people without losing the clarity that makes us good.

This is not a pure data role, but you will work with data. It is not a pure ops role, but you will run processes. You need to be someone who gets things done and who notices when something is not working before it becomes a problem.

What you will work on:
— Financial and operational reporting: helping leadership understand how the business is performing
— Process design and improvement across sales, customer success, and engineering operations
— Tooling: owning our internal tools stack and making sure it actually works for everyone
— Customer data analysis: helping us understand patterns in how customers use KoreOS
— Supporting go-to-market operations as we grow the sales and customer success teams
— Special projects: the things that are important but do not have a clear owner

We are based in Amsterdam and Berlin, with most people working remotely. This role can be fully remote within European time zones.',
  ARRAY[
    '2–4 years of experience in operations, business analysis, or a similar role',
    'Comfortable working with data: SQL, spreadsheets, and dashboards',
    'Strong written communication — you will document things clearly',
    'High attention to detail combined with the ability to see the bigger picture',
    'Genuine interest in how organisations work (you are joining a company that is solving this problem)',
    'Based in European time zones (CET ±3h)',
    'Right to work in the EU or UK'
  ],
  ARRAY[
    '€55,000–€75,000 base salary',
    'Equity package',
    'Remote-first with optional Amsterdam HQ or Berlin office access',
    '30 days holiday',
    'Learning budget: €1,500/year',
    'Hardware: choose your setup',
    'Annual team retreat'
  ],
  'active'
);
