import * as React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  View,
  type ModalProps,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStyles } from '../../theme';
import { ModalFooter } from './modal-footer';
import { ModalHeader, type ModalHeaderProps } from './modal-header';

export type AppModalProps = {
  visible: boolean;
  onClose: () => void;
  /**
   * Called when the user attempts a soft dismiss (Android back / iOS gesture).
   * Return true to allow, false to block. Use for dirty-form confirmation.
   */
  onRequestDismiss?: () => boolean | Promise<boolean>;
  presentationStyle?: ModalProps['presentationStyle'];
  animationType?: ModalProps['animationType'];
  header?: ModalHeaderProps | React.ReactElement | null;
  footer?: React.ReactNode;
  /** When true, the body is wrapped in a ScrollView. Defaults to true. */
  scrollable?: boolean;
  scrollViewProps?: ScrollViewProps;
  /** Apply KeyboardAvoidingView for keyboard-heavy forms. Defaults to true. */
  keyboardAvoiding?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

function renderHeader(header: AppModalProps['header'], onClose: () => void): React.ReactNode {
  if (header == null) return null;
  if (React.isValidElement(header)) return header;
  return <ModalHeader onClose={onClose} {...(header as ModalHeaderProps)} />;
}

export function AppModal({
  visible,
  onClose,
  onRequestDismiss,
  presentationStyle = 'pageSheet',
  animationType = 'slide',
  header,
  footer,
  scrollable = true,
  scrollViewProps,
  keyboardAvoiding = true,
  contentStyle,
  bodyStyle,
  children,
}: AppModalProps) {
  const styles = useThemeStyles((t) => ({
    safe: { flex: 1, backgroundColor: t.colors.background },
    flex: { flex: 1, width: '100%' as const },
    scrollContent: {
      padding: t.spacing.xl,
      paddingBottom: t.spacing['3xl'],
      gap: t.spacing.xl,
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

  const body = scrollable ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.scrollContent}
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      {...scrollViewProps}
      style={[styles.flex, scrollViewProps?.style]}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, bodyStyle]}>{children}</View>
  );

  return (
    <Modal
      visible={visible}
      animationType={animationType}
      onRequestClose={requestClose}
      presentationStyle={presentationStyle}>
      <SafeAreaView style={[styles.safe, contentStyle]} edges={['top', 'bottom']}>
        {renderHeader(header, requestClose)}
        {keyboardAvoiding ? (
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {body}
            {footer ? <ModalFooter>{footer}</ModalFooter> : null}
          </KeyboardAvoidingView>
        ) : (
          <>
            {body}
            {footer ? <ModalFooter>{footer}</ModalFooter> : null}
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}
