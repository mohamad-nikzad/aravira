import * as React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useAuth } from '../components/auth-provider';
import { ServicesCard } from '../components/services/services-card';
import { useTheme, useThemeStyles, withAlpha } from '../theme';

export default function ServicesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();

  const styles = useThemeStyles((t) => ({
    safe: { backgroundColor: t.colors.background, flex: 1 },
    header: {
      borderBottomColor: withAlpha(t.colors.border, 0.5),
      backgroundColor: t.colors.card,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: t.spacing.lg,
      borderBottomWidth: t.sizes.hairline,
      paddingHorizontal: t.spacing.lg,
      paddingVertical: t.spacing.lg,
    },
    backButton: {
      height: t.sizes.avatarMd,
      width: t.sizes.avatarMd,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: t.radius.full,
    },
    titleWrap: { flex: 1, minWidth: 0 },
    headerTitle: {
      color: t.colors.foreground,
      fontSize: t.fontSize.xl,
      fontFamily: t.fonts.sansBold,
    },
    headerHint: {
      color: t.colors.mutedForeground,
      fontSize: t.fontSize.sm,
      fontFamily: t.fonts.sans,
    },
    scroll: { padding: t.spacing.xl, gap: t.spacing.xl },
  }));

  if (!user || user.role !== 'manager') return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="بازگشت به بیشتر"
          onPress={() => router.back()}
          style={styles.backButton}>
          <ArrowRight size={theme.sizes.iconMd} color={theme.colors.primary} strokeWidth={1.8} />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            خدمات
          </Text>
          <Text style={styles.headerHint} numberOfLines={1}>
            بخش‌ها، گروه‌ها، قیمت و مدت زمان
          </Text>
        </View>
      </View>

      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scroll}>
        <ServicesCard />
      </ScrollView>
    </SafeAreaView>
  );
}
