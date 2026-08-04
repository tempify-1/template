import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ExitPreview() {
  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <Link
        href="/next/exit-preview"
        prefetch={false}
        className={cn(buttonVariants({ size: 'sm' }), 'shadow-lg')}
      >
        Previewing a draft — exit preview
      </Link>
    </div>
  )
}
