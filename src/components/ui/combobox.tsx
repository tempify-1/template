'use client'

import * as React from 'react'
import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox'

import { cn } from '@/lib/utils'
import { CheckIcon } from 'lucide-react'

const Combobox = ComboboxPrimitive.Root

const ComboboxPortal = ComboboxPrimitive.Portal

const ComboboxPositioner = ComboboxPrimitive.Positioner

const ComboboxPopup = ComboboxPrimitive.Popup

const ComboboxContent = ComboboxPrimitive.List

const ComboboxInput = React.forwardRef<HTMLInputElement, ComboboxPrimitive.Input.Props>(
  ({ className, ...props }, ref) => (
    <ComboboxPrimitive.Input
      ref={ref}
      data-slot="combobox-input"
      className={cn(
        "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  ),
)
ComboboxInput.displayName = 'ComboboxInput'

const ComboboxTrigger = React.forwardRef<
  HTMLButtonElement,
  ComboboxPrimitive.Trigger.Props
>(({ className, children, ...props }, ref) => (
  <ComboboxPrimitive.Trigger
    ref={ref}
    data-slot="combobox-trigger"
    className={cn(
      "flex h-8 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 data-[open=true]:border-ring data-[open=true]:ring-3 data-[open=true]:ring-ring/50 dark:data-[open=true]:border-ring dark:data-[open=true]:ring-ring/50",
      className,
    )}
    {...props}
  >
    {children}
  </ComboboxPrimitive.Trigger>
))
ComboboxTrigger.displayName = 'ComboboxTrigger'

const ComboboxValue = ComboboxPrimitive.Value

const ComboboxItem = (props: ComboboxPrimitive.Item.Props) => {
  const { className, children, ...rest } = props
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...rest}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <CheckIcon className="pointer-events-none" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  )
}
ComboboxItem.displayName = 'ComboboxItem'

const ComboboxGroup = ComboboxPrimitive.Group

const ComboboxGroupLabel = (props: ComboboxPrimitive.GroupLabel.Props) => {
  const { className, ...rest } = props
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-group-label"
      className={cn('px-1.5 py-1 text-xs text-muted-foreground', className)}
      {...rest}
    />
  )
}
ComboboxGroupLabel.displayName = 'ComboboxGroupLabel'

const ComboboxStatus = React.forwardRef<
  HTMLDivElement,
  ComboboxPrimitive.Status.Props
>(({ className, ...props }, ref) => (
  <ComboboxPrimitive.Status
    ref={ref}
    data-slot="combobox-status"
    className={cn('px-1.5 py-1 text-xs text-muted-foreground', className)}
    {...props}
  />
))
ComboboxStatus.displayName = 'ComboboxStatus'

export {
  Combobox,
  ComboboxContent,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxPortal,
  ComboboxPositioner,
  ComboboxPopup,
  ComboboxStatus,
  ComboboxTrigger,
  ComboboxValue,
}