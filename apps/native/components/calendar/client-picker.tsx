import * as React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Check, ChevronDown, Plus, Search, UserPlus, X } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@repo/api-client';
import type { Client } from '@repo/salon-core/types';
import { displayPhone, normalizePhone } from '@repo/salon-core/phone';
import { clientFormSchema, type ClientFormInput } from '@repo/salon-core/forms/client';
import { AppSheet, confirmDirtyDismiss } from '../ui/app-sheet';
import { ModalHeader } from '../ui/modal-header';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { clientsApi } from '../../lib/api';
import { useTheme, useThemeStyles, withAlpha } from '../../theme';
import { AppText } from '../ui';

type Mode = 'search' | 'add';

export type ClientPickerProps = {
  clients: Client[];
  value: string;
  onChange: (clientId: string) => void;
  onClientCreated?: (client: Client) => void;
};

export function ClientPicker({ clients, value, onChange, onClientCreated }: ClientPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>('search');
  const [query, setQuery] = React.useState('');
  const {
    handleSubmit,
    reset: resetForm,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormInput>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: { name: '', phone: '', notes: '', tags: [] },
  });
  const { theme } = useTheme();
  const styles = useThemeStyles((t) => ({
    trigger: {
      height: t.sizes.controlLg,
      width: '100%' as const,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      borderRadius: t.radius.md,
      borderWidth: t.sizes.hairline,
      borderColor: t.colors.input,
      backgroundColor: t.colors.background,
      paddingHorizontal: t.spacing.lg,
    },
    triggerText: { flex: 1, fontSize: t.fontSize.base },
    searchBar: {
      marginHorizontal: t.spacing.xl,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.md,
      borderRadius: t.radius.md,
      borderWidth: t.sizes.hairline,
      borderColor: t.colors.border,
      backgroundColor: t.colors.background,
      paddingHorizontal: t.spacing.lg,
    },
    searchInput: {
      flex: 1,
      paddingVertical: t.spacing.md,
      fontSize: t.fontSize.base,
      color: t.colors.foreground,
      fontFamily: t.fonts.sans,
      includeFontPadding: false,
    },
    list: { marginTop: t.spacing.md, maxHeight: 320 },
    listInner: { paddingHorizontal: t.spacing.md },
    clientRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.lg,
      borderRadius: t.radius.md,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.lg,
    },
    clientRowSelected: { backgroundColor: withAlpha(t.colors.primary, 0.1) },
    clientName: {
      fontSize: t.fontSize.base,
      color: t.colors.foreground,
      fontFamily: t.fonts.sansSemiBold,
    },
    clientPhone: {
      marginTop: t.spacing.xs / 2,
      fontSize: t.fontSize.sm,
      color: t.colors.mutedForeground,
      fontFamily: t.fonts.sans,
      writingDirection: 'ltr' as const,
    },
    flex1: { flex: 1 },
    emptyWrap: { paddingHorizontal: t.spacing.lg, paddingVertical: t.spacing['3xl'] },
    emptyText: {
      textAlign: 'center' as const,
      fontSize: t.fontSize.base,
      color: t.colors.mutedForeground,
      fontFamily: t.fonts.sans,
    },
    addSection: {
      marginTop: t.spacing.md,
      borderTopWidth: t.sizes.hairline,
      borderTopColor: t.colors.border,
      paddingHorizontal: t.spacing.md,
      paddingTop: t.spacing.md,
    },
    addRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.lg,
      borderRadius: t.radius.md,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.lg,
    },
    addIconWrap: {
      height: t.sizes.avatarSm,
      width: t.sizes.avatarSm,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: t.radius.md,
      backgroundColor: withAlpha(t.colors.primary, 0.1),
    },
    addTextPrimary: {
      flex: 1,
      fontSize: t.fontSize.base,
      color: t.colors.primary,
      fontFamily: t.fonts.sansSemiBold,
    },
    addTextMuted: {
      flex: 1,
      fontSize: t.fontSize.base,
      color: t.colors.mutedForeground,
      fontFamily: t.fonts.sansMedium,
    },
    addBody: { paddingHorizontal: t.spacing.xl, gap: t.spacing.lg },
    addHeaderRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
    backText: {
      fontSize: t.fontSize.sm,
      color: t.colors.mutedForeground,
      fontFamily: t.fonts.sansMedium,
    },
    addTitle: {
      fontSize: t.fontSize.base,
      color: t.colors.foreground,
      fontFamily: t.fonts.sansSemiBold,
    },
    errorText: {
      fontSize: t.fontSize.sm,
      color: t.colors.destructive,
      fontFamily: t.fonts.sansMedium,
    },
    submitText: {
      fontSize: t.fontSize.base,
      color: t.colors.primaryForeground,
      fontFamily: t.fonts.sansSemiBold,
    },
    fullWidth: { width: '100%' as const },
  }));

  const selectedClient = clients.find((c) => c.id === value);
  const newName = watch('name') ?? '';
  const newPhone = watch('phone') ?? '';

  const filtered = React.useMemo(() => {
    const q = query.trim();
    if (!q) return clients;
    const phoneQuery = normalizePhone(q);
    const lower = q.toLowerCase();
    return clients.filter(
      (c) => c.name.toLowerCase().includes(lower) || (c.phone ?? '').includes(phoneQuery)
    );
  }, [clients, query]);

  const hasExactMatch = React.useMemo(() => {
    const q = query.trim();
    if (!q) return true;
    const lower = q.toLowerCase();
    const phoneQuery = normalizePhone(q);
    return clients.some((c) => c.name.toLowerCase() === lower || c.phone === phoneQuery);
  }, [clients, query]);

  const reset = () => {
    setMode('search');
    setQuery('');
    resetForm({ name: '', phone: '', notes: '', tags: [] });
  };

  const handleOpen = () => {
    reset();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const handleSelect = (id: string) => {
    onChange(id);
    handleClose();
  };

  const startAdding = () => {
    const q = query.trim();
    const looksLikePhone = /^[\d۰-۹٠-٩\s+()-]{4,}$/.test(q);
    resetForm({
      name: looksLikePhone ? '' : q,
      phone: looksLikePhone ? normalizePhone(q) : '',
      notes: '',
      tags: [],
    });
    setMode('add');
  };

  const handleSaveNew = handleSubmit(async (values) => {
    try {
      const { client } = await clientsApi.create({ ...values, tags: values.tags ?? [] });
      onClientCreated?.(client);
      onChange(client.id);
      handleClose();
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'خطایی رخ داد';
      setError('root', { message: msg });
    }
  });

  const triggerLabel = selectedClient
    ? `${selectedClient.name}${
        selectedClient.isPlaceholder
          ? ' · اطلاعات ناقص'
          : ` · ${displayPhone(selectedClient.phone)}`
      }`
    : 'انتخاب مشتری…';

  const isFormDirty = React.useCallback(
    () => mode === 'add' && Boolean(newName.trim() || newPhone.trim()),
    [mode, newName, newPhone]
  );

  const requestClose = React.useCallback(async (): Promise<boolean> => {
    if (!isFormDirty()) return true;
    return confirmDirtyDismiss();
  }, [isFormDirty]);

  const handleCloseRequest = async () => {
    const ok = await requestClose();
    if (ok) handleClose();
  };

  return (
    <>
      <Pressable
        onPress={handleOpen}
        accessibilityRole="button"
        accessibilityLabel="انتخاب مشتری"
        style={styles.trigger}>
        <AppText
          weight="medium"
          color={selectedClient ? 'foreground' : 'mutedForeground'}
          style={styles.triggerText}
          numberOfLines={1}>
          {triggerLabel}
        </AppText>
        <ChevronDown size={theme.sizes.iconSm} color={theme.iconColors.muted} strokeWidth={1.6} />
      </Pressable>

      <AppSheet
        visible={open}
        onClose={handleClose}
        onRequestDismiss={requestClose}
        dismissOnBackdropPress
        hideHandle>
        <ModalHeader
          title={mode === 'add' ? 'مشتری جدید' : 'انتخاب مشتری'}
          onClose={() => void handleCloseRequest()}
          borderless
        />

        {mode === 'search' ? (
          <>
            <View style={styles.searchBar}>
              <Search size={theme.sizes.iconSm} color={theme.iconColors.muted} strokeWidth={1.6} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="جستجو نام یا شماره…"
                placeholderTextColor={theme.colors.mutedForeground}
                autoFocus
                style={styles.searchInput}
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <X
                    size={theme.sizes.iconSm - 2}
                    color={theme.iconColors.muted}
                    strokeWidth={1.8}
                  />
                </Pressable>
              ) : null}
            </View>

            <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
              <View style={styles.listInner}>
                {filtered.length > 0 ? (
                  filtered.map((client) => {
                    const isSelected = client.id === value;
                    return (
                      <Pressable
                        key={client.id}
                        onPress={() => handleSelect(client.id)}
                        style={[styles.clientRow, isSelected ? styles.clientRowSelected : null]}>
                        <View style={styles.flex1}>
                          <Text style={styles.clientName} numberOfLines={1}>
                            {client.name}
                          </Text>
                          <Text style={styles.clientPhone}>
                            {client.isPlaceholder ? 'اطلاعات ناقص' : displayPhone(client.phone)}
                          </Text>
                        </View>
                        {isSelected ? (
                          <Check
                            size={theme.sizes.iconSm}
                            color={theme.colors.primary}
                            strokeWidth={2}
                          />
                        ) : null}
                      </Pressable>
                    );
                  })
                ) : (
                  <View style={styles.emptyWrap}>
                    <Text style={styles.emptyText}>مشتری‌ای یافت نشد</Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.addSection}>
              {!hasExactMatch && query.trim() ? (
                <Pressable onPress={startAdding} style={styles.addRow}>
                  <View style={styles.addIconWrap}>
                    <UserPlus
                      size={theme.sizes.iconSm - 2}
                      color={theme.colors.primary}
                      strokeWidth={1.8}
                    />
                  </View>
                  <Text style={styles.addTextPrimary} numberOfLines={1}>
                    افزودن «{query.trim()}» به عنوان مشتری جدید
                  </Text>
                </Pressable>
              ) : (
                <Pressable onPress={startAdding} style={styles.addRow}>
                  <Plus
                    size={theme.sizes.iconSm}
                    color={theme.iconColors.muted}
                    strokeWidth={1.8}
                  />
                  <Text style={styles.addTextMuted}>مشتری جدید</Text>
                </Pressable>
              )}
            </View>
          </>
        ) : (
          <View style={styles.addBody}>
            <View style={styles.addHeaderRow}>
              <Pressable
                onPress={() => {
                  setMode('search');
                  resetForm({ name: '', phone: '', notes: '', tags: [] });
                }}>
                <Text style={styles.backText}>بازگشت</Text>
              </Pressable>
              <Text style={styles.addTitle}>ثبت مشتری جدید</Text>
            </View>

            <Input
              value={newName}
              onChangeText={(text) => setValue('name', text)}
              placeholder="نام مشتری"
            />

            <Input
              value={displayPhone(newPhone)}
              onChangeText={(text) => setValue('phone', text)}
              placeholder="شماره تماس (۰۹…)"
              keyboardType="phone-pad"
              style={{ textAlign: 'left', writingDirection: 'ltr' }}
            />

            {errors.name ? <Text style={styles.errorText}>{errors.name.message}</Text> : null}
            {errors.phone ? <Text style={styles.errorText}>{errors.phone.message}</Text> : null}
            {errors.root ? <Text style={styles.errorText}>{errors.root.message}</Text> : null}

            <Button
              disabled={isSubmitting || !newName.trim() || !newPhone.trim()}
              onPress={() => void handleSaveNew()}
              style={styles.fullWidth}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color={theme.colors.primaryForeground} />
              ) : (
                <Plus
                  size={theme.sizes.iconSm - 2}
                  color={theme.colors.primaryForeground}
                  strokeWidth={2}
                />
              )}
              <Text style={styles.submitText}>
                {isSubmitting ? 'در حال ذخیره…' : 'ذخیره و انتخاب'}
              </Text>
            </Button>
          </View>
        )}
      </AppSheet>
    </>
  );
}
