import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { FONTS } from './helpers';
import type { CalendarView } from './types';

import { tw } from '../../lib/utils';
const VIEWS: readonly { key: CalendarView; label: string }[] = [
  { key: 'day', label: 'روز' },
  { key: 'week', label: 'هفته' },
  { key: 'month', label: 'ماه' },
  { key: 'agenda', label: 'لیست' },
];

export function ViewSwitcher({
  value,
  onChange,
}: {
  value: CalendarView;
  onChange: (view: CalendarView) => void;
}) {
  return (
    <View style={tw('bg-muted/70 flex-row rounded-2xl p-1')}>
      {VIEWS.map((v) => {
        const active = v.key === value;
        return (
          <Pressable
            key={v.key}
            onPress={() => onChange(v.key)}
            style={({ pressed }) => [
              tw(
                `flex-1 items-center justify-center rounded-xl px-2 py-1.5 ${
                  active ? 'bg-card shadow-sm' : 'bg-transparent'
                }`
              ),
              pressed && !active ? { opacity: 0.7 } : null,
            ]}>
            <Text
              style={[
                tw(`text-[12px] ${active ? 'text-primary' : 'text-muted-foreground'}`),
                { fontFamily: active ? FONTS.semi : FONTS.med },
              ]}>
              {v.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
