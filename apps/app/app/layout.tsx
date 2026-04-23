import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Vazirmatn } from 'next/font/google'
import { InstallPrompt } from '@/components/pwa/install-prompt'
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register'
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
    { media: '(prefers-color-scheme: light)', color: '#f8f5f2' },
    { media: '(prefers-color-scheme: dark)', color: '#272019' },
  ],
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
}

export const metadata: Metadata = {
  title: 'آراویرا',
  description: 'سامانه مدیریت نوبت‌دهی آراویرا',
  applicationName: 'آراویرا',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/icon-192x192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.ico'],
  },
  category: 'business',
  keywords: ['آراویرا', 'نوبت دهی سالن', 'مدیریت سالن', 'آرایشگاه', 'PWA'],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'آراویرا',
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
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="min-h-dvh bg-background font-sans antialiased">
        {children}
        {isProduction && <InstallPrompt />}
        <ServiceWorkerRegister />
        <Toaster />
        {isProduction && <Analytics />}
      </body>
    </html>
  )
}
