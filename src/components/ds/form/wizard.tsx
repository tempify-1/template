'use client'

import confetti from 'canvas-confetti'
import { CheckIcon } from 'lucide-react'
import * as React from 'react'
import type { FieldErrors, UseFormReturn } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { getAtPath } from '@/lib/forms/paths'
import { inputFields, type FieldConfig, type FormValues } from '@/lib/forms/types'

export interface WizardProps {
  steps: FieldConfig[]
  form: UseFormReturn<FormValues, unknown, FormValues>
  submitLabel: string
  onBeforeNext?: (stepIndex: number, values: FormValues) => Promise<boolean>
  initialStep?: number
  initialCompletedSteps?: number[]
  stepSubmitMode?: boolean
  renderStep: (step: FieldConfig) => React.ReactNode
}

function stepPaths(step: FieldConfig): string[] {
  return inputFields(step.fields ?? []).map((field) => field.name)
}

function collectMessages(errors: FieldErrors, paths: string[]): string[] {
  const messages: string[] = []
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    const entry = node as Record<string, unknown>
    if (typeof entry.message === 'string') messages.push(entry.message)
    for (const [key, value] of Object.entries(entry)) {
      if (key === 'message' || key === 'type' || key === 'ref') continue
      walk(value)
    }
  }
  for (const path of paths) walk(getAtPath(errors, path))
  return [...new Set(messages)]
}

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  if (el.isContentEditable) return true
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT'
}

function celebrate() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } })
}

export function Wizard({
  steps,
  form,
  submitLabel,
  onBeforeNext,
  initialStep = 0,
  initialCompletedSteps = [],
  stepSubmitMode = false,
  renderStep,
}: WizardProps) {
  const [current, setCurrent] = React.useState(() =>
    Math.min(Math.max(initialStep, 0), steps.length - 1),
  )
  const [completed, setCompleted] = React.useState<Set<number>>(
    () => new Set(initialCompletedSteps),
  )
  const [maxReached, setMaxReached] = React.useState(() =>
    Math.max(current, ...initialCompletedSteps, 0),
  )
  const [attempted, setAttempted] = React.useState<Set<number>>(() => new Set())
  const [saving, setSaving] = React.useState(false)
  const [sweptCount, setSweptCount] = React.useState(0)
  const submitCount = form.formState.submitCount

  if (submitCount !== sweptCount) {
    setSweptCount(submitCount)
    const firstInvalid = steps.findIndex((step) =>
      stepPaths(step).some((path) => getAtPath(form.formState.errors, path) !== undefined),
    )
    if (firstInvalid >= 0) {
      setAttempted(new Set(steps.map((_, i) => i)))
      setCurrent(firstInvalid)
      setMaxReached((reached) => Math.max(reached, firstInvalid))
    }
  }

  const goTo = (index: number) => {
    if (index === current) return
    if (!completed.has(index) && index > maxReached) return
    setCurrent(index)
  }

  const next = async () => {
    if (saving) return
    const step = steps[current]
    if (!step) return
    const valid = await form.trigger(stepPaths(step) as never[], { shouldFocus: true })
    setAttempted((prev) => new Set(prev).add(current))
    if (!valid) return
    if (onBeforeNext) {
      setSaving(true)
      const ok = await onBeforeNext(current, form.getValues() as FormValues)
      setSaving(false)
      if (!ok) return
    }
    setCompleted((prev) => new Set(prev).add(current))
    if (step.wizard?.confetti) celebrate()
    if (current < steps.length - 1) {
      setCurrent(current + 1)
      setMaxReached((reached) => Math.max(reached, current + 1))
    }
  }

  const currentStep = steps[current]
  const errors = form.formState.errors
  const summary = attempted.has(current)
    ? collectMessages(errors, currentStep ? stepPaths(currentStep) : [])
    : []
  const isLast = current === steps.length - 1

  return (
    <div
      data-slot="wizard"
      data-current={current}
      data-attempted={[...attempted].join(',')}
      data-completed-steps={[...completed].join(',')}
      data-max-reached={maxReached}
      data-submit-count={submitCount}
      data-error-keys={Object.keys(form.formState.errors).join(',')}
      onKeyDown={(event) => {
        if (!event.shiftKey || isTypingTarget(event.target)) return
        if (event.key === 'ArrowRight' && current < steps.length - 1) {
          event.preventDefault()
          goTo(current + 1)
        }
        if (event.key === 'ArrowLeft' && current > 0) {
          event.preventDefault()
          goTo(current - 1)
        }
      }}
    >
      <div role="tablist" aria-label="Form steps" className="mb-6 flex flex-wrap gap-1">
        {steps.map((step, index) => {
          const hasError = stepPaths(step).some(
            (path) => getAtPath(errors, path) !== undefined,
          )
          const reachable = completed.has(index) || index <= maxReached
          return (
            <button
              key={step.name}
              type="button"
              role="tab"
              aria-selected={index === current}
              aria-current={index === current ? 'step' : undefined}
              disabled={!reachable}
              data-step-index={index}
              data-completed={completed.has(index) || undefined}
              data-error={(attempted.has(index) && hasError) || undefined}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-selected:bg-muted aria-selected:text-foreground data-error:text-destructive"
              onClick={() => goTo(index)}
            >
              {completed.has(index) && !hasError ? <CheckIcon className="size-3.5" /> : null}
              {attempted.has(index) && hasError ? <span aria-hidden>!</span> : null}
              {step.label ?? `Step ${index + 1}`}
            </button>
          )
        })}
      </div>

      {summary.length > 0 ? (
        <div
          role="alert"
          data-slot="step-error-summary"
          className="mb-4 rounded-md border border-border bg-muted p-3 text-sm text-destructive"
        >
          <ul className="list-disc pl-4">
            {summary.map((message, index) => (
              <li key={`${index}-${message}`}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {currentStep ? (
        <fieldset
          disabled={stepSubmitMode && completed.has(current)}
          className="flex min-w-0 flex-col gap-5"
          data-step={currentStep.name}
        >
          {renderStep(currentStep)}
        </fieldset>
      ) : null}

      <div className="mt-6 flex justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={current === 0}
          onClick={() => goTo(current - 1)}
        >
          Back
        </Button>
        {isLast ? (
          <Button key="wizard-submit" type="submit" disabled={form.formState.isSubmitting}>
            {submitLabel}
          </Button>
        ) : (
          <Button key="wizard-next" type="button" onClick={next} disabled={saving}>
            {saving ? 'Saving…' : 'Next'}
          </Button>
        )}
      </div>
    </div>
  )
}
