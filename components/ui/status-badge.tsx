import React from "react"
import { cn } from '@/lib/utils'
import { Loader2, AlertCircle, CheckCircle, FileDown, AlertTriangle, Eye } from 'lucide-react'

type ProjectStatus = 'processing' | 'needs-review' | 'ready' | 'exported'

interface StatusBadgeProps {
  status: ProjectStatus
  className?: string
}

const statusConfig: Record<ProjectStatus, { label: string; className: string; icon: React.ElementType }> = {
  processing: {
    label: 'Processing',
    className: 'bg-info/20 text-info border-info/30',
    icon: Loader2,
  },
  'needs-review': {
    label: 'Needs Review',
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse',
    icon: AlertCircle,
  },
  ready: {
    label: 'Ready',
    className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: CheckCircle,
  },
  exported: {
    label: 'Exported',
    className: 'bg-primary/20 text-primary border-primary/30',
    icon: FileDown,
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      <Icon className={cn('h-3 w-3', status === 'processing' && 'animate-spin')} />
      {config.label}
    </span>
  )
}

interface ConfidenceBadgeProps {
  confidence: number
  showLabel?: boolean
  size?: 'sm' | 'default'
  className?: string
}

export function ConfidenceBadge({ confidence, showLabel = false, size = 'default', className }: ConfidenceBadgeProps) {
  const level = confidence >= 85 ? 'high' : confidence >= 70 ? 'medium' : 'low'
  
  const levelConfig = {
    high: {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      label: 'High',
    },
    medium: {
      bg: 'bg-amber-500/20',
      text: 'text-amber-400',
      border: 'border-amber-500/40',
      label: 'Medium',
    },
    low: {
      bg: 'bg-red-500/25',
      text: 'text-red-400',
      border: 'border-red-500/50',
      label: 'Low',
    },
  }

  const config = levelConfig[level]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium tabular-nums',
        config.bg,
        config.text,
        config.border,
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
        level === 'low' && 'ring-1 ring-red-500/30',
        className
      )}
    >
      {level === 'low' && <AlertTriangle className="h-2.5 w-2.5" />}
      {confidence.toFixed(0)}%
      {showLabel && <span className="ml-0.5 opacity-80">{config.label}</span>}
    </span>
  )
}

interface NeedsReviewBadgeProps {
  count?: number
  className?: string
}

export function NeedsReviewBadge({ count, className }: NeedsReviewBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-amber-500/50 bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-300',
        className
      )}
    >
      <Eye className="h-3.5 w-3.5" />
      Needs Review
      {count !== undefined && (
        <span className="ml-1 rounded bg-amber-500/30 px-1.5 py-0.5 text-[10px] font-bold">
          {count}
        </span>
      )}
    </span>
  )
}

interface PageReferenceBadgeProps {
  page: number
  className?: string
}

export function PageReferenceBadge({ page, className }: PageReferenceBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground',
        className
      )}
    >
      Pg {page}
    </span>
  )
}

interface SymbolTypeBadgeProps {
  type: string
  className?: string
}

const typeColors: Record<string, string> = {
  light: 'bg-chart-1/20 text-chart-1 border-chart-1/30',
  gpo: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  fan: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
  data: 'bg-chart-4/20 text-chart-4 border-chart-4/30',
  exit: 'bg-chart-5/20 text-chart-5 border-chart-5/30',
}

const typeLabels: Record<string, string> = {
  light: 'Light',
  gpo: 'GPO',
  fan: 'Fan',
  data: 'Data',
  exit: 'Exit',
}

export function SymbolTypeBadge({ type, className }: SymbolTypeBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        typeColors[type] || 'bg-muted text-muted-foreground border-border',
        className
      )}
    >
      {typeLabels[type] || type}
    </span>
  )
}

interface ComingSoonBadgeProps {
  feature?: string
  className?: string
}

export function ComingSoonBadge({ feature, className }: ComingSoonBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded border border-border/60 bg-muted/80 px-2 py-0.5 text-xs font-medium text-muted-foreground',
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary/80" />
      </span>
      Coming Soon
      {feature && <span className="opacity-70">- {feature}</span>}
    </span>
  )
}
