import Image from 'next/image'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import type { TestimonialCarouselBlock } from '@/lib/presets/types'

export function TestimonialCarousel({ block }: { block: TestimonialCarouselBlock }) {
  return (
    <div className="w-full max-w-4xl px-11 sm:px-12">
      <Carousel className="w-full" opts={{ align: 'start', loop: false }}>
        <CarouselContent>
        {block.testimonials.map((testimonial, index) => (
          <CarouselItem key={`${testimonial.name}-${index}`} className="md:basis-1/2">
            <figure className="flex h-full flex-col gap-4 rounded-lg border border-border bg-card p-6 text-left">
              <blockquote className="text-pretty text-foreground">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-3">
                {testimonial.image ? (
                  <Image
                    src={testimonial.image.src}
                    alt={testimonial.name}
                    width={testimonial.image.width}
                    height={testimonial.image.height}
                    sizes="40px"
                    className="size-10 shrink-0 rounded-full object-cover"
                  />
                ) : null}
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{testimonial.name}</span>
                  {testimonial.title ? (
                    <span className="text-sm text-muted-foreground">{testimonial.title}</span>
                  ) : null}
                </span>
              </figcaption>
            </figure>
          </CarouselItem>
        ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  )
}
