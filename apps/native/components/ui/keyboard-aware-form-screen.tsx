import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeStyles } from '../../theme';

export type KeyboardAwareFormScreenProps = {
  children: React.ReactNode;
  contentContainerStyle?: ViewStyle;
  scrollViewProps?: Omit<ScrollViewProps, 'children' | 'contentContainerStyle'>;
  /** Extra padding at the bottom in addition to safe-area bottom inset. */
  bottomInset?: number;
};

export function KeyboardAwareFormScreen({
  children,
  contentContainerStyle,
  scrollViewProps,
  bottomInset = 24,
}: KeyboardAwareFormScreenProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemeStyles((t) => ({
    safe: { flex: 1, backgroundColor: t.colors.background },
    flex: { flex: 1 },
    content: {
      flexGrow: 1,
      padding: t.spacing['3xl'],
      paddingBottom: t.spacing['3xl'] + bottomInset + insets.bottom,
    },
  }));

  const scroll = (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      showsVerticalScrollIndicator={false}
      {...scrollViewProps}>
      {children}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView behavior="padding" style={styles.flex}>
          {scroll}
        </KeyboardAvoidingView>
      ) : (
        scroll
      )}
    </SafeAreaView>
  );
}
