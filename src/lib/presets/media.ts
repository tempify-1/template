import { z } from 'zod'

export const imageArgs = z
  .object({
    src: z.string().min(1),
    alt: z.string().min(1),
    width: z.number(),
    height: z.number(),
  })
  .meta({ payload: { type: 'upload', relationTo: 'media' } })

export type ImageArgs = z.infer<typeof imageArgs>

export interface StoredMedia {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
}

export function toImage(media: number | StoredMedia | null | undefined): ImageArgs | undefined {
  if (media === null || media === undefined || typeof media === 'number') return undefined
  if (!media.url || !media.alt || !media.width || !media.height) return undefined

  return { src: media.url, alt: media.alt, width: media.width, height: media.height }
}
