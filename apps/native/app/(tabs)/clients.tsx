import * as React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, Search } from 'lucide-react-native';
import type { Client } from '@repo/salon-core/types';
import { displayPhone } from '@repo/salon-core/phone';
import { saloora, semanticLight } from '@repo/brand-tokens/colors';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { useAuth } from '../../components/auth-provider';
import { clientsApi } from '../../lib/api';
import { useAsyncResource } from '../../lib/hooks/use-async-resource';

import { tw } from '../../lib/utils';
const FONT_REG = 'Vazirmatn_400Regular';
const FONT_MED = 'Vazirmatn_500Medium';
const FONT_BOLD = 'Vazirmatn_700Bold';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);
}

export default function ClientsScreen() {
  const { user } = useAuth();
  const [search, setSearch] = React.useState('');

  const key = user?.role === 'manager' ? 'clients' : null;
  const { data, loading } = useAsyncResource<{ clients: Client[] }>(key, (signal) =>
    clientsApi.list({ signal })
  );
  const clients = data?.clients ?? [];
  const filtered = React.useMemo(
    () =>
      clients.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone ?? '').includes(search)
      ),
    [clients, search]
  );

  if (!user || user.role !== 'manager') return null;

  return (
    <SafeAreaView
      style={[tw('bg-background flex-1'), { backgroundColor: semanticLight.background.hex }]}
      edges={['top']}>
      <View
        style={tw(
          'border-border/50 bg-card flex-row items-center justify-between gap-4 border-b px-4 py-3'
        )}>
        <Text style={[tw('text-foreground text-lg'), { fontFamily: FONT_BOLD }]}>مشتریان</Text>
      </View>

      <View style={tw('bg-card px-4 pb-3')}>
        <View style={tw('relative')}>
          <View style={[tw('absolute top-1/2 right-3 z-10'), { transform: [{ translateY: -8 }] }]}>
            <Search size={16} color={saloora.sage.hex} strokeWidth={1.6} />
          </View>
          <Input
            placeholder="جستجوی مشتری…"
            value={search}
            onChangeText={setSearch}
            style={{ height: 40, borderWidth: 0, paddingRight: 36 }}
          />
        </View>
      </View>

      {loading && !data ? (
        <View style={tw('gap-3 px-4 py-3')}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={tw('flex-row items-center gap-3')}>
              <Skeleton height={44} width={44} radius={22} />
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
            مشتری‌ای یافت نشد
          </Text>
        </View>
      ) : (
        <ScrollView contentInsetAdjustmentBehavior="automatic">
          <View>
            {filtered.map((client, idx) => (
              <View
                key={client.id}
                style={[
                  tw('flex-row items-center gap-3 px-4 py-3'),
                  idx > 0 ? { borderTopWidth: 1, borderTopColor: 'rgba(229,217,219,0.5)' } : null,
                ]}>
                <Avatar style={tw('h-11 w-11')}>
                  <AvatarFallback
                    style={tw('bg-primary/10')}
                    textStyle={tw('text-primary text-sm')}>
                    {getInitials(client.name)}
                  </AvatarFallback>
                </Avatar>

                <View style={tw('min-w-0 flex-1 gap-1')}>
                  <Text
                    style={[tw('text-foreground text-sm'), { fontFamily: FONT_MED }]}
                    numberOfLines={1}>
                    {client.name}
                  </Text>
                  <View style={tw('flex-row items-center gap-1')}>
                    <Phone size={12} color={saloora.sage.hex} strokeWidth={1.6} />
                    <Text style={[tw('text-muted-foreground text-xs'), { fontFamily: FONT_REG }]}>
                      {displayPhone(client.phone)}
                    </Text>
                  </View>
                  {client.tags && client.tags.length > 0 ? (
                    <View style={tw('flex-row flex-wrap gap-1 pt-0.5')}>
                      {client.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          style={{ paddingHorizontal: 6, paddingVertical: 0 }}>
                          {tag.label}
                        </Badge>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
