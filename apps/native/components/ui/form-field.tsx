import * as React from 'react';
import { Pressable, Switch, Text, TextInput, View, type ViewStyle } from 'react-native';
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldPathValue,
  type FieldValues,
} from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react-native';

import { displayPhone, normalizePhone } from '@repo/salon-core/phone';

import { useTheme, useThemeStyles } from '../../theme';
import { Badge } from './badge';
import { Input, type InputProps } from './input';
import { JalaliDatePicker } from './jalali-date-picker';
import { Label } from './label';
import { Select, type SelectGroup, type SelectOption } from './select';
import { TimePicker } from './time-picker';

/* -------------------------------------------------------------------------- */
/*  Shared shell — label + body + inline error                                */
/* -------------------------------------------------------------------------- */

function useFieldStyles() {
  return useThemeStyles((t) => ({
    field: { gap: t.spacing.md },
    label: { fontFamily: t.fonts.sansMedium },
    error: {
      fontSize: t.fontSize.sm,
      color: t.colors.destructive,
      fontFamily: t.fonts.sans,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: t.spacing.lg,
    },
    chipRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: t.spacing.md,
    },
    chip: { paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.xs },
  }));
}

type Common = {
  label?: string;
  description?: string;
  style?: ViewStyle;
};

function FieldShell({
  label,
  description,
  errorMessage,
  children,
  style,
}: Common & { errorMessage?: string; children: React.ReactNode }) {
  const styles = useFieldStyles();
  const descriptionStyles = useThemeStyles((t) => ({
    description: {
      fontSize: t.fontSize.sm,
      color: t.colors.mutedForeground,
      fontFamily: t.fonts.sans,
    },
  }));
  return (
    <View style={[styles.field, style]}>
      {label ? <Label style={styles.label}>{label}</Label> : null}
      {description ? <Text style={descriptionStyles.description}>{description}</Text> : null}
      {children}
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Generic helper — bind any controlled child to a RHF field                 */
/* -------------------------------------------------------------------------- */

type ControlProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> = {
  control: Control<TFieldValues>;
  name: TName;
};

/* -------------------------------------------------------------------------- */
/*  FormTextField                                                             */
/* -------------------------------------------------------------------------- */

type FormTextFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = ControlProps<TFieldValues, TName> &
  Omit<InputProps, 'value' | 'onChangeText' | 'onBlur'> &
  Common;

function PasswordVisibilityToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={visible ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور'}
      hitSlop={8}
      style={{
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {visible ? (
        <EyeOff size={20} color={theme.colors.mutedForeground} strokeWidth={1.8} />
      ) : (
        <Eye size={20} color={theme.colors.mutedForeground} strokeWidth={1.8} />
      )}
    </Pressable>
  );
}

function FormTextFieldImpl<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(
  {
    control,
    name,
    label,
    description,
    style,
    secureTextEntry,
    ...inputProps
  }: FormTextFieldProps<TFieldValues, TName>,
  ref: React.Ref<TextInput>
) {
  const styles = useThemeStyles((t) => ({ input: { fontFamily: t.fonts.sans } }));
  const { style: inputStyle, rightAdornment, ...rest } = inputProps as InputProps;
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const isPassword = Boolean(secureTextEntry);
  const adornment = isPassword ? (
    <PasswordVisibilityToggle
      visible={passwordVisible}
      onToggle={() => setPasswordVisible((v) => !v)}
    />
  ) : (
    rightAdornment
  );

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FieldShell
          label={label}
          description={description}
          errorMessage={fieldState.error?.message}
          style={style}>
          <Input
            ref={ref}
            value={(field.value as string | undefined) ?? ''}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            secureTextEntry={isPassword && !passwordVisible}
            error={Boolean(fieldState.error)}
            rightAdornment={adornment}
            {...rest}
            style={[styles.input, inputStyle]}
          />
        </FieldShell>
      )}
    />
  );
}

export const FormTextField = React.forwardRef(FormTextFieldImpl) as <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>(
  props: FormTextFieldProps<TFieldValues, TName> & { ref?: React.Ref<TextInput> }
) => React.ReactElement;

/* -------------------------------------------------------------------------- */
/*  FormPhoneField — displays Persian-friendly digits, stores normalized      */
/* -------------------------------------------------------------------------- */

type FormPhoneFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = ControlProps<TFieldValues, TName> &
  Omit<InputProps, 'value' | 'onChangeText' | 'onBlur' | 'keyboardType'> &
  Common;

function FormPhoneFieldImpl<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>(
  {
    control,
    name,
    label,
    description,
    style,
    ...inputProps
  }: FormPhoneFieldProps<TFieldValues, TName>,
  ref: React.Ref<TextInput>
) {
  const styles = useThemeStyles((t) => ({
    input: { fontFamily: t.fonts.sans, textAlign: 'left' as const },
  }));
  const { style: inputStyle, placeholder, ...rest } = inputProps as InputProps;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FieldShell
          label={label}
          description={description}
          errorMessage={fieldState.error?.message}
          style={style}>
          <Input
            ref={ref}
            value={displayPhone((field.value as string | undefined) ?? '')}
            onChangeText={(text) => field.onChange(normalizePhone(text))}
            onBlur={field.onBlur}
            keyboardType="phone-pad"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={placeholder ?? '۰۹۱۲…'}
            error={Boolean(fieldState.error)}
            {...rest}
            style={[styles.input, inputStyle]}
          />
        </FieldShell>
      )}
    />
  );
}

