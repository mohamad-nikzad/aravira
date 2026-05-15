import * as React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PackageCheck, Trash2, X } from 'lucide-react-native';
import type { Service, ServiceCategory, ServiceFamily } from '@repo/salon-core/types';
import { STAFF_COLORS } from '@repo/salon-core/types';
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

const colorOptions = STAFF_COLORS.map((c) => ({ value: c, label: c }));
const kindOptions = [
  { value: 'standard', label: 'معمولی' },
  { value: 'combo', label: 'ترکیبی' },
];

export type ServiceFormModalProps = {
  open: boolean;
  service: Service | null;
  services: Service[];
  categories: ServiceCategory[];
  families: ServiceFamily[];
  defaultFamilyId?: string | null;
  onClose: () => void;
  onSaved: () => void;
};

export function ServiceFormModal({
  open,
  service,
  services,
  categories,
  families,
  defaultFamilyId,
  onClose,
  onSaved,
}: ServiceFormModalProps) {
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
      familyId: defaultFamilyId ?? '',
      category: 'hair',
      duration: 60,
      price: 0,
      color: STAFF_COLORS[0],
      active: true,
      description: '',
      kind: 'standard',
    },
  });

  React.useEffect(() => {
    if (!open) return;
    if (service) {
      reset({
        name: service.name,
        familyId: service.familyId ?? '',
        category: service.category,
        duration: service.duration,
        price: service.price,
        color: service.color,
        active: service.active,
        description: service.description ?? '',
        kind: service.kind ?? 'standard',
      });
    } else {
      reset({
        name: '',
        familyId: defaultFamilyId ?? families[0]?.id ?? '',
        category: 'hair',
        duration: 60,
        price: 0,
        color: STAFF_COLORS[0],
        active: true,
        description: '',
        kind: 'standard',
      });
    }
  }, [defaultFamilyId, families, open, service, reset]);

  const durationRaw = watch('duration');
  const priceRaw = watch('price');
  const kind = watch('kind');
  const active = watch('active');
  const duration = typeof durationRaw === 'number' ? durationRaw : Number(durationRaw ?? 60) || 60;
  const price = typeof priceRaw === 'number' ? priceRaw : Number(priceRaw ?? 0) || 0;
  const [componentIds, setComponentIds] = React.useState<string[]>([]);
  const [loadingComponents, setLoadingComponents] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (!service || service.kind !== 'combo') {
      setComponentIds([]);
      return;
    }
    setLoadingComponents(true);
    servicesApi.comboComponents
      .get(service.id)
      .then((response) =>
        setComponentIds(response.combo.components.map((item) => item.componentServiceId))
      )
      .catch(() => setComponentIds([]))
      .finally(() => setLoadingComponents(false));
  }, [open, service]);

  const componentServices = componentIds
    .map((id) => services.find((item) => item.id === id))
    .filter((item): item is Service => Boolean(item));
  const selectableComponents = services.filter(
    (item) => item.kind !== 'combo' && item.id !== service?.id && !componentIds.includes(item.id)
  );
  const componentTotals = componentServices.reduce(
    (sum, item) => ({ duration: sum.duration + item.duration, price: sum.price + item.price }),
    { duration: 0, price: 0 }
  );

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
    comboBox: {
      gap: t.spacing.md,
      borderRadius: t.radius.lg,
      borderWidth: t.sizes.hairline,
      borderColor: withAlpha(t.colors.border, 0.65),
      backgroundColor: t.colors.background,
      padding: t.spacing.md,
    },
    comboHeader: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      justifyContent: 'space-between' as const,
      gap: t.spacing.md,
    },
    comboTitle: {
      color: t.colors.foreground,
      fontSize: t.fontSize.base,
      fontFamily: t.fonts.sansSemiBold,
    },
    comboHint: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.xs,
      fontFamily: t.fonts.sans,
      lineHeight: 18,
    },
    comboBadge: {
      borderRadius: t.radius.md,
      backgroundColor: withAlpha(t.colors.primary, 0.12),
      paddingHorizontal: t.spacing.sm,
      paddingVertical: t.spacing.xs,
    },
    comboBadgeText: {
      color: t.colors.primary,
      fontSize: t.fontSize.xs,
      fontFamily: t.fonts.sansSemiBold,
    },
    comboTotals: { flexDirection: 'row' as const, gap: t.spacing.sm },
    comboTotal: {
      flex: 1,
      borderRadius: t.radius.md,
      borderWidth: t.sizes.hairline,
      borderColor: withAlpha(t.colors.border, 0.5),
      backgroundColor: t.colors.card,
      padding: t.spacing.sm,
      gap: t.spacing.xs,
    },
    pickerList: { gap: t.spacing.xs },
    pickerItem: {
      borderRadius: t.radius.md,
      borderWidth: t.sizes.hairline,
      borderColor: withAlpha(t.colors.border, 0.5),
      backgroundColor: t.colors.card,
      padding: t.spacing.sm,
    },
    selectedComponent: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.sm,
      borderRadius: t.radius.md,
      borderWidth: t.sizes.hairline,
      borderColor: withAlpha(t.colors.border, 0.5),
      backgroundColor: t.colors.card,
      padding: t.spacing.sm,
    },
    selectedBody: { flex: 1, minWidth: 0 },
    removeButton: { padding: t.spacing.xs },
  }));

  const familyOptions = React.useMemo(
    () =>
      families.map((family) => {
        const categoryName =
          family.categoryName ??
          categories.find((category) => category.id === family.categoryId)?.name;
        return {
          value: family.id,
          label: categoryName ? `${categoryName} / ${family.name}` : family.name,
        };
      }),
    [categories, families]
  );

  const onSubmit = handleSubmit(async (values) => {
    const payload = values as ServiceFormPayload;
    if (!payload.familyId) {
      setError('familyId', { message: 'گروه خدمات را انتخاب کنید.' });
      return;
    }
    try {
      if (service) {
        const shouldStageComboActivation =
          payload.kind === 'combo' && payload.active && componentIds.length > 0;
        await servicesApi.update(service.id, {
          ...payload,
          active: shouldStageComboActivation ? false : payload.active,
        });
        if (payload.kind === 'combo') {
          await servicesApi.comboComponents.update(service.id, {
            componentServiceIds: componentIds,
          });
          if (shouldStageComboActivation) {
            await servicesApi.update(service.id, { active: true });
          }
        }
      } else {
        const shouldStageComboActivation =
          payload.kind === 'combo' && payload.active && componentIds.length > 0;
        const created = await servicesApi.create({
          ...payload,
          active: shouldStageComboActivation ? false : payload.active,
        });
        if (payload.kind === 'combo') {
          await servicesApi.comboComponents.update(created.service.id, {
            componentServiceIds: componentIds,
          });
          if (shouldStageComboActivation) {
            await servicesApi.update(created.service.id, { active: true });
          }
        }
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
              placeholder="مثلاً کاشت با پودر"
              editable={!isSubmitting}
            />

            <FormSelectField
              control={control}
              name="familyId"
              label="گروه خدمات"
              options={familyOptions}
              title="انتخاب گروه"
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

            <FormTextField
              control={control}
              name="description"
              label="توضیح کوتاه"
              placeholder="اختیاری"
              editable={!isSubmitting}
            />

            <FormSelectField
              control={control}
              name="kind"
              label="نوع خدمت"
              options={kindOptions}
              title="انتخاب نوع خدمت"
              disabled={isSubmitting}
            />

            <FormSwitchField
              control={control}
              name="active"
              label="فعال"
              description="خدمات غیرفعال در رزرو نمایش داده نمی‌شوند"
              disabled={isSubmitting}
            />

            {kind === 'combo' ? (
              <View style={styles.comboBox}>
                <View style={styles.comboHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.comboTitle}>ترکیب پکیج</Text>
                    <Text style={styles.comboHint}>
                      مدت و قیمت اصلی از همین فرم ذخیره می‌شود؛ مجموع اجزا فقط مرجع است.
                    </Text>
                  </View>
                  <View style={styles.comboBadge}>
                    <Text style={styles.comboBadgeText}>
                      {componentIds.length === 0
                        ? 'پیش‌نویس ناقص'
                        : `${toPersianDigits(componentIds.length)} جزء`}
                    </Text>
                  </View>
                </View>
                <View style={styles.comboTotals}>
                  <View style={styles.comboTotal}>
                    <Text style={styles.comboHint}>مجموع زمان اجزا</Text>
                    <Text style={styles.comboTitle}>
                      {toPersianDigits(componentTotals.duration)} دقیقه
                    </Text>
                  </View>
                  <View style={styles.comboTotal}>
                    <Text style={styles.comboHint}>مجموع قیمت اجزا</Text>
                    <Text style={styles.comboTitle}>
                      {componentTotals.price > 0
                        ? `${toPersianDigits(componentTotals.price.toLocaleString('fa-IR'))} تومان`
                        : 'قیمت وارد نشده'}
                    </Text>
                  </View>
                </View>
                {componentServices.map((item) => (
                  <View key={item.id} style={styles.selectedComponent}>
                    <PackageCheck size={theme.sizes.iconSm} color={theme.colors.primary} />
                    <View style={styles.selectedBody}>
                      <Text style={styles.comboTitle} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.comboHint}>
                        {toPersianDigits(item.duration)} دقیقه ·{' '}
                        {item.price > 0
                          ? `${toPersianDigits(item.price.toLocaleString('fa-IR'))} تومان`
                          : 'قیمت وارد نشده'}
                        {!item.active ? ' · غیرفعال' : ''}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        setComponentIds((current) => current.filter((id) => id !== item.id))
                      }
                      style={styles.removeButton}>
                      <Trash2 size={theme.sizes.iconSm} color={theme.iconColors.muted} />
                    </Pressable>
                  </View>
                ))}
                <View style={styles.pickerList}>
                  {loadingComponents ? (
                    <Text style={styles.comboHint}>در حال خواندن اجزا...</Text>
                  ) : null}
                  {selectableComponents.slice(0, 8).map((item) => (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      onPress={() => setComponentIds((current) => [...current, item.id])}
                      style={styles.pickerItem}>
                      <Text style={styles.comboTitle}>{item.name}</Text>
                      <Text style={styles.comboHint}>
                        {toPersianDigits(item.duration)} دقیقه ·{' '}
                        {item.price > 0
                          ? `${toPersianDigits(item.price.toLocaleString('fa-IR'))} تومان`
                          : 'قیمت وارد نشده'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {active && componentIds.length === 0 ? (
                  <Text style={styles.error}>
                    پکیج فعال بدون جزء ذخیره نمی‌شود؛ چند خدمت اضافه کنید یا وضعیت را غیرفعال
                    بگذارید.
                  </Text>
                ) : null}
              </View>
            ) : null}

            <FormRootError message={errors.root?.message} />

            <Button
              onPress={onSubmit}
              disabled={isSubmitting || (kind === 'combo' && active && componentIds.length === 0)}>
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
