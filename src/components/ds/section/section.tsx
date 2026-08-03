import type { CSSProperties } from 'react'

import { responsiveVars, type SectionDefinition } from '@/lib/presets/types'

import { Column } from './column'

export function Section({ definition }: { definition: SectionDefinition }) {
  const Tag = definition.tag ?? 'section'

  const style = {
    ...responsiveVars('cols', definition.columnLayout),
    ...(definition.minHeight ? { minHeight: definition.minHeight } : {}),
  } as CSSProperties

  return (
    <Tag className="ds-section bg-background text-foreground" style={style} data-gutter={definition.gutter}>
      <div className="ds-grid">
        {(definition.columns ?? []).map((column, index) => (
          <Column key={index} definition={column} index={index} />
        ))}
      </div>
    </Tag>
  )
}
