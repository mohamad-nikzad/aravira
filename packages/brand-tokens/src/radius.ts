/**
 * Radius tokens. `rem` strings target the web; `px` numbers target RN.
 * Base radius is 0.75rem (12px). Web computes sm/md/lg/xl via calc();
 * RN gets the resolved pixel values.
 */

export const radiusRem = {
  sm: 'calc(0.75rem - 4px)',
  md: 'calc(0.75rem - 2px)',
  lg: '0.75rem',
  xl: 'calc(0.75rem + 4px)',
  base: '0.75rem',
} as const

export const radiusPx = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  base: 12,
} as const

export type RadiusKey = keyof typeof radiusPx
