export function PrimaryCell({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className="min-w-0">
      <div className="truncate font-medium">{title || '-'}</div>
      {subtitle ? (
        <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
      ) : null}
    </div>
  )
}
