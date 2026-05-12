import * as React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError, NetworkError } from '@repo/api-client';
import { signupSchema, type SignupFormInput } from '@repo/salon-core/forms/auth';
import { Button } from '../components/ui/button';
import { FormPhoneField, FormRootError, FormTextField } from '../components/ui/form-field';
import { KeyboardAwareFormScreen } from '../components/ui/keyboard-aware-form-screen';
import { Spinner } from '../components/ui/spinner';
import { useAuth } from '../components/auth-provider';
import { useTheme, useThemeStyles, withAlpha } from '../theme';

function makeSlug(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || 'salon';
}

const FIELD_ORDER = ['salonName', 'slug', 'managerName', 'managerPhone', 'password'] as const;

export default function SignupScreen() {
  const { signup } = useAuth();
  const { theme } = useTheme();
  const salonNameRef = React.useRef<TextInput>(null);
  const slugRef = React.useRef<TextInput>(null);
  const managerNameRef = React.useRef<TextInput>(null);
  const managerPhoneRef = React.useRef<TextInput>(null);
  const passwordRef = React.useRef<TextInput>(null);
  const refs: Record<(typeof FIELD_ORDER)[number], React.RefObject<TextInput | null>> = {
    salonName: salonNameRef,
    slug: slugRef,
    managerName: managerNameRef,
    managerPhone: managerPhoneRef,
    password: passwordRef,
  };
  const {
    control,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      salonName: '',
      slug: 'salon',
      managerName: '',
      managerPhone: '',
      password: '',
    },
    shouldFocusError: false,
  });
  const salonName = watch('salonName') ?? '';
  const slug = watch('slug') ?? 'salon';
  const slugEditedRef = React.useRef(false);

  React.useEffect(() => {
    if (slugEditedRef.current) return;
    setValue('slug', makeSlug(salonName), { shouldValidate: false });
  }, [salonName, setValue]);

  const styles = useThemeStyles((t) => ({
    brand: { alignItems: 'center' as const, gap: t.spacing.md },
    logo: { width: 64, height: 64, borderRadius: t.radius.xl },
    brandTitle: {
      fontSize: t.fontSize['2xl'],
      color: t.colors.foreground,
      fontFamily: t.fonts.sansExtraBold,
    },
    brandSubtitle: {
      fontSize: t.fontSize.sm,
      color: t.colors.mutedForeground,
      fontFamily: t.fonts.sans,
    },
    card: {
      marginTop: t.spacing['2xl'],
      gap: t.spacing['xl'],
      borderRadius: t.radius.xl,
      borderWidth: t.sizes.hairline,
      borderColor: withAlpha(t.colors.border, 0.6),
      backgroundColor: t.colors.card,
      padding: t.spacing['2xl'],
    },
    submit: { minHeight: 48 },
    submitText: {
      fontSize: t.fontSize.base,
      color: t.colors.primaryForeground,
      fontFamily: t.fonts.sansSemiBold,
    },
    footer: {
      marginTop: t.spacing.xl,
      alignItems: 'center' as const,
      gap: t.spacing.xs,
    },
    footerHint: {
      fontSize: t.fontSize.sm,
      color: t.colors.mutedForeground,
      fontFamily: t.fonts.sans,
    },
    footerLink: {
      fontSize: t.fontSize.base,
      fontFamily: t.fonts.sansSemiBold,
      color: t.colors.primary,
      minHeight: 44,
      paddingVertical: t.spacing.sm,
    },
  }));

  const onSubmit = handleSubmit(
    async (values) => {
      try {
        await signup(values);
      } catch (err) {
        const message =
          err instanceof ApiError || err instanceof NetworkError
            ? err.message
            : 'ثبت‌نام انجام نشد. دوباره تلاش کنید.';
        setError('root', { message });
      }
    },
    (validationErrors) => {
      const firstField = FIELD_ORDER.find((k) => validationErrors[k]);
      if (firstField) refs[firstField].current?.focus();
    }
  );

  return (
    <KeyboardAwareFormScreen>
      <View style={styles.brand}>
        <Image
          source={require('../assets/images/saloora-mark-clean.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.brandTitle}>ساخت سالن جدید</Text>
        <Text style={styles.brandSubtitle}>سالن خود را در سالورا بسازید</Text>
      </View>

      <View style={styles.card}>
        <FormTextField
          ref={salonNameRef}
          control={control}
          name="salonName"
          label="نام سالن"
          placeholder="مثلاً سالن رز"
          autoCapitalize="words"
          editable={!isSubmitting}
          returnKeyType="next"
          onSubmitEditing={() => slugRef.current?.focus()}
          submitBehavior="submit"
        />

        <FormTextField
          ref={slugRef}
          control={control}
          name="slug"
          label="آدرس سالن"
          description={`aravira.app/${slug || 'salon'}`}
          placeholder="rose-salon"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isSubmitting}
          onFocus={() => {
            slugEditedRef.current = true;
          }}
          returnKeyType="next"
          onSubmitEditing={() => managerNameRef.current?.focus()}
          submitBehavior="submit"
        />

        <FormTextField
          ref={managerNameRef}
          control={control}
          name="managerName"
          label="نام مدیر"
          placeholder="نام و نام خانوادگی"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          editable={!isSubmitting}
          returnKeyType="next"
          onSubmitEditing={() => managerPhoneRef.current?.focus()}
          submitBehavior="submit"
        />

        <FormPhoneField
          ref={managerPhoneRef}
          control={control}
          name="managerPhone"
          label="شماره موبایل مدیر"
          autoComplete="tel"
          textContentType="telephoneNumber"
          editable={!isSubmitting}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          submitBehavior="submit"
        />

        <FormTextField
          ref={passwordRef}
          control={control}
          name="password"
          label="رمز عبور"
          placeholder="حداقل ۶ کاراکتر"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          editable={!isSubmitting}
          returnKeyType="go"
          onSubmitEditing={() => onSubmit()}
        />

        <FormRootError message={errors.root?.message} />

        <Button onPress={onSubmit} disabled={isSubmitting} style={styles.submit}>
          {isSubmitting ? (
            <Spinner color={theme.colors.primaryForeground} />
          ) : (
            <Text style={styles.submitText}>ساخت سالن</Text>
          )}
        </Button>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerHint}>حساب دارید؟</Text>
        <Link href="/login" asChild>
          <Pressable accessibilityRole="link" hitSlop={8}>
            <Text style={styles.footerLink}>ورود</Text>
          </Pressable>
        </Link>
      </View>
    </KeyboardAwareFormScreen>
  );
}
