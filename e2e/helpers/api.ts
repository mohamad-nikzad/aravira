/** Match versioned API routes (`/api/v1/...` or legacy `/api/...`). */
export function apiPathPattern(segment: string): RegExp {
  return new RegExp(`/api/(v\\d+/)?${segment}`)
}
