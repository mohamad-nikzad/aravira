import * as React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError, NetworkError } from '@repo/api-client';
import { normalizePhone } from '@repo/salon-core/phone';
import { saloora, semanticLight } from '@repo/brand-tokens/colors';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Spinner } from '../components/ui/spinner';
import { useAuth } from '../components/auth-provider';

import { tw } from '../lib/utils';
function KeyboardOffset({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'ios') return <>{children}</>;
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      {children}
    </KeyboardAvoidingView>
  );
}

export default function LoginScreen() {
  const { login } = useAuth();
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit() {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      await login({ phone: normalizePhone(phone), password });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof NetworkError) {
        setError(err.message);
      } else {
        setError('خطایی رخ داد. لطفاً دوباره تلاش کنید.');
      }
      setLoading(false);
    }
  }

  return (
    <SafeAreaView
      style={[tw('flex-1 bg-background'), { backgroundColor: semanticLight.background.hex }]}>
      <KeyboardOffset>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: 24,
          }}
          keyboardShouldPersistTaps="handled">
          <View style={tw('items-center gap-3')}>
            <Image
              source={require('../assets/images/saloora-mark-clean.png')}
              style={{ width: 80, height: 80, borderRadius: 22 }}
              contentFit="contain"
            />
            <Text
              style={[tw('text-3xl text-foreground'), { fontFamily: 'Vazirmatn_800ExtraBold' }]}>
              سالورا
            </Text>
            <Text
              style={[tw('text-sm text-muted-foreground'), { fontFamily: 'Vazirmatn_400Regular' }]}>
              مدیریت هوشمند سالن زیبایی
            </Text>
          </View>

          <View style={tw('mt-8 gap-5 rounded-2xl border border-border/60 bg-card p-6')}>
            <View style={tw('items-center gap-1')}>
              <Text
                style={[tw('text-base text-foreground'), { fontFamily: 'Vazirmatn_600SemiBold' }]}>
                خوش آمدید
              </Text>
              <Text
                style={[
                  tw('text-sm text-muted-foreground'),
                  { fontFamily: 'Vazirmatn_400Regular' },
                ]}>
                برای ادامه وارد شوید
              </Text>
            </View>

            <View style={tw('gap-2')}>
              <Label style={{ fontFamily: 'Vazirmatn_500Medium' }}>شماره موبایل</Label>
              <Input
                value={phone}
                onChangeText={setPhone}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                editable={!loading}
                style={{ fontFamily: 'Vazirmatn_400Regular', textAlign: 'right' }}
              />
            </View>

            <View style={tw('gap-2')}>
              <Label style={{ fontFamily: 'Vazirmatn_500Medium' }}>رمز عبور</Label>
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder="رمز عبور"
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                editable={!loading}
                style={{ fontFamily: 'Vazirmatn_400Regular', textAlign: 'right' }}
              />
            </View>

            {error ? (
              <Text style={[tw('text-sm text-destructive'), { fontFamily: 'Vazirmatn_500Medium' }]}>
                {error}
              </Text>
            ) : null}

            <Button
              onPress={handleSubmit}
              disabled={loading || phone.length === 0 || password.length === 0}>
              {loading ? (
                <Spinner color="white" />
              ) : (
                <Text
                  style={[
                    tw('text-sm text-primary-foreground'),
                    { fontFamily: 'Vazirmatn_600SemiBold' },
                  ]}>
                  ورود
                </Text>
              )}
            </Button>
          </View>

          <View style={tw('mt-6 items-center gap-1')}>
            <Text
              style={[tw('text-xs text-muted-foreground'), { fontFamily: 'Vazirmatn_400Regular' }]}>
              حساب کاربری ندارید؟
            </Text>
            <Link href="/signup" asChild>
              <Pressable accessibilityRole="link">
                <Text
                  style={[
                    tw('text-sm'),
                    {
                      fontFamily: 'Vazirmatn_600SemiBold',
                      color: saloora.plum.hex,
                    },
                  ]}>
                  ساخت سالن جدید
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardOffset>
    </SafeAreaView>
  );
}
