import Image from 'next/image'

import type { ImageBlock } from '@/lib/presets/types'

export function ImageMedia({ block }: { block: ImageBlock }) {
  return (
    <Image
      src={block.src}
      alt={block.alt}
      width={block.width}
      height={block.height}
      priority={block.priority}
      className="h-auto w-full max-w-5xl rounded-lg"
      sizes="(min-width: 64rem) 64rem, 100vw"
    />
  )
}
