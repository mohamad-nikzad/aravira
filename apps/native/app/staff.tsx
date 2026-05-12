import * as React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Clock3,
  ListChecks,
  Phone,
  Plus,
  Search,
  Shield,
  User as UserIcon,
} from 'lucide-react-native';
import type { Service, User } from '@repo/salon-core/types';
import { displayPhone } from '@repo/salon-core/phone';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { useAuth } from '../components/auth-provider';
import { servicesApi, staffApi } from '../lib/api';
import { StaffFormModal } from '../components/staff/staff-form-modal';
import { StaffServicesModal } from '../components/staff/staff-services-modal';
import { StaffScheduleModal } from '../components/staff/staff-schedule-modal';
import { useAsyncResource } from '../lib/hooks/use-async-resource';
import { useTheme, useThemeStyles, withAlpha } from '../theme';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);
}

export default function StaffScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [search, setSearch] = React.useState('');
  const [showCreate, setShowCreate] = React.useState(false);
  const [servicesStaff, setServicesStaff] = React.useState<User | null>(null);
  const [scheduleStaff, setScheduleStaff] = React.useState<User | null>(null);
  const styles = useThemeStyles((t) => ({
    safe: { backgroundColor: t.colors.background, flex: 1 },
    header: {
      borderBottomColor: withAlpha(t.colors.border, 0.5),
      backgroundColor: t.colors.card,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: t.spacing.lg,
      borderBottomWidth: t.sizes.hairline,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.lg,
    },
    headerLeft: {
      minWidth: 0,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.lg,
    },
    backButton: {
      height: t.sizes.avatarMd,
      width: t.sizes.avatarMd,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: t.radius.xl,
    },
    headerTextWrap: { minWidth: 0 },
    headerTitle: {
      color: t.colors.foreground,
      fontSize: t.fontSize.xl,
      fontFamily: t.fonts.sansBold,
    },
    headerSubtitle: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.sm,
      fontFamily: t.fonts.sans,
    },
    searchBar: {
      backgroundColor: t.colors.card,
      paddingHorizontal: t.spacing.xl,
      paddingTop: t.spacing.md,
      paddingBottom: t.spacing.lg,
    },
    searchWrap: { position: 'relative' as const },
    searchIconWrap: {
      position: 'absolute' as const,
      top: '50%' as const,
      right: t.spacing.lg,
      zIndex: 10,
      transform: [{ translateY: -8 }],
    },
    searchInput: {
      height: t.sizes.avatarMd,
      borderWidth: 0,
      paddingRight: t.spacing['4xl'],
    },
    skeletonWrap: {
      gap: t.spacing.lg,
      paddingHorizontal: t.spacing.xl,
      paddingVertical: t.spacing.lg,
    },
    skeletonRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.lg,
    },
    skeletonBody: { flex: 1, gap: t.spacing.md },
    empty: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: t.spacing['5xl'],
    },
    emptyText: { color: t.colors.mutedForeground, fontFamily: t.fonts.sans },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.lg,
      paddingHorizontal: t.spacing.xl,
      paddingVertical: t.spacing.lg,
    },
    rowBorder: {
      borderTopWidth: t.sizes.hairline,
      borderTopColor: withAlpha(t.colors.border, 0.5),
    },
    avatar: { height: t.sizes.avatarMd, width: t.sizes.avatarMd },
    rowBody: { minWidth: 0, flex: 1, gap: t.spacing.xs },
    rowHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.md,
    },
    name: {
      color: t.colors.foreground,
      fontSize: t.fontSize.base,
      fontFamily: t.fonts.sansMedium,
    },
    roleBadge: { paddingHorizontal: t.spacing.sm, paddingVertical: 0 },
    roleBadgeInner: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.xs,
    },
    roleText: {
      color: t.colors.secondaryForeground,
      fontSize: t.fontSize.xs,
      fontFamily: t.fonts.sansMedium,
    },
    phoneRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.xs,
    },
    phoneText: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.sm,
      fontFamily: t.fonts.sans,
    },
    avatarText: {
      color: t.colors.foreground,
      fontSize: t.fontSize.base,
    },
    addBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.xs,
      borderRadius: t.radius.lg,
      backgroundColor: t.colors.primary,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.sm,
    },
    addBtnText: {
      color: t.colors.primaryForeground,
      fontFamily: t.fonts.sansSemiBold,
      fontSize: t.fontSize.sm,
    },
    rowActions: {
      flexDirection: 'row' as const,
      gap: t.spacing.sm,
      marginInlineStart: t.spacing.sm,
    },
    rowActionBtn: {
      width: 36,
      height: 36,
      borderRadius: t.radius.lg,
      borderWidth: t.sizes.hairline,
      borderColor: t.colors.border,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: t.colors.card,
    },
  }));

  const key = user?.role === 'manager' ? 'staff' : null;
  const { data, loading, reload } = useAsyncResource<{ staff: User[] }>(key, (signal) =>
    staffApi.list({ signal })
  );
  const servicesKey = user?.role === 'manager' ? 'staff-services-list' : null;
  const servicesResource = useAsyncResource<{ services: Service[] }>(servicesKey, (signal) =>
    servicesApi.list({ signal })
  );
  const staff = data?.staff ?? [];
  const services = servicesResource.data?.services ?? [];
  const filtered = React.useMemo(
    () =>
      staff.filter(
        (m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search)
      ),
    [staff, search]
  );

  if (!user || user.role !== 'manager') return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            accessibilityLabel="بازگشت به بیشتر"
            onPress={() => router.back()}
            style={styles.backButton}>
            <ArrowRight size={theme.sizes.iconMd} color={theme.colors.primary} strokeWidth={1.8} />
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              پرسنل
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              نقش‌ها، خدمات و ساعت کاری
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowCreate(true)}
          style={styles.addBtn}>
          <Plus size={theme.sizes.iconSm} color={theme.colors.primaryForeground} strokeWidth={2} />
          <Text style={styles.addBtnText}>پرسنل جدید</Text>
        </Pressable>
      </View>

      <View style={styles.searchBar}>
        <View style={styles.searchWrap}>
          <View style={styles.searchIconWrap}>
            <Search size={theme.sizes.iconSm} color={theme.iconColors.muted} strokeWidth={1.6} />
          </View>
          <Input
            placeholder="جستجوی پرسنل…"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
      </View>

      {loading && !data ? (
        <View style={styles.skeletonWrap}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton height={40} width={40} radius={20} />
              <View style={styles.skeletonBody}>
                <Skeleton height={16} width="50%" />
                <Skeleton height={12} width="33%" />
              </View>
            </View>
          ))}
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>پرسنلی یافت نشد</Text>
        </View>
      ) : (
        <ScrollView contentInsetAdjustmentBehavior="automatic">
          <View>
            {filtered.map((member, idx) => (
              <View key={member.id} style={[styles.row, idx > 0 ? styles.rowBorder : null]}>
                <Avatar style={styles.avatar}>
                  <AvatarFallback textStyle={styles.avatarText}>
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>

                <View style={styles.rowBody}>
                  <View style={styles.rowHeader}>
                    <Text style={styles.name} numberOfLines={1}>
                      {member.name}
                    </Text>
                    <Badge variant="secondary" style={styles.roleBadge}>
                      <View style={styles.roleBadgeInner}>
                        {member.role === 'manager' ? (
                          <Shield size={12} color={theme.colors.primary} strokeWidth={1.6} />
                        ) : (
                          <UserIcon size={12} color={theme.colors.primary} strokeWidth={1.6} />
                        )}
                        <Text style={styles.roleText}>
                          {member.role === 'manager' ? 'مدیر' : 'پرسنل'}
                        </Text>
                      </View>
                    </Badge>
                  </View>
                  <View style={styles.phoneRow}>
                    <Phone size={12} color={theme.iconColors.muted} strokeWidth={1.6} />
                    <Text style={styles.phoneText}>{displayPhone(member.phone)}</Text>
                  </View>
                </View>

                {member.role === 'staff' ? (
                  <View style={styles.rowActions}>
                    <Pressable
                      accessibilityLabel={`ساعت کاری ${member.name}`}
                      onPress={() => setScheduleStaff(member)}
                      style={styles.rowActionBtn}>
                      <Clock3
                        size={theme.sizes.iconSm}
                        color={theme.colors.foreground}
                        strokeWidth={1.8}
                      />
                    </Pressable>
                    <Pressable
                      accessibilityLabel={`خدمات ${member.name}`}
                      onPress={() => setServicesStaff(member)}
                      style={styles.rowActionBtn}>
                      <ListChecks
                        size={theme.sizes.iconSm}
                        color={theme.colors.foreground}
                        strokeWidth={1.8}
                      />
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <StaffFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSaved={() => {
          setShowCreate(false);
          reload();
        }}
      />
      <StaffServicesModal
        open={servicesStaff != null}
        staff={servicesStaff}
        services={services}
        onClose={() => setServicesStaff(null)}
        onSaved={() => {
          setServicesStaff(null);
          reload();
        }}
      />
      <StaffScheduleModal
        open={scheduleStaff != null}
        staff={scheduleStaff}
        onClose={() => setScheduleStaff(null)}
        onSaved={() => {
          setScheduleStaff(null);
          reload();
        }}
      />
    </SafeAreaView>
  );
}