export const FormPhoneField = React.forwardRef(FormPhoneFieldImpl) as <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>(
  props: FormPhoneFieldProps<TFieldValues, TName> & { ref?: React.Ref<TextInput> }
) => React.ReactElement;

/* -------------------------------------------------------------------------- */
/*  FormSelectField                                                           */
/* -------------------------------------------------------------------------- */

type FormSelectFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = ControlProps<TFieldValues, TName> &
  Common & {
    options?: SelectOption[];
    groups?: SelectGroup[];
    placeholder?: string;
    title?: string;
    disabled?: boolean;
  };

export function FormSelectField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  style,
  options,
  groups,
  placeholder,
  title,
  disabled,
}: FormSelectFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FieldShell
          label={label}
          description={description}
          errorMessage={fieldState.error?.message}
          style={style}>
          <Select
            value={(field.value as string | undefined) ?? ''}
            onChange={field.onChange}
            options={options}
            groups={groups}
            placeholder={placeholder}
            title={title ?? label}
            disabled={disabled}
          />
        </FieldShell>
      )}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  FormJalaliDateField — stores a Gregorian "YYYY-MM-DD" string              */
/* -------------------------------------------------------------------------- */

type FormJalaliDateFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = ControlProps<TFieldValues, TName> & Common;

export function FormJalaliDateField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({ control, name, label, description, style }: FormJalaliDateFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FieldShell
          label={label}
          description={description}
          errorMessage={fieldState.error?.message}
          style={style}>
          <JalaliDatePicker
            value={(field.value as string | undefined) ?? ''}
            onChange={field.onChange}
          />
        </FieldShell>
      )}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  FormTimeField — "HH:MM"                                                   */
/* -------------------------------------------------------------------------- */

type FormTimeFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = ControlProps<TFieldValues, TName> &
  Common & {
    pickerLabel?: string;
    fallback?: string;
    onTimeChange?: (value: string) => void;
  };

export function FormTimeField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  style,
  pickerLabel,
  fallback = '09:00',
  onTimeChange,
}: FormTimeFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FieldShell
          label={label}
          description={description}
          errorMessage={fieldState.error?.message}
          style={style}>
          <TimePicker
            value={(field.value as string | undefined) || fallback}
            onChange={(next) => {
              field.onChange(next);
              onTimeChange?.(next);
            }}
            label={pickerLabel ?? label}
          />
        </FieldShell>
      )}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  FormChipGroupField — multi-select from a fixed list of string labels      */
/* -------------------------------------------------------------------------- */

type FormChipGroupFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = ControlProps<TFieldValues, TName> &
  Common & {
    options: readonly string[];
    maxSelected?: number;
  };

export function FormChipGroupField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  style,
  options,
  maxSelected,
}: FormChipGroupFieldProps<TFieldValues, TName>) {
  const styles = useFieldStyles();
  const chipStyles = useThemeStyles((t) => ({
    pressable: { borderRadius: t.radius.sm },
  }));
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const current = Array.isArray(field.value) ? (field.value as string[]) : [];
        const toggle = (label_: string) => {
          if (current.includes(label_)) {
            field.onChange(current.filter((t) => t !== label_));
            return;
          }
          if (maxSelected != null && current.length >= maxSelected) return;
          field.onChange([...current, label_]);
        };
        return (
          <FieldShell
            label={label}
            description={description}
            errorMessage={fieldState.error?.message}
            style={style}>
            <View style={styles.chipRow}>
              {options.map((opt) => {
                const selected = current.includes(opt);
                return (
                  <Pressable
                    key={opt}
                    onPress={() => toggle(opt)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={chipStyles.pressable}>
                    <Badge variant={selected ? 'default' : 'outline'} style={styles.chip}>
                      {opt}
                    </Badge>
                  </Pressable>
                );
              })}
            </View>
          </FieldShell>
        );
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  FormSwitchField / FormCheckboxField (alias) — boolean                     */
/* -------------------------------------------------------------------------- */

type FormSwitchFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = ControlProps<TFieldValues, TName> &
  Common & {
    disabled?: boolean;
  };

export function FormSwitchField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  style,
  disabled,
}: FormSwitchFieldProps<TFieldValues, TName>) {
  const styles = useFieldStyles();
  const textStyles = useThemeStyles((t) => ({
    description: {
      fontSize: t.fontSize.sm,
      color: t.colors.mutedForeground,
      fontFamily: t.fonts.sans,
    },
    body: { flexShrink: 1, gap: t.spacing.xs },
  }));
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FieldShell errorMessage={fieldState.error?.message} style={style}>
          <View style={styles.row}>
            <View style={textStyles.body}>
              {label ? <Label style={styles.label}>{label}</Label> : null}
              {description ? <Text style={textStyles.description}>{description}</Text> : null}
            </View>
            <Switch
              value={Boolean(field.value)}
              onValueChange={(v) => {
                field.onChange(v as FieldPathValue<TFieldValues, TName>);
                field.onBlur();
              }}
              disabled={disabled}
            />
          </View>
        </FieldShell>
      )}
    />
  );
}

export const FormCheckboxField = FormSwitchField;

/* -------------------------------------------------------------------------- */
/*  FormRootError                                                             */
/* -------------------------------------------------------------------------- */

export function FormRootError({ message }: { message?: string }) {
  const styles = useThemeStyles((t) => ({
    error: {
      fontSize: t.fontSize.base,
      color: t.colors.destructive,
      fontFamily: t.fonts.sansMedium,
    },
  }));
  if (!message) return null;
  return <Text style={styles.error}>{message}</Text>;
}
