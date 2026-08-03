import { ChartAreaInteractive } from '@/components/chart-area-interactive'

export default function ChartsPage() {
  return (
    <>
      <h1 className="px-4 text-2xl font-medium tracking-tight text-foreground lg:px-6">Charts</h1>
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
    </>
  )
}
