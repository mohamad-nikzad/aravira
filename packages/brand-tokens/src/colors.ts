/**
 * Saloora brand color tokens.
 *
 * `oklch` strings are the source of truth for the web app
 * (`packages/ui/styles/globals.css`). `hex` values are sRGB
 * approximations for React Native, which does not yet handle
 * OKLch consistently across runtimes.
 *
 * Keep these two in sync when palette values change.
 */

export type ColorToken = {
  readonly oklch: string
  readonly hex: string
}

const tok = (oklch: string, hex: string): ColorToken => ({ oklch, hex })

export const saloora = {
  plum: tok('oklch(0.414 0.072 359.8)', '#6B3A4A'),
  rose: tok('oklch(0.597 0.126 10)', '#C26878'),
  blush: tok('oklch(0.902 0.033 1.5)', '#ECD3D7'),
  mist: tok('oklch(0.959 0.01 9.5)', '#F8EFF0'),
  paper: tok('oklch(0.961 0.007 53.4)', '#F4EFE7'),
  sage: tok('oklch(0.495 0.017 132.6)', '#767A6F'),
} as const

export const semanticLight = {
  background: saloora.mist,
  foreground: saloora.plum,
  card: tok('oklch(1 0 0)', '#FFFFFF'),
  cardForeground: saloora.plum,
  popover: tok('oklch(1 0 0)', '#FFFFFF'),
  popoverForeground: saloora.plum,
  primary: saloora.plum,
  primaryForeground: tok('oklch(1 0 0)', '#FFFFFF'),
  secondary: saloora.blush,
  secondaryForeground: saloora.plum,
  muted: saloora.paper,
  mutedForeground: saloora.sage,
  accent: saloora.blush,
  accentForeground: saloora.plum,
  destructive: tok('oklch(0.55 0.2 25)', '#C03A2C'),
  destructiveForeground: tok('oklch(1 0 0)', '#FFFFFF'),
  border: tok('oklch(0.893 0.018 0.4)', '#E5D9DB'),
  input: tok('oklch(0.893 0.018 0.4)', '#E5D9DB'),
  ring: saloora.rose,
} as const

export const semanticDark = {
  background: tok('oklch(0.216 0.015 346.8)', '#2A1F25'),
  foreground: saloora.mist,
  card: tok('oklch(0.271 0.029 344.4)', '#392A30'),
  cardForeground: saloora.mist,
  popover: tok('oklch(0.271 0.029 344.4)', '#392A30'),
  popoverForeground: saloora.mist,
  primary: tok('oklch(0.807 0.051 0.8)', '#D8B8BF'),
  primaryForeground: tok('oklch(0.216 0.015 346.8)', '#2A1F25'),
  secondary: tok('oklch(0.456 0.089 4)', '#7E3C49'),
  secondaryForeground: saloora.mist,
  muted: tok('oklch(0.335 0.028 345)', '#4A3942'),
  mutedForeground: tok('oklch(0.807 0.051 0.8)', '#D8B8BF'),
  accent: tok('oklch(0.456 0.089 4)', '#7E3C49'),
  accentForeground: saloora.mist,
  destructive: tok('oklch(0.5 0.18 25)', '#A83025'),
  destructiveForeground: tok('oklch(0.95 0 0)', '#F2F2F2'),
  border: tok('oklch(0.335 0.028 345)', '#4A3942'),
  input: tok('oklch(0.335 0.028 345)', '#4A3942'),
  ring: saloora.rose,
} as const

export type SemanticTokens = typeof semanticLight
