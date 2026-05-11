import * as React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Users } from 'lucide-react-native';
import { FONTS, staffHex } from './helpers';
import type { CalendarStaff } from './types';

import { tw } from '../../lib/utils';
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '؟';
  if (parts.length === 1) return parts[0].slice(0, 1);
  return parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1);
}

export function StaffFilter({
  staff,
  selected,
  onSelect,
}: {
  staff: CalendarStaff[];
  selected: string | null;
  onSelect: (staffId: string | null) => void;
}) {
  if (staff.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
      <Pressable
        onPress={() => onSelect(null)}
        style={tw(
          `flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 ${
            selected === null ? 'border-primary/60 bg-primary/10' : 'border-border/60 bg-card'
          }`
        )}>
        <Users size={13} color={selected === null ? '#6B3A4A' : '#767A6F'} strokeWidth={1.8} />
        <Text
          style={[
            tw(`text-[12px] ${selected === null ? 'text-primary' : 'text-muted-foreground'}`),
            { fontFamily: FONTS.semi },
          ]}>
          همه
        </Text>
      </Pressable>

      {staff.map((s) => {
        const active = selected === s.id;
        const hex = staffHex(s.color);
        return (
          <Pressable
            key={s.id}
            onPress={() => onSelect(active ? null : s.id)}
            style={[
              tw(
                `flex-row items-center gap-2 rounded-full border px-2 py-1 ${
                  active ? 'bg-primary/5' : 'bg-card'
                }`
              ),
              {
                borderColor: active ? hex : 'rgba(229, 217, 219, 0.7)',
              },
            ]}>
            <View
              style={[
                tw('h-6 w-6 items-center justify-center rounded-full'),
                { backgroundColor: hex },
              ]}>
              <Text style={[tw('text-[10px] text-white'), { fontFamily: FONTS.bold }]}>
                {initials(s.name)}
              </Text>
            </View>
            <Text
              style={[
                tw('text-foreground pr-1 text-[12px]'),
                { fontFamily: active ? FONTS.semi : FONTS.med, maxWidth: 110 },
              ]}
              numberOfLines={1}>
              {s.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
