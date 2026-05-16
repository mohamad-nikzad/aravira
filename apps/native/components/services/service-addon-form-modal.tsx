import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, X } from 'lucide-react-native';
import type {
  Service,
  ServiceAddon,
  ServiceAddonScope,
  ServiceCategory,
  ServiceFamily,
} from '@repo/salon-core/types';
import {
  serviceAddonFormSchema,
  type ServiceAddonCreatePayload,
  type ServiceAddonScopeInput,
} from '@repo/salon-core/forms/service';
import { parseLocalizedInt, toPersianDigits } from '@repo/salon-core/persian-digits';
import { ApiError, NetworkError } from '@repo/api-client';
import { AppModal } from '../ui/app-modal';
import { Button } from '../ui/button';
import { FormRootError, FormSwitchField, FormTextField } from '../ui/form-field';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Spinner } from '../ui/spinner';
import { servicesApi } from '../../lib/api';
import { useTheme, useThemeStyles, withAlpha } from '../../theme';

type ServiceAddonFormValues = {
  name: string;
  priceDelta: number;
  durationDelta: number;
  active: boolean;
  sortOrder: number;
  description?: string;
  scopes: ServiceAddonScopeInput[];
};

type Props = {
  open: boolean;
  addon: ServiceAddon | null;
  categories: ServiceCategory[];
  families: ServiceFamily[];
  services: Service[];
  nextSortOrder: number;
  onClose: () => void;
  onSaved: () => void;
};

function scopeKey(scope: ServiceAddonScopeInput) {
  if (scope.type === 'category') return `category:${scope.categoryId}`;
  if (scope.type === 'family') return `family:${scope.familyId}`;
  return `service:${scope.serviceId}`;
}

function existingScopeToInput(scope: ServiceAddonScope): ServiceAddonScopeInput {
  if (scope.type === 'category') return { type: 'category', categoryId: scope.categoryId };
  if (scope.type === 'family') return { type: 'family', familyId: scope.familyId };
  return { type: 'service', serviceId: scope.serviceId };
}

function scopeDisplay(
  scope: ServiceAddonScopeInput,
  categories: ServiceCategory[],
  families: ServiceFamily[],
  services: Service[]
) {
  if (scope.type === 'category') {
    return {
      level: 'دسته',
      label: categories.find((item) => item.id === scope.categoryId)?.name ?? 'دسته',
    };
  }
  if (scope.type === 'family') {
    return {
      level: 'خانواده خدمت',
      label: families.find((item) => item.id === scope.familyId)?.name ?? 'خانواده خدمت',
    };
  }
  return {
    level: 'خدمت',
    label: services.find((item) => item.id === scope.serviceId)?.name ?? 'خدمت',
  };
}

