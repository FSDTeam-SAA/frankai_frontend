'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export interface WizardStep {
  id: string
  label: string
  description?: string
}

interface WizardProgressProps {
  steps: WizardStep[]
  currentStep: number
  className?: string
}

export function WizardProgress({ steps, currentStep, className }: WizardProgressProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isLast = index === steps.length - 1

          return (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                {/* Step indicator */}
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all',
                    isCompleted
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isCurrent
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted-foreground/30 bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {/* Step label */}
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCurrent || isCompleted ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="mt-0.5 hidden text-xs text-muted-foreground sm:block">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
              {/* Connector line */}
              {!isLast && (
                <div className="mx-2 mb-8 h-0.5 flex-1 sm:mx-4">
                  <div
                    className={cn(
                      'h-full transition-all',
                      isCompleted ? 'bg-primary' : 'bg-muted-foreground/30'
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
