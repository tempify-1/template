import type { SectionDefinition } from '@/lib/presets/types'

import { Section } from './section'

export function Page({ sections = [] }: { sections?: SectionDefinition[] }) {
  const header = sections.filter((section) => section.tag === 'header')
  const footer = sections.filter((section) => section.tag === 'footer')
  const body = sections.filter((section) => section.tag !== 'header' && section.tag !== 'footer')

  return (
    <>
      {header.map((section, index) => (
        <Section key={`header-${index}`} definition={section} />
      ))}
      <main>
        {body.map((section, index) => (
          <Section key={`body-${index}`} definition={section} />
        ))}
      </main>
      {footer.map((section, index) => (
        <Section key={`footer-${index}`} definition={section} />
      ))}
    </>
  )
}
