import type { AstroGlobal } from 'astro'

export function setSalonShellCache(Astro: AstroGlobal) {
  Astro.response.headers.set(
    'Cache-Control',
    'public, s-maxage=300, stale-while-revalidate=86400',
  )
  Astro.response.headers.set('Vary', 'Accept-Encoding')
}

export function setNoStoreCache(Astro: AstroGlobal) {
  Astro.response.headers.set('Cache-Control', 'private, no-store')
}
