/**
 * Saloora brand color tokens (Saloora v2 palette — soft pink paper).
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

/**
 * Brand identity anchors (theme-invariant, light-theme values). Used for
 * charts, sidebar and decorative marks. Theme-aware surfaces live in the
 * semantic sets below.
 */
export const saloora = {
  plum: tok('oklch(0.414 0.072 359.8)', '#6B3A4A'),
  rose: tok('oklch(0.625 0.115 9.7)', '#C26878'),
  blush: tok('oklch(0.889 0.028 6.7)', '#ECD3D7'),
  mist: tok('oklch(0.959 0.01 9.5)', '#F8EFF0'),
  paper: tok('oklch(0.962 0.013 5.8)', '#FBEFF1'),
  sage: tok('oklch(0.57 0.035 3.4)', '#8A6F75'),
} as const

const white = tok('oklch(1 0 0)', '#FFFFFF')

export const semanticLight = {
  background: saloora.paper,
  foreground: tok('oklch(0.225 0.037 5.8)', '#2A1419'),
  card: white,
  cardForeground: tok('oklch(0.225 0.037 5.8)', '#2A1419'),
  popover: white,
  popoverForeground: tok('oklch(0.225 0.037 5.8)', '#2A1419'),
  primary: saloora.plum,
  primaryForeground: white,
  secondary: saloora.blush,
  secondaryForeground: saloora.plum,
  muted: tok('oklch(0.934 0.02 6)', '#F6E4E7'),
  mutedForeground: saloora.sage,
  accent: saloora.blush,
  accentForeground: saloora.plum,
  destructive: tok('oklch(0.535 0.158 28.7)', '#B73E33'),
  destructiveForeground: white,
  destructiveSoft: tok('oklch(0.906 0.029 28.1)', '#F3D9D5'),
  border: tok('oklch(0.883 0.025 5.2)', '#E8D2D6'),
  input: tok('oklch(0.883 0.025 5.2)', '#E8D2D6'),
  ring: saloora.rose,
  // Saloora v2 design extras (warm rose tints / deep variants)
  plumDeep: tok('oklch(0.333 0.057 359.9)', '#4E2935'),
  blushSoft: tok('oklch(0.934 0.02 6)', '#F6E4E7'),
  paperDeep: tok('oklch(0.915 0.027 6.2)', '#F4DCE0'),
  lineSoft: tok('oklch(0.915 0.023 3.8)', '#F1DDE1'),
  sageDeep: tok('oklch(0.419 0.035 2.8)', '#5E454B'),
  // Accent families (follow-ups / success / info)
  amber: tok('oklch(0.708 0.115 77)', '#C99746'),
  amberSoft: tok('oklch(0.931 0.038 85.3)', '#F4E7CC'),
  amberFg: tok('oklch(0.491 0.085 78.2)', '#7B5A20'),
  mint: tok('oklch(0.683 0.076 159.8)', '#6FA889'),
  mintSoft: tok('oklch(0.924 0.024 159.1)', '#D9EBE0'),
  mintFg: tok('oklch(0.438 0.065 159.3)', '#2F5D45'),
  sky: tok('oklch(0.626 0.066 233.9)', '#5F8FAA'),
  skySoft: tok('oklch(0.925 0.015 235.4)', '#DDE8EF'),
  skyFg: tok('oklch(0.481 0.057 230.1)', '#3A6478'),
} as const

export const semanticDark = {
  background: tok('oklch(0.188 0.018 353.2)', '#1A1014'),
  foreground: tok('oklch(0.934 0.02 6)', '#F6E4E7'),
  card: tok('oklch(0.255 0.02 344.7)', '#2A1F25'),
  cardForeground: tok('oklch(0.934 0.02 6)', '#F6E4E7'),
  popover: tok('oklch(0.255 0.02 344.7)', '#2A1F25'),
  popoverForeground: tok('oklch(0.934 0.02 6)', '#F6E4E7'),
  primary: tok('oklch(0.842 0.036 4.7)', '#E1C2C8'),
  primaryForeground: tok('oklch(0.255 0.02 344.7)', '#2A1F25'),
  secondary: tok('oklch(0.337 0.046 355.5)', '#4A2D38'),
  secondaryForeground: tok('oklch(0.934 0.02 6)', '#F6E4E7'),
  muted: tok('oklch(0.295 0.036 346.8)', '#3A2530'),
  mutedForeground: tok('oklch(0.702 0.014 28.9)', '#A89C9A'),
  accent: tok('oklch(0.337 0.046 355.5)', '#4A2D38'),
  accentForeground: tok('oklch(0.934 0.02 6)', '#F6E4E7'),
  destructive: tok('oklch(0.691 0.129 27.3)', '#E07A6F'),
  destructiveForeground: tok('oklch(0.95 0 0)', '#F2F2F2'),
  destructiveSoft: tok('oklch(0.282 0.051 28.2)', '#3F1F1B'),
  border: tok('oklch(0.366 0.028 345.5)', '#4A3942'),
  input: tok('oklch(0.366 0.028 345.5)', '#4A3942'),
  ring: saloora.rose,
  // Saloora v2 design extras (warm rose tints / deep variants)
  plumDeep: tok('oklch(0.737 0.055 5.1)', '#C99CA5'),
  blushSoft: tok('oklch(0.295 0.036 346.8)', '#3A2530'),
  paperDeep: tok('oklch(0.256 0.021 347.2)', '#2B1F25'),
  lineSoft: tok('oklch(0.301 0.026 345.5)', '#382931'),
  sageDeep: tok('oklch(0.822 0.016 27.3)', '#CFC1BF'),
  // Accent families (follow-ups / success / info)
  amber: tok('oklch(0.787 0.114 83.1)', '#DDB35F'),
  amberSoft: tok('oklch(0.317 0.043 75.2)', '#3F2F18'),
  amberFg: tok('oklch(0.848 0.09 85.1)', '#E8C988'),
  mint: tok('oklch(0.759 0.067 155.6)', '#8FBE9F'),
  mintSoft: tok('oklch(0.325 0.038 156.8)', '#233A2C'),
  mintFg: tok('oklch(0.858 0.052 155.6)', '#B6DBC2'),
  sky: tok('oklch(0.717 0.063 238.3)', '#7FAAC7'),
  skySoft: tok('oklch(0.33 0.036 239.8)', '#243846'),
  skyFg: tok('oklch(0.841 0.032 233.4)', '#B7CFDD'),
} as const

export type SemanticTokens = typeof semanticLight
