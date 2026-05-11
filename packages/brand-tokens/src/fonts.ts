/**
 * Font family tokens. The web app loads Vazirmatn via next/font; the native
 * app loads it via expo-font. Native must select a weight-specific family
 * (RN does not resolve CSS font-weight against a generic family name).
 */

export const fontFamily = {
  sans: 'Vazirmatn-Regular',
  sansMedium: 'Vazirmatn-Medium',
  sansSemiBold: 'Vazirmatn-SemiBold',
  sansBold: 'Vazirmatn-Bold',
  sansExtraBold: 'Vazirmatn-ExtraBold',
  mono: 'ui-monospace',
} as const

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const

export type FontFamilyKey = keyof typeof fontFamily
