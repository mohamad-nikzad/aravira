import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/today')({
  component: TodayPlaceholder,
})

function TodayPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-xl font-bold">امروز</h1>
      <p className="text-sm text-muted-foreground">به‌زودی در نسخه جدید…</p>
    </div>
  )
}
