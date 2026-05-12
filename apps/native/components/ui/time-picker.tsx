import * as React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Clock } from 'lucide-react-native';
import { toPersianDigits } from '@repo/salon-core/persian-digits';
import { AppSheet } from './app-sheet';
import { ModalHeader } from './modal-header';
import { Button } from './button';
import { useTheme, useThemeStyles, withAlpha } from '../../theme';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

const ITEM_HEIGHT = 44;
const WHEEL_VISIBLE_ROWS = 5;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function parseHm(value: string): { h: number; m: number } {
  const [hh, mm] = (value || '09:00').split(':').map((s) => Number.parseInt(s, 10));
  const h = Number.isFinite(hh) ? Math.min(23, Math.max(0, hh)) : 9;
  const mRaw = Number.isFinite(mm) ? Math.min(59, Math.max(0, mm)) : 0;
  const m = Math.round(mRaw / 5) * 5;
  return { h, m: m === 60 ? 55 : m };
}

export type TimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
};

export function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const initial = React.useMemo(() => parseHm(value), [value]);
  const [hour, setHour] = React.useState(initial.h);
  const [minute, setMinute] = React.useState(initial.m);
  const hourRef = React.useRef<FlatList<number>>(null);
  const minuteRef = React.useRef<FlatList<number>>(null);
  const { theme } = useTheme();
  const styles = useThemeStyles((t) => ({
    trigger: {
      height: t.sizes.controlMd,
      width: '100%' as const,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      borderRadius: t.radius.sm,
      borderWidth: t.sizes.hairline,
      borderColor: t.colors.input,
      backgroundColor: 'transparent',
      paddingHorizontal: t.spacing.lg,
    },
    triggerText: {
      fontSize: t.fontSize.base,
      color: t.colors.foreground,
      fontFamily: t.fonts.sansMedium,
      fontVariant: ['tabular-nums' as const],
      writingDirection: 'ltr' as const,
    },
    wheelsRow: {
      flexDirection: 'row' as const,
      height: ITEM_HEIGHT * WHEEL_VISIBLE_ROWS,
      paddingHorizontal: t.spacing.xl,
    },
    colonWrap: {
      width: t.spacing.xl,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    colon: {
      fontFamily: t.fonts.sansBold,
      fontSize: t.fontSize['2xl'],
      color: t.colors.foreground,
    },
    actions: {
      paddingHorizontal: t.spacing.xl,
      paddingTop: t.spacing.lg,
      flexDirection: 'row' as const,
      gap: t.spacing.md,
    },
    actionFlex: { flex: 1 },
    cancelText: {
      fontSize: t.fontSize.base,
      color: t.colors.foreground,
      fontFamily: t.fonts.sansMedium,
    },
    confirmText: {
      fontSize: t.fontSize.base,
      color: t.colors.primaryForeground,
      fontFamily: t.fonts.sansSemiBold,
    },
  }));

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
        accessibilityRole="button"
        accessibilityLabel={label ?? 'انتخاب زمان'}
        style={styles.trigger}>
        <Text style={styles.triggerText}>{toPersianDigits(value || '09:00')}</Text>
        <Clock size={theme.sizes.iconSm} color={theme.iconColors.muted} strokeWidth={1.6} />
      </Pressable>

      <AppSheet visible={open} onClose={() => setOpen(false)}>
        <ModalHeader title={label ?? 'انتخاب زمان'} onClose={() => setOpen(false)} borderless />

        <View style={styles.wheelsRow}>
          <Wheel listRef={hourRef} data={HOURS} value={hour} onChange={setHour} width="50%" />
          <View style={styles.colonWrap}>
            <Text style={styles.colon}>:</Text>
          </View>
          <Wheel
            listRef={minuteRef}
            data={MINUTES}
            value={minute}
            onChange={setMinute}
            width="50%"
          />
        </View>

        <View style={styles.actions}>
          <Button variant="outline" style={styles.actionFlex} onPress={() => setOpen(false)}>
            <Text style={styles.cancelText}>انصراف</Text>
          </Button>
          <Button style={styles.actionFlex} onPress={handleConfirm}>
            <Text style={styles.confirmText}>تأیید</Text>
          </Button>
        </View>
      </AppSheet>
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
  const { theme } = useTheme();
  const styles = useThemeStyles((t) => ({
    container: { position: 'relative' as const },
    highlight: {
      position: 'absolute' as const,
      top: ITEM_HEIGHT * 2,
      left: t.spacing.md,
      right: t.spacing.md,
      height: ITEM_HEIGHT,
      borderRadius: t.radius.lg,
      backgroundColor: withAlpha(t.colors.accent, 0.35),
      zIndex: 0,
    },
    list: { paddingVertical: ITEM_HEIGHT * 2 },
    itemRow: {
      height: ITEM_HEIGHT,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
  }));

  return (
    <View style={[styles.container, { width: width as never }]}>
      <View pointerEvents="none" style={styles.highlight} />
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(it) => String(it)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={styles.list}
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
            <View style={styles.itemRow}>
              <Text
                style={{
                  fontFamily: selected ? theme.fonts.sansBold : theme.fonts.sansMedium,
                  fontSize: selected ? theme.fontSize['2xl'] : theme.fontSize.xl,
                  color: selected ? theme.colors.foreground : theme.colors.mutedForeground,
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
