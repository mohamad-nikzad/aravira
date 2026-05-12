import * as React from 'react';
import { Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { AppointmentWithDetails, Client } from '@repo/salon-core/types';
import {
  completePlaceholderClientSchema,
  type CompletePlaceholderClientInput,
} from '@repo/salon-core/forms/appointment';
import { ApiError } from '@repo/api-client';
import { AppModal } from '../ui/app-modal';
import { confirmDirtyDismiss } from '../ui/app-sheet';
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
  const { control, handleSubmit, reset, setError, setValue, formState } = form;
  const { errors, isSubmitting } = formState;

  const styles = useThemeStyles((t) => ({
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

  const requestDismiss = React.useCallback(async () => {
    if (isSubmitting) return false;
    if (!formState.isDirty) return true;
    return confirmDirtyDismiss();
  }, [formState.isDirty, isSubmitting]);

  return (
    <AppModal
      visible={open}
      onClose={onClose}
      onRequestDismiss={requestDismiss}
      header={{
        title: 'تکمیل اطلاعات مشتری',
        subtitle: 'اطلاعات مشتری موقت را تکمیل کنید.',
      }}
      footer={
        <>
          <Button onPress={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Spinner color={theme.colors.primaryForeground} /> : null}
            <Text style={styles.submitText}>{isSubmitting ? 'در حال ذخیره…' : 'ذخیره مشتری'}</Text>
          </Button>
          <Button variant="outline" onPress={onClose} disabled={isSubmitting}>
            <Text style={styles.cancelText}>انصراف</Text>
          </Button>
        </>
      }>
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
    </AppModal>
  );
}
