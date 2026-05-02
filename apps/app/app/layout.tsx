import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Vazirmatn } from 'next/font/google'
import { InstallPrompt } from '@/components/pwa/install-prompt'
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register'
import { ThemeProvider } from '@/components/theme-provider'
import { withPwaAssetVersion } from '@/lib/pwa-assets'
import { Toaster } from '@repo/ui/toaster'
import './globals.css'

const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  variable: '--font-vazirmatn',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8eff0' },
    { media: '(prefers-color-scheme: dark)', color: '#1f171b' },
  ],
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
}

export const metadata: Metadata = {
  title: 'سالورا',
  description: 'سامانه مدیریت هوشمند نوبت‌دهی سالورا',
  applicationName: 'سالورا',
  manifest: withPwaAssetVersion('/manifest.webmanifest'),
  icons: {
    icon: [
      { url: withPwaAssetVersion('/favicon.ico') },
      {
        url: withPwaAssetVersion('/icons/icon-192x192.png'),
        type: 'image/png',
        sizes: '192x192',
      },
    ],
    apple: [
      {
        url: withPwaAssetVersion('/apple-touch-icon.png'),
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    shortcut: [withPwaAssetVersion('/favicon.ico')],
  },
  category: 'business',
  keywords: ['سالورا', 'Saloora', 'نوبت دهی سالن', 'مدیریت سالن', 'آرایشگاه', 'PWA'],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'سالورا',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const isProduction = process.env.NODE_ENV === 'production'

  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable} suppressHydrationWarning>
      <body className="min-h-dvh bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
          storageKey="aravira-theme"
        >
          {children}
          {isProduction && <InstallPrompt />}
          <ServiceWorkerRegister />
          <Toaster />
          {isProduction && <Analytics />}
        </ThemeProvider>
      </body>
    </html>
  )
}
