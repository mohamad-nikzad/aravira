import * as React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useThemeStyles } from '../../theme';

export type AppSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /**
   * Allow dismissal by tapping the backdrop. Defaults to true for simple
   * pickers. Set to false for dirty forms or destructive surfaces.
   */
  dismissOnBackdropPress?: boolean;
  /**
   * Called when the user attempts a soft dismissal (backdrop tap or Android
   * back). Return true to allow close, false to block. If omitted, close is
   * always allowed. Use this to confirm dirty-form dismissal.
   */
  onRequestDismiss?: () => boolean | Promise<boolean>;
  /** Maximum height as a fraction of screen height, defaults to 0.85. */
  maxHeightFraction?: number;
  /** Use KeyboardAvoidingView around the sheet content. Defaults to true. */
  keyboardAvoiding?: boolean;
  /** Hide the top grab handle. */
  hideHandle?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** Accessibility label for the backdrop dismissal area. */
  backdropAccessibilityLabel?: string;
};

const SHEET_BOTTOM_PADDING = Platform.select({
  android: 72,
  default: 24,
});

export function AppSheet({
  visible,
  onClose,
  children,
  dismissOnBackdropPress = true,
  onRequestDismiss,
  maxHeightFraction = 0.85,
  keyboardAvoiding = true,
  hideHandle,
  contentStyle,
  backdropAccessibilityLabel = 'بستن',
}: AppSheetProps) {
  const styles = useThemeStyles((t) => ({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end' as const,
      backgroundColor: t.scrim,
      position: 'relative' as const,
    },
    backdropDismissArea: {
      position: 'absolute' as const,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: 0,
    },
    sheet: {
      borderTopLeftRadius: t.radius['2xl'],
      borderTopRightRadius: t.radius['2xl'],
      backgroundColor: t.colors.card,
      paddingTop: t.spacing.md,
      paddingBottom: SHEET_BOTTOM_PADDING,
      overflow: 'hidden' as const,
      zIndex: 1,
    },
    handleWrap: {
      alignItems: 'center' as const,
      paddingTop: t.spacing.sm,
      paddingBottom: t.spacing.md,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: t.radius.full,
      backgroundColor: t.colors.border,
    },
    contentWrap: {
      flexShrink: 1,
      width: '100%' as const,
    },
  }));

  const requestClose = React.useCallback(async () => {
    if (!onRequestDismiss) {
      onClose();
      return;
    }
    const ok = await onRequestDismiss();
    if (ok) onClose();
  }, [onClose, onRequestDismiss]);

  const handleBackdropPress = () => {
    if (!dismissOnBackdropPress) return;
    void requestClose();
  };

  const sheetContent = (
    <View
      style={[
        styles.sheet,
        {
          maxHeight: `${Math.round(maxHeightFraction * 100)}%`,
        },
        contentStyle,
      ]}>
      {hideHandle ? null : (
        <View style={styles.handleWrap}>
          <View style={styles.handle} />
        </View>
      )}
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.contentWrap}>
          {children}
        </KeyboardAvoidingView>
      ) : (
        children
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={requestClose}
      statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel={backdropAccessibilityLabel}
          onPress={handleBackdropPress}
          style={styles.backdropDismissArea}
        />
        {sheetContent}
      </View>
    </Modal>
  );
}

/**
 * Convenience helper for dirty-form dismissal — returns a promise that resolves
 * true if the user confirms losing changes, false otherwise.
 */
export function confirmDirtyDismiss(
  message = 'تغییرات ذخیره‌نشده دارید. خروج می‌کنید؟'
): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert('خروج بدون ذخیره؟', message, [
      { text: 'ادامه ویرایش', style: 'cancel', onPress: () => resolve(false) },
      { text: 'خروج', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
