import * as React from 'react';
import { Text, View } from 'react-native';
import type { Service } from '@repo/salon-core/types';
import { SERVICE_CATEGORIES } from '@repo/salon-core/types';
import { toPersianDigits } from '@repo/salon-core/persian-digits';
import { AppText } from '../ui/app-text';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { servicesApi } from '../../lib/api';
import { useAsyncResource } from '../../lib/hooks/use-async-resource';

import { tw } from '../../lib/utils';
const FONT_REG = 'Vazirmatn_400Regular';
const FONT_MED = 'Vazirmatn_500Medium';

export function ServicesCard() {
  const { data, loading } = useAsyncResource<{ services: Service[] }>('services', (signal) =>
    servicesApi.list({ includeInactive: true, signal })
  );
  const services = data?.services ?? [];

  return (
    <Card style={{ gap: 12, padding: 16 }}>
      <CardHeader
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          padding: 0,
        }}>
        <CardTitle color="mutedForeground" variant="label" weight="medium">
          خدمات
        </CardTitle>
      </CardHeader>
      <CardContent style={{ gap: 8, padding: 0 }}>
        {loading && !data ? (
          <View style={tw('gap-2')}>
            <Skeleton height={48} width="100%" radius={12} />
            <Skeleton height={48} width="100%" radius={12} />
          </View>
        ) : services.length === 0 ? (
          <AppText color="mutedForeground">هنوز خدمتی ثبت نشده.</AppText>
        ) : (
          services.map((s) => {
            const category = SERVICE_CATEGORIES[s.category]?.label ?? s.category;
            return (
              <View
                key={s.id}
                style={tw(
                  'border-border/50 flex-row items-center gap-3 rounded-xl border px-3 py-2.5'
                )}>
                <View style={tw('min-w-0 flex-1 gap-1')}>
                  <Text
                    style={[tw('text-foreground text-sm'), { fontFamily: FONT_MED }]}
                    numberOfLines={1}>
                    {s.name}
                  </Text>
                  <Text style={[tw('text-muted-foreground text-xs'), { fontFamily: FONT_REG }]}>
                    {category} · {toPersianDigits(s.duration)} دقیقه
                  </Text>
                </View>
                {!s.active ? (
                  <Badge variant="secondary" style={{ paddingHorizontal: 6, paddingVertical: 0 }}>
                    غیرفعال
                  </Badge>
                ) : null}
              </View>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
