import * as React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useThemeStyles } from '../../theme';

export type ModalFooterProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderless?: boolean;
};

export function ModalFooter({ children, style, borderless }: ModalFooterProps) {
  const styles = useThemeStyles((t) => ({
    container: {
      gap: t.spacing.md,
      paddingHorizontal: t.spacing.xl,
      paddingTop: t.spacing.lg,
      paddingBottom: t.spacing.lg,
      borderTopWidth: t.sizes.hairline,
      borderTopColor: t.colors.border,
      backgroundColor: t.colors.background,
    },
    borderless: {
      gap: t.spacing.md,
      paddingHorizontal: t.spacing.xl,
      paddingTop: t.spacing.lg,
    },
  }));

  return <View style={[borderless ? styles.borderless : styles.container, style]}>{children}</View>;
}
