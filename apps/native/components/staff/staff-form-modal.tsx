import * as React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react-native';
import {
  staffCreateSchema,
  type StaffCreateFormInput,
  type StaffCreateFormPayload,
} from '@repo/salon-core/forms/staff';
import { ApiError, NetworkError } from '@repo/api-client';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { FormPhoneField, FormRootError, FormSelectField, FormTextField } from '../ui/form-field';
import { staffApi } from '../../lib/api';
import { useTheme, useThemeStyles, withAlpha } from '../../theme';

const emptyValues: StaffCreateFormInput = {
  name: '',
  phone: '',
  password: '',
  role: 'staff',
};

const ROLE_OPTIONS = [
  { value: 'staff', label: 'پرسنل' },
  { value: 'manager', label: 'مدیر' },
];

export type StaffFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function StaffFormModal({ open, onClose, onSaved }: StaffFormModalProps) {
  const { theme } = useTheme();
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StaffCreateFormInput>({
    resolver: zodResolver(staffCreateSchema),
    defaultValues: emptyValues,
  });

  React.useEffect(() => {
    if (open) reset(emptyValues);
  }, [open, reset]);

  const styles = useThemeStyles((t) => ({
    backdrop: {
      flex: 1,
      backgroundColor: withAlpha(t.colors.foreground, 0.45),
      justifyContent: 'flex-end' as const,
    },
    sheet: {
      backgroundColor: t.colors.card,
      borderTopLeftRadius: t.radius.xl,
      borderTopRightRadius: t.radius.xl,
      maxHeight: '90%',
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      borderBottomColor: withAlpha(t.colors.border, 0.5),
      borderBottomWidth: t.sizes.hairline,
      paddingHorizontal: t.spacing.xl,
      paddingVertical: t.spacing.lg,
    },
    title: {
      color: t.colors.foreground,
      fontSize: t.fontSize.lg,
      fontFamily: t.fonts.sansBold,
    },
    body: { padding: t.spacing.xl, gap: t.spacing.lg },
    closeBtn: { padding: t.spacing.sm },
    submitText: {
      fontSize: t.fontSize.base,
      color: t.colors.primaryForeground,
      fontFamily: t.fonts.sansSemiBold,
    },
  }));

  const onSubmit = handleSubmit(async (values) => {
    try {
      await staffApi.create(values as StaffCreateFormPayload);
      onSaved();
    } catch (err) {
      const message =
        err instanceof ApiError || err instanceof NetworkError
          ? err.message
          : 'افزودن پرسنل انجام نشد.';
      setError('root', { message });
    }
  });

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>پرسنل جدید</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
              <X size={theme.sizes.iconSm + 2} color={theme.colors.foreground} strokeWidth={1.8} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <FormTextField
              control={control}
              name="name"
              label="نام و نام خانوادگی"
              placeholder="مثال: نرگس کاظمی"
              editable={!isSubmitting}
            />
            <FormPhoneField
              control={control}
              name="phone"
              label="شماره موبایل"
              editable={!isSubmitting}
            />
            <FormTextField
              control={control}
              name="password"
              label="رمز عبور"
              placeholder="رمز ورود به سیستم"
              secureTextEntry
              editable={!isSubmitting}
            />
            <FormSelectField
              control={control}
              name="role"
              label="نقش"
              options={ROLE_OPTIONS}
              title="انتخاب نقش"
              disabled={isSubmitting}
            />

            <FormRootError message={errors.root?.message} />

            <Button onPress={onSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Spinner color={theme.colors.primaryForeground} />
              ) : (
                <Text style={styles.submitText}>افزودن پرسنل</Text>
              )}
            </Button>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
