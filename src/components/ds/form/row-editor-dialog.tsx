'use client'

import { AlertCircleIcon, ArrowDownIcon, ArrowUpIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSectionTheme } from '@/components/ds/section/section-theme-context'

export interface RowEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  position?: { index: number; total: number }
  chips?: string[]
  descriptions?: string[]
  incomplete?: string[]
  onPrev?: () => void
  onNext?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  children: React.ReactNode
}

export function RowEditorDialog({
  open,
  onOpenChange,
  title,
  position,
  chips,
  descriptions,
  incomplete,
  onPrev,
  onNext,
  onMoveUp,
  onMoveDown,
  children,
}: RowEditorDialogProps) {
  const showNav = onPrev !== undefined || onNext !== undefined
  const theme = useSectionTheme()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto" data-theme={theme ?? undefined}>
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle>{title}</DialogTitle>
              {chips?.map((chip) => (
                <span
                  key={chip}
                  className="rounded-sm bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {chip}
                </span>
              ))}
            </div>
            {showNav && position ? (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Previous"
                  disabled={!onPrev}
                  onClick={onPrev}
                >
                  <ChevronLeftIcon />
                </Button>
                <span className="text-xs text-muted-foreground" aria-live="polite">
                  {`${position.index + 1} of ${position.total}`}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Next"
                  disabled={!onNext}
                  onClick={onNext}
                >
                  <ChevronRightIcon />
                </Button>
              </div>
            ) : null}
          </div>
          {descriptions?.length ? (
            <DialogDescription>{descriptions.join(' · ')}</DialogDescription>
          ) : null}
        </DialogHeader>

        {incomplete?.length ? (
          <div
            role="status"
            className="flex items-start gap-2 rounded-md border border-border bg-muted p-3 text-sm text-foreground"
          >
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
            <span>
              <strong>Please complete:</strong> {incomplete.join(', ')}
            </span>
          </div>
        ) : null}

        <div className="flex flex-col gap-4">{children}</div>

        <DialogFooter className="sm:justify-between">
          <div className="flex gap-1">
            {onMoveUp !== undefined || onMoveDown !== undefined ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Move up"
                  disabled={!onMoveUp}
                  onClick={onMoveUp}
                >
                  <ArrowUpIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Move down"
                  disabled={!onMoveDown}
                  onClick={onMoveDown}
                >
                  <ArrowDownIcon />
                </Button>
              </>
            ) : null}
          </div>
          <DialogClose
            render={
              <Button type="button" variant="default">
                Done
              </Button>
            }
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
