import * as React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError, NetworkError } from '@repo/api-client';
import { signupSchema, type SignupFormInput } from '@repo/salon-core/forms/auth';
import { Button } from '../components/ui/button';
import { FormPhoneField, FormRootError, FormTextField } from '../components/ui/form-field';
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

function KeyboardOffset({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'ios') return <>{children}</>;
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      {children}
    </KeyboardAvoidingView>
  );
}

export default function SignupScreen() {
  const { signup } = useAuth();
  const { theme } = useTheme();
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
  });
  const salonName = watch('salonName') ?? '';
  const slug = watch('slug') ?? 'salon';
  const slugEditedRef = React.useRef(false);

  React.useEffect(() => {
    if (slugEditedRef.current) return;
    setValue('slug', makeSlug(salonName), { shouldValidate: false });
  }, [salonName, setValue]);

  const styles = useThemeStyles((t) => ({
    safe: { flex: 1, backgroundColor: t.colors.background },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center' as const,
      padding: t.spacing['3xl'],
    },
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
    },
  }));

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signup(values);
    } catch (err) {
      const message =
        err instanceof ApiError || err instanceof NetworkError
          ? err.message
          : 'ثبت‌نام انجام نشد. دوباره تلاش کنید.';
      setError('root', { message });
    }
  });

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardOffset>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
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
              control={control}
              name="salonName"
              label="نام سالن"
              placeholder="مثلاً سالن رز"
              autoCapitalize="words"
              editable={!isSubmitting}
            />

            <FormTextField
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
            />

            <FormTextField
              control={control}
              name="managerName"
              label="نام مدیر"
              placeholder="نام و نام خانوادگی"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              editable={!isSubmitting}
            />

            <FormPhoneField
              control={control}
              name="managerPhone"
              label="شماره موبایل مدیر"
              autoComplete="tel"
              textContentType="telephoneNumber"
              editable={!isSubmitting}
            />

            <FormTextField
              control={control}
              name="password"
              label="رمز عبور"
              placeholder="حداقل ۶ کاراکتر"
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              editable={!isSubmitting}
            />

            <FormRootError message={errors.root?.message} />

            <Button onPress={onSubmit} disabled={isSubmitting}>
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
              <Pressable accessibilityRole="link">
                <Text style={styles.footerLink}>ورود</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardOffset>
    </SafeAreaView>
  );
}
