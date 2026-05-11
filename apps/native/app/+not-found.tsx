import { Link, Stack } from 'expo-router';
import { ScreenShell } from '../components/screen-shell';
import { AppText } from '../components/ui';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'یافت نشد' }} />
      <ScreenShell
        title="یافت نشد"
        emptyTitle="صفحه یافت نشد"
        emptyDescription="این مسیر در اپلیکیشن وجود ندارد.">
        <Link href="/today">
          <AppText variant="label" weight="semibold" color="primary" align="center">
            بازگشت به امروز
          </AppText>
        </Link>
      </ScreenShell>
    </>
  );
}
