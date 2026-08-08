import { SiteShell } from '@/components/ds/shell/site-shell'
import { loadNavigation } from '@/lib/navigation'

import { AllFieldsDemo } from './all-fields-demo'

export const metadata = {
  title: 'Demo: every form field',
  robots: { index: false, follow: false },
}

export default async function AllFieldsFormPage() {
  return (
    <SiteShell config={await loadNavigation()}>
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-foreground">Every form field</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Maintained fixture route. Every control the form engine implements today: rooms as a
          chip-list combobox whose modal holds a nested Field Array with per-row conditions and a
          picker, and a rooms array carrying one travellers combobox per row.
        </p>
        <div className="mt-10">
          <AllFieldsDemo />
        </div>
      </div>
    </SiteShell>
  )
}
