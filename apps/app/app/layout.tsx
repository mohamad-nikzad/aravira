import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register'
import { Toaster } from '@repo/ui/toaster'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f5f2' },
    { media: '(prefers-color-scheme: dark)', color: '#272019' },
  ],
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'آراویرا',
  description: 'سامانه مدیریت نوبت‌دهی آراویرا',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'آراویرا',
    startupImage: [
      {
        url: '/icons/splash-iphone5.png',
        media:
          '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icons/splash-iphone6.png',
        media:
          '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icons/splash-iphone6plus.png',
        media:
          '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/icons/splash-iphonex.png',
        media:
          '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/icons/splash-iphonexr.png',
        media:
          '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icons/splash-iphonexsmax.png',
        media:
          '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/icons/splash-iphone12.png',
        media:
          '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/icons/splash-iphone12max.png',
        media:
          '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/icons/splash-iphone14pro.png',
        media:
          '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/icons/splash-iphone14promax.png',
        media:
          '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/icons/splash-ipad.png',
        media:
          '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icons/splash-ipadpro11.png',
        media:
          '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/icons/splash-ipadpro129.png',
        media:
          '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="antialiased">
        {children}
        <ServiceWorkerRegister />
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
