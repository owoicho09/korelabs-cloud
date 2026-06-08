import { cn } from '@/lib/utils'
import type { ApplicantStage } from '@/lib/types'

type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'muted' | 'purple'

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
  purple: 'bg-purple-50 text-purple-700',
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
  assessment_video_done: 'success',
  under_review: 'brand',
  accepted: 'purple',
  on_hold: 'warning',
  archived: 'danger',
}

const stageLabels: Record<ApplicantStage, string> = {
  received: 'Received',
  assessment_sent: 'Assessment Sent',
  assessment_video_done: 'Video Done',
  under_review: 'Under Review',
  accepted: 'Accepted',
  on_hold: 'On Hold',
  archived: 'Archived',
}

export function StageBadge({ stage }: { stage: ApplicantStage }) {
  return (
    <Badge variant={stageVariantMap[stage]}>
      {stageLabels[stage]}
    </Badge>
  )
}

export function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-[#9FB5A9]">—</span>
  const variant: BadgeVariant = score >= 30 ? 'success' : score >= 20 ? 'warning' : 'danger'
  return <Badge variant={variant}>{score}/36</Badge>
}
