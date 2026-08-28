import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/review')({
  component: ReviewPage,
})

function ReviewPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Weekly review</h1>
          <p className="mt-1 text-sm text-zinc-500">Everything that needs attention, in one pass.</p>
        </div>
      </header>

      <div className="card border-emerald-500/20 bg-emerald-500/[0.04] py-16 text-center">
        <p className="text-base font-medium text-emerald-200">All clear</p>
        <p className="mt-1 text-sm text-emerald-300/60">Nothing needs attention right now.</p>
      </div>
    </div>
  )
}
