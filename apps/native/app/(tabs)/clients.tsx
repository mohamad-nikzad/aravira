import * as React from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Phone, Plus, Search } from 'lucide-react-native';
import type { Client } from '@repo/salon-core/types';
import { displayPhone } from '@repo/salon-core/phone';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { ClientFormModal } from '../../components/clients/client-form-modal';
import { useAuth } from '../../components/auth-provider';
import { clientsApi } from '../../lib/api';
import { useAsyncResource } from '../../lib/hooks/use-async-resource';
import { useTheme, useThemeStyles, withAlpha } from '../../theme';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);
}

export default function ClientsScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [search, setSearch] = React.useState('');
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingClient, setEditingClient] = React.useState<Client | null>(null);

  const styles = useThemeStyles((t) => ({
    safe: { backgroundColor: t.colors.background, flex: 1 },
    header: {
      borderBottomColor: withAlpha(t.colors.border, 0.5),
      backgroundColor: t.colors.card,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: t.spacing.xl,
      borderBottomWidth: t.sizes.hairline,
      paddingHorizontal: t.spacing.xl,
      paddingVertical: t.spacing.lg,
    },
    headerTitle: {
      color: t.colors.foreground,
      fontSize: t.fontSize.xl,
      fontFamily: t.fonts.sansBold,
    },
    addBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.xs,
    },
    addBtnText: {
      color: t.colors.primaryForeground,
      fontSize: t.fontSize.sm,
      fontFamily: t.fonts.sansMedium,
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
      gap: t.spacing.md,
    },
    emptyText: { color: t.colors.mutedForeground, fontFamily: t.fonts.sans },
    emptyLink: { color: t.colors.primary, fontFamily: t.fonts.sansMedium },
    errorBox: {
      marginHorizontal: t.spacing.xl,
      marginVertical: t.spacing.lg,
      padding: t.spacing.lg,
      borderRadius: t.radius.md,
      backgroundColor: withAlpha(t.colors.destructive, 0.08),
    },
    errorText: { color: t.colors.destructive, fontFamily: t.fonts.sans },
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
    rowMain: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.lg,
      minWidth: 0,
    },
    avatar: { height: t.sizes.controlLg, width: t.sizes.controlLg },
    avatarFallback: { backgroundColor: withAlpha(t.colors.primary, 0.1) },
    avatarText: { color: t.colors.primary, fontSize: t.fontSize.base },
    body: { minWidth: 0, flex: 1, gap: t.spacing.xs },
    name: {
      color: t.colors.foreground,
      fontSize: t.fontSize.base,
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
    tagRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: t.spacing.xs,
      paddingTop: t.spacing.xs / 2,
    },
    tagBadge: { paddingHorizontal: t.spacing.sm, paddingVertical: 0 },
    actionBtn: {
      height: t.sizes.avatarMd,
      width: t.sizes.avatarMd,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: t.radius.full,
      backgroundColor: withAlpha(t.colors.primary, 0.08),
    },
  }));

  const key = user?.role === 'manager' ? 'clients' : null;
  const { data, error, loading, reload } = useAsyncResource<{ clients: Client[] }>(
    key,
    (signal) => clientsApi.list({ signal })
  );
  const clients = data?.clients ?? [];
  const filtered = React.useMemo(
    () =>
      clients.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.phone ?? '').includes(search)
      ),
    [clients, search]
  );

  if (!user || user.role !== 'manager') return null;

  const openCreate = () => {
    setEditingClient(null);
    setModalOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setModalOpen(true);
  };

  const callClient = async (phone: string | null | undefined) => {
    if (!phone) return;
    const url = `tel:${phone}`;
    const can = await Linking.canOpenURL(url);
    if (can) {
      await Linking.openURL(url);
    } else {
      Alert.alert('شماره در دسترس نیست');
    }
  };

  const showRowActions = (client: Client) => {
    const buttons: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }> = [
      { text: 'مشاهده پروفایل', onPress: () => router.push(`/clients/${client.id}` as never) },
      { text: 'ویرایش', onPress: () => openEdit(client) },
    ];
    if (client.phone) {
      buttons.push({ text: 'تماس', onPress: () => void callClient(client.phone) });
    }
    buttons.push({ text: 'انصراف', style: 'cancel' });
    Alert.alert(client.name, undefined, buttons);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>مشتریان</Text>
        <Button size="sm" onPress={openCreate} style={styles.addBtn}>
          <Plus size={theme.sizes.iconSm} color={theme.colors.primaryForeground} strokeWidth={1.8} />
          <Text style={styles.addBtnText}>جدید</Text>
        </Button>
      </View>

      <View style={styles.searchBar}>
        <View style={styles.searchWrap}>
          <View style={styles.searchIconWrap}>
            <Search size={theme.sizes.iconSm} color={theme.iconColors.muted} strokeWidth={1.6} />
          </View>
          <Input
            placeholder="جستجوی مشتری…"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>دریافت فهرست مشتریان انجام نشد.</Text>
        </View>
      ) : null}

      {loading && !data ? (
        <View style={styles.skeletonWrap}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton height={44} width={44} radius={22} />
              <View style={styles.skeletonBody}>
                <Skeleton height={16} width="50%" />
                <Skeleton height={12} width="33%" />
              </View>
            </View>
          ))}
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>مشتری‌ای یافت نشد</Text>
          <Pressable accessibilityRole="button" onPress={openCreate}>
            <Text style={styles.emptyLink}>اولین مشتری را اضافه کنید</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentInsetAdjustmentBehavior="automatic">
          <View>
            {filtered.map((client, idx) => (
              <View key={client.id} style={[styles.row, idx > 0 ? styles.rowBorder : null]}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push(`/clients/${client.id}` as never)}
                  onLongPress={() => showRowActions(client)}
                  style={styles.rowMain}>
                  <Avatar style={styles.avatar}>
                    <AvatarFallback style={styles.avatarFallback} textStyle={styles.avatarText}>
                      {getInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>

                  <View style={styles.body}>
                    <Text style={styles.name} numberOfLines={1}>
                      {client.name}
                    </Text>
                    <View style={styles.phoneRow}>
                      <Phone size={12} color={theme.iconColors.muted} strokeWidth={1.6} />
                      <Text style={styles.phoneText}>{displayPhone(client.phone)}</Text>
                    </View>
                    {client.tags && client.tags.length > 0 ? (
                      <View style={styles.tagRow}>
                        {client.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag.id} variant="outline" style={styles.tagBadge}>
                            {tag.label}
                          </Badge>
                        ))}
                      </View>
                    ) : null}
                  </View>
                </Pressable>

                {client.phone ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="تماس"
                    onPress={() => void callClient(client.phone)}
                    style={styles.actionBtn}>
                    <Phone
                      size={theme.sizes.iconSm}
                      color={theme.colors.primary}
                      strokeWidth={1.8}
                    />
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <ClientFormModal
        open={modalOpen}
        client={editingClient}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          setEditingClient(null);
          reload();
        }}
      />
    </SafeAreaView>
  );
}
