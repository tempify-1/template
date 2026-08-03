import type { CSSProperties } from 'react'

import { responsiveVars, type SectionDefinition } from '@/lib/presets/types'

import { Column } from './column'

export function Section({ definition }: { definition: SectionDefinition }) {
  const Tag = definition.tag ?? 'section'
  const theme = definition.theme && definition.theme !== 'default' ? definition.theme : undefined

  const style = {
    ...responsiveVars('cols', definition.columnLayout),
    ...(definition.minHeight ? { minHeight: definition.minHeight } : {}),
  } as CSSProperties

  return (
    <Tag
      className="ds-section bg-background text-foreground"
      style={style}
      data-theme={theme}
      data-invert={definition.invert ? '' : undefined}
      data-gutter={definition.gutter}
      data-scroll-animate={definition.scrollAnimate === false ? undefined : ''}
    >
      <div className="ds-grid">
        {(definition.columns ?? []).map((column, index) => (
          <Column key={index} definition={column} index={index} />
        ))}
      </div>
    </Tag>
  )
}
