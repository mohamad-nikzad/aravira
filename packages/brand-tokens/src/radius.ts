/**
 * Radius tokens. `rem` strings target the web; `px` numbers target RN.
 * Base radius is 1.25rem (20px) to match the Saloora v2 card shape. Web
 * computes sm/md/lg/xl via calc(); RN gets the resolved pixel values.
 */

export const radiusRem = {
  sm: 'calc(1.25rem - 4px)',
  md: 'calc(1.25rem - 2px)',
  lg: '1.25rem',
  xl: 'calc(1.25rem + 4px)',
  base: '1.25rem',
} as const

export const radiusPx = {
  sm: 16,
  md: 18,
  lg: 20,
  xl: 24,
  base: 20,
} as const

export type RadiusKey = keyof typeof radiusPx
