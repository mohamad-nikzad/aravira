import type { TextStyle, ViewStyle } from 'react-native';
import { lightTheme } from '../theme/themes';

type NativeStyle = ViewStyle & TextStyle;
type StyleInput = string | false | null | undefined;

const spacingUnit = 4;

const colorTokens: Record<string, string> = {
  background: lightTheme.colors.background,
  foreground: lightTheme.colors.foreground,
  card: lightTheme.colors.card,
  primary: lightTheme.colors.primary,
  'primary-foreground': lightTheme.colors.primaryForeground,
  secondary: lightTheme.colors.secondary,
  'secondary-foreground': lightTheme.colors.secondaryForeground,
  muted: lightTheme.colors.muted,
  'muted-foreground': lightTheme.colors.mutedForeground,
  accent: lightTheme.colors.accent,
  destructive: lightTheme.colors.destructive,
  border: lightTheme.colors.border,
  input: lightTheme.colors.input,
  white: lightTheme.colors.primaryForeground,
  transparent: 'transparent',
  black: lightTheme.colors.foreground,
};

function tokenColor(value: string): string | undefined {
  const [name, opacity] = value.split('/');
  const color = colorTokens[name];

  if (!color || !opacity || !color.startsWith('#')) {
    return color;
  }

  const alpha = Math.max(0, Math.min(100, Number(opacity))) / 100;
  const hexAlpha = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');

  return `${color}${hexAlpha}`;
}

function parseSpacing(value: string): number | undefined {
  if (value === 'px') return 1;
  const numeric = Number(value.replace('[', '').replace(']', '').replace('%', ''));

  if (Number.isNaN(numeric)) return undefined;
  return numeric * spacingUnit;
}

function applySpacing(style: NativeStyle, key: string, value: string) {
  const amount = parseSpacing(value);
  if (amount === undefined) return;

  const map: Record<string, keyof NativeStyle | (keyof NativeStyle)[]> = {
    p: 'padding',
    px: ['paddingLeft', 'paddingRight'],
    py: ['paddingTop', 'paddingBottom'],
    pt: 'paddingTop',
    pr: 'paddingRight',
    pb: 'paddingBottom',
    pl: 'paddingLeft',
    m: 'margin',
    mx: ['marginLeft', 'marginRight'],
    my: ['marginTop', 'marginBottom'],
    mt: 'marginTop',
    mr: 'marginRight',
    mb: 'marginBottom',
    ml: 'marginLeft',
  };
  const target = map[key];

  if (Array.isArray(target)) {
    target.forEach((prop) => {
      style[prop] = amount as never;
    });
    return;
  }

  if (target) style[target] = amount as never;
}

export function tw(...inputs: StyleInput[]): NativeStyle {
  const tokens = inputs.filter(Boolean).join(' ');
  const style: NativeStyle = {};

  for (const token of tokens.split(/\s+/).filter(Boolean)) {
    if (token === 'flex-1') style.flex = 1;
    else if (token === 'flex-row') style.flexDirection = 'row';
    else if (token === 'flex-wrap') style.flexWrap = 'wrap';
    else if (token === 'items-center') style.alignItems = 'center';
    else if (token === 'items-start') style.alignItems = 'flex-start';
    else if (token === 'justify-center') style.justifyContent = 'center';
    else if (token === 'justify-between') style.justifyContent = 'space-between';
    else if (token === 'justify-end') style.justifyContent = 'flex-end';
    else if (token === 'absolute') style.position = 'absolute';
    else if (token === 'relative') style.position = 'relative';
    else if (token === 'overflow-hidden') style.overflow = 'hidden';
    else if (token === 'text-center') style.textAlign = 'center';
    else if (token === 'text-right') style.textAlign = 'right';
    else if (token === 'font-medium') style.fontWeight = '500';
    else if (token === 'tabular-nums') style.fontVariant = ['tabular-nums'];
    else if (token === 'border') style.borderWidth = 1;
    else if (token === 'border-b') style.borderBottomWidth = 1;
    else if (token === 'border-t') style.borderTopWidth = 1;
    else if (token === 'border-dashed') style.borderStyle = 'dashed';
    else if (token === 'rounded-full') style.borderRadius = 999;
    else if (token === 'rounded-md') style.borderRadius = 8;
    else if (token === 'rounded-lg') style.borderRadius = 10;
    else if (token === 'rounded-xl') style.borderRadius = 14;
    else if (token === 'rounded-2xl' || token === 'rounded-t-2xl') style.borderRadius = 18;
    else if (token.startsWith('gap-')) style.gap = parseSpacing(token.slice(4));
    else if (/^[mp][trblxy]?-/u.test(token)) {
      const [key, value] = token.split('-', 2);
      applySpacing(style, key, value);
    } else if (token.startsWith('bg-')) {
      style.backgroundColor = tokenColor(token.slice(3));
    } else if (token.startsWith('text-[')) {
      style.fontSize = Number(token.slice(6, -1).replace('px', ''));
    } else if (token.startsWith('text-')) {
      const color = tokenColor(token.slice(5));
      if (color) style.color = color;
    } else if (token.startsWith('border-')) {
      const color = tokenColor(token.slice(7));
      if (color) style.borderColor = color;
    } else if (token.startsWith('h-')) {
      style.height = parseSpacing(token.slice(2));
    } else if (token.startsWith('w-')) {
      style.width = parseSpacing(token.slice(2));
    } else if (token.startsWith('min-w-[')) {
      style.minWidth = (
        token.endsWith('%]') ? token.slice(7, -1) : Number(token.slice(7, -1))
      ) as never;
    } else if (token === 'min-w-0') {
      style.minWidth = 0;
    } else if (token.startsWith('top-')) {
      style.top = parseSpacing(token.slice(4));
    } else if (token.startsWith('right-')) {
      style.right = parseSpacing(token.slice(6));
    } else if (token === 'aspect-square') {
      style.aspectRatio = 1;
    }
  }

  return style;
}
