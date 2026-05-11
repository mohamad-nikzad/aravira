import * as React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { saloora } from '@repo/brand-tokens/colors';

import { tw } from '../../lib/utils';
import { AppText } from './app-text';
export type SelectOption = {
  value: string;
  label: string;
  detail?: string;
  disabled?: boolean;
};

export type SelectGroup = {
  label?: string;
  options: SelectOption[];
};

export type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  title?: string;
  options?: SelectOption[];
  groups?: SelectGroup[];
  disabled?: boolean;
  className?: string;
};

export function Select({
  value,
  onChange,
  placeholder = 'انتخاب کنید',
  title,
  options,
  groups,
  disabled,
  className,
}: SelectProps) {
  const [open, setOpen] = React.useState(false);

  const allOptions = React.useMemo(() => {
    if (groups) return groups.flatMap((g) => g.options);
    return options ?? [];
  }, [options, groups]);

  const selected = allOptions.find((o) => o.value === value);
  const displayText = selected?.label ?? placeholder;

  return (
    <>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        style={tw(
          'h-9 w-full flex-row items-center justify-between rounded-md border border-input bg-transparent px-3',
          disabled && 'opacity-50',
          className
        )}>
        <AppText
          style={[
            tw('text-sm flex-1', selected ? 'text-foreground' : 'text-muted-foreground'),
            // { fontFamily: 'Vazirmatn_500Medium', textAlign: 'right' },
          ]}
          numberOfLines={1}>
          {displayText}
        </AppText>
        <ChevronDown size={16} color={saloora.sage.hex} strokeWidth={1.6} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={tw('flex-1 justify-end bg-black/40')}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[tw('rounded-t-2xl bg-card pb-6 pt-4'), { maxHeight: '80%' }]}>
            {title ? (
              <View style={tw('px-4 pb-3')}>
                <Text
                  style={[tw('text-base text-foreground'), { fontFamily: 'Vazirmatn_700Bold' }]}>
                  {title}
                </Text>
              </View>
            ) : null}

            <ScrollView style={{ maxHeight: 480 }}>
              <View style={{ paddingHorizontal: 8, paddingBottom: 8 }}>
                {groups
                  ? groups.map((g, gi) => (
                      <View key={gi}>
                        {g.label ? (
                          <Text
                            style={[
                              tw('text-xs text-muted-foreground'),
                              {
                                fontFamily: 'Vazirmatn_500Medium',
                                paddingHorizontal: 12,
                                paddingTop: 10,
                                paddingBottom: 4,
                              },
                            ]}>
                            {g.label}
                          </Text>
                        ) : null}
                        {g.options.map((opt) => (
                          <OptionRow
                            key={opt.value}
                            option={opt}
                            selected={opt.value === value}
                            onPress={() => {
                              if (opt.disabled) return;
                              onChange(opt.value);
                              setOpen(false);
                            }}
                          />
                        ))}
                      </View>
                    ))
                  : (options ?? []).map((opt) => (
                      <OptionRow
                        key={opt.value}
                        option={opt}
                        selected={opt.value === value}
                        onPress={() => {
                          if (opt.disabled) return;
                          onChange(opt.value);
                          setOpen(false);
                        }}
                      />
                    ))}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function OptionRow({
  option,
  selected,
  onPress,
}: {
  option: SelectOption;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={option.disabled}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 10,
        opacity: option.disabled ? 0.4 : pressed ? 0.7 : 1,
        backgroundColor: selected ? saloora.blush.hex + '40' : 'transparent',
        gap: 8,
      })}>
      {selected ? (
        <Check size={16} color={saloora.plum.hex} strokeWidth={2} />
      ) : (
        <View style={{ width: 16 }} />
      )}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Vazirmatn_500Medium',
            fontSize: 14,
            color: saloora.plum.hex,
            textAlign: 'right',
          }}
          numberOfLines={2}>
          {option.label}
        </Text>
        {option.detail ? (
          <Text
            style={{
              fontFamily: 'Vazirmatn_400Regular',
              fontSize: 11,
              color: saloora.sage.hex,
              textAlign: 'right',
              marginTop: 2,
            }}>
            {option.detail}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
