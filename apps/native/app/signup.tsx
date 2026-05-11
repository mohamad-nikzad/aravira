import * as React from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { ExternalLink } from 'lucide-react-native';
import { saloora, semanticLight } from '@repo/brand-tokens/colors';
import { Button } from '../components/ui/button';

import { tw } from '../lib/utils';
function resolveWebUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_WEB_BASE_URL;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  const fromConfig = Constants.expoConfig?.extra as
    | { webBaseUrl?: string; apiBaseUrl?: string }
    | undefined;
  if (fromConfig?.webBaseUrl) return fromConfig.webBaseUrl;
  if (fromConfig?.apiBaseUrl) return fromConfig.apiBaseUrl;
  return 'https://aravira-saloon.vercel.app';
}

export default function SignupScreen() {
  const signupUrl = `${resolveWebUrl().replace(/\/+$/, '')}/signup`;

  return (
    <SafeAreaView
      style={[tw('flex-1 bg-background'), { backgroundColor: semanticLight.background.hex }]}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
        <View style={tw('items-center gap-3')}>
          <Image
            source={require('../assets/images/saloora-mark-clean.png')}
            style={{ width: 72, height: 72, borderRadius: 20 }}
            contentFit="contain"
          />
          <Text style={[tw('text-2xl text-foreground'), { fontFamily: 'Vazirmatn_700Bold' }]}>
            ساخت سالن جدید
          </Text>
        </View>

        <View style={tw('gap-3 rounded-2xl border border-border/60 bg-card p-5')}>
          <Text style={[tw('text-base text-foreground'), { fontFamily: 'Vazirmatn_600SemiBold' }]}>
            راه‌اندازی سالن از طریق وب
          </Text>
          <Text
            style={[
              tw('text-sm text-muted-foreground'),
              { fontFamily: 'Vazirmatn_400Regular', lineHeight: 22 },
            ]}>
            برای ایجاد سالن جدید، انتخاب نام، و افزودن خدمات و کارکنان از داشبورد وب سالورا استفاده
            کنید. پس از ساخت سالن، می‌توانید از همین برنامه وارد شوید.
          </Text>

          <Button onPress={() => Linking.openURL(signupUrl)}>
            <View style={tw('flex-row items-center gap-2')}>
              <ExternalLink size={16} color="white" strokeWidth={2} />
              <Text
                style={[
                  tw('text-sm text-primary-foreground'),
                  { fontFamily: 'Vazirmatn_600SemiBold' },
                ]}>
                باز کردن داشبورد وب
              </Text>
            </View>
          </Button>
        </View>

        <View style={tw('items-center')}>
          <Link href="/login" asChild>
            <Pressable accessibilityRole="link">
              <Text
                style={[
                  tw('text-sm'),
                  {
                    fontFamily: 'Vazirmatn_600SemiBold',
                    color: saloora.plum.hex,
                  },
                ]}>
                بازگشت به ورود
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
