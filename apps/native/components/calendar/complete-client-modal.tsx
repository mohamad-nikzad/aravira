import * as React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { AppointmentWithDetails, Client } from '@repo/salon-core/types';
import {
  completePlaceholderClientSchema,
  type CompletePlaceholderClientInput,
} from '@repo/salon-core/forms/appointment';
import { ApiError } from '@repo/api-client';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { FormRootError, FormTextField } from '../ui/form-field';
import { appointmentsApi } from '../../lib/api';
import { useTheme, useThemeStyles, withAlpha } from '../../theme';

export type CompleteClientModalProps = {
  open: boolean;
  onClose: () => void;
  appointment: AppointmentWithDetails | null;
  onSuccess: (appointment: AppointmentWithDetails) => void;
};

export function CompleteClientModal({
  open,
  onClose,
  appointment,
  onSuccess,
}: CompleteClientModalProps) {
  const { theme } = useTheme();
  const [duplicate, setDuplicate] = React.useState<Client | null>(null);
  const wasOpenRef = React.useRef(false);

  const form = useForm<CompletePlaceholderClientInput>({
    resolver: zodResolver(completePlaceholderClientSchema),
    defaultValues: { name: '', phone: '', notes: '', reassignToExistingClientId: undefined },
  });
  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const styles = useThemeStyles((t) => ({
    safe: { flex: 1, backgroundColor: t.colors.background },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      borderBottomWidth: t.sizes.hairline,
      borderBottomColor: t.colors.border,
      paddingHorizontal: t.spacing.xl,
      paddingVertical: t.spacing.lg,
    },
    flex1: { flex: 1, width: '100%' },
    title: { fontSize: t.fontSize.lg, color: t.colors.foreground, fontFamily: t.fonts.sansBold },
    subtitle: {
      marginTop: t.spacing.xs / 2,
      fontSize: t.fontSize.sm,
      color: t.colors.mutedForeground,
      fontFamily: t.fonts.sans,
    },
    closeBtn: {
      height: t.sizes.avatarSm,
      width: t.sizes.avatarSm,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: t.radius.full,
      backgroundColor: t.colors.muted,
    },
    body: { padding: t.spacing.xl, gap: t.spacing.lg, paddingBottom: t.spacing['3xl'] },
    duplicateCard: {
      borderRadius: t.radius.lg,
      borderWidth: t.sizes.hairline,
      borderColor: withAlpha(t.colors.destructive, 0.4),
      backgroundColor: withAlpha(t.colors.destructive, 0.06),
      padding: t.spacing.md,
      gap: t.spacing.sm,
    },
    duplicateText: {
      fontSize: t.fontSize.sm,
      color: t.colors.destructive,
      fontFamily: t.fonts.sansSemiBold,
    },
    duplicateSub: { fontSize: t.fontSize.xs, color: t.colors.foreground, fontFamily: t.fonts.sans },
    footer: {
      gap: t.spacing.md,
      borderTopWidth: t.sizes.hairline,
      borderTopColor: t.colors.border,
      backgroundColor: t.colors.background,
      padding: t.spacing.xl,
    },
    submitText: {
      fontSize: t.fontSize.base,
      color: t.colors.primaryForeground,
      fontFamily: t.fonts.sansSemiBold,
    },
    cancelText: {
      fontSize: t.fontSize.base,
      color: t.colors.foreground,
      fontFamily: t.fonts.sansMedium,
    },
  }));

  React.useEffect(() => {
    if (open && !wasOpenRef.current && appointment) {
      reset({
        name: appointment.client.name,
        phone: '',
        notes: appointment.client.notes ?? '',
        reassignToExistingClientId: undefined,
      });
      setDuplicate(null);
    }
    wasOpenRef.current = open;
  }, [open, appointment, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!appointment) return;
    try {
      const result = await appointmentsApi.completePlaceholderClient(appointment.id, {
        ...values,
        notes: values.notes ?? undefined,
      });
      onSuccess(result.appointment);
    } catch (err) {
      if (err instanceof ApiError) {
        setError('root', { message: err.message });
        const payload = err.payload as { existingClient?: Client } | null;
        if (payload?.existingClient) setDuplicate(payload.existingClient);
      } else {
        setError('root', { message: 'تکمیل اطلاعات مشتری انجام نشد' });
      }
    }
  });

  const handleReassign = () => {
    if (!duplicate) return;
    setValue('reassignToExistingClientId', duplicate.id, { shouldDirty: true });
    void onSubmit();
  };

  return (
    <Modal
      visible={open}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet">
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.flex1}>
            <Text style={styles.title}>تکمیل اطلاعات مشتری</Text>
            <Text style={styles.subtitle}>اطلاعات مشتری موقت را تکمیل کنید.</Text>
          </View>
          <Pressable onPress={onClose} accessibilityLabel="بستن" style={styles.closeBtn}>
            <X size={theme.sizes.iconSm} color={theme.colors.foreground} strokeWidth={2} />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <FormTextField control={control} name="name" label="نام" placeholder="نام مشتری" />
            <FormTextField
              control={control}
              name="phone"
              label="شماره تماس"
              placeholder="۰۹..."
              keyboardType="phone-pad"
            />
            <FormTextField
              control={control}
              name="notes"
              label="یادداشت (اختیاری)"
              placeholder="یادداشت"
            />

            {duplicate ? (
              <View style={styles.duplicateCard}>
                <Text style={styles.duplicateText}>
                  مشتری با این شماره از قبل وجود دارد: {duplicate.name}
                </Text>
                <Text style={styles.duplicateSub}>می‌توانید نوبت را به همان مشتری منتقل کنید.</Text>
                <Button variant="outline" onPress={handleReassign} disabled={isSubmitting}>
                  <Text style={styles.cancelText}>انتقال به مشتری موجود</Text>
                </Button>
              </View>
            ) : null}

            <FormRootError message={errors.root?.message} />
          </ScrollView>

          <View style={styles.footer}>
            <Button onPress={onSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Spinner color={theme.colors.primaryForeground} /> : null}
              <Text style={styles.submitText}>
                {isSubmitting ? 'در حال ذخیره…' : 'ذخیره مشتری'}
              </Text>
            </Button>
            <Button variant="outline" onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.cancelText}>انصراف</Text>
            </Button>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
