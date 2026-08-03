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

export type MediaProblem = (reason: string) => void

export function toImage(
  media: number | StoredMedia | null | undefined,
  onProblem?: MediaProblem,
): ImageArgs | undefined {
  if (media === null || media === undefined) return undefined

  if (typeof media === 'number') {
    onProblem?.(`media ${media} was referenced but not populated`)
    return undefined
  }

  const missing = (['url', 'alt', 'width', 'height'] as const).filter((key) => !media[key])
  if (missing.length > 0) {
    onProblem?.(`media document is missing ${missing.join(', ')}`)
    return undefined
  }

  return {
    src: media.url as string,
    alt: media.alt as string,
    width: media.width as number,
    height: media.height as number,
  }
}
