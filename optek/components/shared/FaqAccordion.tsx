'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FaqItem, FaqSection } from '@/content/faq/preguntas-frecuentes'

interface FaqAccordionProps {
  sections: FaqSection[]
}

export function FaqAccordion({ sections }: FaqAccordionProps) {
  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <div key={section.id} id={section.id}>
          <h2 className="text-xl font-bold tracking-tight mb-4">{section.title}</h2>
          <div className="space-y-2">
            {section.items.map((item, i) => (
              <AccordionItem key={i} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function AccordionItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg border bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
        aria-expanded={open}
      >
        <span>{item.question}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
          {item.answer}
        </div>
      )}
    </div>
  )
}
