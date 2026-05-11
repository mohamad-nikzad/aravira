import * as React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, LogOut, Users } from 'lucide-react-native';
import { saloora, semanticLight } from '@repo/brand-tokens/colors';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { useAuth } from '../../components/auth-provider';
import { ServicesCard } from '../../components/services/services-card';

import { tw } from '../../lib/utils';
const FONT_REG = 'Vazirmatn_400Regular';
const FONT_MED = 'Vazirmatn_500Medium';
const FONT_BOLD = 'Vazirmatn_700Bold';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const isManager = user?.role === 'manager';

  return (
    <SafeAreaView
      style={[tw('bg-background flex-1'), { backgroundColor: semanticLight.background.hex }]}
      edges={['top']}>
      <View style={tw('border-border/50 bg-card border-b px-4 py-3')}>
        <Text style={[tw('text-foreground text-lg'), { fontFamily: FONT_BOLD }]}>
          {isManager ? 'بیشتر' : 'تنظیمات'}
        </Text>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card style={{ gap: 12, padding: 16 }}>
          <View style={tw('flex-row items-center justify-between')}>
            <Text style={[tw('text-foreground text-sm'), { fontFamily: FONT_MED }]}>
              کاربر فعلی
            </Text>
            <Text style={[tw('text-muted-foreground text-sm'), { fontFamily: FONT_REG }]}>
              {user?.name} · {isManager ? 'مدیر' : 'کارمند'}
            </Text>
          </View>
          <Separator />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void logout();
            }}
            style={tw('flex-row items-center gap-3 py-2')}>
            <LogOut size={18} color={saloora.plum.hex} strokeWidth={1.8} />
            <Text style={[tw('text-foreground text-sm'), { fontFamily: FONT_MED }]}>خروج</Text>
          </Pressable>
        </Card>

        {isManager ? (
          <>
            <Card style={{ gap: 12, padding: 16 }}>
              <CardHeader style={{ padding: 0 }}>
                <CardTitle color="mutedForeground" variant="label" weight="medium">
                  مدیریت
                </CardTitle>
              </CardHeader>
              <CardContent style={{ gap: 8, padding: 0 }}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/staff')}
                  style={tw(
                    'border-border/50 flex-row items-center justify-between gap-3 rounded-xl border px-3 py-3'
                  )}>
                  <View style={tw('flex-row items-center gap-3')}>
                    <Users size={18} color={saloora.plum.hex} strokeWidth={1.8} />
                    <View>
                      <Text style={[tw('text-foreground text-sm'), { fontFamily: FONT_MED }]}>
                        پرسنل و نقش‌ها
                      </Text>
                      <Text style={[tw('text-muted-foreground text-xs'), { fontFamily: FONT_REG }]}>
                        مدیریت پرسنل، خدمات و ساعت کاری
                      </Text>
                    </View>
                  </View>
                  <ChevronLeft size={18} color={saloora.sage.hex} strokeWidth={1.6} />
                </Pressable>
              </CardContent>
            </Card>

            <ServicesCard />
          </>
        ) : null}

        <View style={tw('items-center pt-4 pb-2')}>
          <Text style={[tw('text-muted-foreground text-xs'), { fontFamily: FONT_MED }]}>
            سالورا
          </Text>
          <Text style={[tw('text-muted-foreground text-[10px]'), { fontFamily: FONT_REG }]}>
            نسخه ۱.۰.۰
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
