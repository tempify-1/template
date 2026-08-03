'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { AccordionBlock } from '@/lib/presets/types'

export function AccordionList({ block }: { block: AccordionBlock }) {
  return (
    <Accordion className="w-full max-w-3xl text-left">
      {block.items.map((item, index) => (
        <AccordionItem key={`${item.question}-${index}`} value={`item-${index}`}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
