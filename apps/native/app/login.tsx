import * as React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { brand } from '@repo/brand';
import { ApiError, NetworkError } from '@repo/api-client';
import { loginSchema, type LoginFormInput } from '@repo/salon-core/forms/auth';
import { Button } from '../components/ui/button';
import { FormPhoneField, FormRootError, FormTextField } from '../components/ui/form-field';
import { KeyboardAwareFormScreen } from '../components/ui/keyboard-aware-form-screen';
import { Spinner } from '../components/ui/spinner';
import { useAuth } from '../components/auth-provider';
import { useTheme, useThemeStyles, withAlpha } from '../theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const { theme } = useTheme();
  const phoneRef = React.useRef<TextInput>(null);
  const passwordRef = React.useRef<TextInput>(null);
  const {
    control,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', password: '' },
    shouldFocusError: false,
  });
  const styles = useThemeStyles((t) => ({
    brand: { alignItems: 'center' as const, gap: t.spacing.lg },
    logo: { width: 80, height: 80, borderRadius: t.radius.xl },
    brandTitle: {
      fontSize: t.fontSize['3xl'],
      color: t.colors.foreground,
      fontFamily: t.fonts.sansExtraBold,
    },
    brandSubtitle: {
      fontSize: t.fontSize.base,
      color: t.colors.mutedForeground,
      fontFamily: t.fonts.sans,
    },
    card: {
      marginTop: t.spacing['3xl'],
      gap: t.spacing['2xl'],
      borderRadius: t.radius.xl,
      borderWidth: t.sizes.hairline,
      borderColor: withAlpha(t.colors.border, 0.6),
      backgroundColor: t.colors.card,
      padding: t.spacing['3xl'],
    },
    cardHeader: { alignItems: 'center' as const, gap: t.spacing.xs },
    cardTitle: {
      fontSize: t.fontSize.lg,
      color: t.colors.foreground,
      fontFamily: t.fonts.sansSemiBold,
    },
    cardSubtitle: {
      fontSize: t.fontSize.base,
      color: t.colors.mutedForeground,
      fontFamily: t.fonts.sans,
    },
    submit: { minHeight: 48 },
    submitText: {
      fontSize: t.fontSize.base,
      color: t.colors.primaryForeground,
      fontFamily: t.fonts.sansSemiBold,
    },
    footer: {
      marginTop: t.spacing['2xl'],
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
        await login(values);
      } catch (err) {
        const message =
          err instanceof ApiError || err instanceof NetworkError
            ? err.message
            : 'خطایی رخ داد. لطفاً دوباره تلاش کنید.';
        setError('root', { message });
      }
    },
    (validationErrors) => {
      const firstField = (Object.keys(validationErrors) as (keyof LoginFormInput)[]).find(
        (k) => k === 'phone' || k === 'password'
      );
      if (firstField === 'phone') phoneRef.current?.focus();
      else if (firstField === 'password') passwordRef.current?.focus();
      else setFocus('phone');
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
        <Text style={styles.brandTitle}>{brand.name.fa}</Text>
        <Text style={styles.brandSubtitle}>مدیریت هوشمند سالن زیبایی</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>خوش آمدید</Text>
          <Text style={styles.cardSubtitle}>برای ادامه وارد شوید</Text>
        </View>

        <FormPhoneField
          ref={phoneRef}
          control={control}
          name="phone"
          label="شماره موبایل"
          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
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
          placeholder="رمز عبور"
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          editable={!isSubmitting}
          returnKeyType="go"
          onSubmitEditing={() => onSubmit()}
        />

        <FormRootError message={errors.root?.message} />

        <Button onPress={onSubmit} disabled={isSubmitting} style={styles.submit}>
          {isSubmitting ? (
            <Spinner color={theme.colors.primaryForeground} />
          ) : (
            <Text style={styles.submitText}>ورود</Text>
          )}
        </Button>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerHint}>حساب کاربری ندارید؟</Text>
        <Link href="/signup" asChild>
          <Pressable accessibilityRole="link" hitSlop={8}>
            <Text style={styles.footerLink}>ساخت سالن جدید</Text>
          </Pressable>
        </Link>
      </View>
    </KeyboardAwareFormScreen>
  );
}
