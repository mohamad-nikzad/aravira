import * as React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from '../../theme';
import type { ThemeColorName } from '../../theme/types';

type AppTextVariant = 'body' | 'caption' | 'label' | 'title' | 'headline';
type AppTextWeight = 'regular' | 'medium' | 'semibold' | 'bold';
type AppTextAlign = 'auto' | 'left' | 'right' | 'center';

export type AppTextProps = TextProps & {
  variant?: AppTextVariant;
  color?: ThemeColorName;
  weight?: AppTextWeight;
  align?: AppTextAlign;
};

const variantStyles: Record<AppTextVariant, TextStyle> = {
  body: { fontSize: 14, lineHeight: 22 },
  caption: { fontSize: 12, lineHeight: 18 },
  label: { fontSize: 14, lineHeight: 20 },
  title: { fontSize: 18, lineHeight: 28 },
  headline: { fontSize: 24, lineHeight: 34 },
};

function AppText({
  variant = 'body',
  color = 'foreground',
  weight = 'regular',
  align = 'auto',
  style,
  ...props
}: AppTextProps) {
  const { theme } = useTheme();

  const fontFamily = {
    regular: theme.fonts.sans,
    medium: theme.fonts.sansMedium,
    semibold: theme.fonts.sansSemiBold,
    bold: theme.fonts.sansBold,
  }[weight];

  return (
    <Text
      style={[
        {
          color: theme.colors[color],
          fontFamily,
          writingDirection: 'rtl',
          // Do not pass textAlign: 'auto' — with writingDirection 'rtl' in flex rows, RN can
          // under-measure width and clip Persian tails (e.g. "در" instead of "در انتظار").
          ...(align === 'auto' ? null : { textAlign: align }),
          includeFontPadding: false,
        },
        variantStyles[variant],
        style,
      ]}
      {...props}
    />
  );
}

export { AppText };
