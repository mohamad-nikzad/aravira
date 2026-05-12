import * as React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react-native';
import type { Service } from '@repo/salon-core/types';
import { SERVICE_CATEGORIES, STAFF_COLORS } from '@repo/salon-core/types';
import {
  serviceFormSchema,
  type ServiceFormInput,
  type ServiceFormPayload,
} from '@repo/salon-core/forms/service';
import { parseLocalizedInt, toPersianDigits } from '@repo/salon-core/persian-digits';
import { ApiError, NetworkError } from '@repo/api-client';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Spinner } from '../ui/spinner';
import { FormRootError, FormSelectField, FormSwitchField, FormTextField } from '../ui/form-field';
import { servicesApi } from '../../lib/api';
import { useTheme, useThemeStyles, withAlpha } from '../../theme';

const categoryOptions = (
  Object.keys(SERVICE_CATEGORIES) as (keyof typeof SERVICE_CATEGORIES)[]
).map((key) => ({ value: key, label: SERVICE_CATEGORIES[key].label }));

const colorOptions = STAFF_COLORS.map((c) => ({ value: c, label: c }));

export type ServiceFormModalProps = {
  open: boolean;
  service: Service | null;
  onClose: () => void;
  onSaved: () => void;
};

export function ServiceFormModal({ open, service, onClose, onSaved }: ServiceFormModalProps) {
  const { theme } = useTheme();
  const isEdit = Boolean(service);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormInput>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: '',
      category: 'hair',
      duration: 60,
      price: 0,
      color: STAFF_COLORS[0],
      active: true,
    },
  });

  React.useEffect(() => {
    if (!open) return;
    if (service) {
      reset({
        name: service.name,
        category: service.category,
        duration: service.duration,
        price: service.price,
        color: service.color,
        active: service.active,
      });
    } else {
      reset({
        name: '',
        category: 'hair',
        duration: 60,
        price: 0,
        color: STAFF_COLORS[0],
        active: true,
      });
    }
  }, [open, service, reset]);

  const durationRaw = watch('duration');
  const priceRaw = watch('price');
  const duration = typeof durationRaw === 'number' ? durationRaw : Number(durationRaw ?? 60) || 60;
  const price = typeof priceRaw === 'number' ? priceRaw : Number(priceRaw ?? 0) || 0;

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
    row: { flexDirection: 'row' as const, gap: t.spacing.lg },
    field: { flex: 1, gap: t.spacing.md },
    submitText: {
      fontSize: t.fontSize.base,
      color: t.colors.primaryForeground,
      fontFamily: t.fonts.sansSemiBold,
    },
    error: {
      fontSize: t.fontSize.sm,
      color: t.colors.destructive,
      fontFamily: t.fonts.sans,
    },
  }));

  const onSubmit = handleSubmit(async (values) => {
    const payload = values as ServiceFormPayload;
    try {
      if (service) {
        await servicesApi.update(service.id, payload);
      } else {
        await servicesApi.create(payload);
      }
      onSaved();
    } catch (err) {
      const message =
        err instanceof ApiError || err instanceof NetworkError
          ? err.message
          : 'ذخیره خدمت انجام نشد.';
      setError('root', { message });
    }
  });

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>{isEdit ? 'ویرایش خدمت' : 'خدمت جدید'}</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
              <X size={theme.sizes.iconSm + 2} color={theme.colors.foreground} strokeWidth={1.8} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <FormTextField
              control={control}
              name="name"
              label="نام خدمت"
              placeholder="مثلاً کوتاهی مو"
              editable={!isSubmitting}
            />

            <FormSelectField
              control={control}
              name="category"
              label="دسته‌بندی"
              options={categoryOptions}
              title="انتخاب دسته"
              disabled={isSubmitting}
            />

            <View style={styles.row}>
              <View style={styles.field}>
                <Label>مدت زمان (دقیقه)</Label>
                <Input
                  value={toPersianDigits(duration)}
                  onChangeText={(text) =>
                    setValue('duration', Math.max(5, parseLocalizedInt(text, duration)))
                  }
                  keyboardType="number-pad"
                  editable={!isSubmitting}
                />
                {errors.duration ? (
                  <Text style={styles.error}>{errors.duration.message}</Text>
                ) : null}
              </View>
              <View style={styles.field}>
                <Label>قیمت (تومان)</Label>
                <Input
                  value={toPersianDigits(price)}
                  onChangeText={(text) =>
                    setValue('price', Math.max(0, parseLocalizedInt(text, price)))
                  }
                  keyboardType="number-pad"
                  editable={!isSubmitting}
                />
                {errors.price ? <Text style={styles.error}>{errors.price.message}</Text> : null}
              </View>
            </View>

            <FormSelectField
              control={control}
              name="color"
              label="رنگ تقویم"
              options={colorOptions}
              title="انتخاب رنگ"
              disabled={isSubmitting}
            />

            <FormSwitchField
              control={control}
              name="active"
              label="فعال"
              description="خدمات غیرفعال در رزرو نمایش داده نمی‌شوند"
              disabled={isSubmitting}
            />

            <FormRootError message={errors.root?.message} />

            <Button onPress={onSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <Spinner color={theme.colors.primaryForeground} />
              ) : (
                <Text style={styles.submitText}>{isEdit ? 'ذخیره تغییرات' : 'ساخت خدمت'}</Text>
              )}
            </Button>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