export function ServiceAddonFormModal({
  open,
  addon,
  categories,
  families,
  services,
  nextSortOrder,
  onClose,
  onSaved,
}: Props) {
  const { theme } = useTheme();
  const isEdit = Boolean(addon);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ServiceAddonFormValues>({
    resolver: zodResolver(serviceAddonFormSchema),
    defaultValues: {
      name: '',
      priceDelta: 0,
      durationDelta: 0,
      active: true,
      sortOrder: nextSortOrder,
      description: '',
      scopes: [],
    },
  });

  React.useEffect(() => {
    if (!open) return;
    reset(
      addon
        ? {
            name: addon.name,
            priceDelta: addon.priceDelta,
            durationDelta: addon.durationDelta,
            active: addon.active,
            sortOrder: addon.sortOrder,
            description: addon.description ?? '',
            scopes: addon.scopes.map(existingScopeToInput),
          }
        : {
            name: '',
            priceDelta: 0,
            durationDelta: 0,
            active: true,
            sortOrder: nextSortOrder,
            description: '',
            scopes: [],
          }
    );
  }, [addon, nextSortOrder, open, reset]);

  const priceRaw = watch('priceDelta');
  const durationRaw = watch('durationDelta');
  const sortRaw = watch('sortOrder');
  const scopes = watch('scopes') ?? [];
  const price = typeof priceRaw === 'number' ? priceRaw : Number(priceRaw ?? 0) || 0;
  const duration = typeof durationRaw === 'number' ? durationRaw : Number(durationRaw ?? 0) || 0;
  const sortOrder = typeof sortRaw === 'number' ? sortRaw : Number(sortRaw ?? 0) || 0;
  const scopeKeys = new Set(scopes.map(scopeKey));

  const styles = useThemeStyles((t) => ({
    row: { flexDirection: 'row' as const, gap: t.spacing.lg },
    field: { flex: 1, gap: t.spacing.md },
    error: { color: t.colors.destructive, fontFamily: t.fonts.sans, fontSize: t.fontSize.sm },
    scopeBox: {
      gap: t.spacing.md,
      borderRadius: t.radius.lg,
      borderWidth: t.sizes.hairline,
      borderColor: withAlpha(t.colors.border, 0.65),
      backgroundColor: t.colors.card,
      padding: t.spacing.md,
    },
    scopeTitle: {
      color: t.colors.foreground,
      fontFamily: t.fonts.sansSemiBold,
      fontSize: t.fontSize.base,
    },
    hint: {
      color: t.colors.mutedForeground,
      fontFamily: t.fonts.sans,
      fontSize: t.fontSize.xs,
      lineHeight: 18,
    },
    optionList: { gap: t.spacing.xs },
    option: {
      borderRadius: t.radius.md,
      borderWidth: t.sizes.hairline,
      borderColor: withAlpha(t.colors.border, 0.5),
      backgroundColor: t.colors.background,
      padding: t.spacing.sm,
      gap: t.spacing.xs,
    },
    selected: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.sm,
      borderRadius: t.radius.md,
      borderWidth: t.sizes.hairline,
      borderColor: withAlpha(t.colors.border, 0.5),
      backgroundColor: t.colors.background,
      padding: t.spacing.sm,
    },
    selectedBody: { flex: 1, minWidth: 0 },
    submitText: {
      color: t.colors.primaryForeground,
      fontFamily: t.fonts.sansSemiBold,
      fontSize: t.fontSize.base,
    },
  }));

  const addScope = (scope: ServiceAddonScopeInput) => {
    if (scopeKeys.has(scopeKey(scope))) return;
    setValue('scopes', [...scopes, scope], { shouldDirty: true, shouldValidate: true });
  };

  const removeScope = (scope: ServiceAddonScopeInput) => {
    const key = scopeKey(scope);
    setValue(
      'scopes',
      scopes.filter((item) => scopeKey(item) !== key),
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload = serviceAddonFormSchema.parse(values) as ServiceAddonCreatePayload;
      if (addon) {
        await servicesApi.addons.update(addon.id, payload);
      } else {
        await servicesApi.addons.create(payload);
      }
      onSaved();
    } catch (err) {
      const message =
        err instanceof ApiError || err instanceof NetworkError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'ذخیره افزودنی انجام نشد.';
      setError('root', { message });
    }
  });

  const scopeSections = [
    {
      title: 'دسته',
      items: categories.slice(0, 6).map((item) => ({
        id: item.id,
        label: item.name,
        scope: { type: 'category', categoryId: item.id } as ServiceAddonScopeInput,
      })),
    },
    {
      title: 'خانواده خدمت',
      items: families.slice(0, 8).map((item) => ({
        id: item.id,
        label: item.name,
        scope: { type: 'family', familyId: item.id } as ServiceAddonScopeInput,
      })),
    },
    {
      title: 'خدمت',
      items: services.slice(0, 8).map((item) => ({
        id: item.id,
        label: item.name,
        scope: { type: 'service', serviceId: item.id } as ServiceAddonScopeInput,
      })),
    },
  ];

  return (
    <AppModal
      visible={open}
      onClose={onClose}
      header={{ title: isEdit ? 'ویرایش افزودنی' : 'افزودنی جدید' }}
      footer={
        <Button onPress={onSubmit} disabled={isSubmitting || scopes.length === 0}>
          {isSubmitting ? (
            <Spinner color={theme.colors.primaryForeground} />
          ) : (
            <>
              <Check size={theme.sizes.iconSm} color={theme.colors.primaryForeground} />
              <Text style={styles.submitText}>{isEdit ? 'ذخیره تغییرات' : 'ساخت افزودنی'}</Text>
            </>
          )}
        </Button>
      }>
      <FormTextField
        control={control}
        name="name"
        label="نام افزودنی"
        placeholder="مثلاً فرنچ یا مواد اضافه"
        editable={!isSubmitting}
      />
      <View style={styles.row}>
        <View style={styles.field}>
          <Label>افزایش قیمت (تومان)</Label>
          <Input
            value={toPersianDigits(price)}
            onChangeText={(text) =>
              setValue('priceDelta', Math.max(0, parseLocalizedInt(text, price)))
            }
            keyboardType="number-pad"
            editable={!isSubmitting}
          />
          {errors.priceDelta ? <Text style={styles.error}>{errors.priceDelta.message}</Text> : null}
        </View>
        <View style={styles.field}>
          <Label>افزایش زمان (دقیقه)</Label>
          <Input
            value={toPersianDigits(duration)}
            onChangeText={(text) =>
              setValue('durationDelta', Math.max(0, parseLocalizedInt(text, duration)))
            }
            keyboardType="number-pad"
            editable={!isSubmitting}
          />
          {errors.durationDelta ? (
            <Text style={styles.error}>{errors.durationDelta.message}</Text>
          ) : null}
        </View>
      </View>
      <FormTextField
        control={control}
        name="description"
        label="توضیح کوتاه"
        placeholder="اختیاری"
        editable={!isSubmitting}
      />
      <View style={styles.row}>
        <View style={styles.field}>
          <Label>ترتیب نمایش</Label>
          <Input
            value={toPersianDigits(sortOrder)}
            onChangeText={(text) =>
              setValue('sortOrder', Math.max(0, parseLocalizedInt(text, sortOrder)))
            }
            keyboardType="number-pad"
            editable={!isSubmitting}
          />
        </View>
        <FormSwitchField
          control={control}
          name="active"
          label="فعال"
          description="برای غیرفعال‌سازی حذف سخت انجام نمی‌شود"
          disabled={isSubmitting}
          style={styles.field}
        />
      </View>
      <View style={styles.scopeBox}>
        <View>
          <Text style={styles.scopeTitle}>دامنه نمایش</Text>
          <Text style={styles.hint}>حداقل یک دسته، خانواده خدمت یا خدمت را انتخاب کنید.</Text>
        </View>
        {scopes.map((scope) => {
          const item = scopeDisplay(scope, categories, families, services);
          return (
            <View key={scopeKey(scope)} style={styles.selected}>
              <View style={styles.selectedBody}>
                <Text style={styles.hint}>{item.level}</Text>
                <Text style={styles.scopeTitle} numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => removeScope(scope)}>
                <X size={theme.sizes.iconSm} color={theme.iconColors.muted} />
              </Pressable>
            </View>
          );
        })}
        {scopeSections.map((section) => (
          <View key={section.title} style={styles.optionList}>
            <Text style={styles.hint}>{section.title}</Text>
            {section.items.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                disabled={scopeKeys.has(scopeKey(item.scope))}
                onPress={() => addScope(item.scope)}
                style={[
                  styles.option,
                  scopeKeys.has(scopeKey(item.scope)) && theme.states.disabled,
                ]}>
                <Text style={styles.scopeTitle}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
      <FormRootError message={errors.root?.message} />
    </AppModal>
  );
}
