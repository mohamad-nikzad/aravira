import * as React from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { Clock } from 'lucide-react-native';
import { saloora } from '@repo/brand-tokens/colors';
import { toPersianDigits } from '@repo/salon-core/persian-digits';
import { Button } from './button';

import { tw } from '../../lib/utils';
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 5-min steps

const ITEM_HEIGHT = 44;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function parseHm(value: string): { h: number; m: number } {
  const [hh, mm] = (value || '09:00').split(':').map((s) => Number.parseInt(s, 10));
  const h = Number.isFinite(hh) ? Math.min(23, Math.max(0, hh)) : 9;
  const mRaw = Number.isFinite(mm) ? Math.min(59, Math.max(0, mm)) : 0;
  // snap minute to nearest 5
  const m = Math.round(mRaw / 5) * 5;
  return { h, m: m === 60 ? 55 : m };
}

export type TimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
};

export function TimePicker({ value, onChange, label, className }: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const initial = React.useMemo(() => parseHm(value), [value]);
  const [hour, setHour] = React.useState(initial.h);
  const [minute, setMinute] = React.useState(initial.m);
  const hourRef = React.useRef<FlatList<number>>(null);
  const minuteRef = React.useRef<FlatList<number>>(null);

  const handleOpen = () => {
    const p = parseHm(value);
    setHour(p.h);
    setMinute(p.m);
    setOpen(true);
    requestAnimationFrame(() => {
      hourRef.current?.scrollToOffset({ offset: p.h * ITEM_HEIGHT, animated: false });
      minuteRef.current?.scrollToOffset({
        offset: (p.m / 5) * ITEM_HEIGHT,
        animated: false,
      });
    });
  };

  const handleConfirm = () => {
    onChange(`${pad(hour)}:${pad(minute)}`);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={handleOpen}
        style={tw(
          'h-9 w-full flex-row items-center justify-between rounded-md border border-input bg-transparent px-3',
          className
        )}>
        <Text
          style={[
            tw('text-sm text-foreground tabular-nums'),
            { fontFamily: 'Vazirmatn_500Medium', writingDirection: 'ltr' },
          ]}>
          {toPersianDigits(value || '09:00')}
        </Text>
        <Clock size={16} color={saloora.sage.hex} strokeWidth={1.6} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={tw('flex-1 justify-end bg-black/40')}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={tw('rounded-t-2xl bg-card pb-6 pt-4')}>
            <View style={tw('px-4 pb-3')}>
              <Text style={[tw('text-base text-foreground'), { fontFamily: 'Vazirmatn_700Bold' }]}>
                {label ?? 'انتخاب زمان'}
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                height: ITEM_HEIGHT * 5,
                paddingHorizontal: 16,
              }}>
              <Wheel listRef={hourRef} data={HOURS} value={hour} onChange={setHour} width="50%" />
              <View
                style={{
                  width: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text
                  style={{
                    fontFamily: 'Vazirmatn_700Bold',
                    fontSize: 22,
                    color: saloora.plum.hex,
                  }}>
                  :
                </Text>
              </View>
              <Wheel
                listRef={minuteRef}
                data={MINUTES}
                value={minute}
                onChange={setMinute}
                width="50%"
              />
            </View>

            <View style={tw('px-4 pt-3 flex-row gap-2')}>
              <Button variant="outline" style={{ flex: 1 }} onPress={() => setOpen(false)}>
                <Text
                  style={[tw('text-sm text-foreground'), { fontFamily: 'Vazirmatn_500Medium' }]}>
                  انصراف
                </Text>
              </Button>
              <Button style={{ flex: 1 }} onPress={handleConfirm}>
                <Text
                  style={[
                    tw('text-sm text-primary-foreground'),
                    { fontFamily: 'Vazirmatn_600SemiBold' },
                  ]}>
                  تأیید
                </Text>
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function Wheel({
  listRef,
  data,
  value,
  onChange,
  width,
}: {
  listRef: React.RefObject<FlatList<number> | null>;
  data: number[];
  value: number;
  onChange: (v: number) => void;
  width: string | number;
}) {
  return (
    <View style={{ width: width as never, position: 'relative' }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: ITEM_HEIGHT * 2,
          left: 8,
          right: 8,
          height: ITEM_HEIGHT,
          borderRadius: 12,
          backgroundColor: saloora.blush.hex + '55',
          zIndex: 0,
        }}
      />
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(it) => String(it)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
          const clamped = Math.min(data.length - 1, Math.max(0, idx));
          const next = data[clamped];
          if (next !== value) onChange(next);
        }}
        renderItem={({ item }) => {
          const selected = item === value;
          return (
            <View
              style={{
                height: ITEM_HEIGHT,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text
                style={{
                  fontFamily: selected ? 'Vazirmatn_700Bold' : 'Vazirmatn_500Medium',
                  fontSize: selected ? 22 : 18,
                  color: selected ? saloora.plum.hex : saloora.sage.hex,
                  writingDirection: 'ltr',
                }}>
                {toPersianDigits(pad(item))}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}
