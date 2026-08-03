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
    <div className="w-full max-w-4xl sm:px-12">
      <Carousel
        className="w-full"
        opts={{ align: 'start', loop: true }}
        aria-label="Customer testimonials"
      >
        <CarouselContent>
          {block.testimonials.map((testimonial, index) => (
            <CarouselItem
              key={`${testimonial.name}-${index}`}
              className="md:basis-1/2"
              aria-label={`${index + 1} of ${block.testimonials.length}`}
            >
              <figure className="flex h-full flex-col gap-4 rounded-lg border border-border bg-card p-6 text-left">
                <blockquote className="text-pretty text-foreground">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-auto flex items-center gap-3">
                  {testimonial.image ? (
                    <Image
                      src={testimonial.image.src}
                      alt={testimonial.image.alt}
                      width={testimonial.image.width}
                      height={testimonial.image.height}
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
        <CarouselPrevious className="left-1 sm:-left-12" />
        <CarouselNext className="right-1 sm:-right-12" />
      </Carousel>
    </div>
  )
}
