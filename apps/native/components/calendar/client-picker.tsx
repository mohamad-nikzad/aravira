import * as React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Check, ChevronDown, Plus, Search, UserPlus, X } from 'lucide-react-native';
import { ApiError } from '@repo/api-client';
import type { Client } from '@repo/salon-core/types';
import { displayPhone, normalizePhone } from '@repo/salon-core/phone';
import { saloora } from '@repo/brand-tokens/colors';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { clientsApi } from '../../lib/api';

import { tw } from '../../lib/utils';
type Mode = 'search' | 'add';

export type ClientPickerProps = {
  clients: Client[];
  value: string;
  onChange: (clientId: string) => void;
  onClientCreated?: (client: Client) => void;
  className?: string;
};

export function ClientPicker({
  clients,
  value,
  onChange,
  onClientCreated,
  className,
}: ClientPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>('search');
  const [query, setQuery] = React.useState('');
  const [newName, setNewName] = React.useState('');
  const [newPhone, setNewPhone] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState('');

  const selectedClient = clients.find((c) => c.id === value);

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
    setNewName('');
    setNewPhone('');
    setSaveError('');
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
    setNewName(looksLikePhone ? '' : q);
    setNewPhone(looksLikePhone ? normalizePhone(q) : '');
    setSaveError('');
    setMode('add');
  };

  const handleSaveNew = async () => {
    if (!newName.trim() || !newPhone.trim()) return;
    setSaving(true);
    setSaveError('');
    try {
      const { client } = await clientsApi.create({
        name: newName.trim(),
        phone: newPhone.trim(),
      });
      onClientCreated?.(client);
      onChange(client.id);
      handleClose();
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'خطایی رخ داد';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const triggerLabel = selectedClient
    ? `${selectedClient.name}${
        selectedClient.isPlaceholder
          ? ' · اطلاعات ناقص'
          : ` · ${displayPhone(selectedClient.phone)}`
      }`
    : 'انتخاب مشتری…';

  return (
    <>
      <Pressable
        onPress={handleOpen}
        style={tw(
          'h-10 w-full flex-row items-center justify-between rounded-lg border border-input bg-background px-3',
          className
        )}>
        <Text
          style={[
            tw('flex-1 text-sm', selectedClient ? 'text-foreground' : 'text-muted-foreground'),
            { fontFamily: 'Vazirmatn_500Medium', textAlign: 'right' },
          ]}
          numberOfLines={1}>
          {triggerLabel}
        </Text>
        <ChevronDown size={16} color={saloora.sage.hex} strokeWidth={1.6} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={handleClose}>
        <Pressable onPress={handleClose} style={tw('flex-1 justify-end bg-black/40')}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[tw('rounded-t-2xl bg-card pb-6 pt-4'), { maxHeight: '85%' }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={tw('px-4 pb-3 flex-row items-center justify-between')}>
                <Text
                  style={[tw('text-base text-foreground'), { fontFamily: 'Vazirmatn_700Bold' }]}>
                  {mode === 'add' ? 'مشتری جدید' : 'انتخاب مشتری'}
                </Text>
                <Pressable
                  onPress={handleClose}
                  style={tw('h-8 w-8 items-center justify-center rounded-full bg-muted')}>
                  <X size={16} color={saloora.plum.hex} strokeWidth={2} />
                </Pressable>
              </View>

              {mode === 'search' ? (
                <SearchMode
                  query={query}
                  onQueryChange={setQuery}
                  filtered={filtered}
                  value={value}
                  onSelect={handleSelect}
                  hasExactMatch={hasExactMatch}
                  onStartAdding={startAdding}
                />
              ) : (
                <AddMode
                  newName={newName}
                  newPhone={newPhone}
                  onNameChange={setNewName}
                  onPhoneChange={(t) => setNewPhone(normalizePhone(t))}
                  saving={saving}
                  saveError={saveError}
                  onSave={handleSaveNew}
                  onBack={() => {
                    setMode('search');
                    setSaveError('');
                  }}
                />
              )}
            </KeyboardAvoidingView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function SearchMode({
  query,
  onQueryChange,
  filtered,
  value,
  onSelect,
  hasExactMatch,
  onStartAdding,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  filtered: Client[];
  value: string;
  onSelect: (id: string) => void;
  hasExactMatch: boolean;
  onStartAdding: () => void;
}) {
  return (
    <>
      <View
        style={tw(
          'mx-4 flex-row items-center gap-2 rounded-lg border border-border bg-background px-3'
        )}>
        <Search size={16} color={saloora.sage.hex} strokeWidth={1.6} />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="جستجو نام یا شماره…"
          placeholderTextColor="#767A6F"
          autoFocus
          style={[
            tw('flex-1 py-2.5 text-sm text-foreground'),
            {
              fontFamily: 'Vazirmatn_400Regular',
              textAlign: 'right',
              includeFontPadding: false,
            },
          ]}
        />
        {query ? (
          <Pressable onPress={() => onQueryChange('')} hitSlop={8}>
            <X size={14} color={saloora.sage.hex} strokeWidth={1.8} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView style={[tw('mt-2'), { maxHeight: 320 }]} keyboardShouldPersistTaps="handled">
        <View style={tw('px-2')}>
          {filtered.length > 0 ? (
            filtered.map((client) => {
              const isSelected = client.id === value;
              return (
                <Pressable
                  key={client.id}
                  onPress={() => onSelect(client.id)}
                  style={tw(
                    'flex-row items-center gap-3 rounded-lg px-3 py-3',
                    isSelected && 'bg-primary/10'
                  )}>
                  <View style={tw('flex-1')}>
                    <Text
                      style={[
                        tw('text-sm text-foreground'),
                        { fontFamily: 'Vazirmatn_600SemiBold', textAlign: 'right' },
                      ]}
                      numberOfLines={1}>
                      {client.name}
                    </Text>
                    <Text
                      style={[
                        tw('mt-0.5 text-xs text-muted-foreground'),
                        {
                          fontFamily: 'Vazirmatn_400Regular',
                          writingDirection: 'ltr',
                          textAlign: 'right',
                        },
                      ]}>
                      {client.isPlaceholder ? 'اطلاعات ناقص' : displayPhone(client.phone)}
                    </Text>
                  </View>
                  {isSelected ? <Check size={16} color={saloora.plum.hex} strokeWidth={2} /> : null}
                </Pressable>
              );
            })
          ) : (
            <View style={tw('px-3 py-6')}>
              <Text
                style={[
                  tw('text-center text-sm text-muted-foreground'),
                  { fontFamily: 'Vazirmatn_400Regular' },
                ]}>
                مشتری‌ای یافت نشد
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={tw('mt-2 border-t border-border px-2 pt-2')}>
        {!hasExactMatch && query.trim() ? (
          <Pressable
            onPress={onStartAdding}
            style={tw('flex-row items-center gap-3 rounded-lg px-3 py-3')}>
            <View style={tw('h-8 w-8 items-center justify-center rounded-lg bg-primary/10')}>
              <UserPlus size={14} color={saloora.plum.hex} strokeWidth={1.8} />
            </View>
            <Text
              style={[
                tw('flex-1 text-sm text-primary'),
                { fontFamily: 'Vazirmatn_600SemiBold', textAlign: 'right' },
              ]}
              numberOfLines={1}>
              افزودن «{query.trim()}» به عنوان مشتری جدید
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={onStartAdding}
            style={tw('flex-row items-center gap-3 rounded-lg px-3 py-3')}>
            <Plus size={16} color={saloora.sage.hex} strokeWidth={1.8} />
            <Text
              style={[
                tw('flex-1 text-sm text-muted-foreground'),
                { fontFamily: 'Vazirmatn_500Medium', textAlign: 'right' },
              ]}>
              مشتری جدید
            </Text>
          </Pressable>
        )}
      </View>
    </>
  );
}

function AddMode({
  newName,
  newPhone,
  onNameChange,
  onPhoneChange,
  saving,
  saveError,
  onSave,
  onBack,
}: {
  newName: string;
  newPhone: string;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  saving: boolean;
  saveError: string;
  onSave: () => void;
  onBack: () => void;
}) {
  return (
    <View style={tw('px-4 gap-3')}>
      <View style={tw('flex-row items-center justify-between')}>
        <Pressable onPress={onBack}>
          <Text
            style={[tw('text-xs text-muted-foreground'), { fontFamily: 'Vazirmatn_500Medium' }]}>
            بازگشت
          </Text>
        </Pressable>
        <Text style={[tw('text-sm text-foreground'), { fontFamily: 'Vazirmatn_600SemiBold' }]}>
          ثبت مشتری جدید
        </Text>
      </View>

      <Input value={newName} onChangeText={onNameChange} placeholder="نام مشتری" />

      <Input
        value={displayPhone(newPhone)}
        onChangeText={onPhoneChange}
        placeholder="شماره تماس (۰۹…)"
        keyboardType="phone-pad"
        style={{ textAlign: 'left', writingDirection: 'ltr' }}
      />

      {saveError ? (
        <Text
          style={[
            tw('text-xs text-destructive'),
            { fontFamily: 'Vazirmatn_500Medium', textAlign: 'right' },
          ]}>
          {saveError}
        </Text>
      ) : null}

      <Button
        disabled={saving || !newName.trim() || !newPhone.trim()}
        onPress={onSave}
        style={tw('w-full')}>
        {saving ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Plus size={14} color="#FFFFFF" strokeWidth={2} />
        )}
        <Text
          style={[tw('text-sm text-primary-foreground'), { fontFamily: 'Vazirmatn_600SemiBold' }]}>
          {saving ? 'در حال ذخیره…' : 'ذخیره و انتخاب'}
        </Text>
      </Button>
    </View>
  );
}
