import * as React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react-native';
import type { Client } from '@repo/salon-core/types';
import {
  clientFormSchema,
  type ClientFormInput,
  type ClientFormPayload,
} from '@repo/salon-core/forms/client';
import { ApiError, NetworkError } from '@repo/api-client';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { FormChipGroupField, FormPhoneField, FormRootError, FormTextField } from '../ui/form-field';
import { clientsApi } from '../../lib/api';
import { useTheme, useThemeStyles, withAlpha } from '../../theme';

const TAG_OPTIONS = ['VIP', 'حساسیت', 'رنگ خاص', 'نیاز به پیگیری', 'بدقول'] as const;

const emptyValues: ClientFormInput = { name: '', phone: '', notes: '', tags: [] };

function toFormValues(client: Client): ClientFormInput {
  return {
    name: client.name,
    phone: client.phone ?? '',
    notes: client.notes ?? '',
    tags: client.tags?.map((tag) => tag.label) ?? [],
  };
}

export type ClientFormModalProps = {
  open: boolean;
  client: Client | null;
  onClose: () => void;
  onSaved: (client: Client) => void;
};

export function ClientFormModal({ open, client, onClose, onSaved }: ClientFormModalProps) {
  const { theme } = useTheme();
  const isEdit = Boolean(client);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormInput>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: emptyValues,
  });

  React.useEffect(() => {
    if (!open) return;
    reset(client ? toFormValues(client) : emptyValues);
  }, [open, client, reset]);

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
    closeBtn: { padding: t.spacing.sm },
    body: { padding: t.spacing.xl, gap: t.spacing.lg },
    submitText: {
      fontSize: t.fontSize.base,
      color: t.colors.primaryForeground,
      fontFamily: t.fonts.sansSemiBold,
    },
  }));

  const onSubmit = handleSubmit(async (values) => {
    const payload = values as ClientFormPayload;
    try {
      const result = client
        ? await clientsApi.update(client.id, payload)
        : await clientsApi.create(payload);
      onSaved(result.client);
    } catch (err) {
      const message =
        err instanceof ApiError || err instanceof NetworkError
          ? err.message
          : 'ذخیره اطلاعات مشتری انجام نشد.';
      setError('root', { message });
    }
  });

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>{isEdit ? 'ویرایش مشتری' : 'مشتری جدید'}</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
              <X size={theme.sizes.iconSm + 2} color={theme.colors.foreground} strokeWidth={1.8} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <FormTextField
              control={control}
              name="name"
              label="نام"
              placeholder="نام مشتری"
              editable={!isSubmitting}
            />

            <FormPhoneField
              control={control}
              name="phone"
              label="شماره تماس"
              editable={!isSubmitting}
            />

            <FormTextField
              control={control}
              name="notes"
              label="یادداشت (اختیاری)"
              placeholder="یادداشت درباره این مشتری…"
              editable={!isSubmitting}
              multiline
            />

            <FormChipGroupField
              control={control}
              name="tags"
              label="برچسب‌ها"
              options={TAG_OPTIONS}
            />

            <FormRootError message={errors.root?.message} />

            <Button onPress={onSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Spinner color={theme.colors.primaryForeground} />
              ) : (
                <Text style={styles.submitText}>{isEdit ? 'ذخیره تغییرات' : 'افزودن مشتری'}</Text>
              )}
            </Button>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
