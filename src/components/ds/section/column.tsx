import type { CSSProperties } from 'react'

import { responsiveVars, type ColumnDefinition } from '@/lib/presets/types'

import { BlockRenderer } from './block-renderer'

export function Column({ definition, index }: { definition: ColumnDefinition; index: number }) {
  const style = {
    ...responsiveVars('span', definition.colSpan),
    '--column-index': index,
  } as CSSProperties

  return (
    <div
      className="ds-column"
      style={style}
      data-justify={definition.justify}
      data-align={definition.verticalAlignment}
    >
      {(definition.blocks ?? []).map((block, blockIndex) => (
        <div
          key={`${block.blockType}-${blockIndex}`}
          className="ds-block"
          data-block={block.blockType}
          style={{ '--block-index': blockIndex } as CSSProperties}
        >
          <BlockRenderer block={block} />
        </div>
      ))}
    </div>
  )
}
