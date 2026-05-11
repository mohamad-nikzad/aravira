import * as React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowRight, Phone, Search, Shield, User as UserIcon } from 'lucide-react-native';
import type { User } from '@repo/salon-core/types';
import { displayPhone } from '@repo/salon-core/phone';
import { saloora, semanticLight } from '@repo/brand-tokens/colors';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { useAuth } from '../components/auth-provider';
import { staffApi } from '../lib/api';
import { useAsyncResource } from '../lib/hooks/use-async-resource';

import { tw } from '../lib/utils';
const FONT_REG = 'Vazirmatn_400Regular';
const FONT_MED = 'Vazirmatn_500Medium';
const FONT_BOLD = 'Vazirmatn_700Bold';

const STAFF_COLOR_CLASS: Record<string, string> = {
  'bg-staff-1': 'bg-staff-1',
  'bg-staff-2': 'bg-staff-2',
  'bg-staff-3': 'bg-staff-3',
  'bg-staff-4': 'bg-staff-4',
  'bg-staff-5': 'bg-staff-5',
};

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
  const [search, setSearch] = React.useState('');

  const key = user?.role === 'manager' ? 'staff' : null;
  const { data, loading } = useAsyncResource<{ staff: User[] }>(key, (signal) =>
    staffApi.list({ signal })
  );
  const staff = data?.staff ?? [];
  const filtered = React.useMemo(
    () =>
      staff.filter(
        (m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search)
      ),
    [staff, search]
  );

  if (!user || user.role !== 'manager') return null;

  return (
    <SafeAreaView
      style={[tw('bg-background flex-1'), { backgroundColor: semanticLight.background.hex }]}
      edges={['top']}>
      <View
        style={tw(
          'border-border/50 bg-card flex-row items-center justify-between gap-3 border-b px-3 py-3'
        )}>
        <View style={tw('min-w-0 flex-row items-center gap-3')}>
          <Pressable
            accessibilityLabel="بازگشت به بیشتر"
            onPress={() => router.back()}
            style={tw('h-10 w-10 items-center justify-center rounded-2xl')}>
            <ArrowRight size={20} color={saloora.plum.hex} strokeWidth={1.8} />
          </Pressable>
          <View style={tw('min-w-0')}>
            <Text
              style={[tw('text-foreground text-lg'), { fontFamily: FONT_BOLD }]}
              numberOfLines={1}>
              پرسنل
            </Text>
            <Text
              style={[tw('text-muted-foreground text-xs'), { fontFamily: FONT_REG }]}
              numberOfLines={1}>
              نقش‌ها، خدمات و ساعت کاری
            </Text>
          </View>
        </View>
      </View>

      <View style={tw('bg-card px-4 pb-3')}>
        <View style={tw('relative')}>
          <View style={[tw('absolute top-1/2 right-3 z-10'), { transform: [{ translateY: -8 }] }]}>
            <Search size={16} color={saloora.sage.hex} strokeWidth={1.6} />
          </View>
          <Input
            placeholder="جستجوی پرسنل…"
            value={search}
            onChangeText={setSearch}
            style={{ height: 40, borderWidth: 0, paddingRight: 36 }}
          />
        </View>
      </View>

      {loading && !data ? (
        <View style={tw('gap-3 px-4 py-3')}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={tw('flex-row items-center gap-3')}>
              <Skeleton height={40} width={40} radius={20} />
              <View style={tw('flex-1 gap-2')}>
                <Skeleton height={16} width="50%" />
                <Skeleton height={12} width="33%" />
              </View>
            </View>
          ))}
        </View>
      ) : filtered.length === 0 ? (
        <View style={tw('flex-1 items-center justify-center py-16')}>
          <Text style={[tw('text-muted-foreground'), { fontFamily: FONT_REG }]}>
            پرسنلی یافت نشد
          </Text>
        </View>
      ) : (
        <ScrollView contentInsetAdjustmentBehavior="automatic">
          <View>
            {filtered.map((member, idx) => {
              const colorClass = STAFF_COLOR_CLASS[member.color] ?? 'bg-primary';
              return (
                <View
                  key={member.id}
                  style={[
                    tw('flex-row items-center gap-3 px-4 py-3'),
                    idx > 0 ? { borderTopWidth: 1, borderTopColor: 'rgba(229,217,219,0.5)' } : null,
                  ]}>
                  <Avatar style={tw('h-10 w-10', colorClass)}>
                    <AvatarFallback textStyle={tw('text-foreground text-sm')}>
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>

                  <View style={tw('min-w-0 flex-1 gap-1')}>
                    <View style={tw('flex-row items-center gap-2')}>
                      <Text
                        style={[tw('text-foreground text-sm'), { fontFamily: FONT_MED }]}
                        numberOfLines={1}>
                        {member.name}
                      </Text>
                      <Badge
                        variant="secondary"
                        style={{ paddingHorizontal: 6, paddingVertical: 0 }}>
                        <View style={tw('flex-row items-center gap-1')}>
                          {member.role === 'manager' ? (
                            <Shield size={12} color={saloora.plum.hex} strokeWidth={1.6} />
                          ) : (
                            <UserIcon size={12} color={saloora.plum.hex} strokeWidth={1.6} />
                          )}
                          <Text
                            style={[
                              tw('text-secondary-foreground text-[10px]'),
                              { fontFamily: FONT_MED },
                            ]}>
                            {member.role === 'manager' ? 'مدیر' : 'پرسنل'}
                          </Text>
                        </View>
                      </Badge>
                    </View>
                    <View style={tw('flex-row items-center gap-1')}>
                      <Phone size={12} color={saloora.sage.hex} strokeWidth={1.6} />
                      <Text style={[tw('text-muted-foreground text-xs'), { fontFamily: FONT_REG }]}>
                        {displayPhone(member.phone)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
