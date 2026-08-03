import { ChartAreaInteractive } from '@/components/chart-area-interactive'

export default function ChartsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <h1 className="text-2xl font-medium tracking-tight text-foreground">Charts</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Visitor totals over time, filterable by range.
            </p>
          </div>
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
        </div>
      </div>
    </div>
  )
}
