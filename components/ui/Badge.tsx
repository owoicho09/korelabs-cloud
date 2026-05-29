import { cn } from '@/lib/utils'
import type { ApplicantStage } from '@/lib/types'

type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'muted'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[#F0F7F3] text-brand-700',
  brand: 'bg-brand text-white',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-600',
  muted: 'bg-[#F4F7F5] text-[#637A6F]',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

const stageVariantMap: Record<ApplicantStage, BadgeVariant> = {
  received: 'muted',
  assessment_sent: 'default',
  assessment_done: 'success',
  interview_scheduled: 'brand',
  interviewed: 'brand',
  hired: 'success',
  on_hold: 'warning',
}

const stageLabels: Record<ApplicantStage, string> = {
  received: 'Received',
  assessment_sent: 'Assessment Sent',
  assessment_done: 'Assessment Done',
  interview_scheduled: 'Interview Scheduled',
  interviewed: 'Interviewed',
  hired: 'Hired',
  on_hold: 'On Hold',
}

export function StageBadge({ stage }: { stage: ApplicantStage }) {
  return (
    <Badge variant={stageVariantMap[stage]}>
      {stageLabels[stage]}
    </Badge>
  )
}
