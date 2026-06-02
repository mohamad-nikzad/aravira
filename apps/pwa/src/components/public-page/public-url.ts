import { env } from '#/env'

export function monogramFor(name: string): string {
  return Array.from(name.trim())[0] ?? '?'
}

export function publicUrlFor(slug: string): string {
  if (env.webUrl) {
    return `${env.webUrl.replace(/\/+$/, '')}/salons/${slug}`
  }
  if (typeof window === 'undefined') return `/salons/${slug}`
  const origin = window.location.origin.replace(/\/\/app\./, '//')
  return `${origin}/salons/${slug}`
}

export function publicSlugPrefix(): string {
  if (env.webUrl) {
    return `${env.webUrl.replace(/\/+$/, '')}/salons/`
  }
  if (typeof window === 'undefined') return '/salons/'
  const origin = window.location.origin.replace(/\/\/app\./, '//')
  return `${origin}/salons/`
}
