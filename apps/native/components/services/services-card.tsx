import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Pencil, Plus } from 'lucide-react-native';
import type { Service } from '@repo/salon-core/types';
import { SERVICE_CATEGORIES } from '@repo/salon-core/types';
import { toPersianDigits } from '@repo/salon-core/persian-digits';
import { AppText } from '../ui/app-text';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { servicesApi } from '../../lib/api';
import { useAsyncResource } from '../../lib/hooks/use-async-resource';
import { useTheme, useThemeStyles, withAlpha } from '../../theme';
import { ServiceFormModal } from './service-form-modal';

export function ServicesCard() {
  const { theme } = useTheme();
  const { data, loading, reload } = useAsyncResource<{ services: Service[] }>(
    'services',
    (signal) => servicesApi.list({ includeInactive: true, signal })
  );
  const services = data?.services ?? [];
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingService, setEditingService] = React.useState<Service | null>(null);

  const styles = useThemeStyles((t) => ({
    card: { gap: t.spacing.lg, padding: t.spacing.xl },
    header: {
      alignItems: 'center' as const,
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      padding: 0,
    },
    content: { gap: t.spacing.md, padding: 0 },
    skeletonWrap: { gap: t.spacing.md },
    row: {
      borderColor: withAlpha(t.colors.border, 0.5),
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.lg,
      borderRadius: t.radius.lg,
      borderWidth: t.sizes.hairline,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.md,
    },
    rowBody: { minWidth: 0, flex: 1, gap: t.spacing.xs },
    name: {
      color: t.colors.foreground,
      fontSize: t.fontSize.base,
      fontFamily: t.fonts.sansMedium,
    },
    meta: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.sm,
      fontFamily: t.fonts.sans,
    },
    badge: { paddingHorizontal: t.spacing.sm, paddingVertical: 0 },
    addBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.xs,
      borderRadius: t.radius.md,
      borderWidth: t.sizes.hairline,
      borderColor: withAlpha(t.colors.border, 0.6),
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.sm,
    },
    addBtnText: {
      color: t.colors.foreground,
      fontSize: t.fontSize.sm,
      fontFamily: t.fonts.sansMedium,
    },
    editIcon: { padding: t.spacing.xs },
  }));

  const openCreate = () => {
    setEditingService(null);
    setModalOpen(true);
  };
  const openEdit = (svc: Service) => {
    setEditingService(svc);
    setModalOpen(true);
  };

  return (
    <>
      <Card style={styles.card}>
        <CardHeader style={styles.header}>
          <CardTitle color="mutedForeground" variant="label" weight="medium">
            خدمات
          </CardTitle>
          <Pressable accessibilityRole="button" onPress={openCreate} style={styles.addBtn}>
            <Plus size={theme.sizes.iconSm} color={theme.colors.foreground} strokeWidth={1.8} />
            <Text style={styles.addBtnText}>جدید</Text>
          </Pressable>
        </CardHeader>
        <CardContent style={styles.content}>
          {loading && !data ? (
            <View style={styles.skeletonWrap}>
              <Skeleton height={48} width="100%" radius={12} />
              <Skeleton height={48} width="100%" radius={12} />
            </View>
          ) : services.length === 0 ? (
            <AppText color="mutedForeground">هنوز خدمتی ثبت نشده.</AppText>
          ) : (
            services.map((s) => {
              const category = SERVICE_CATEGORIES[s.category]?.label ?? s.category;
              return (
                <View key={s.id} style={styles.row}>
                  <View style={styles.rowBody}>
                    <Text style={styles.name} numberOfLines={1}>
                      {s.name}
                    </Text>
                    <Text style={styles.meta}>
                      {category} · {toPersianDigits(s.duration)} دقیقه
                    </Text>
                  </View>
                  {!s.active ? (
                    <Badge variant="secondary" style={styles.badge}>
                      غیرفعال
                    </Badge>
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="ویرایش خدمت"
                    onPress={() => openEdit(s)}
                    style={styles.editIcon}>
                    <Pencil
                      size={theme.sizes.iconSm}
                      color={theme.iconColors.muted}
                      strokeWidth={1.6}
                    />
                  </Pressable>
                </View>
              );
            })
          )}
        </CardContent>
      </Card>

      <ServiceFormModal
        open={modalOpen}
        service={editingService}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          setEditingService(null);
          reload();
        }}
      />
    </>
  );
}
